import { useEffect, useState } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { LoadingSpinner, EmptyState, PageHeader } from '@/components/ui/Feedback';
import { fetchAllEvents, createEvent, deleteEvent } from '@/lib/services/calendarService';
import { toDateString, todayString, formatTime, daysUntil } from '@/lib/date';
import type { CalendarEvent, CalendarEventInsert, EventType } from '@/types';

type ViewMode = 'month' | 'week' | 'agenda';

const EVENT_TYPES: { value: EventType; label: string; color: string }[] = [
  { value: 'event', label: 'Event', color: 'bg-ember-500' },
  { value: 'appointment', label: 'Appointment', color: 'bg-frost-500' },
  { value: 'birthday', label: 'Birthday', color: 'bg-pink-500' },
  { value: 'anniversary', label: 'Anniversary', color: 'bg-purple-500' },
  { value: 'reminder', label: 'Reminder', color: 'bg-amber-500' },
];

export function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [addDate, setAddDate] = useState(todayString());
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);

  const loadData = async () => {
    try { const data = await fetchAllEvents(); setEvents(data); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await deleteEvent(deleteTarget.id); setDeleteTarget(null); loadData(); }
    catch (err) { console.error(err); }
  };

  const eventsByDate = (dateStr: string) => events.filter(e => e.event_date === dateStr);

  const today = todayString();

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-10 pb-24 md:pb-10">
      <PageHeader title="Calendar" subtitle="Your events, appointments, and important dates." />

      <div className="flex items-center justify-between mb-5 gap-3">
        <div className="flex items-center gap-1 bg-ink-800/50 rounded-xl p-1">
          {(['month', 'week', 'agenda'] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${view === v ? 'bg-ember-500/15 text-ember-400' : 'text-slate-400 hover:text-white'}`}>{v}</button>
          ))}
        </div>
        <button onClick={() => { setAddDate(today); setShowAdd(true); }} className="btn-primary text-sm flex items-center gap-2 flex-shrink-0">
          <Plus size={16} /> <span className="hidden sm:inline">New Event</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : view === 'month' ? (
        <MonthView currentDate={currentDate} events={events} onPrev={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() - 1); setCurrentDate(d); }} onNext={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() + 1); setCurrentDate(d); }} onAddDate={(dateStr) => { setAddDate(dateStr); setShowAdd(true); }} />
      ) : view === 'week' ? (
        <WeekView currentDate={currentDate} events={events} onPrev={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }} onNext={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }} onAddDate={(dateStr) => { setAddDate(dateStr); setShowAdd(true); }} />
      ) : (
        <AgendaView events={events} onDelete={(e) => setDeleteTarget(e)} />
      )}

      <EventFormModal open={showAdd} onClose={() => setShowAdd(false)} initialDate={addDate} onSubmit={async (data) => { await createEvent(data); setShowAdd(false); loadData(); }} />
      <ConfirmDialog open={!!deleteTarget} title="Delete event?" message={`Delete "${deleteTarget?.title}"? This cannot be undone.`} confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

function MonthView({ currentDate, events, onPrev, onNext, onAddDate }: { currentDate: Date; events: CalendarEvent[]; onPrev: () => void; onNext: () => void; onAddDate: (d: string) => void }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const today = todayString();

  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) week.push(null);
  for (let d = 1; d <= daysInMonth; d++) { week.push(new Date(year, month, d)); if (week.length === 7) { weeks.push(week); week = []; } }
  if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }

  return (
    <div className="card p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-semibold text-white">{currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h2>
        <div className="flex items-center gap-1">
          <button onClick={onPrev} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"><ChevronLeft size={18} /></button>
          <button onClick={onNext} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-[10px] text-slate-500 font-mono py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((date, i) => {
          if (!date) return <div key={i} />;
          const dateStr = toDateString(date);
          const dayEvents = events.filter(e => e.event_date === dateStr);
          const isToday = dateStr === today;
          return (
            <button key={i} onClick={() => onAddDate(dateStr)} className={`min-h-[60px] md:min-h-[80px] p-1.5 rounded-lg text-left transition-all hover:bg-white/[0.04] ${isToday ? 'bg-ember-500/10 border border-ember-500/20' : 'border border-transparent'}`}>
              <span className={`text-xs ${isToday ? 'text-ember-400 font-semibold' : 'text-slate-400'}`}>{date.getDate()}</span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map(e => {
                  const typeColor = EVENT_TYPES.find(t => t.value === e.type);
                  return <div key={e.id} className={`text-[9px] md:text-[10px] truncate px-1 py-0.5 rounded text-white ${typeColor?.color ?? 'bg-slate-600'}`}>{e.title}</div>;
                })}
                {dayEvents.length > 3 && <div className="text-[9px] text-slate-500 px-1">+{dayEvents.length - 3} more</div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ currentDate, events, onPrev, onNext, onAddDate }: { currentDate: Date; events: CalendarEvent[]; onPrev: () => void; onNext: () => void; onAddDate: (d: string) => void }) {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(startOfWeek); d.setDate(d.getDate() + i); return d; });
  const today = todayString();

  return (
    <div className="card p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-semibold text-white">{startOfWeek.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {days[6].toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</h2>
        <div className="flex items-center gap-1">
          <button onClick={onPrev} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"><ChevronLeft size={18} /></button>
          <button onClick={onNext} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div className="space-y-2">
        {days.map((date, i) => {
          const dateStr = toDateString(date);
          const dayEvents = events.filter(e => e.event_date === dateStr);
          const isToday = dateStr === today;
          return (
            <div key={i} className={`p-3 rounded-xl border ${isToday ? 'border-ember-500/20 bg-ember-500/5' : 'border-white/[0.04]'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${isToday ? 'text-ember-400' : 'text-slate-300'}`}>{date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                <button onClick={() => onAddDate(dateStr)} className="text-slate-500 hover:text-ember-400 transition-colors"><Plus size={14} /></button>
              </div>
              {dayEvents.length === 0 ? (
                <p className="text-xs text-slate-600">No events</p>
              ) : (
                <div className="space-y-1.5">
                  {dayEvents.map(e => {
                    const typeColor = EVENT_TYPES.find(t => t.value === e.type);
                    return (
                      <div key={e.id} className="flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${typeColor?.color ?? 'bg-slate-600'}`} />
                        <span className="text-slate-200">{e.title}</span>
                        {e.event_time && <span className="text-xs text-slate-500">{formatTime(e.event_time)}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgendaView({ events, onDelete }: { events: CalendarEvent[]; onDelete: (e: CalendarEvent) => void }) {
  const today = todayString();
  const upcoming = events.filter(e => e.event_date >= today);
  const past = events.filter(e => e.event_date < today).reverse();

  if (upcoming.length === 0 && past.length === 0) {
    return <EmptyState icon={Calendar} title="No events yet" description="Create events, appointments, and reminders to keep track of important dates." />;
  }

  return (
    <div className="space-y-6">
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-sm font-display font-semibold text-white mb-3 flex items-center gap-2"><span className="w-1 h-4 rounded-full bg-ember-500" /> Upcoming</h3>
          <div className="space-y-2">
            {upcoming.map(e => <AgendaItem key={e.id} event={e} onDelete={() => onDelete(e)} />)}
          </div>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <h3 className="text-sm font-display font-semibold text-slate-500 mb-3 flex items-center gap-2"><span className="w-1 h-4 rounded-full bg-slate-600" /> Past</h3>
          <div className="space-y-2 opacity-60">
            {past.slice(0, 10).map(e => <AgendaItem key={e.id} event={e} onDelete={() => onDelete(e)} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function AgendaItem({ event, onDelete }: { event: CalendarEvent; onDelete: () => void }) {
  const typeColor = EVENT_TYPES.find(t => t.value === event.type);
  const days = daysUntil(event.event_date);
  return (
    <div className="group card card-hover p-4 flex items-center gap-3">
      <div className={`w-2 h-10 rounded-full flex-shrink-0 ${typeColor?.color ?? 'bg-slate-600'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-100">{event.title}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
          <span>{new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          {event.event_time && <span className="flex items-center gap-1"><Clock size={11} /> {formatTime(event.event_time)}</span>}
          {event.location && <span className="flex items-center gap-1"><MapPin size={11} /> {event.location}</span>}
          {days !== null && days >= 0 && days <= 7 && <span className="text-ember-400">{days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`}</span>}
        </div>
      </div>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1"><Trash2 size={14} /></button>
    </div>
  );
}

function EventFormModal({ open, onClose, onSubmit, initialDate }: { open: boolean; onClose: () => void; onSubmit: (data: CalendarEventInsert) => Promise<void>; initialDate: string }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState('');
  const [type, setType] = useState<EventType>('event');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (open) { setTitle(''); setDate(initialDate); setTime(''); setType('event'); setLocation(''); setDescription(''); setError(null); } }, [open, initialDate]);

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Event title is required'); return; }
    setSaving(true); setError(null);
    try { await onSubmit({ title: title.trim(), description: description.trim() || null, event_date: date, event_time: time || null, type, location: location.trim() || null }); }
    catch { setError('Failed to save. Try again.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Event" footer={<><button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button><button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Create Event'}</button></>}>
      <div className="space-y-4">
        <div><label className="block text-xs text-slate-400 mb-1.5">Title</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Meeting with Rahul" className="input-field w-full" autoFocus /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs text-slate-400 mb-1.5">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field w-full" /></div>
          <div><label className="block text-xs text-slate-400 mb-1.5">Time</label><input type="time" value={time} onChange={e => setTime(e.target.value)} className="input-field w-full" /></div>
        </div>
        <div><label className="block text-xs text-slate-400 mb-1.5">Type</label><select value={type} onChange={e => setType(e.target.value as EventType)} className="input-field w-full cursor-pointer">{EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
        <div><label className="block text-xs text-slate-400 mb-1.5">Location (optional)</label><input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Office, home, clinic" className="input-field w-full" /></div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </Modal>
  );
}
