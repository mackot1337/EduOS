from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import List, Optional

from app.core.database import get_db
from app.models.academic import Semester, Subject, DayOfWeek, TimeBlock, Task

router = APIRouter(prefix="/academic", tags=["Academic Organization"])

class SubjectBase(BaseModel):
    name: str
    code: Optional[str] = None
    instructor: Optional[str] = None
    day_of_week: Optional[DayOfWeek] = None
    time_block: Optional[TimeBlock] = None
    room: Optional[str] = None

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
    
    query = select(Semester).where(Semester.id == new_semester.id).options(selectinload(Semester.subjects))
    result = await db.execute(query)
    loaded_semester = result.scalars().first()
    
    return loaded_semester

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

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = "TODO"

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = None

class TaskResponse(TaskBase):
    id: int
    subject_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

@router.post("/semesters/{subject_id}/tasks", response_model=TaskResponse)
async def create_task(subject_id: int, task: TaskCreate, db: AsyncSession = Depends(get_db)):
    new_task = Task(**task.model_dump(), subject_id=subject_id)
    db.add(new_task)
    await db.commit()
    await db.refresh(new_task)
    return new_task

@router.get("/subjects/{subject_id}/tasks", response_model=List[TaskResponse])
async def get_tasks(subject_id: int, db: AsyncSession = Depends(get_db)):
    query = select(Task).where(Task.subject_id == subject_id).order_by(Task.due_date.asc().nulls_last())
    result = await db.execute(query)
    return result.scalars().all()

@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(task_id: int, task_update: TaskUpdate, db: AsyncSession = Depends(get_db)):
    query = select(Task).where(Task.id == task_id)
    result = await db.execute(query)
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Zadanie nie znalezione")
        
    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
        
    await db.commit()
    await db.refresh(task)
    return task

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: int, db: AsyncSession = Depends(get_db)):
    query = select(Task).where(Task.id == task_id)
    result = await db.execute(query)
    task = result.scalars().first()
    if task:
        await db.delete(task)
        await db.commit()
    return {"status": "ok"}