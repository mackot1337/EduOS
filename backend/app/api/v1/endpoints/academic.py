from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import List, Optional

from app.core.database import get_db
from app.models.academic import Semester, Subject 

router = APIRouter(prefix="/academic", tags=["Academic Organization"])

class SubjectBase(BaseModel):
    name: str
    code: Optional[str] = None
    instructor: Optional[str] = None

class SubjectCreate(SubjectBase):
    pass

class SubjectResponse(SubjectBase):
    id: int
    semester_id: int
    
    model_config = ConfigDict(from_attributes=True)

class SemesterBase(BaseModel):
    name: str
    start_date: date
    end_date: date

class SemesterCreate(SemesterBase):
    pass

class SemesterResponse(SemesterBase):
    id: int
    subjects: List[SubjectResponse] = []
    
    model_config = ConfigDict(from_attributes=True)

@router.post("/semesters", response_model=SemesterResponse, status_code=status.HTTP_201_CREATED)
async def create_semester(semester: SemesterCreate, db: AsyncSession = Depends(get_db)):
    new_semester = Semester(**semester.model_dump())
    db.add(new_semester)
    await db.commit()
    await db.refresh(new_semester)
    return new_semester

@router.get("/semesters", response_model=List[SemesterResponse])
async def get_semesters(db: AsyncSession = Depends(get_db)):
    query = select(Semester).options(selectinload(Semester.subjects)).order_by(Semester.start_date.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/semesters/{semester_id}/subjects", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
async def create_subject(semester_id: int, subject: SubjectCreate, db: AsyncSession = Depends(get_db)):
    query = select(Semester).where(Semester.id == semester_id)
    result = await db.execute(query)
    semester_obj = result.scalars().first()
    
    if not semester_obj:
        raise HTTPException(status_code=404, detail="Semestr nie znaleziony")
        
    new_subject = Subject(**subject.model_dump(), semester_id=semester_id)
    db.add(new_subject)
    await db.commit()
    await db.refresh(new_subject)
    return new_subject