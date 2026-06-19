import os
import io
from typing import List
from pypdf import PdfReader
from docx import Document
from pydantic import BaseModel
from dotenv import load_dotenv

from sentence_transformers import SentenceTransformer

from google import genai
from google.genai import types

load_dotenv(dotenv_path="../.env")
API_KEY = os.getenv("GEMINI_API_KEY")

ai_client = genai.Client(api_key=API_KEY)
embedder = SentenceTransformer("all-MiniLM-L6-v2")

class ExtractedDeadline(BaseModel):
    title: str
    description: str
    deadline_iso: str  

class ExtractedFlashcard(BaseModel):
    question: str
    answer: str

class DocumentAnalysisResult(BaseModel):
    summary: str
    deadlines: List[ExtractedDeadline]
    flashcards: List[ExtractedFlashcard]

class AIProcessor:
    @staticmethod
    def extract_text_from_pdf(file_bytes: bytes) -> str:
        pdf = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text

    @staticmethod
    def extract_text_from_docx(file_bytes: bytes) -> str:
        doc = Document(io.BytesIO(file_bytes))
        return "\n".join([paragraph.text for paragraph in doc.paragraphs])

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunks.append(text[start:end])
            start += chunk_size - overlap
        return chunks

    @classmethod
    async def generate_embedding(cls, text: str) -> List[float]:
        vector = embedder.encode(text)
        return vector.tolist()

    @classmethod
    async def analyze_document_content(cls, full_text: str) -> DocumentAnalysisResult:
        prompt = f"""
        Jesteś inteligentnym asystentem. Przeanalizuj poniższy tekst materiałów akademickich.
        1. Stwórz zwięzłe podsumowanie.
        2. Znajdź daty i kolokwia. Zwróć jako listę z datą w formacie ISO (YYYY-MM-DDTHH:MM:SS).
        3. Wygeneruj od 5 do 15 fiszek.
        Tekst: {full_text[:30000]}
        """

        response = ai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=DocumentAnalysisResult,
                temperature=0.2
            ),
        )
        return response.parsed