import { useEffect, useState, useRef } from 'react';
import { Search, CheckSquare, FileText, Wallet, Calendar, Users, Brain, ArrowRight } from 'lucide-react';
import type { PageId } from '@/config/navigation';
import { fetchAllTasks } from '@/lib/services/taskService';
import { fetchAllExpenses } from '@/lib/services/expenseService';
import { fetchAllEvents } from '@/lib/services/calendarService';
import { fetchAllFamilyMembers, fetchAllMemories } from '@/lib/services/familyService';
import { fetchAllDocuments } from '@/lib/services/documentService';
import { formatTime } from '@/lib/date';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  page: PageId;
  icon: typeof Search;
}

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (page: PageId) => void;
}

export function GlobalSearch({ open, onClose, onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && results[selectedIndex]) { onNavigate(results[selectedIndex].page); onClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, results, selectedIndex, onNavigate]);

  useEffect(() => {
    if (open) { setQuery(''); setSelectedIndex(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    const timeout = setTimeout(async () => {
      const q = query.toLowerCase();
      try {
        const [tasks, expenses, events, members, memories, documents] = await Promise.all([
          fetchAllTasks(), fetchAllExpenses(), fetchAllEvents(), fetchAllFamilyMembers(), fetchAllMemories(), fetchAllDocuments(),
        ]);

        const matched: SearchResult[] = [];
        tasks.forEach(t => { if (t.title.toLowerCase().includes(q)) matched.push({ id: t.id, title: t.title, subtitle: `Task · ${t.category}`, type: 'task', page: 'tasks', icon: CheckSquare }); });
        expenses.forEach(e => { if (e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)) matched.push({ id: e.id, title: `${e.description} — ₹${e.amount}`, subtitle: `Expense · ${e.category}`, type: 'expense', page: 'money', icon: Wallet }); });
        events.forEach(e => { if (e.title.toLowerCase().includes(q)) matched.push({ id: e.id, title: e.title, subtitle: `Event · ${e.event_date}${e.event_time ? ' ' + formatTime(e.event_time) : ''}`, type: 'event', page: 'calendar', icon: Calendar }); });
        members.forEach(m => { if (m.name.toLowerCase().includes(q)) matched.push({ id: m.id, title: m.name, subtitle: `Family · ${m.relationship}`, type: 'family', page: 'family', icon: Users }); });
        memories.forEach(mem => { if (mem.title.toLowerCase().includes(q)) matched.push({ id: mem.id, title: mem.title, subtitle: 'Memory', type: 'memory', page: 'family', icon: Brain }); });
        documents.forEach(d => { if (d.name.toLowerCase().includes(q)) matched.push({ id: d.id, title: d.name, subtitle: `Document · ${d.category}`, type: 'document', page: 'documents', icon: FileText }); });

        setResults(matched.slice(0, 12));
        setSelectedIndex(0);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh] px-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-xl glass-strong rounded-2xl overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-4 border-b border-white/[0.06]">
          <Search size={18} className="text-slate-500 flex-shrink-0" />
          <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search anything..." className="flex-1 bg-transparent text-slate-100 placeholder:text-slate-500 text-base outline-none" />
          <kbd className="text-[10px] text-slate-500 font-mono bg-white/[0.04] px-2 py-1 rounded-md">ESC</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-sm text-slate-500">Searching...</div>
          ) : query.trim() === '' ? (
            <div className="p-6 text-center text-sm text-slate-500">Type to search across tasks, expenses, events, family, documents, and memories.</div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">No results found for "{query}"</div>
          ) : (
            <div className="py-2">
              {results.map((result, i) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => { onNavigate(result.page); onClose(); }}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === selectedIndex ? 'bg-ember-500/10' : 'hover:bg-white/[0.03]'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${i === selectedIndex ? 'bg-ember-500/15 text-ember-400' : 'bg-white/[0.04] text-slate-400'}`}>
                    <result.icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-100 truncate">{result.title}</p>
                    <p className="text-xs text-slate-500 truncate">{result.subtitle}</p>
                  </div>
                  <ArrowRight size={14} className={`flex-shrink-0 transition-opacity ${i === selectedIndex ? 'text-ember-400 opacity-100' : 'text-slate-600 opacity-0'}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-slate-600 font-mono">
          <span>↑↓ Navigate · Enter Select</span>
          <span>{results.length} results</span>
        </div>
      </div>
    </div>
  );
}
