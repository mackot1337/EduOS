from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Optional

from app.core.database import get_db
from app.services.vector_search import VectorSearchService

router = APIRouter(prefix="/search", tags=["RAG & Vector Search"])

class SearchRequest(BaseModel):
    query: str
    subject_id: int
    limit: Optional[int] = 3

class SearchResponse(BaseModel):
    answer: str
    sources: List[str]

@router.post("/ask", response_model=SearchResponse)
async def ask_assistant(request: SearchRequest, db: AsyncSession = Depends(get_db)):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Pytanie nie może być puste.")

    chunks = await VectorSearchService.get_relevant_chunks(
        db=db, 
        query_text=request.query, 
        subject_id=request.subject_id, 
        limit=request.limit
    )

    answer = await VectorSearchService.generate_rag_answer(
        query=request.query, 
        context_chunks=chunks
    )

    unique_sources = list(set([chunk["file_name"] for chunk in chunks]))

    return SearchResponse(
        answer=answer,
        sources=unique_sources
    )