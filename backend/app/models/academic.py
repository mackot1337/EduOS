import enum
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from app.core.database import Base

class DayOfWeek(str, enum.Enum):
    MONDAY = "Poniedziałek"
    TUESDAY = "Wtorek"
    WEDNESDAY = "Środa"
    THURSDAY = "Czwartek"
    FRIDAY = "Piątek"

class TimeBlock(str, enum.Enum):
    B1 = "7:30 - 9:00"
    B2 = "9:15 - 10:45"
    B3 = "11:15 - 12:45"
    B4 = "13:15 - 14:45"
    B5 = "15:15 - 16:45"
    B6 = "17:05 - 18:35"
    B7 = "18:55 - 20:25"

class Semester(Base):
    __tablename__ = "semesters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)        
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    subjects = relationship("Subject", back_populates="semester", cascade="all, delete-orphan")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)         
    code = Column(String, nullable=True)  
    instructor = Column(String, nullable=True)      

    day_of_week = Column(SQLEnum(DayOfWeek), nullable=True)
    time_block = Column(SQLEnum(TimeBlock), nullable=True)
    room = Column(String, nullable=True)

    semester = relationship("Semester", back_populates="subjects")
    
    files = relationship("AcademicFile", back_populates="subject", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="subject", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="subject", cascade="all, delete-orphan")


class AcademicFile(Base):
    __tablename__ = "academic_files"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)          
    file_path = Column(String, nullable=False)  
    summary = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    subject = relationship("Subject", back_populates="files")
    
    chunks = relationship("FileChunk", back_populates="file", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="file", cascade="all, delete-orphan")

class TaskStatus(str, enum.Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    due_date = Column(Date, nullable=True)
    status = Column(String, default="TODO")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    subject = relationship("Subject", back_populates="tasks")