"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Search, Sparkles, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SearchResult {
  answer: string;
  sources: string[];
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const subjectId = searchParams.get('subjectId') || '1';
  const subjectName = searchParams.get('name') || 'Wybrany Przedmiot';

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post('/search/ask', {
        query: query,
        subject_id: parseInt(subjectId),
        limit: 3
      });

      setResult({
        answer: response.data.answer,
        sources: response.data.sources || [],
      });
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        "Wystąpił błąd podczas komunikacji z silnikiem RAG. Sprawdź terminal backendu."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 md:p-16 font-sans">
      <div className="max-w-4xl mx-auto">
        
        <Link href={`/subject/${subjectId}?name=${encodeURIComponent(subjectName)}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-8 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Powrót do przedmiotu
        </Link>

        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 flex items-center justify-center gap-3 mb-4">
            <Search className="text-indigo-600 w-10 h-10" /> Wyszukiwarka AI
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Zadaj dowolne pytanie dotyczące wgranych materiałów dla: <span className="font-semibold text-slate-700">{subjectName}</span>. EduOS przeszuka Twoje dokumenty wektorowo i wygeneruje precyzyjną odpowiedź.
          </p>
        </div>

        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 mb-8 relative focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
          <form onSubmit={handleSearch} className="flex items-center">
            <div className="pl-4">
              <Search className="w-6 h-6 text-slate-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="np. Czym jest model pojęciowy?"
              className="flex-1 px-4 py-4 text-lg bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-300"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className={`mr-2 py-3 px-6 rounded-xl font-semibold text-white transition-all flex items-center gap-2 ${
                loading || !query.trim()
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
              }`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Szukaj"}
            </button>
          </form>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8 bg-red-50 text-red-900 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Błąd wyszukiwania</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="bg-white p-8 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-indigo-500" /> Odpowiedź Gemini
              </h2>
              <div className="text-slate-700 text-lg leading-relaxed whitespace-pre-line">
                {result.answer}
              </div>
            </div>

            {result.sources && result.sources.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Baza wiedzy powiązana z odpowiedzią ({result.sources.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.sources.map((source, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 text-sm text-slate-600 font-medium flex items-center gap-3 shadow-sm">
                      <div className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-lg flex items-center justify-center font-bold">
                        {idx + 1}
                      </div>
                      {source}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}