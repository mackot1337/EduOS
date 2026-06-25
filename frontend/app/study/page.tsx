"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { 
  ArrowLeft, Brain, Check, RefreshCw, X, Eye, FileQuestion, 
  Plus, Edit2, Trash2 
} from 'lucide-react';

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

  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");

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
      setCurrentIndex(0);
      setIsFlipped(false);
      setFinished(false);
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

const handleCreateFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        question: newQuestion,
        answer: newAnswer
      };

      // Jeśli jesteśmy w trybie konkretnego pliku, dopinamy jego ID do fiszki
      if (fileId) {
        payload.file_id = parseInt(fileId);
      }

      const response = await api.post(`/flashcards/subjects/${subjectId}`, payload);
      
      const newCard: Flashcard = {
        id: response.data.id,
        pytanie: response.data.pytanie,
        odpowiedz: response.data.odpowiedz,
        poziom: response.data.poziom
      };

      setFlashcards(prev => [...prev, newCard]);
      setTotalCount(prev => prev + 1);
      
      if (flashcards.length === 0 || finished) {
        setFinished(false);
      }

      setShowAddModal(false);
      setNewQuestion("");
      setNewAnswer("");
    } catch (error) {
      alert("Błąd podczas dodawania fiszki.");
    }
  };

  const handleDeleteFlashcard = async () => {
    if (!confirm("Na pewno chcesz usunąć tę fiszkę z bazy?")) return;
    
    const currentCard = flashcards[currentIndex];
    try {
      await api.delete(`/flashcards/${currentCard.id}`);
      
      const updatedFlashcards = flashcards.filter((_, idx) => idx !== currentIndex);
      setFlashcards(updatedFlashcards);
      setTotalCount(prev => prev - 1);
      setIsFlipped(false);

      if (currentIndex >= updatedFlashcards.length) {
        setFinished(true);
      }
    } catch (error) {
      alert("Nie udało się usunąć fiszki.");
    }
  };

  const openEditModal = () => {
    const currentCard = flashcards[currentIndex];
    setEditQuestion(currentCard.pytanie);
    setEditAnswer(currentCard.odpowiedz);
    setShowEditModal(true);
  };

  const handleUpdateFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentCard = flashcards[currentIndex];
    try {
      await api.patch(`/flashcards/${currentCard.id}`, {
        question: editQuestion,
        answer: editAnswer
      });

      const updatedFlashcards = [...flashcards];
      updatedFlashcards[currentIndex] = {
        ...currentCard,
        pytanie: editQuestion,
        odpowiedz: editAnswer
      };
      
      setFlashcards(updatedFlashcards);
      setShowEditModal(false);
    } catch (error) {
      alert("Nie udało się zaktualizować fiszki.");
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
    <div className="min-h-screen bg-slate-50 p-8 md:p-16 font-sans relative">
      <div className="max-w-2xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <Link href={subjectDashboardUrl} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Powrót do przedmiotu
          </Link>
          <button 
            onClick={() => setShowAddModal(true)} 
            className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            <Plus className="w-4 h-4" /> Dodaj fiszkę
          </button>
        </div>

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
              Nie wygenerowałeś jeszcze żadnych fiszek dla tego przedmiotu, ale możesz dodać je ręcznie klikając przycisk powyżej.
            </p>
            <Link href={`/upload?subjectId=${subjectId}&name=${encodeURIComponent(subjectName)}`} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-colors inline-block">
              Przejdź do generowania AI
            </Link>
          </div>

        ) : flashcards.length === 0 || finished ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center animate-in fade-in duration-500">
            <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Świetna robota!</h2>
            <p className="text-slate-500 mb-6">Przerobiłeś wszystkie zaplanowane na dziś fiszki z tego przedmiotu. Wróć tu jutro, aby utrwalić wiedzę.</p>
            <Link href={subjectDashboardUrl} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-colors inline-block">
              Wróć do przedmiotu
            </Link>
          </div>

        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[300px] flex flex-col relative transition-all group">
              
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/80 backdrop-blur-sm p-1 rounded-lg border border-slate-200 shadow-sm">
                <button 
                  onClick={openEditModal} 
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Edytuj fiszkę"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleDeleteFlashcard} 
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Usuń fiszkę"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-8 flex-1 flex flex-col justify-center items-center text-center">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Pytanie</span>
                <h2 className="text-2xl font-medium text-slate-800 leading-relaxed whitespace-pre-wrap break-words w-full">
                  {flashcards[currentIndex].pytanie}
                </h2>
              </div>

              {isFlipped ? (
                <div className="p-8 bg-blue-50/50 border-t border-slate-100 flex-1 flex flex-col justify-center items-center text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <span className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4">Odpowiedź</span>
                  <p className="text-lg text-slate-700 leading-relaxed whitespace-pre-wrap break-words w-full">
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

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Plus className="text-blue-500 w-6 h-6"/> Dodaj fiszkę ręcznie</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleCreateFlashcard} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Pytanie</label>
                <textarea 
                  required
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm resize-none h-24"
                  placeholder="Wpisz treść pytania..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Odpowiedź</label>
                <textarea 
                  required
                  value={newAnswer}
                  onChange={e => setNewAnswer(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm resize-none h-32 bg-blue-50/50"
                  placeholder="Wpisz poprawną odpowiedź..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm transition-colors">Anuluj</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm">Zapisz fiszkę</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Edit2 className="text-amber-500 w-6 h-6"/> Edytuj fiszkę</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleUpdateFlashcard} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Pytanie</label>
                <textarea 
                  required
                  value={editQuestion}
                  onChange={e => setEditQuestion(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm resize-none h-24"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Odpowiedź</label>
                <textarea 
                  required
                  value={editAnswer}
                  onChange={e => setEditAnswer(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm resize-none h-32 bg-amber-50/50"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm transition-colors">Anuluj</button>
                <button type="submit" className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium text-sm transition-all shadow-sm">Zapisz zmiany</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}