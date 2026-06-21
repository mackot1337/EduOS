from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, func
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.models.ai import Flashcard
from app.services.spaced_repetition import SpacedRepetitionService

router = APIRouter(prefix="/flashcards", tags=["Flashcards & Review"])

class FlashcardReviewRequest(BaseModel):
    recall_quality: int

@router.get("/due/{subject_id}")
async def get_due_flashcards(subject_id: int, db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    
    total_query = select(func.count(Flashcard.id)).where(Flashcard.subject_id == subject_id)
    total_count = await db.scalar(total_query)
    
    query = select(Flashcard).where(
        Flashcard.subject_id == subject_id,
        or_(
            Flashcard.next_review <= now,
            Flashcard.next_review == None
        )
    ).order_by(Flashcard.id)

    result = await db.execute(query)
    due_flashcards = result.scalars().all()

    return {
        "total_count": total_count or 0,
        "due_count": len(due_flashcards),
        "flashcards": [
            {
                "id": fc.id,
                "pytanie": fc.question,
                "odpowiedz": fc.answer,
                "poziom": fc.level
            } for fc in due_flashcards
        ]
    }

@router.get("/all/{subject_id}")
async def get_all_flashcards(subject_id: int, file_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    query = select(Flashcard).where(Flashcard.subject_id == subject_id)
    
    if file_id:
        query = query.where(Flashcard.file_id == file_id)
        
    query = query.order_by(Flashcard.id)
    result = await db.execute(query)
    all_flashcards = result.scalars().all()

    return {
        "total_count": len(all_flashcards),
        "due_count": len(all_flashcards),
        "flashcards": [
            {
                "id": fc.id,
                "pytanie": fc.question,
                "odpowiedz": fc.answer,
                "poziom": fc.level
            } for fc in all_flashcards
        ]
    }

@router.post("/{flashcard_id}/review")
async def review_flashcard(
    flashcard_id: int, 
    review: FlashcardReviewRequest, 
    db: AsyncSession = Depends(get_db)
):
    if review.recall_quality not in [0, 1, 2]:
        raise HTTPException(status_code=400, detail="recall_quality musi wynosić 0, 1 lub 2")

    query = select(Flashcard).where(Flashcard.id == flashcard_id)
    result = await db.execute(query)
    flashcard = result.scalars().first()

    if not flashcard:
        raise HTTPException(status_code=404, detail="Fiszka nie znaleziona")

    new_level, next_date = SpacedRepetitionService.calculate_next_review(
        current_level=flashcard.level,
        recall_quality=review.recall_quality
    )

    flashcard.level = new_level
    flashcard.next_review = next_date

    await db.commit()

    return {
        "status": "success",
        "message": f"Fiszka oceniona na {review.recall_quality}.",
        "new_level": new_level,
        "next_review": next_date.isoformat()
    }