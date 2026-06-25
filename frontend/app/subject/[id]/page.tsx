"use client";

import React, { use, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { 
  ArrowLeft, Library, FileText, UploadCloud, BookOpen, Search, Loader2, 
  BrainCircuit, ChevronDown, MapPin, Clock, Plus, GripVertical, Trash2, 
  CheckCircle2, CircleDashed, X, AlignLeft, Edit2, Check, Download
} from 'lucide-react';

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

function SubjectContent({ params }: { params: Promise<{ id: string }> }) {
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

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '' });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTaskData, setEditTaskData] = useState({ title: '', description: '', due_date: '' });

  const [selectedFile, setSelectedFile] = useState<AcademicFile | null>(null);
  const [isEditingFile, setIsEditingFile] = useState(false);
  const [editFileName, setEditFileName] = useState("");

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

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const handleDrop = async (e: React.DragEvent, newStatus: Task['status']) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData("taskId");
    if (!taskIdStr) return;
    const taskId = parseInt(taskIdStr);

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await api.patch(`/academic/tasks/${taskId}`, { status: newStatus });
    } catch (error) {
      fetchData();
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/academic/subjects/${subjectId}/tasks`, newTask);
      setNewTask({ title: '', description: '', due_date: '' });
      setShowTaskForm(false);
      fetchData();
    } catch (error) { alert("Błąd dodawania zadania."); }
  };

  const handleDeleteTask = async (taskId: number) => {
    if(!confirm("Na pewno usunąć to zadanie?")) return;
    try {
      await api.delete(`/academic/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
        setIsEditingTask(false);
      }
    } catch (error) { console.error(error); }
  };

  const handleUpdateTaskDetails = async () => {
    if (!selectedTask || !editTaskData.title.trim()) return;
    try {
      const payload = {
        title: editTaskData.title,
        description: editTaskData.description,
        due_date: editTaskData.due_date || null
      };
      await api.patch(`/academic/tasks/${selectedTask.id}`, payload);
      
      const updatedTask: Task = { 
        ...selectedTask, 
        title: editTaskData.title,
        description: editTaskData.description,
        due_date: editTaskData.due_date || undefined 
      };
      
      setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
      setSelectedTask(updatedTask);
      setIsEditingTask(false);
    } catch (error) { alert("Błąd podczas aktualizacji zadania."); }
  };

  const openTaskModal = (task: Task) => {
    setSelectedTask(task);
    setIsEditingTask(false);
  };

  const openFileModal = (file: AcademicFile) => {
    setSelectedFile(file);
    setIsEditingFile(false);
  };

  const handleDeleteFile = async (fileId: number) => {
    if(!confirm("Na pewno usunąć ten plik? Zostanie on usunięty również z dysku serwera.")) return;
    try {
      await api.delete(`/files/${fileId}`);
      setFiles(files.filter(f => f.id !== fileId));
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
        setIsEditingFile(false);
      }
    } catch (error) {
      console.error(error);
      alert("Nie udało się usunąć pliku.");
    }
  };

  const handleUpdateFile = async () => {
    if (!selectedFile || !editFileName.trim()) return;
    try {
      await api.patch(`/files/${selectedFile.id}`, { name: editFileName });
      const updatedFile = { ...selectedFile, name: editFileName };
      setFiles(files.map(f => f.id === selectedFile.id ? updatedFile : f));
      setSelectedFile(updatedFile);
      setIsEditingFile(false);
    } catch (error) {
      alert("Błąd podczas zmiany nazwy pliku.");
    }
  };

  const handleDownloadFile = async () => {
    if (!selectedFile) return;
    try {
      const response = await api.get(`/files/${selectedFile.id}/download`, {
        responseType: 'blob', 
      });
      
      const disposition = response.headers['content-disposition'];
      let filename = selectedFile.name;
      
      if (disposition) {
        const filenameStarMatch = disposition.match(/filename\*=utf-8''([^;\n]*)/i);
        const filenameMatch = disposition.match(/filename="([^"]*)"/i);
        
        if (filenameStarMatch && filenameStarMatch[1]) {
          filename = decodeURIComponent(filenameStarMatch[1]);
        } else if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Błąd pobierania:", error);
      alert("Nie udało się pobrać pliku.");
    }
  };

  const closeAllModals = () => {
    setSelectedTask(null);
    setIsEditingTask(false);
    setSelectedFile(null);
    setIsEditingFile(false);
  };

  return (
    <div className="flex min-h-screen flex-col p-8 md:p-16 bg-slate-50 font-sans">
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
                      <li 
                        key={file.id} 
                        onClick={() => openFileModal(file)}
                        className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="w-full flex items-center justify-between p-3 transition-colors text-left">
                          <span className="font-semibold text-slate-700 text-sm truncate group-hover:text-blue-700 transition-colors">{file.name}</span>
                          <FileText className="w-4 h-4 shrink-0 text-slate-300 group-hover:text-blue-400 transition-colors" />
                        </div>
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
                    <textarea placeholder="Pełny opis, wytyczne, linki (możesz wpisać ile chcesz)..." value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm md:col-span-2 resize-none h-24" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowTaskForm(false)} className="px-4 py-2 text-slate-500 text-sm hover:bg-slate-100 rounded-lg font-medium">Anuluj</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium">Dodaj zadanie</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-100/70 p-4 rounded-xl border border-slate-200 flex flex-col gap-3 min-h-[300px]" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'TODO')}>
                  <h3 className="font-bold text-slate-600 text-sm flex items-center justify-between">
                    <span>Do zrobienia</span>
                    <span className="bg-slate-200 px-2 py-0.5 rounded-full text-xs">{tasks.filter(t => t.status === 'TODO').length}</span>
                  </h3>
                  {tasks.filter(t => t.status === 'TODO').map(task => (
                    <TaskCard key={task.id} task={task} onDragStart={handleDragStart} onDelete={handleDeleteTask} onView={() => openTaskModal(task)} />
                  ))}
                </div>

                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col gap-3 min-h-[300px]" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'IN_PROGRESS')}>
                  <h3 className="font-bold text-blue-700 text-sm flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><CircleDashed className="w-4 h-4 animate-spin-slow"/> W trakcie</span>
                    <span className="bg-blue-100 px-2 py-0.5 rounded-full text-xs">{tasks.filter(t => t.status === 'IN_PROGRESS').length}</span>
                  </h3>
                  {tasks.filter(t => t.status === 'IN_PROGRESS').map(task => (
                    <TaskCard key={task.id} task={task} onDragStart={handleDragStart} onDelete={handleDeleteTask} onView={() => openTaskModal(task)} />
                  ))}
                </div>

                <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 flex flex-col gap-3 min-h-[300px]" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'DONE')}>
                  <h3 className="font-bold text-green-700 text-sm flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4"/> Gotowe</span>
                    <span className="bg-green-100 px-2 py-0.5 rounded-full text-xs">{tasks.filter(t => t.status === 'DONE').length}</span>
                  </h3>
                  {tasks.filter(t => t.status === 'DONE').map(task => (
                    <TaskCard key={task.id} task={task} onDragStart={handleDragStart} onDelete={handleDeleteTask} onView={() => openTaskModal(task)} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={closeAllModals}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {!isEditingTask ? (
              <>
                <div className="flex justify-between items-start mb-4 shrink-0 pr-16 relative">
                  <h2 className="text-2xl font-bold text-slate-800 break-words leading-tight">{selectedTask.title}</h2>
                  <div className="absolute top-0 right-0 flex items-center gap-1">
                    <button 
                      onClick={() => {
                        setEditTaskData({
                          title: selectedTask.title,
                          description: selectedTask.description || '',
                          due_date: selectedTask.due_date || ''
                        });
                        setIsEditingTask(true);
                      }} 
                      className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                      title="Edytuj zadanie"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={closeAllModals} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-6 shrink-0">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${
                    selectedTask.status === 'DONE' ? 'bg-green-50 text-green-700 border-green-200' : 
                    selectedTask.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                    'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    Status: {selectedTask.status === 'TODO' ? 'Do zrobienia' : selectedTask.status === 'IN_PROGRESS' ? 'W trakcie' : 'Zrobione'}
                  </span>
                  {selectedTask.due_date && (
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md border ${
                      new Date(selectedTask.due_date) < new Date() && selectedTask.status !== 'DONE' 
                      ? 'bg-red-50 text-red-700 border-red-200' 
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      <Clock className="w-3.5 h-3.5" /> Termin: {new Date(selectedTask.due_date).toLocaleDateString('pl-PL')}
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 overflow-y-auto flex-1">
                  <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2 mb-3">
                    <AlignLeft className="w-4 h-4" /> Opis zadania
                  </h3>
                  <p className="text-slate-700 text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {selectedTask.description || <span className="italic text-slate-400">Brak dodatkowego opisu.</span>}
                  </p>
                </div>

                <div className="mt-6 flex justify-end shrink-0">
                  <button onClick={() => handleDeleteTask(selectedTask.id)} className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-medium transition-colors border border-transparent hover:border-red-100">
                    <Trash2 className="w-4 h-4" /> Usuń to zadanie
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-start mb-6 shrink-0 pr-8 relative">
                  <div className="w-full pr-4">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Tytuł zadania</label>
                    <input 
                      autoFocus
                      className="text-xl font-bold text-slate-800 w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      value={editTaskData.title}
                      onChange={(e) => setEditTaskData({...editTaskData, title: e.target.value})}
                    />
                  </div>
                  <button onClick={() => setIsEditingTask(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors absolute top-0 right-0">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="mb-6 shrink-0">
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Termin</label>
                  <input 
                    type="date"
                    className="p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-700 w-full sm:w-auto transition-all"
                    value={editTaskData.due_date}
                    onChange={(e) => setEditTaskData({...editTaskData, due_date: e.target.value})}
                  />
                </div>
                <div className="flex-1 flex flex-col min-h-[200px]">
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Opis zadania</label>
                  <textarea 
                    className="w-full flex-1 p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm resize-none transition-all text-slate-700 leading-relaxed"
                    value={editTaskData.description}
                    onChange={(e) => setEditTaskData({...editTaskData, description: e.target.value})}
                  />
                </div>
                <div className="mt-6 flex justify-end gap-3 shrink-0">
                  <button onClick={() => setIsEditingTask(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm transition-colors">Anuluj</button>
                  <button onClick={handleUpdateTaskDetails} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow text-white rounded-xl font-medium text-sm transition-all"><Check className="w-4 h-4" /> Zapisz zmiany</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {selectedFile && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={closeAllModals}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            
            {!isEditingFile ? (
              <>
                <div className="flex justify-between items-start mb-6 shrink-0 pr-16 relative">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-xl"><FileText className="w-6 h-6 text-blue-600" /></div>
                    <h2 className="text-xl font-bold text-slate-800 break-words leading-tight">{selectedFile.name}</h2>
                  </div>
                  <div className="absolute top-0 right-0 flex items-center gap-1">
                    <button 
                      onClick={() => {
                        setEditFileName(selectedFile.name);
                        setIsEditingFile(true);
                      }} 
                      className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                      title="Zmień nazwę pliku"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={closeAllModals} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 overflow-y-auto flex-1 mb-6">
                  <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2 mb-3">
                    <AlignLeft className="w-4 h-4" /> Wygenerowane podsumowanie AI
                  </h3>
                  <p className="text-slate-700 text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {selectedFile.summary || <span className="italic text-slate-400">Brak podsumowania dla tego pliku.</span>}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
                  <button onClick={() => handleDeleteFile(selectedFile.id)} className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl font-medium transition-colors w-full sm:w-auto justify-center">
                    <Trash2 className="w-4 h-4" /> Usuń trwale
                  </button>
                  <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
                    <button onClick={handleDownloadFile} className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-5 py-2.5 rounded-xl font-bold transition-colors w-full sm:w-auto justify-center shadow-sm">
                      <Download className="w-4 h-4" /> Pobierz plik
                    </button>
                    <Link href={`/study?subjectId=${subjectId}&name=${encodeURIComponent(subjectName)}&mode=all&fileId=${selectedFile.id}`} className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-5 py-2.5 rounded-xl font-bold transition-colors w-full sm:w-auto justify-center shadow-sm">
                      <BrainCircuit className="w-4 h-4" /> Zakuwaj z AI
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-start mb-6 shrink-0 pr-8 relative">
                  <div className="w-full pr-4">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Nowa nazwa pliku</label>
                    <input 
                      autoFocus
                      className="text-xl font-bold text-slate-800 w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      value={editFileName}
                      onChange={(e) => setEditFileName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateFile()}
                    />
                  </div>
                  <button onClick={() => setIsEditingFile(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors absolute top-0 right-0">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mt-4 flex justify-end gap-3 shrink-0">
                  <button onClick={() => setIsEditingFile(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm transition-colors">Anuluj</button>
                  <button onClick={handleUpdateFile} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow text-white rounded-xl font-medium text-sm transition-all"><Check className="w-4 h-4" /> Zapisz nową nazwę</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

function TaskCard({ task, onDragStart, onDelete, onView }: { task: Task, onDragStart: (e: React.DragEvent, id: number) => void, onDelete: (id: number) => void, onView: () => void }) {
  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={onView}
      className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 transition-colors group relative hover:shadow-md"
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-slate-300 mt-1 shrink-0" />
        <div className="flex-1 overflow-hidden">
          <h4 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2 break-words">{task.title}</h4>
          {task.description && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 break-words">{task.description}</p>}
          {task.due_date && (
            <div className={`mt-3 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${new Date(task.due_date) < new Date() && task.status !== 'DONE' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-600'}`}>
              <Clock className="w-3 h-3" /> {new Date(task.due_date).toLocaleDateString('pl-PL')}
            </div>
          )}
        </div>
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
        className="absolute top-2 right-2 p-1.5 bg-white text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 shadow-sm transition-all border border-transparent hover:border-red-100"
        title="Usuń zadanie"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function SubjectDashboard({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <SubjectContent params={params} />
    </Suspense>
  );
}