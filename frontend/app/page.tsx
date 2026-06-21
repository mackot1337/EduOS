import Link from 'next/link';
import { BookOpen, BrainCircuit, UploadCloud, Search } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-50">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col gap-8">
        
        <div className="flex items-center gap-4">
          <BrainCircuit className="w-16 h-16 text-blue-600" />
          <h1 className="text-6xl font-extrabold text-slate-900 tracking-tight">EduOS</h1>
        </div>
        <p className="text-xl text-slate-600 text-center max-w-2xl">
          Twój inteligentny system edukacyjny. Wgrywaj notatki, ucz się z fiszek generowanych przez AI i rozmawiaj ze swoją bazą wiedzy.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full max-w-4xl">
          
          <Link href="/upload" className="group flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-400 transition-all cursor-pointer">
            <UploadCloud className="w-12 h-12 text-slate-400 group-hover:text-blue-500 mb-4 transition-colors" />
            <h2 className="text-2xl font-semibold text-slate-800">1. Baza Wiedzy</h2>
            <p className="text-slate-500 text-center mt-2">Wgraj PDF lub DOCX, aby AI stworzyło fiszki i podsumowanie.</p>
          </Link>

          <Link href="/study" className="group flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:green-400 transition-all cursor-pointer">
            <BookOpen className="w-12 h-12 text-slate-400 group-hover:text-green-500 mb-4 transition-colors" />
            <h2 className="text-2xl font-semibold text-slate-800">2. Nauka (Spaced Rep.)</h2>
            <p className="text-slate-500 text-center mt-2">Ucz się inteligentnie. Powtarzaj fiszki, które system zaplanował na dziś.</p>
          </Link>

          <Link href="/ask" className="group flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-purple-400 transition-all cursor-pointer">
            <Search className="w-12 h-12 text-slate-400 group-hover:text-purple-500 mb-4 transition-colors" />
            <h2 className="text-2xl font-semibold text-slate-800">3. Zapytaj RAG</h2>
            <p className="text-slate-500 text-center mt-2">Zadaj pytanie swoim notatkom. AI znajdzie odpowiedź za Ciebie.</p>
          </Link>

        </div>
      </div>
    </main>
  );
}