from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Dict, Any

from app.services.ai_processor import embedder 
from google import genai

from app.services.ai_processor import ai_client

class VectorSearchService:
    @staticmethod
    async def get_relevant_chunks(
        db: AsyncSession, 
        query_text: str, 
        subject_id: int, 
        limit: int = 3
    ) -> List[Dict[str, Any]]:
        query_vector = embedder.encode(query_text).tolist()
        
        vector_str = "[" + ",".join(str(x) for x in query_vector) + "]"

        sql_query = text("""
            SELECT 
                fc.text_fragment, 
                af.name as file_name,
                1 - (fc.embedding <=> CAST(:vector AS vector)) as similarity
            FROM file_chunks fc
            JOIN academic_files af ON fc.file_id = af.id
            WHERE af.subject_id = :subject_id
            ORDER BY fc.embedding <=> CAST(:vector AS vector)
            LIMIT :limit
        """)

        result = await db.execute(sql_query, {
            "vector": vector_str,
            "subject_id": subject_id,
            "limit": limit
        })

        chunks = []
        for row in result.fetchall():
            chunks.append({
                "text": row.text_fragment,
                "file_name": row.file_name,
                "similarity": float(row.similarity)
            })

        return chunks

    @staticmethod
    async def generate_rag_answer(query: str, context_chunks: List[Dict[str, Any]]) -> str:
        if not context_chunks:
            return "Nie znalazłem żadnych informacji na ten temat w Twoich notatkach dla tego przedmiotu."

        context_text = ""
        for i, chunk in enumerate(context_chunks):
            context_text += f"\n[Fragment {i+1} z pliku: {chunk['file_name']}]:\n{chunk['text']}\n"

        prompt = f"""
        Jesteś inteligentnym asystentem edukacyjnym. Udziel odpowiedzi na pytanie studenta, 
        bazując WYŁĄCZNIE na dostarczonym poniżej kontekście (notatkach). 

        Jeśli w kontekście nie ma odpowiedzi, powiedz wprost: "Nie mam informacji na ten temat w Twoich notatkach".
        Nie zmyślaj informacji (zero halucynacji). Odpowiadaj zwięźle i profesjonalnie.

        PYTANIE STUDENTA: {query}

        KONTEKST (MATERIAŁY Z BAZY WIEDZY):
        {context_text}
        """

        response = ai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        return response.text