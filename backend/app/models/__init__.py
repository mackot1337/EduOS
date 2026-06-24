from app.core.database import Base
from app.models.academic import Semester, Subject, AcademicFile, Task, TaskStatus
from app.models.ai import FileChunk, Flashcard

__all__ = ["Base", "Semester", "Subject", "AcademicFile", "FileChunk", "Flashcard", "Task", "TaskStatus"]