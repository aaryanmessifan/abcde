import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Search, Trash2, Pencil, CheckSquare, Calendar, ListFilter } from 'lucide-react';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { LoadingSpinner, EmptyState, ErrorState, PageHeader } from '@/components/ui/Feedback';
import {
  fetchAllTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
} from '@/lib/services/taskService';
import { todayString, isToday, isOverdue, isUpcoming } from '@/lib/date';
import type { Task, TaskInsert, Priority } from '@/types';

type ViewFilter = 'today' | 'upcoming' | 'completed' | 'all';

const priorities: Priority[] = ['low', 'medium', 'high'];
const categories = ['general', 'groceries', 'food', 'travel', 'bills', 'shopping', 'health', 'entertainment', 'personal'];

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewFilter>('today');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      const data = await fetchAllTasks();
      setTasks(data);
    } catch (err) {
      setError('Failed to load tasks. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = async (task: Task) => {
    try {
      await toggleTaskComplete(task);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTask(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = tasks.filter((task) => {
    if (view === 'today' && !isToday(task.due_date)) return false;
    if (view === 'upcoming' && !isUpcoming(task.due_date, task.completed)) return false;
    if (view === 'completed' && !task.completed) return false;
    if (view === 'today' && task.completed) return false;

    if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      if (!task.title.toLowerCase().includes(q) && !task.category.toLowerCase().includes(q)) {
        return false;
      }
    }

    return true;
  });

  const counts = {
    today: tasks.filter((t) => isToday(t.due_date) && !t.completed).length,
    upcoming: tasks.filter((t) => isUpcoming(t.due_date, t.completed)).length,
    completed: tasks.filter((t) => t.completed).length,
    all: tasks.length,
  };

  const views: { id: ViewFilter; label: string; count: number }[] = [
    { id: 'today', label: 'Today', count: counts.today },
    { id: 'upcoming', label: 'Upcoming', count: counts.upcoming },
    { id: 'completed', label: 'Completed', count: counts.completed },
    { id: 'all', label: 'All', count: counts.all },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10 pb-24 md:pb-10">
      <PageHeader title="Tasks & Reminders" subtitle="Stay on top of everything that matters." />

      <div className="flex items-center justify-between mb-5 gap-3">
        <div className="flex items-center gap-1 bg-ink-800/50 rounded-xl p-1 overflow-x-auto scrollbar-none">
          {views.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                view === v.id ? 'bg-ember-500/15 text-ember-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              {v.label}
              {v.count > 0 && (
                <span className={`text-[10px] px-1.5 rounded-md ${view === v.id ? 'bg-ember-500/20' : 'bg-white/5'}`}>
                  {v.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm flex items-center gap-2 flex-shrink-0">
          <Plus size={16} /> <span className="hidden sm:inline">New Task</span>
        </button>
      </div>

      <div className="flex items-center gap-2.5 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="input-field w-full pl-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input-field flex-shrink-0 cursor-pointer"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorState message={error} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={view === 'completed' ? 'No completed tasks yet' : view === 'today' ? 'No tasks for today' : 'No tasks found'}
          description={view === 'today' ? 'Create a new task or ask the AI assistant to set a reminder.' : undefined}
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onEdit={(t) => setEditingTask(t)}
              onDelete={(t) => setDeleteTarget(t)}
            />
          ))}
        </div>
      )}

      <TaskFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={async (data) => {
          await createTask(data);
          setShowCreate(false);
          loadData();
        }}
      />

      {editingTask && (
        <TaskFormModal
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
          task={editingTask}
          onSubmit={async (data) => {
            await updateTask(editingTask.id, data);
            setEditingTask(null);
            loadData();
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete task?"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaskInsert) => Promise<void>;
  task?: Task | null;
}

function TaskFormModal({ open, onClose, onSubmit, task }: TaskFormModalProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [dueDate, setDueDate] = useState(task?.due_date ?? '');
  const [dueTime, setDueTime] = useState(task?.due_time ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium');
  const [category, setCategory] = useState(task?.category ?? 'general');
  const [recurring, setRecurring] = useState(task?.recurring ?? '');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? '');
      setDescription(task?.description ?? '');
      setDueDate(task?.due_date ?? '');
      setDueTime(task?.due_time ?? '');
      setPriority(task?.priority ?? 'medium');
      setCategory(task?.category ?? 'general');
      setRecurring(task?.recurring ?? '');
      setFormError(null);
    }
  }, [open, task]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Task title is required');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate || null,
        due_time: dueTime || null,
        priority,
        category,
        completed: task?.completed ?? false,
        recurring: (recurring || null) as TaskInsert['recurring'],
      });
    } catch (err) {
      setFormError('Failed to save. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? 'Edit Task' : 'New Task'}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Task Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Call Rahul about the property documents"
            className="input-field w-full"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any details..."
            rows={2}
            className="input-field w-full resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Due Date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Due Time</label>
            <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="input-field w-full" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="input-field w-full cursor-pointer">
              {priorities.map((p) => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field w-full cursor-pointer">
              {categories.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Repeat (optional)</label>
          <select value={recurring} onChange={(e) => setRecurring(e.target.value)} className="input-field w-full cursor-pointer">
            <option value="">No repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {formError && <p className="text-sm text-red-400">{formError}</p>}
      </form>
    </Modal>
  );
}
