from app.core.database import Base
from app.models.academic import Semester, Subject, AcademicFile
from app.models.ai import FileChunk, Flashcard, Task, TaskStatus

__all__ = ["Base", "Semester", "Subject", "AcademicFile", "FileChunk", "Flashcard", "Task", "TaskStatus"]