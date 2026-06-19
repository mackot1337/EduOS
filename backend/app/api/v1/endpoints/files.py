from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import os
import shutil

from app.core.database import get_db
from app.models.academic import AcademicFile
from app.models.ai import FileChunk, Flashcard, Task, TaskStatus
from app.services.ai_processor import AIProcessor

router = APIRouter(prefix="/files", tags=["Files & AI Processing"])

STORAGE_DIR = "storage"
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
            deadline=deadline_dt,
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