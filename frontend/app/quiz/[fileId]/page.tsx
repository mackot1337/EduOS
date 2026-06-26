"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, ArrowRight, BrainCircuit, RotateCcw } from 'lucide-react';

interface QuizOption {
  text: string;
  is_correct: boolean;
}

interface QuizQuestion {
  question: string;
  options: QuizOption[];
  explanation: string;
}

interface QuizData {
  questions: QuizQuestion[];
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const fileId = params.fileId as string;

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const generateQuiz = async () => {
      try {
        const response = await api.post(`/files/${fileId}/generate-quiz?num_questions=5`);
        setQuizData(response.data);
      } catch (error: any) {
        alert("Nie udało się wygenerować quizu: " + (error.response?.data?.detail || error.message));
      } finally {
        setLoading(false);
      }
    };
    generateQuiz();
  }, [fileId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-slate-600 font-medium animate-pulse">Sztuczna inteligencja układa pytania z Twoich notatek...</p>
      </div>
    );
  }

  if (!quizData || quizData.questions.length === 0) {
    return <div className="text-center p-12">Brak pytań. Wróć do pliku i spróbuj ponownie.</div>;
  }

  const isFinished = currentIndex >= quizData.questions.length;
  
  if (isFinished) {
    const percentage = Math.round((score / quizData.questions.length) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border text-center space-y-6">
          <BrainCircuit className="w-16 h-16 text-blue-500 mx-auto" />
          <h1 className="text-3xl font-bold text-slate-800">Koniec Quizu!</h1>
          <p className="text-lg text-slate-600">Twój wynik: <b>{score}</b> z <b>{quizData.questions.length}</b> ({percentage}%)</p>
          <div className="flex gap-4 justify-center pt-4">
            <Button variant="outline" onClick={() => router.back()}>Wróć do plików</Button>
            <Button onClick={() => window.location.reload()}><RotateCcw className="w-4 h-4 mr-2"/> Generuj nowy</Button>
          </div>
        </div>
      </div>
    );
  }

  const question = quizData.questions[currentIndex];

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOptionIdx(idx);
    setIsAnswered(true);

    if (question.options[idx].is_correct) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    setCurrentIndex(i => i + 1);
    setSelectedOptionIdx(null);
    setIsAnswered(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between text-sm font-medium text-slate-500 mb-2">
          <span>Pytanie {currentIndex + 1} z {quizData.questions.length}</span>
          <span>Punkty: {score}</span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-300" 
            style={{ width: `${((currentIndex) / quizData.questions.length) * 100}%` }}
          />
        </div>

        <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-8">{question.question}</h2>

          <div className="space-y-3">
            {question.options.map((opt, idx) => {
              let bgColor = "bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50";
              let textColor = "text-slate-700";
              let Icon = null;

              if (isAnswered) {
                if (opt.is_correct) {
                  bgColor = "bg-green-50 border-green-500";
                  textColor = "text-green-900 font-semibold";
                  Icon = <CheckCircle2 className="w-5 h-5 text-green-600" />;
                } else if (idx === selectedOptionIdx) {
                  bgColor = "bg-red-50 border-red-500";
                  textColor = "text-red-900 font-semibold";
                  Icon = <XCircle className="w-5 h-5 text-red-600" />;
                } else {
                  bgColor = "bg-white border-slate-200 opacity-50";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${bgColor} ${textColor}`}
                >
                  <span className="text-lg">{opt.text}</span>
                  {Icon}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className="mt-8 p-5 bg-blue-50 border border-blue-100 rounded-xl animate-in fade-in slide-in-from-bottom-4">
              <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5"/> Dlaczego tak jest?
              </h3>
              <p className="text-blue-800 leading-relaxed">{question.explanation}</p>
              
              <div className="mt-6 flex justify-end">
                <Button onClick={handleNext} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Następne pytanie <ArrowRight className="w-4 h-4 ml-2"/>
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}