"use client";

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Library, FileText, UploadCloud, BookOpen, Search, Loader2, BrainCircuit, ChevronDown, MapPin, Clock } from 'lucide-react';

interface AcademicFile {
  id: number;
  name: string;
  summary?: string;
  created_at: string;
}

export default function SubjectDashboard({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const subjectId = resolvedParams.id;
  
  const searchParams = useSearchParams();
  const subjectName = searchParams.get('name') || "Wybrany Przedmiot";
  const subjectDay = searchParams.get('day');
  const subjectTime = searchParams.get('time');
  const subjectRoom = searchParams.get('room');

  const [files, setFiles] = useState<AcademicFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFileId, setExpandedFileId] = useState<number | null>(null);

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
          <ArrowLeft className="w-4 h-4" /> Powrót do planu zajęć
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-4 rounded-2xl shrink-0">
              <Library className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{subjectName}</h1>
              
              <div className="flex items-center gap-3 mt-2 text-sm font-medium text-slate-500">
                {subjectDay && subjectTime ? (
                  <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
                    <Clock className="w-4 h-4 text-slate-600" /> 
                    {subjectDay}, {subjectTime}
                  </span>
                ) : (
                  <span>Zarządzaj swoimi materiałami i nauką</span>
                )}
                
                {subjectRoom && (
                  <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-100">
                    <MapPin className="w-4 h-4" /> 
                    Sala {subjectRoom}
                  </span>
                )}
              </div>

            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/study?subjectId=${subjectId}&name=${encodeURIComponent(subjectName)}`} className="flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 px-5 py-2.5 rounded-xl font-bold transition-colors border border-green-200 shadow-sm whitespace-nowrap">
              <BookOpen className="w-5 h-5" /> Fiszki (Na dziś)
            </Link>
            <Link href={`/ask?subjectId=${subjectId}&name=${encodeURIComponent(subjectName)}`} className="flex items-center gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 px-5 py-2.5 rounded-xl font-bold transition-colors border border-purple-200 shadow-sm whitespace-nowrap">
              <Search className="w-5 h-5" /> Zapytaj RAG
            </Link>
            <Link href={`/upload?subjectId=${subjectId}&name=${encodeURIComponent(subjectName)}`} className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm whitespace-nowrap">
              <UploadCloud className="w-5 h-5" /> Wgraj plik
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-slate-500" /> Wgrane dokumenty
            </h2>
            <span className="text-sm font-bold text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
              {files.length}
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
                <p className="text-slate-500 mb-6 max-w-md mx-auto">Sztuczna inteligencja czeka na dokumenty!</p>
                <Link href={`/upload?subjectId=${subjectId}&name=${encodeURIComponent(subjectName)}`} className="inline-flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold transition-colors shadow-sm">
                  <UploadCloud className="w-5 h-5" /> Wgraj plik
                </Link>
              </div>
            ) : (
              <ul className="space-y-4">
                {files.map((file) => (
                  <li key={file.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:border-blue-300 transition-all">
                    
                    <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between p-4 lg:p-5 hover:bg-blue-50/30 transition-colors">
                      <button 
                        onClick={() => setExpandedFileId(expandedFileId === file.id ? null : file.id)}
                        className="flex-1 flex items-center gap-4 overflow-hidden text-left"
                      >
                        <div className="bg-blue-100 p-3 rounded-xl text-blue-600 shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                        <span className="font-semibold text-slate-700 text-base md:text-lg truncate">{file.name}</span>
                      </button>

                      <div className="flex items-center gap-3 mt-4 lg:mt-0 lg:ml-4 shrink-0 justify-end">
                        <Link href={`/study?subjectId=${subjectId}&name=${encodeURIComponent(subjectName)}&mode=all&fileId=${file.id}`} className="flex items-center gap-2 bg-amber-50 text-amber-700 hover:bg-amber-100 px-3 py-2 rounded-lg font-bold transition-colors border border-amber-200 text-sm whitespace-nowrap">
                          <BrainCircuit className="w-4 h-4" /> Zakuwanie
                        </Link>
                        
                        {file.created_at && (
                          <span className="text-sm font-medium text-slate-400 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 hidden md:block">
                            {new Date(file.created_at).toLocaleDateString('pl-PL')}
                          </span>
                        )}
                        
                        <button 
                          onClick={() => setExpandedFileId(expandedFileId === file.id ? null : file.id)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                        >
                          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedFileId === file.id ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {expandedFileId === file.id && (
                      <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-slate-600 animate-in slide-in-from-top-2">
                        <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">Podsumowanie AI</h4>
                        <p className="whitespace-pre-line text-sm leading-relaxed">
                          {file.summary || "Brak wygenerowanego podsumowania. Plik został wgrany przed aktywacją tej funkcji."}
                        </p>
                      </div>
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