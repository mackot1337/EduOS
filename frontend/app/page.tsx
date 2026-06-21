"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { BookOpen, Calendar, Plus, ChevronRight, GraduationCap, Loader2, Library } from 'lucide-react';

interface Subject {
  id: number;
  name: string;
  code?: string;
  instructor?: string;
}

interface Semester {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  subjects: Subject[];
}

export default function Home() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showSemForm, setShowSemForm] = useState(false);
  const [newSemName, setNewSemName] = useState("");
  const [newSemStart, setNewSemStart] = useState("");
  const [newSemEnd, setNewSemEnd] = useState("");

  const [activeSemId, setActiveSemId] = useState<number | null>(null);
  const [newSubName, setNewSubName] = useState("");

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      const response = await api.get('/academic/semesters');
      setSemesters(response.data);
    } catch (error) {
      console.error("Błąd pobierania semestrów:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/academic/semesters', {
        name: newSemName,
        start_date: newSemStart,
        end_date: newSemEnd
      });
      setShowSemForm(false);
      setNewSemName(""); setNewSemStart(""); setNewSemEnd("");
      fetchSemesters();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddSubject = async (e: React.FormEvent, semesterId: number) => {
    e.preventDefault();
    try {
      await api.post(`/academic/semesters/${semesterId}/subjects`, {
        name: newSubName
      });
      setActiveSemId(null);
      setNewSubName("");
      fetchSemesters();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8 md:p-16 font-sans">
      <div className="max-w-5xl mx-auto space-y-12">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="w-10 h-10 text-blue-600" />
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">EduOS</h1>
            </div>
            <p className="text-lg text-slate-500">Twój panel zarządzania wiedzą.</p>
          </div>
          <button 
            onClick={() => setShowSemForm(!showSemForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 w-fit"
          >
            <Plus className="w-5 h-5" /> Dodaj Semestr
          </button>
        </div>

        {showSemForm && (
          <form onSubmit={handleAddSemester} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-semibold text-slate-800 mb-4">Nowy Semestr</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input type="text" placeholder="Nazwa (np. Semestr Zimowy 2026)" value={newSemName} onChange={(e) => setNewSemName(e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500" required />
              <input type="date" value={newSemStart} onChange={(e) => setNewSemStart(e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500" required />
              <input type="date" value={newSemEnd} onChange={(e) => setNewSemEnd(e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500" required />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowSemForm(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Anuluj</button>
              <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">Zapisz</button>
            </div>
          </form>
        )}

        <div className="space-y-8">
          {semesters.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-slate-300">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-700">Brak semestrów</h3>
              <p className="text-slate-500">Rozpocznij naukę dodając swój pierwszy semestr.</p>
            </div>
          ) : (
            semesters.map((sem) => (
              <div key={sem.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-400" /> {sem.name}
                  </h2>
                  <span className="text-slate-400 text-sm">{sem.start_date} - {sem.end_date}</span>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* PRZEDMIOTY */}
                    {sem.subjects.map((sub) => (
                      <Link href={`/subject/${sub.id}?name=${encodeURIComponent(sub.name)}`} key={sub.id} className="group p-5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer flex flex-col justify-between h-32">
                        <div>
                          <h3 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-2">{sub.name}</h3>
                          {sub.instructor && <p className="text-xs text-slate-500 mt-1">{sub.instructor}</p>}
                        </div>
                        <div className="flex items-center text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          Przejdź do nauki <ChevronRight className="w-4 h-4 ml-1" />
                        </div>
                      </Link>
                    ))}

                    {activeSemId === sem.id ? (
                      <form onSubmit={(e) => handleAddSubject(e, sem.id)} className="p-4 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 flex flex-col justify-between h-32">
                        <input autoFocus type="text" placeholder="Nazwa przedmiotu" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} className="w-full p-2 text-sm bg-white border border-blue-200 rounded outline-none focus:border-blue-500" required />
                        <div className="flex gap-2 mt-2">
                          <button type="submit" className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded hover:bg-blue-700">Dodaj</button>
                          <button type="button" onClick={() => setActiveSemId(null)} className="flex-1 bg-white text-slate-600 text-xs font-bold py-2 rounded border border-slate-200 hover:bg-slate-50">Anuluj</button>
                        </div>
                      </form>
                    ) : (
                      <button onClick={() => setActiveSemId(sem.id)} className="p-5 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all flex flex-col items-center justify-center h-32 gap-2">
                        <Plus className="w-6 h-6" />
                        <span className="font-medium text-sm">Dodaj przedmiot</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}