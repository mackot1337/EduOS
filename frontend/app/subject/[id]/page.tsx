"use client";

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Library, FileText, UploadCloud, BookOpen, Search, Loader2, BrainCircuit, ChevronDown, MapPin, Clock, Plus, GripVertical, Trash2, CheckCircle2, CircleDashed } from 'lucide-react';

interface AcademicFile {
  id: number;
  name: string;
  summary?: string;
  created_at: string;
}

interface Task {
  id: number;
  subject_id: number;
  title: string;
  description?: string;
  due_date?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFileId, setExpandedFileId] = useState<number | null>(null);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '' });

  useEffect(() => {
    fetchData();
  }, [subjectId]);

  const fetchData = async () => {
    try {
      const [filesRes, tasksRes] = await Promise.all([
        api.get(`/files/subject/${subjectId}`),
        api.get(`/academic/subjects/${subjectId}/tasks`)
      ]);
      setFiles(filesRes.data);
      setTasks(tasksRes.data);
    } catch (error) {
      console.error("Błąd pobierania danych:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData("taskId", taskId.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: Task['status']) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData("taskId");
    if (!taskIdStr) return;
    const taskId = parseInt(taskIdStr);

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      await api.patch(`/academic/tasks/${taskId}`, { status: newStatus });
    } catch (error) {
      console.error("Błąd zmiany statusu", error);
      fetchData();
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/academic/semesters/${subjectId}/tasks`, newTask);
      setNewTask({ title: '', description: '', due_date: '' });
      setShowTaskForm(false);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if(!confirm("Na pewno usunąć to zadanie?")) return;
    try {
      await api.delete(`/academic/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <main className="flex min-h-screen flex-col p-8 md:p-16 bg-slate-50 font-sans">
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-8">
        
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
                    <Clock className="w-4 h-4 text-slate-600" /> {subjectDay}, {subjectTime}
                  </span>
                ) : (<span>Zarządzaj swoimi materiałami i nauką</span>)}
                
                {subjectRoom && (
                  <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-100">
                    <MapPin className="w-4 h-4" /> Sala {subjectRoom}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/study?subjectId=${subjectId}&name=${encodeURIComponent(subjectName)}`} className="flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 px-5 py-2.5 rounded-xl font-bold transition-colors border border-green-200 shadow-sm whitespace-nowrap">
              <BookOpen className="w-5 h-5" /> Fiszki
            </Link>
            <Link href={`/ask?subjectId=${subjectId}&name=${encodeURIComponent(subjectName)}`} className="flex items-center gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 px-5 py-2.5 rounded-xl font-bold transition-colors border border-purple-200 shadow-sm whitespace-nowrap">
              <Search className="w-5 h-5" /> Zapytaj RAG
            </Link>
            <Link href={`/upload?subjectId=${subjectId}&name=${encodeURIComponent(subjectName)}`} className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm whitespace-nowrap">
              <UploadCloud className="w-5 h-5" /> Wgraj plik
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-slate-500" /> Materiały
                </h2>
                <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200">{files.length}</span>
              </div>
              <div className="p-4">
                {files.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400 text-sm mb-4">Brak wgranych plików.</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {files.map((file) => (
                      <li key={file.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:border-blue-300 transition-all">
                        <button onClick={() => setExpandedFileId(expandedFileId === file.id ? null : file.id)} className="w-full flex items-center justify-between p-3 hover:bg-blue-50/30 transition-colors text-left">
                          <span className="font-medium text-slate-700 text-sm truncate">{file.name}</span>
                          <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${expandedFileId === file.id ? 'rotate-180' : ''}`} />
                        </button>
                        {expandedFileId === file.id && (
                          <div className="p-3 bg-slate-50 border-t border-slate-100 text-slate-600 text-xs">
                            <p className="whitespace-pre-line">{file.summary || "Brak podsumowania."}</p>
                            <Link href={`/study?subjectId=${subjectId}&name=${encodeURIComponent(subjectName)}&mode=all&fileId=${file.id}`} className="mt-3 inline-flex items-center gap-1.5 text-amber-600 hover:text-amber-800 font-semibold bg-amber-50 px-3 py-1.5 rounded border border-amber-200">
                              <BrainCircuit className="w-3 h-3" /> Zakuwaj z tego pliku
                            </Link>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" /> Tablica Zadań (Kanban)
                </h2>
                <button onClick={() => setShowTaskForm(!showTaskForm)} className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm">
                  <Plus className="w-4 h-4" /> Nowe zadanie
                </button>
              </div>

              {showTaskForm && (
                <form onSubmit={handleAddTask} className="bg-white p-5 rounded-xl border-2 border-blue-200 border-dashed animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input type="text" placeholder="Tytuł (np. Kolokwium 1, Prezentacja)" value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm" required />
                    <input type="date" value={newTask.due_date} onChange={(e) => setNewTask({...newTask, due_date: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm" />
                    <input type="text" placeholder="Krótki opis lub linki..." value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm md:col-span-2" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowTaskForm(false)} className="px-4 py-2 text-slate-500 text-sm hover:bg-slate-100 rounded-lg font-medium">Anuluj</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium">Dodaj zadanie</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div 
                  className="bg-slate-100/70 p-4 rounded-xl border border-slate-200 flex flex-col gap-3 min-h-[300px]"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'TODO')}
                >
                  <h3 className="font-bold text-slate-600 text-sm flex items-center justify-between">
                    <span>Do zrobienia</span>
                    <span className="bg-slate-200 px-2 py-0.5 rounded-full text-xs">{tasks.filter(t => t.status === 'TODO').length}</span>
                  </h3>
                  {tasks.filter(t => t.status === 'TODO').map(task => (
                    <TaskCard key={task.id} task={task} onDragStart={handleDragStart} onDelete={handleDeleteTask} />
                  ))}
                </div>

                <div 
                  className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col gap-3 min-h-[300px]"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'IN_PROGRESS')}
                >
                  <h3 className="font-bold text-blue-700 text-sm flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><CircleDashed className="w-4 h-4 animate-spin-slow"/> W trakcie</span>
                    <span className="bg-blue-100 px-2 py-0.5 rounded-full text-xs">{tasks.filter(t => t.status === 'IN_PROGRESS').length}</span>
                  </h3>
                  {tasks.filter(t => t.status === 'IN_PROGRESS').map(task => (
                    <TaskCard key={task.id} task={task} onDragStart={handleDragStart} onDelete={handleDeleteTask} />
                  ))}
                </div>

                <div 
                  className="bg-green-50/50 p-4 rounded-xl border border-green-100 flex flex-col gap-3 min-h-[300px]"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'DONE')}
                >
                  <h3 className="font-bold text-green-700 text-sm flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4"/> Gotowe</span>
                    <span className="bg-green-100 px-2 py-0.5 rounded-full text-xs">{tasks.filter(t => t.status === 'DONE').length}</span>
                  </h3>
                  {tasks.filter(t => t.status === 'DONE').map(task => (
                    <TaskCard key={task.id} task={task} onDragStart={handleDragStart} onDelete={handleDeleteTask} />
                  ))}
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function TaskCard({ task, onDragStart, onDelete }: { task: Task, onDragStart: (e: React.DragEvent, id: number) => void, onDelete: (id: number) => void }) {
  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 transition-colors group relative"
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-slate-300 mt-1 shrink-0" />
        <div className="flex-1">
          <h4 className="font-bold text-slate-800 text-sm leading-tight">{task.title}</h4>
          {task.description && (
            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{task.description}</p>
          )}
          {task.due_date && (
            <div className={`mt-3 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${new Date(task.due_date) < new Date() && task.status !== 'DONE' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-600'}`}>
              <Clock className="w-3 h-3" /> 
              {new Date(task.due_date).toLocaleDateString('pl-PL')}
            </div>
          )}
        </div>
      </div>
      <button 
        onClick={() => onDelete(task.id)}
        className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
        title="Usuń zadanie"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}