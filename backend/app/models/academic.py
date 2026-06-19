from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from app.core.database import Base

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
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    subject = relationship("Subject", back_populates="files")
    
    chunks = relationship("FileChunk", back_populates="file", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="file", cascade="all, delete-orphan")