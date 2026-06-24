import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.core.database import Base

class FileChunk(Base):
    __tablename__ = "file_chunks"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("academic_files.id", ondelete="CASCADE"), nullable=False)
    text_fragment = Column(String, nullable=False) 
    embedding = Column(Vector(384), nullable=True)

    file = relationship("AcademicFile", back_populates="chunks")


class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    file_id = Column(Integer, ForeignKey("academic_files.id", ondelete="SET NULL"), nullable=True)
    question = Column(String, nullable=False)
    answer = Column(String, nullable=False)

    level = Column(Integer, default=0)   
    next_review = Column(DateTime, nullable=True)

    subject = relationship("Subject", back_populates="flashcards")
    file = relationship("AcademicFile", back_populates="flashcards")