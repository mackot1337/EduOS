"use client";

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Library, FileText, UploadCloud, BookOpen, Search, Loader2 } from 'lucide-react';

interface AcademicFile {
  id: number;
  name: string;
  created_at: string;
}

export default function SubjectDashboard({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const subjectId = resolvedParams.id;
  
  const searchParams = useSearchParams();
  const subjectName = searchParams.get('name') || "Wybrany Przedmiot";

  const [files, setFiles] = useState<AcademicFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, [subjectId]);

  const fetchFiles = async () => {
    try {
      const response = await api.get(`/files/subject/${subjectId}`);
      setFiles(response.data);
    } catch (error) {
      console.error("Błąd pobierania plików:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col p-8 md:p-16 bg-slate-50 font-sans">
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-8">
        
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium w-fit">
          <ArrowLeft className="w-4 h-4" /> Powrót do semestrów
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-4 rounded-2xl">
              <Library className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{subjectName}</h1>
              <p className="text-slate-500 font-medium mt-1">Zarządzaj swoimi materiałami i nauką</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={`/study?subjectId=${subjectId}&name=${encodeURIComponent(subjectName)}`} className="flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 px-5 py-2.5 rounded-xl font-bold transition-colors border border-green-200 shadow-sm">
              <BookOpen className="w-5 h-5" /> Fiszki
            </Link>
            <Link href={`/ask?subjectId=${subjectId}&name=${encodeURIComponent(subjectName)}`} className="flex items-center gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 px-5 py-2.5 rounded-xl font-bold transition-colors border border-purple-200 shadow-sm">
              <Search className="w-5 h-5" /> Zapytaj RAG
            </Link>
            <Link href={`/upload?subjectId=${subjectId}&name=${encodeURIComponent(subjectName)}`} className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm">
              <UploadCloud className="w-5 h-5" /> Dodaj materiał
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-slate-500" /> Wgrane dokumenty
            </h2>
            <span className="text-sm font-bold text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
              {files.length} {files.length === 1 ? 'plik' : files.length >= 2 && files.length <= 4 ? 'pliki' : 'plików'}
            </span>
          </div>

          <div className="p-6 md:p-8">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-700 mb-2">Brak materiałów</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">Nie wgrałeś jeszcze żadnych notatek dla tego przedmiotu. Sztuczna inteligencja czeka na dokumenty!</p>
                <Link href={`/upload?subjectId=${subjectId}&name=${encodeURIComponent(subjectName)}`} className="inline-flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold transition-colors shadow-sm">
                  <UploadCloud className="w-5 h-5" /> Wgraj swój pierwszy plik
                </Link>
              </div>
            ) : (
              <ul className="space-y-4">
                {files.map((file) => (
                  <li key={file.id} className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group shadow-sm hover:shadow-md">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="bg-blue-100 p-3 rounded-xl text-blue-600 shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <span className="font-semibold text-slate-700 text-lg truncate group-hover:text-blue-700 transition-colors">
                        {file.name}
                      </span>
                    </div>
                    {file.created_at && (
                      <span className="text-sm font-medium text-slate-400 group-hover:text-blue-500 transition-colors ml-4 shrink-0 bg-white px-3 py-1 rounded-lg border border-slate-100">
                        {new Date(file.created_at).toLocaleDateString('pl-PL')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}