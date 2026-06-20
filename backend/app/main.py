from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.api.v1.endpoints.files import router as files_router
from app.api.v1.endpoints.academic import router as academic_route
from app.api.v1.endpoints.flashcards import router as flashcards_router

app = FastAPI(title="EduOS API - Inteligentny Organizer Studenta")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(files_router, prefix="/api/v1")
app.include_router(academic_route, prefix="/api/v1")
app.include_router(flashcards_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "Wszystko działa!", "app": "EduOS API"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)