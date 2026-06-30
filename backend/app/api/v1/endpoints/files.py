from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import os
import shutil
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.academic import AcademicFile, Task, TaskStatus
from app.models.ai import FileChunk, Flashcard
from app.services.ai_processor import AIProcessor, QuizData

from fastapi.responses import FileResponse

from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/files", tags=["Files & AI Processing"])

STORAGE_DIR = "storage"
QUIZ_CACHE = {}
os.makedirs(STORAGE_DIR, exist_ok=True)

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_academic_file(
    subject_id: int, 
    file: UploadFile = File(...), 
    db: AsyncSession = Depends(get_db)
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".docx"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Akceptowane są wyłącznie pliki w formacie .pdf oraz .docx"
        )

    file_path = os.path.join(STORAGE_DIR, f"{int(datetime.utcnow().timestamp())}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    if ext == ".pdf":
        raw_text = AIProcessor.extract_text_from_pdf(file_bytes)
    else:
        raw_text = AIProcessor.extract_text_from_docx(file_bytes)

    if not raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Nie udało się wyciągnąć tekstu z przesłanego pliku. Plik może być skanem (obrazkiem)."
        )

    db_file = AcademicFile(
        subject_id=subject_id,
        name=file.filename,
        file_path=file_path
    )
    db.add(db_file)
    await db.flush()

    ai_analysis = await AIProcessor.analyze_document_content(raw_text)

    db_file.summary = ai_analysis.summary

    text_chunks = AIProcessor.chunk_text(raw_text)
    for chunk_text in text_chunks:
        vector = await AIProcessor.generate_embedding(chunk_text)
        db_chunk = FileChunk(
            file_id=db_file.id,
            text_fragment=chunk_text,
            embedding=vector
        )
        db.add(db_chunk)

    for dl in ai_analysis.deadlines:
        try:
            deadline_dt = datetime.fromisoformat(dl.deadline_iso)
        except ValueError:
            deadline_dt = None

        db_task = Task(
            subject_id=subject_id,
            title=dl.title,
            description=f"[Auto-wykryte przez AI z pliku {file.filename}]: {dl.description}",
            due_date=deadline_dt,
            status=TaskStatus.TODO
        )
        db.add(db_task)

    for fc in ai_analysis.flashcards:
        db_flashcard = Flashcard(
            subject_id=subject_id,
            file_id=db_file.id,
            question=fc.question,
            answer=fc.answer,
            level=0
        )
        db.add(db_flashcard)

    await db.commit()

    return {
        "status": "success",
        "file_id": db_file.id,
        "message": "Plik przetworzony pomyślnie.",
        "stats": {
            "chunks_created": len(text_chunks),
            "deadlines_discovered": len(ai_analysis.deadlines),
            "flashcards_generated": len(ai_analysis.flashcards)
        },
        "summary": ai_analysis.summary
    }

@router.get("/subject/{subject_id}")
async def get_subject_files(subject_id: int, db: AsyncSession = Depends(get_db)):
    query = select(AcademicFile).where(AcademicFile.subject_id == subject_id).order_by(AcademicFile.created_at.desc())
    result = await db.execute(query)
    files = result.scalars().all()
    
    return [
        {
            "id": f.id, 
            "name": f.name, 
            "summary": f.summary,
            "created_at": f.created_at.isoformat() if f.created_at else None
        } 
        for f in files
    ]

@router.patch("/{file_id}")
async def update_file(file_id: int, data: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AcademicFile).where(AcademicFile.id == file_id))
    file_obj = result.scalars().first()
    if not file_obj:
        raise HTTPException(status_code=404, detail="Plik nie istnieje")
    
    for key, value in data.items():
        if hasattr(file_obj, key):
            setattr(file_obj, key, value)
            
    await db.commit()
    return {"message": "Zaktualizowano plik"}

@router.delete("/{file_id}")
async def delete_file(file_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AcademicFile).where(AcademicFile.id == file_id))
    file_obj = result.scalars().first()
    if not file_obj:
        raise HTTPException(status_code=404, detail="Plik nie istnieje")
        
    if hasattr(file_obj, 'file_path') and file_obj.file_path:
        if os.path.exists(file_obj.file_path):
            os.remove(file_obj.file_path)
            
    await db.delete(file_obj)
    await db.commit()
    return {"message": "Plik usunięty z bazy i z dysku"}

@router.get("/{file_id}/download")
async def download_file(file_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AcademicFile).where(AcademicFile.id == file_id))
    file_obj = result.scalars().first()
    
    if not file_obj:
        raise HTTPException(status_code=404, detail="Plik nie znaleziony w bazie danych")
        
    if not file_obj.file_path or not os.path.exists(file_obj.file_path):
        raise HTTPException(status_code=404, detail="Plik fizycznie nie istnieje na serwerze")
        
    _, ext = os.path.splitext(file_obj.file_path)
    
    safe_filename = file_obj.name
    if not safe_filename.lower().endswith(ext.lower()):
        safe_filename += ext
        
    return FileResponse(
        path=file_obj.file_path, 
        filename=safe_filename,
        media_type="application/octet-stream",
        headers={"Access-Control-Expose-Headers": "Content-Disposition"}
    )

@router.post("/{file_id}/generate-quiz", response_model=QuizData)
async def generate_file_quiz(
    file_id: int, 
    num_questions: int = 5, 
    force_new: bool = False,
    db: AsyncSession = Depends(get_db)
):
    cache_key = f"{file_id}_{num_questions}"
    
    if not force_new and cache_key in QUIZ_CACHE:
        print(f"Zwracam quiz z cache dla klucza: {cache_key}")
        return QUIZ_CACHE[cache_key]

    query = select(AcademicFile).where(AcademicFile.id == file_id).options(selectinload(AcademicFile.chunks))
    result = await db.execute(query)
    academic_file = result.scalars().first()
    
    if not academic_file:
        raise HTTPException(status_code=404, detail="Plik nie znaleziony")
        
    if not academic_file.chunks:
        raise HTTPException(status_code=400, detail="Plik nie został jeszcze przetworzony (brak tekstu)")

    full_text = "\n".join([chunk.text_fragment for chunk in academic_file.chunks])
    
    print(f"Generuję nowy quiz dla klucza: {cache_key}...")
    quiz_data = await AIProcessor.generate_quiz_from_text(full_text, num_questions)
    
    QUIZ_CACHE[cache_key] = quiz_data
    
    return quiz_data