"use client";

import React, { use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BookOpen, ArrowLeft, UploadCloud, Search, Library } from 'lucide-react';

export default function SubjectDashboard({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const subjectId = resolvedParams.id;
  
  const searchParams = useSearchParams();
  const subjectName = searchParams.get('name') || "Wybrany Przedmiot";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-slate-50">
      <div className="z-10 max-w-5xl w-full flex flex-col gap-8">
        
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium w-fit">
          <ArrowLeft className="w-4 h-4" /> Powrót do semestrów
        </Link>

        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Library className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">{subjectName}</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Wybierz akcję dla tego przedmiotu. Wgrywaj notatki, ucz się z fiszek lub zadawaj pytania do bazy wiedzy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mx-auto">
          <Link href={`/upload?subjectId=${subjectId}&name=${encodeURIComponent(subjectName)}`} className="group flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-400 transition-all cursor-pointer">
            <UploadCloud className="w-12 h-12 text-slate-400 group-hover:text-blue-500 mb-4 transition-colors" />
            <h2 className="text-2xl font-semibold text-slate-800">1. Baza Wiedzy</h2>
            <p className="text-slate-500 text-center mt-2 text-sm">Wgraj PDF lub DOCX, aby AI stworzyło fiszki i podsumowanie.</p>
          </Link>

          <Link href={`/study?subjectId=${subjectId}&name=${encodeURIComponent(subjectName)}`} className="group flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-green-400 transition-all cursor-pointer">
            <BookOpen className="w-12 h-12 text-slate-400 group-hover:text-green-500 mb-4 transition-colors" />
            <h2 className="text-2xl font-semibold text-slate-800">2. Nauka</h2>
            <p className="text-slate-500 text-center mt-2 text-sm">Ucz się inteligentnie. Powtarzaj fiszki zaplanowane na dziś.</p>
          </Link>

          <Link href={`/ask?subjectId=${subjectId}&name=${encodeURIComponent(subjectName)}`} className="group flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-purple-400 transition-all cursor-pointer">
            <Search className="w-12 h-12 text-slate-400 group-hover:text-purple-500 mb-4 transition-colors" />
            <h2 className="text-2xl font-semibold text-slate-800">3. Zapytaj RAG</h2>
            <p className="text-slate-500 text-center mt-2 text-sm">Zadaj pytanie swoim notatkom. AI znajdzie odpowiedź za Ciebie.</p>
          </Link>
        </div>

      </div>
    </main>
  );
}