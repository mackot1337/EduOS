"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { UploadCloud, ArrowLeft, RefreshCw, FileText, CheckCircle, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectId = searchParams.get('subjectId') || '1';
  const subjectName = searchParams.get('name') || 'Wybrany Przedmiot';

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    message: string;
    summary: string;
    stats: {
      chunks_created: number;
      deadlines_discovered: number;
      flashcards_generated: number;
    };
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccessData(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Proszę wybrać plik przed wysłaniem.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post(`/files/upload?subject_id=${subjectId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === "success") {
        setSuccessData({
          message: response.data.message,
          summary: response.data.summary,
          stats: response.data.stats,
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        "Wystąpił błąd podczas przetwarzania pliku przez AI. Upewnij się, że backend działa."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 md:p-16 font-sans">
      <div className="max-w-3xl mx-auto">
        
        <Link href={`/subject/${subjectId}?name=${encodeURIComponent(subjectName)}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-8 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Powrót do przedmiotu
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <UploadCloud className="text-blue-600 w-10 h-10" /> Baza Wiedzy AI
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Wgraj materiały z wykładów (PDF, DOCX) dla przedmiotu <span className="font-semibold text-slate-700">{subjectName}</span>. Nasz silnik AI automatycznie wyciągnie z nich esencję.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mb-8">
          <form onSubmit={handleUpload} className="space-y-6">
            
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-8 text-center transition-all bg-slate-50/50 cursor-pointer relative group">
              <input 
                type="file" 
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={loading}
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <FileText className={`w-12 h-12 ${file ? 'text-blue-500' : 'text-slate-400 group-hover:text-blue-400'} transition-colors`} />
                <p className="text-slate-700 font-medium">
                  {file ? file.name : "Kliknij lub przeciągnij plik tutaj"}
                </p>
                <p className="text-slate-400 text-xs">Obsługiwane formaty: .pdf, .docx (max 10MB)</p>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                <AlertTitle>Błąd przetwarzania</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <button
              type="submit"
              disabled={loading || !file}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-sm ${
                loading || !file 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Mielenie dokumentu przez Gemini AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> Analizuj materiały przez AI
                </>
              )}
            </button>
          </form>
        </div>

        {successData && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800">
              <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold">Sukces!</p>
                <p className="text-sm text-green-700">{successData.message}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-2xs">
                <span className="text-2xl font-bold text-slate-800 block">{successData.stats.chunks_created}</span>
                <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Fragmenty RAG</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-2xs">
                <span className="text-2xl font-bold text-purple-600 block">{successData.stats.flashcards_generated}</span>
                <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Nowe Fiszki</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-2xs">
                <span className="text-2xl font-bold text-amber-600 block">{successData.stats.deadlines_discovered}</span>
                <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Terminy / Egzaminy</span>
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
                <Sparkles className="w-5 h-5 text-purple-500" /> Inteligentne Podsumowanie Materiału
              </h2>
              <div className="text-slate-600 leading-relaxed whitespace-pre-line text-sm md:text-base">
                {successData.summary}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}