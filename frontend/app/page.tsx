"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Calendar, Plus, GraduationCap, Loader2, MapPin, Clock, BookOpen } from 'lucide-react';

const DAYS_OF_WEEK = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek"] as const;
const TIME_BLOCKS = [
  "7:30 - 9:00",
  "9:15 - 10:45",
  "11:15 - 12:45",
  "13:15 - 14:45",
  "15:15 - 16:45",
  "17:05 - 18:35",
  "18:55 - 20:25"
] as const;

interface Subject {
  id: number;
  name: string;
  code?: string;
  instructor?: string;
  day_of_week?: string;
  time_block?: string;
  room?: string;
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
  
  const [activeSemId, setActiveSemId] = useState<number | null>(null);

  const [showSemForm, setShowSemForm] = useState(false);
  const [newSemName, setNewSemName] = useState("");
  const [newSemStart, setNewSemStart] = useState("");
  const [newSemEnd, setNewSemEnd] = useState("");

  const [showSubForm, setShowSubForm] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubDay, setNewSubDay] = useState("");
  const [newSubTime, setNewSubTime] = useState("");
  const [newSubRoom, setNewSubRoom] = useState("");

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      const response = await api.get('/academic/semesters');
      const fetchedSemesters = response.data;
      setSemesters(fetchedSemesters);
      
      if (fetchedSemesters.length > 0 && !activeSemId) {
        setActiveSemId(fetchedSemesters[0].id);
      }
    } catch (error) {
      console.error("Błąd pobierania semestrów:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/academic/semesters', {
        name: newSemName,
        start_date: newSemStart,
        end_date: newSemEnd
      });
      setShowSemForm(false);
      setNewSemName(""); setNewSemStart(""); setNewSemEnd("");
      setActiveSemId(response.data.id);
      fetchSemesters();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSemId) return;
    try {
      await api.post(`/academic/semesters/${activeSemId}/subjects`, {
        name: newSubName,
        day_of_week: newSubDay || null,
        time_block: newSubTime || null,
        room: newSubRoom || null
      });
      setShowSubForm(false);
      setNewSubName(""); setNewSubDay(""); setNewSubTime(""); setNewSubRoom("");
      fetchSemesters();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  const activeSemester = semesters.find(s => s.id === activeSemId);

  return (
    <main className="min-h-screen bg-slate-50 p-8 md:p-16 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="w-10 h-10 text-blue-600" />
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">EduOS</h1>
            </div>
            <p className="text-lg text-slate-500">Twój interaktywny plan zajęć.</p>
          </div>
          
          <div className="flex items-center gap-4">
            {semesters.length > 0 && (
              <select 
                value={activeSemId || ''} 
                onChange={(e) => setActiveSemId(Number(e.target.value))}
                className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 font-medium text-slate-700"
              >
                {semesters.map(sem => (
                  <option key={sem.id} value={sem.id}>{sem.name}</option>
                ))}
              </select>
            )}
            <button 
              onClick={() => setShowSemForm(!showSemForm)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Nowy Semestr
            </button>
          </div>
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
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Zapisz</button>
            </div>
          </form>
        )}

        {semesters.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-slate-300">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-700">Brak semestrów</h3>
            <p className="text-slate-500">Dodaj swój pierwszy semestr, aby utworzyć plan zajęć.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-500" /> Plan zajęć: {activeSemester?.name}
              </h2>
              <button 
                onClick={() => setShowSubForm(!showSubForm)}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" /> Dodaj zajęcia do planu
              </button>
            </div>

            {showSubForm && (
              <form onSubmit={handleAddSubject} className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-200 border-dashed animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <input type="text" placeholder="Nazwa przedmiotu" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} className="p-3 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500" required />
                  
                  <select value={newSubDay} onChange={(e) => setNewSubDay(e.target.value)} className="p-3 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500" required>
                    <option value="" disabled>Wybierz dzień</option>
                    {DAYS_OF_WEEK.map(day => <option key={day} value={day}>{day}</option>)}
                  </select>

                  <select value={newSubTime} onChange={(e) => setNewSubTime(e.target.value)} className="p-3 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500" required>
                    <option value="" disabled>Wybierz godziny</option>
                    {TIME_BLOCKS.map(time => <option key={time} value={time}>{time}</option>)}
                  </select>

                  <input type="text" placeholder="Sala (opcjonalnie)" value={newSubRoom} onChange={(e) => setNewSubRoom(e.target.value)} className="p-3 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowSubForm(false)} className="px-4 py-2 text-slate-500 hover:bg-blue-100 rounded-lg">Anuluj</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Zapisz w planie</button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-semibold text-slate-600 w-32 border-r"><Clock className="w-4 h-4 inline mr-2"/>Godzina</th>
                    {DAYS_OF_WEEK.map((day) => (
                      <th key={day} className="p-4 font-semibold text-slate-600 text-center w-1/5">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {TIME_BLOCKS.map((time) => (
                    <tr key={time} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium text-slate-800 whitespace-nowrap border-r border-slate-100 text-center bg-slate-50/50">
                        {time}
                      </td>
                      
                      {DAYS_OF_WEEK.map((day) => {
                        // Pobieramy przedmioty przypisane do tej komórki siatki
                        const cellSubjects = activeSemester?.subjects.filter(
                          (s) => s.day_of_week === day && s.time_block === time
                        ) || [];

                        return (
                          <td key={`${day}-${time}`} className="p-2 border-r border-slate-100 align-top min-h-[100px]">
                            <div className="flex flex-col gap-2 h-full min-h-[80px]">
                              {cellSubjects.map(subject => (
                                <Link 
                                  href={`/subject/${subject.id}?name=${encodeURIComponent(subject.name)}`} 
                                  key={subject.id}
                                  className="group block bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-blue-600 p-3 rounded-lg transition-all text-center cursor-pointer"
                                >
                                  <p className="font-bold text-blue-900 group-hover:text-white transition-colors line-clamp-2">
                                    {subject.name}
                                  </p>
                                  {subject.room && (
                                    <p className="text-xs text-blue-700 group-hover:text-blue-100 mt-1 flex items-center justify-center gap-1">
                                      <MapPin className="w-3 h-3" /> {subject.room}
                                    </p>
                                  )}
                                </Link>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {activeSemester?.subjects.some(s => !s.day_of_week || !s.time_block) && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5" /> Przedmioty niesklasyfikowane w planie
                </h3>
                <div className="flex flex-wrap gap-3">
                  {activeSemester.subjects.filter(s => !s.day_of_week || !s.time_block).map(sub => (
                    <Link 
                      href={`/subject/${sub.id}?name=${encodeURIComponent(sub.name)}`} 
                      key={sub.id} 
                      className="bg-white border border-slate-200 px-4 py-2 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors text-slate-700 font-medium"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}