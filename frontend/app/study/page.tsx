"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Brain, Check, RefreshCw, X, Eye, FileQuestion } from 'lucide-react';

interface Flashcard {
  id: number;
  pytanie: string;
  odpowiedz: string;
  poziom: number;
}

export default function StudyPage() {
  const searchParams = useSearchParams();
  const subjectId = searchParams.get('subjectId') || '1';
  const subjectName = searchParams.get('name') || 'Wybrany Przedmiot';
  const mode = searchParams.get('mode');
  const fileId = searchParams.get('fileId');

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    fetchDueFlashcards();
  }, [subjectId, mode, fileId]);

  const fetchDueFlashcards = async () => {
    try {
      const endpoint = mode === 'all' 
        ? `/flashcards/all/${subjectId}${fileId ? `?file_id=${fileId}` : ''}` 
        : `/flashcards/due/${subjectId}`;
        
      const response = await api.get(endpoint);
      setFlashcards(response.data?.flashcards || []);
      setTotalCount(response.data?.total_count || 0);
    } catch (error) {
      console.error("Błąd podczas pobierania fiszek:", error);
      setFlashcards([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (quality: number) => {
    const currentCard = flashcards[currentIndex];
    
    if (currentIndex + 1 < flashcards.length) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setFinished(true);
    }

    try {
      await api.post(`/flashcards/${currentCard.id}/review`, {
        recall_quality: quality
      });
    } catch (error) {
      console.error("Błąd podczas zapisywania oceny:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const subjectDashboardUrl = `/subject/${subjectId}?name=${encodeURIComponent(subjectName)}`;

  return (
    <div className="min-h-screen bg-slate-50 p-8 md:p-16 font-sans">
      <div className="max-w-2xl mx-auto">
        
        <Link href={subjectDashboardUrl} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-8 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Powrót do przedmiotu
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-900 flex items-center gap-3">
            <Brain className="text-green-500 w-10 h-10" /> 
            {mode === 'all' ? 'Zakuwanie (Wszystko)' : 'Inteligentne Powtórki'}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">{subjectName}</p>
          {!finished && flashcards.length > 0 && (
            <p className="text-slate-500 mt-1">
              Karta {currentIndex + 1} z {flashcards.length}
            </p>
          )}
        </div>

        {totalCount === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center animate-in fade-in duration-500">
            <FileQuestion className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Brak fiszek w bazie</h2>
            <p className="text-slate-500 mb-6">
              Nie wygenerowałeś jeszcze żadnych fiszek dla tego przedmiotu. Przejdź do panelu AI, aby przetworzyć swoje materiały na fiszki.
            </p>
            <Link href={`/upload?subjectId=${subjectId}&name=${encodeURIComponent(subjectName)}`} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-colors">
              Przejdź do generowania
            </Link>
          </div>

        ) : flashcards.length === 0 || finished ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center animate-in fade-in duration-500">
            <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Świetna robota!</h2>
            <p className="text-slate-500 mb-6">Przerobiłeś wszystkie zaplanowane na dziś fiszki z tego przedmiotu. Wróć tu jutro, aby utrwalić wiedzę.</p>
            <Link href={subjectDashboardUrl} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-colors">
              Wróć do przedmiotu
            </Link>
          </div>

        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[300px] flex flex-col relative transition-all">
              <div className="p-8 flex-1 flex flex-col justify-center items-center text-center">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Pytanie</span>
                <h2 className="text-2xl font-medium text-slate-800 leading-relaxed">
                  {flashcards[currentIndex].pytanie}
                </h2>
              </div>

              {isFlipped ? (
                <div className="p-8 bg-blue-50/50 border-t border-slate-100 flex-1 flex flex-col justify-center items-center text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <span className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4">Odpowiedź</span>
                  <p className="text-lg text-slate-700 leading-relaxed">
                    {flashcards[currentIndex].odpowiedz}
                  </p>
                </div>
              ) : (
                <button 
                  onClick={() => setIsFlipped(true)}
                  className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors w-full font-medium"
                >
                  <Eye className="w-5 h-5" /> Pokaż odpowiedź
                </button>
              )}
            </div>

            {isFlipped && (
              <div className="grid grid-cols-3 gap-4 animate-in fade-in duration-300">
                <button 
                  onClick={() => handleRate(0)}
                  className="flex flex-col items-center p-4 bg-white border-2 border-red-100 hover:border-red-400 rounded-xl group transition-all"
                >
                  <X className="w-6 h-6 text-red-400 group-hover:text-red-600 mb-1" />
                  <span className="font-semibold text-slate-700">Nie pamiętam</span>
                  <span className="text-xs text-slate-400">Powtórka dzisiaj</span>
                </button>
                
                <button 
                  onClick={() => handleRate(1)}
                  className="flex flex-col items-center p-4 bg-white border-2 border-amber-100 hover:border-amber-400 rounded-xl group transition-all"
                >
                  <RefreshCw className="w-6 h-6 text-amber-400 group-hover:text-amber-600 mb-1" />
                  <span className="font-semibold text-slate-700">Trudne</span>
                  <span className="text-xs text-slate-400">Powtórka wkrótce</span>
                </button>

                <button 
                  onClick={() => handleRate(2)}
                  className="flex flex-col items-center p-4 bg-white border-2 border-green-100 hover:border-green-400 rounded-xl group transition-all"
                >
                  <Check className="w-6 h-6 text-green-400 group-hover:text-green-600 mb-1" />
                  <span className="font-semibold text-slate-700">Łatwe</span>
                  <span className="text-xs text-slate-400">Dłuższa przerwa</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}