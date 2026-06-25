"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { 
  Calendar, Plus, GraduationCap, Loader2, MapPin, Clock, 
  BookOpen, Trash2, Edit2, X, Check 
} from 'lucide-react';

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

const getSubjectColors = (name: string) => {
  const upperName = name.toUpperCase();

  const isWyk = /(?:\s|^|\()(W|WYK|WYKŁAD)(?:\s|$|\))/.test(upperName) || /^[A-Z0-9]+W\s/.test(upperName);
  const isLab = /(?:\s|^|\()(L|LAB|LABORATORIUM)(?:\s|$|\))/.test(upperName) || /^[A-Z0-9]+L\s/.test(upperName);
  const isCw = /(?:\s|^|\()(C|Ć|ĆW|ĆWICZENIA)(?:\s|$|\))/.test(upperName) || /^[A-Z0-9]+[CĆ]\s/.test(upperName);
  const isProj = /(?:\s|^|\()(P|PROJ|PROJEKT)(?:\s|$|\))/.test(upperName) || /^[A-Z0-9]+P\s/.test(upperName);
  const isSem = /(?:\s|^|\()(S|SEM|SEMINARIUM)(?:\s|$|\))/.test(upperName) || /^[A-Z0-9]+S\s/.test(upperName);

  if (isWyk) return "bg-red-50 hover:bg-red-600 border-red-200 hover:border-red-600 text-red-900 group-hover:text-white";
  if (isLab) return "bg-blue-50 hover:bg-blue-600 border-blue-200 hover:border-blue-600 text-blue-900 group-hover:text-white";
  if (isCw) return "bg-green-50 hover:bg-green-600 border-green-200 hover:border-green-600 text-green-900 group-hover:text-white";
  if (isProj) return "bg-purple-50 hover:bg-purple-600 border-purple-200 hover:border-purple-600 text-purple-900 group-hover:text-white";
  if (isSem) return "bg-amber-50 hover:bg-amber-500 border-amber-200 hover:border-amber-500 text-amber-900 group-hover:text-white";
  
  return "bg-slate-50 hover:bg-slate-700 border-slate-200 hover:border-slate-700 text-slate-800 group-hover:text-white";
};

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

  const [showUsosImport, setShowUsosImport] = useState(false);
  const [usosUrl, setUsosUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const [editingSubId, setEditingSubId] = useState<number | null>(null);
  const [editSubName, setEditSubName] = useState("");
  const [editSubRoom, setEditSubRoom] = useState("");
  
  const [editingSemId, setEditingSemId] = useState<number | null>(null);
  const [editSemName, setEditSemName] = useState("");
  const [editSemStart, setEditSemStart] = useState("");
  const [editSemEnd, setEditSemEnd] = useState("");

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      const response = await api.get('/academic/semesters');
      const fetchedSemesters = response.data;
      setSemesters(fetchedSemesters);
      
      if (fetchedSemesters.length > 0 && (!activeSemId || !fetchedSemesters.find((s: Semester) => s.id === activeSemId))) {
        setActiveSemId(fetchedSemesters[0].id);
      }
    } catch (error) {
      console.error("Błąd pobierania semestrów:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: 'semester' | 'subject', id: number) => {
    const isSemester = type === 'semester';
    if (!confirm(`Czy na pewno chcesz usunąć ten ${isSemester ? 'semestr (usunie to też wszystkie przypisane pliki i zadania!)' : 'przedmiot'}?`)) return;
    
    try {
      await api.delete(`/academic/${isSemester ? 'semesters' : 'subjects'}/${id}`);
      fetchSemesters();
    } catch (error) {
      console.error("Błąd usuwania:", error);
      alert("Nie udało się usunąć elementu.");
    }
  };

  const handleUpdateSubject = async (id: number) => {
    if (!editSubName.trim()) return;
    try {
      await api.patch(`/academic/subjects/${id}`, { 
        name: editSubName,
        room: editSubRoom.trim() || null
      });
      setEditingSubId(null);
      fetchSemesters();
    } catch (error) {
      alert("Błąd podczas aktualizacji przedmiotu.");
    }
  };

  const handleUpdateSemester = async (id: number) => {
    if (!editSemName.trim()) return;
    try {
      await api.patch(`/academic/semesters/${id}`, { 
        name: editSemName,
        start_date: editSemStart || null,
        end_date: editSemEnd || null
      });
      setEditingSemId(null);
      fetchSemesters();
    } catch (error) {
      alert("Błąd podczas aktualizacji semestru.");
    }
  };

  const handleDragStart = (e: React.DragEvent, subjectId: number) => {
    e.dataTransfer.setData("subjectId", subjectId.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetDay: string | null, targetTimeBlock: string | null) => {
    e.preventDefault();
    const subjectIdStr = e.dataTransfer.getData("subjectId");
    if (!subjectIdStr) return;
    
    const subjectId = parseInt(subjectIdStr, 10);
    
    try {
      await api.patch(`/academic/subjects/${subjectId}`, { 
        day_of_week: targetDay, 
        time_block: targetTimeBlock 
      });
      fetchSemesters();
    } catch (error) {
      console.error(error);
      alert("Nie udało się przenieść przedmiotu.");
    }
  };

  const handleImportUsos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSemId || !usosUrl) return;
    setIsImporting(true);
    try {
      await api.post(`/academic/semesters/${activeSemId}/import-usos`, { url: usosUrl });
      setShowUsosImport(false);
      setUsosUrl("");
      fetchSemesters();
      alert("Zajęcia zaimportowane pomyślnie!");
    } catch (error) {
      console.error(error);
      alert("Błąd podczas importu. Sprawdź link z USOSa.");
    } finally {
      setIsImporting(false);
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
          
          <div className="flex flex-col md:flex-row items-center gap-4">
            {semesters.length > 0 && (
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-xl p-1.5 shadow-sm">
                {editingSemId === activeSemId ? (
                  <div className="flex flex-col gap-2 p-2 w-full md:w-auto">
                    <input 
                      autoFocus
                      value={editSemName} 
                      onChange={e => setEditSemName(e.target.value)}
                      placeholder="Nazwa semestru"
                      className="p-1.5 border rounded border-blue-400 outline-none text-sm w-full font-medium"
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateSemester(activeSemId!)}
                    />
                    <div className="flex items-center gap-2">
                      <input 
                        type="date" 
                        value={editSemStart} 
                        onChange={e => setEditSemStart(e.target.value)} 
                        className="p-1 border rounded outline-none text-xs text-slate-600"
                        title="Data rozpoczęcia"
                      />
                      <span className="text-slate-400 text-xs">-</span>
                      <input 
                        type="date" 
                        value={editSemEnd} 
                        onChange={e => setEditSemEnd(e.target.value)} 
                        className="p-1 border rounded outline-none text-xs text-slate-600"
                        title="Data zakończenia"
                      />
                      <button onClick={() => handleUpdateSemester(activeSemId!)} className="text-green-600 hover:bg-green-100 p-1.5 rounded transition-colors"><Check className="w-4 h-4"/></button>
                      <button onClick={() => setEditingSemId(null)} className="text-slate-500 hover:bg-slate-200 p-1.5 rounded transition-colors"><X className="w-4 h-4"/></button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <select 
                      value={activeSemId || ''} 
                      onChange={(e) => setActiveSemId(Number(e.target.value))}
                      className="p-1.5 bg-transparent outline-none font-medium text-slate-700 cursor-pointer"
                    >
                      {semesters.map(sem => (
                        <option key={sem.id} value={sem.id}>{sem.name}</option>
                      ))}
                    </select>
                    <div className="flex items-center border-l border-slate-300 pl-1 ml-1 gap-1">
                      <button 
                        onClick={() => { 
                          setEditingSemId(activeSemId); 
                          setEditSemName(activeSemester?.name || ""); 
                          setEditSemStart(activeSemester?.start_date || "");
                          setEditSemEnd(activeSemester?.end_date || "");
                        }} 
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                        title="Edytuj semestr"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete('semester', activeSemId!)} 
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" 
                        title="Usuń cały semestr"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <button 
              onClick={() => setShowSemForm(!showSemForm)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 w-full md:w-auto justify-center"
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
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-500" /> Plan zajęć: {activeSemester?.name}
              </h2>
              
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => { setShowUsosImport(!showUsosImport); setShowSubForm(false); }}
                  className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm"
                >
                  Importuj z USOS
                </button>
                <button 
                  onClick={() => { setShowSubForm(!showSubForm); setShowUsosImport(false); }}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" /> Dodaj ręcznie
                </button>
              </div>
            </div>

            {showUsosImport && (
              <form onSubmit={handleImportUsos} className="bg-purple-50 p-6 rounded-2xl border-2 border-purple-200 border-dashed animate-in fade-in mb-6">
                <h3 className="font-bold text-purple-900 mb-2">Automatyczny import planu z USOS</h3>
                <p className="text-sm text-purple-700 mb-4">
                  Skopiuj link <b>iCalendar</b> z kalendarza w USOSweb i wklej go poniżej.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input 
                    type="url" 
                    placeholder="https://apps.usos.pwr.edu.pl/services/tt/upcoming_ical?..." 
                    value={usosUrl} 
                    onChange={(e) => setUsosUrl(e.target.value)} 
                    className="flex-1 p-3 bg-white border border-purple-200 rounded-lg outline-none focus:border-purple-500 text-sm" 
                    required 
                  />
                  <button 
                    type="submit" 
                    disabled={isImporting}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isImporting ? <><Loader2 className="w-4 h-4 animate-spin" /> Pobieranie...</> : "Pobierz plan"}
                  </button>
                </div>
              </form>
            )}

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
                        const cellSubjects = activeSemester?.subjects.filter(
                          (s) => s.day_of_week === day && s.time_block === time
                        ) || [];

                        return (
                          <td 
                            key={`${day}-${time}`} 
                            className="p-2 border-r border-slate-100 align-top min-h-[100px]"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, day, time)}
                          >
                            <div className="flex flex-col gap-2 h-full min-h-[80px]">
                              {cellSubjects.map(subject => (
                                <div 
                                  key={subject.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, subject.id)}
                                  className={`relative group rounded-lg border transition-all text-center cursor-move ${getSubjectColors(subject.name)}`}
                                  title="Chwyć i upuść, aby przenieść"
                                >
                                  {editingSubId === subject.id ? (
                                    <div className="p-3 flex flex-col gap-2 cursor-default" draggable="false" onDragStart={(e) => e.preventDefault()}>
                                      <input 
                                        autoFocus
                                        value={editSubName} 
                                        onChange={(e) => setEditSubName(e.target.value)}
                                        className="w-full p-1 text-sm text-slate-900 border border-blue-400 rounded outline-none"
                                        placeholder="Nazwa przedmiotu"
                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateSubject(subject.id)}
                                      />
                                      <input 
                                        value={editSubRoom} 
                                        onChange={(e) => setEditSubRoom(e.target.value)}
                                        className="w-full p-1 text-sm text-slate-900 border border-blue-400 rounded outline-none"
                                        placeholder="Sala (np. D-1, s. 312)"
                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateSubject(subject.id)}
                                      />
                                      <div className="flex justify-center gap-2">
                                        <button onClick={() => handleUpdateSubject(subject.id)} className="p-1 bg-green-500 hover:bg-green-600 text-white rounded"><Check className="w-3 h-3"/></button>
                                        <button onClick={() => setEditingSubId(null)} className="p-1 bg-slate-400 hover:bg-slate-500 text-white rounded"><X className="w-3 h-3"/></button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <Link href={`/subject/${subject.id}?name=${encodeURIComponent(subject.name)}`} className="block p-3">
                                        <p className="font-bold group-hover:text-white transition-colors line-clamp-2">
                                          {subject.name}
                                        </p>
                                        {subject.room && (
                                          <p className="text-xs group-hover:text-blue-100 mt-1 flex items-center justify-center gap-1">
                                            <MapPin className="w-3 h-3" /> {subject.room}
                                          </p>
                                        )}
                                      </Link>
                                      
                                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/95 p-1 rounded shadow-sm border border-slate-200 z-10 cursor-pointer">
                                        <button 
                                          onClick={(e) => { 
                                            e.preventDefault(); 
                                            e.stopPropagation(); 
                                            setEditingSubId(subject.id); 
                                            setEditSubName(subject.name); 
                                            setEditSubRoom(subject.room || ""); 
                                          }} 
                                          className="text-slate-500 hover:text-blue-600 p-0.5" title="Edytuj"
                                        >
                                          <Edit2 className="w-3 h-3"/>
                                        </button>
                                        <button 
                                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete('subject', subject.id); }} 
                                          className="text-slate-500 hover:text-red-600 p-0.5" title="Usuń"
                                        >
                                          <Trash2 className="w-3 h-3"/>
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
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

            <div 
              className="mt-8 bg-slate-100/50 p-4 rounded-xl border-2 border-dashed border-transparent hover:border-slate-300 transition-colors"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, null, null)}
              title="Upuść tutaj przedmiot, aby usunąć go z planu"
            >
              <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5" /> Przedmioty niesklasyfikowane w planie
              </h3>
              
              {activeSemester?.subjects.some(s => !s.day_of_week || !s.time_block) ? (
                <div className="flex flex-wrap gap-3 min-h-[40px]">
                  {activeSemester.subjects.filter(s => !s.day_of_week || !s.time_block).map(sub => (
                    <div 
                      key={sub.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, sub.id)}
                      className="group relative cursor-move bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors text-slate-700 font-medium flex items-center"
                    >
                      {editingSubId === sub.id ? (
                        <div className="p-2 flex items-center gap-2 cursor-default" draggable="false" onDragStart={(e) => e.preventDefault()}>
                          <input 
                            autoFocus
                            value={editSubName} 
                            onChange={(e) => setEditSubName(e.target.value)}
                            className="p-1 border border-blue-400 rounded outline-none text-sm w-40"
                            placeholder="Nazwa"
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateSubject(sub.id)}
                          />
                          <input 
                            value={editSubRoom} 
                            onChange={(e) => setEditSubRoom(e.target.value)}
                            className="p-1 border border-blue-400 rounded outline-none text-sm w-24"
                            placeholder="Sala"
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateSubject(sub.id)}
                          />
                          <button onClick={() => handleUpdateSubject(sub.id)} className="text-green-600 hover:bg-green-100 p-1 rounded"><Check className="w-4 h-4"/></button>
                          <button onClick={() => setEditingSubId(null)} className="text-slate-500 hover:bg-slate-200 p-1 rounded"><X className="w-4 h-4"/></button>
                        </div>
                      ) : (
                        <>
                          <Link href={`/subject/${sub.id}?name=${encodeURIComponent(sub.name)}`} className="block px-4 py-2">
                            {sub.name}
                          </Link>
                          <div className="hidden group-hover:flex items-center gap-1 pr-2 border-l border-slate-200 pl-2 py-1 cursor-pointer">
                            <button 
                              onClick={(e) => { 
                                e.preventDefault(); 
                                e.stopPropagation(); 
                                setEditingSubId(sub.id); 
                                setEditSubName(sub.name); 
                                setEditSubRoom(sub.room || "");
                              }} 
                              className="text-slate-400 hover:text-blue-600 transition-colors" title="Edytuj"
                            >
                              <Edit2 className="w-3.5 h-3.5"/>
                            </button>
                            <button 
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete('subject', sub.id); }} 
                              className="text-slate-400 hover:text-red-600 transition-colors" title="Usuń"
                            >
                              <Trash2 className="w-3.5 h-3.5"/>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Brak. Możesz przeciągnąć przedmiot z tabeli tutaj, aby zdjąć go z planu.</p>
              )}
            </div>
            
          </div>
        )}
      </div>
    </main>
  );
}