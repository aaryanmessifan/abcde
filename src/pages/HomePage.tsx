import { useEffect, useState } from 'react';
import { CheckSquare, Clock, FileText, Wallet, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import { CommandBox } from '@/components/ai/CommandBox';
import { TaskCard } from '@/components/tasks/TaskCard';
import { fetchTodayTasks, toggleTaskComplete, fetchAllTasks } from '@/lib/services/taskService';
import { getGreeting, formatDate, todayString, isOverdue } from '@/lib/date';
import type { Task } from '@/types';
import type { PageId } from '@/config/navigation';
import { LoadingSpinner } from '@/components/ui/Feedback';

interface HomePageProps {
  onNavigate: (page: PageId) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [today, all] = await Promise.all([fetchTodayTasks(), fetchAllTasks()]);
      setTasks(today);
      setAllTasks(all);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = async (task: Task) => {
    await toggleTaskComplete(task);
    loadData();
  };

  const greeting = getGreeting();
  const today = new Date();

  const overdueCount = allTasks.filter((t) => isOverdue(t.due_date, t.completed)).length;
  const completedToday = allTasks.filter(
    (t) => t.completed && t.completed_at && t.completed_at.startsWith(todayString())
  ).length;

  const stats = [
    { label: 'Tasks Today', value: tasks.length, icon: CheckSquare, color: 'text-ember-400' },
    { label: 'Overdue', value: overdueCount, icon: Clock, color: 'text-red-400' },
    { label: 'Completed Today', value: completedToday, icon: TrendingUp, color: 'text-frost-400' },
  ];

  const dailyBrief = generateDailyBrief(tasks, overdueCount);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-10 pb-24 md:pb-10">
      {/* Greeting */}
      <div className="mb-8 animate-slide-up">
        <p className="text-sm text-slate-500 font-mono tracking-wide">
          {formatDate(today).toUpperCase()}
        </p>
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-white mt-2 tracking-tight">
          {greeting}, <span className="text-gradient-ember">Bade Papa</span>.
        </h1>
      </div>

      {/* Command Box */}
      <div className="mb-8 animate-slide-up" style={{ animationDelay: '50ms' }}>
        <CommandBox onActionComplete={loadData} onNavigate={onNavigate} />
      </div>

      {/* Daily Brief */}
      <div className="mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-radial-ember pointer-events-none opacity-50" />
          <div className="relative flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-ember-500/15 flex items-center justify-center flex-shrink-0">
              <Sparkles size={18} className="text-ember-400" />
            </div>
            <div>
              <p className="text-xs text-ember-400/80 font-mono tracking-wider mb-1">DAILY BRIEF</p>
              <p className="text-slate-200 text-[15px] leading-relaxed">{dailyBrief}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8 animate-slide-up" style={{ animationDelay: '150ms' }}>
        {stats.map((stat) => (
          <div key={stat.label} className="card card-hover p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={16} className={stat.color} />
              <span className="text-xs text-slate-500">{stat.label}</span>
            </div>
            <p className="text-2xl font-display font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Today section */}
      <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold text-white flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-ember-500" />
            Today
          </h2>
          <button
            onClick={() => onNavigate('tasks')}
            className="text-xs text-slate-500 hover:text-ember-400 flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight size={12} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : tasks.length === 0 ? (
          <div className="card p-8 text-center">
            <CheckSquare size={28} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No tasks due today. Your day is clear.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={handleToggle} compact />
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 animate-slide-up" style={{ animationDelay: '250ms' }}>
        {[
          { label: 'New Task', icon: CheckSquare, page: 'tasks' as PageId },
          { label: 'AI Chat', icon: Sparkles, page: 'assistant' as PageId },
          { label: 'Documents', icon: FileText, page: 'documents' as PageId },
          { label: 'Money', icon: Wallet, page: 'money' as PageId },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => onNavigate(action.page)}
            className="card card-hover p-4 flex items-center gap-3 text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center">
              <action.icon size={17} className="text-slate-400" />
            </div>
            <span className="text-sm font-medium text-slate-300">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function generateDailyBrief(todayTasks: Task[], overdueCount: number): string {
  const parts: string[] = [];

  if (todayTasks.length === 0 && overdueCount === 0) {
    return "Your day looks clear. No tasks or reminders scheduled. A good day to get ahead of things, or simply take it easy.";
  }

  if (todayTasks.length > 0) {
    parts.push(`You have ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} today`);
  }

  if (overdueCount > 0) {
    parts.push(`${overdueCount} overdue item${overdueCount > 1 ? 's' : ''} needing attention`);
  }

  let brief = parts.length > 0 ? parts.join(' and ') + '.' : '';

  if (todayTasks.length > 0) {
    const highPriority = todayTasks.filter((t) => t.priority === 'high');
    if (highPriority.length > 0) {
      brief += ` ${highPriority.length} marked as high priority.`;
    }
  }

  if (todayTasks.length > 3) {
    brief += " It's a busy day — tackle the most important ones first.";
  } else if (todayTasks.length > 0 && todayTasks.length <= 2) {
    brief += " Your day looks manageable.";
  }

  return brief;
}
