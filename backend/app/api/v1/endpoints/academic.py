from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, ConfigDict
from datetime import date, datetime, time
from typing import List, Optional
import httpx
import icalendar

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

class UsosImportRequest(BaseModel):
    url: str

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

def map_time_to_block(start_time: time) -> TimeBlock:
    hour = start_time.hour
    minute = start_time.minute
    
    if hour == 7: return TimeBlock.B1
    if hour == 9: return TimeBlock.B2 
    if hour == 11: return TimeBlock.B3 
    if hour == 13: return TimeBlock.B4 
    if hour == 15: return TimeBlock.B5
    if hour == 17: return TimeBlock.B6 
    if hour == 18 or hour == 19: return TimeBlock.B7
    return None

def map_weekday_to_day(weekday: int) -> DayOfWeek:
    days = [
        DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, 
        DayOfWeek.THURSDAY, DayOfWeek.FRIDAY
    ]
    if 0 <= weekday <= 4:
        return days[weekday]
    return None

@router.post("/semesters/{semester_id}/import-usos")
async def import_from_usos(semester_id: int, req: UsosImportRequest, db: AsyncSession = Depends(get_db)):
    query = select(Semester).where(Semester.id == semester_id)
    result = await db.execute(query)
    semester = result.scalars().first()
    if not semester:
        raise HTTPException(status_code=404, detail="Semestr nie znaleziony")

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(req.url)
            response.raise_for_status()
            calendar_data = response.content
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Nie udało się pobrać kalendarza: {str(e)}")

    cal = icalendar.Calendar.from_ical(calendar_data)
    
    processed_subjects = set()
    added_count = 0

    for component in cal.walk('VEVENT'):
        summary = str(component.get('summary', ''))
        location = str(component.get('location', ''))
        dtstart = component.get('dtstart').dt
        
        if not isinstance(dtstart, datetime):
            continue
            
        day_enum = map_weekday_to_day(dtstart.weekday())
        time_enum = map_time_to_block(dtstart.time())
        
        if not day_enum or not time_enum:
            continue
            
        unique_key = (summary, day_enum, time_enum)
        
        if unique_key not in processed_subjects:
            processed_subjects.add(unique_key)
            
            new_subject = Subject(
                semester_id=semester_id,
                name=summary,
                room=location if location else None,
                day_of_week=day_enum,
                time_block=time_enum
            )
            db.add(new_subject)
            added_count += 1
            
    await db.commit()
    
    return {"status": "ok", "imported_count": added_count}

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

class SemesterUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    instructor: Optional[str] = None
    day_of_week: Optional[DayOfWeek] = None
    time_block: Optional[TimeBlock] = None
    room: Optional[str] = None

@router.patch("/semesters/{semester_id}", response_model=SemesterResponse)
async def update_semester(semester_id: int, semester_update: SemesterUpdate, db: AsyncSession = Depends(get_db)):
    query = select(Semester).where(Semester.id == semester_id).options(selectinload(Semester.subjects))
    result = await db.execute(query)
    semester = result.scalars().first()
    
    if not semester:
        raise HTTPException(status_code=404, detail="Semestr nie znaleziony")
        
    update_data = semester_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(semester, key, value)
        
    await db.commit()
    await db.refresh(semester)
    return semester

@router.delete("/semesters/{semester_id}")
async def delete_semester(semester_id: int, db: AsyncSession = Depends(get_db)):
    query = select(Semester).where(Semester.id == semester_id)
    result = await db.execute(query)
    semester = result.scalars().first()
    
    if not semester:
        raise HTTPException(status_code=404, detail="Semestr nie znaleziony")
        
    await db.delete(semester)
    await db.commit()
    # Kaskadowe usuwanie usunie też powiązane przedmioty, pliki i zadania!
    return {"status": "ok", "message": "Semestr usunięty"}



@router.patch("/subjects/{subject_id}", response_model=SubjectResponse)
async def update_subject(subject_id: int, subject_update: SubjectUpdate, db: AsyncSession = Depends(get_db)):
    query = select(Subject).where(Subject.id == subject_id)
    result = await db.execute(query)
    subject = result.scalars().first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Przedmiot nie znaleziony")
        
    update_data = subject_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(subject, key, value)
        
    await db.commit()
    await db.refresh(subject)
    return subject

@router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: int, db: AsyncSession = Depends(get_db)):
    query = select(Subject).where(Subject.id == subject_id)
    result = await db.execute(query)
    subject = result.scalars().first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Przedmiot nie znaleziony")
        
    await db.delete(subject)
    await db.commit()
    return {"status": "ok", "message": "Przedmiot usunięty"}