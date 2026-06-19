from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date

from app.core.database import get_db
from app.models.academic import Semester, Subject

router = APIRouter(prefix="/academic", tags=["Academic Structure"])

@router.post("/setup-dummy-data", status_code=status.HTTP_201_CREATED)
async def setup_dummy_data(db: AsyncSession = Depends(get_db)):
    dummy_semester = Semester(
        name="Semestr Zimowy 2026/2027",
        start_date=date(2026, 10, 1),
        end_date=date(2027, 2, 28)
    )
    db.add(dummy_semester)
    await db.flush() 

    dummy_subject = Subject(
        semester_id=dummy_semester.id,
        name="Bazy Danych",
        code="1033-DATA-Z",
        instructor="dr inż. Jan Kowalski"
    )
    db.add(dummy_subject)
    await db.commit()

    return {
        "message": "Dane testowe zostały pomyślnie utworzone!",
        "semester_id": dummy_semester.id,
        "subject_id": dummy_subject.id
    }