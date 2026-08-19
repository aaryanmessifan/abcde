import { Check, Clock, AlertTriangle, Calendar, Pencil, Trash2 } from 'lucide-react';
import type { Task } from '@/types';
import { relativeDate, isOverdue, formatTime } from '@/lib/date';

const priorityConfig = {
  high: { dot: 'bg-red-400', label: 'High', text: 'text-red-400' },
  medium: { dot: 'bg-amber-400', label: 'Medium', text: 'text-amber-400' },
  low: { dot: 'bg-frost-400', label: 'Low', text: 'text-frost-400' },
};

interface TaskCardProps {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  compact?: boolean;
}

export function TaskCard({ task, onToggle, onEdit, onDelete, compact }: TaskCardProps) {
  const overdue = isOverdue(task.due_date, task.completed);
  const prio = priorityConfig[task.priority];

  return (
    <div
      className={`group card card-hover p-4 ${task.completed ? 'opacity-50' : ''} ${
        overdue ? 'border-red-500/20' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(task)}
          className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
            task.completed
              ? 'bg-ember-500 border-ember-500'
              : 'border-ink-500 hover:border-ember-500'
          }`}
        >
          {task.completed && <Check size={12} className="text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium text-slate-100 ${task.completed ? 'line-through' : ''}`}>
              {task.title}
            </p>
            <span className={`w-1.5 h-1.5 rounded-full ${prio.dot} flex-shrink-0`} />
          </div>

          {!compact && task.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {task.due_date && (
              <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-400' : 'text-slate-500'}`}>
                {overdue ? <AlertTriangle size={11} /> : <Clock size={11} />}
                {relativeDate(task.due_date)}
                {task.due_time && ` · ${formatTime(task.due_time)}`}
              </span>
            )}
            {task.category && task.category !== 'general' && (
              <span className="text-xs text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded-md">
                {task.category}
              </span>
            )}
            {task.recurring && (
              <span className="text-xs text-frost-400/70 flex items-center gap-1">
                <Calendar size={11} />
                {task.recurring}
              </span>
            )}
          </div>
        </div>

        {!compact && (onEdit || onDelete) && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={() => onEdit(task)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Pencil size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(task)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
