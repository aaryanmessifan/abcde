import { useEffect, useState } from 'react';
import { Brain, TrendingUp, AlertTriangle, Calendar, Wallet, Users, CheckSquare, Sparkles } from 'lucide-react';
import { LoadingSpinner, EmptyState, PageHeader } from '@/components/ui/Feedback';
import { fetchAllTasks, fetchTodayTasks } from '@/lib/services/taskService';
import { fetchAllExpenses, fetchExpensesByMonth } from '@/lib/services/expenseService';
import { fetchAllEvents } from '@/lib/services/calendarService';
import { fetchAllFamilyMembers } from '@/lib/services/familyService';
import { isOverdue, daysUntil, todayString } from '@/lib/date';
import type { Task, Expense, CalendarEvent, FamilyMember } from '@/types';

interface Insight {
  icon: typeof Brain;
  title: string;
  description: string;
  color: string;
  category: string;
}

export function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const [allTasks, todayTasks, allExpenses, allEvents, allMembers] = await Promise.all([
        fetchAllTasks(), fetchTodayTasks(), fetchAllExpenses(), fetchAllEvents(), fetchAllFamilyMembers(),
      ]);
      setInsights(generateInsights(allTasks, todayTasks, allExpenses, allEvents, allMembers));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-10 pb-24 md:pb-10">
      <PageHeader title="AI Insights" subtitle="Intelligent analysis based on your data — nothing invented." />

      <div className="card p-4 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-frost opacity-40 pointer-events-none" />
        <div className="relative flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-frost-500/15 flex items-center justify-center flex-shrink-0">
            <Brain size={18} className="text-frost-400" />
          </div>
          <div>
            <p className="text-xs text-frost-400/80 font-mono tracking-wider mb-1">TODAY'S INSIGHTS</p>
            <p className="text-slate-200 text-sm leading-relaxed">
              {insights.length > 0
                ? `${insights.length} insight${insights.length > 1 ? 's' : ''} generated from your data. These are based on real information you've entered — not predictions.`
                : 'Not enough data to generate insights yet. Start adding tasks, expenses, events, and family members to see intelligent analysis here.'}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : insights.length === 0 ? (
        <EmptyState icon={Brain} title="No insights yet" description="Add tasks, expenses, events, and family members. The AI will analyze your data and surface meaningful patterns and reminders." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((insight, i) => (
            <div key={i} className="card card-hover p-4 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${insight.color}`}>
                  <insight.icon size={17} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-100">{insight.title}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{insight.description}</p>
                  <span className="text-[10px] text-slate-600 mt-2 inline-block">{insight.category}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function generateInsights(tasks: Task[], todayTasks: Task[], expenses: Expense[], events: CalendarEvent[], members: FamilyMember[]): Insight[] {
  const insights: Insight[] = [];
  const today = todayString();

  // Task insights
  const overdueTasks = tasks.filter(t => isOverdue(t.due_date, t.completed));
  if (overdueTasks.length > 0) {
    insights.push({
      icon: AlertTriangle, title: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`,
      description: overdueTasks.slice(0, 3).map(t => `• ${t.title}`).join('\n'),
      color: 'bg-red-500/15 text-red-400', category: 'Tasks',
    });
  }

  if (todayTasks.length > 0) {
    const highPriority = todayTasks.filter(t => t.priority === 'high');
    if (highPriority.length > 0) {
      insights.push({
        icon: CheckSquare, title: `${highPriority.length} high-priority task${highPriority.length > 1 ? 's' : ''} today`,
        description: highPriority.map(t => `• ${t.title}`).join('\n'),
        color: 'bg-ember-500/15 text-ember-400', category: 'Tasks',
      });
    }
  }

  // Expense insights
  const now = new Date();
  const thisMonth = expenses.filter(e => { const d = new Date(e.expense_date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const lastMonthDate = new Date(now); lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonth = expenses.filter(e => { const d = new Date(e.expense_date); return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear(); });

  if (thisMonth.length > 0 && lastMonth.length > 0) {
    const monthTotal = thisMonth.reduce((s, e) => s + e.amount, 0);
    const lastTotal = lastMonth.reduce((s, e) => s + e.amount, 0);
    const change = lastTotal > 0 ? ((monthTotal - lastTotal) / lastTotal) * 100 : 0;

    const thisByCat: Record<string, number> = {};
    const lastByCat: Record<string, number> = {};
    thisMonth.forEach(e => { thisByCat[e.category] = (thisByCat[e.category] ?? 0) + e.amount; });
    lastMonth.forEach(e => { lastByCat[e.category] = (lastByCat[e.category] ?? 0) + e.amount; });

    const increasedCategories = Object.entries(thisByCat).filter(([cat, amt]) => { const last = lastByCat[cat] ?? 0; return last > 0 && amt > last * 1.15; });
    if (increasedCategories.length > 0) {
      const top = increasedCategories.sort((a, b) => (b[1] - (lastByCat[b[0]] ?? 0)) - (a[1] - (lastByCat[a[0]] ?? 0)))[0];
      const pct = ((top[1] - (lastByCat[top[0]] ?? 0)) / (lastByCat[top[0]] ?? 1)) * 100;
      insights.push({
        icon: TrendingUp, title: `${top[0]} spending up ${pct.toFixed(0)}%`,
        description: `You've spent ₹${top[1].toFixed(0)} on ${top[0]} this month, compared to ₹${(lastByCat[top[0]] ?? 0).toFixed(0)} last month.`,
        color: 'bg-amber-500/15 text-amber-400', category: 'Money',
      });
    }

    if (change < -10) {
      insights.push({
        icon: Wallet, title: `Spending down ${Math.abs(change).toFixed(0)}% this month`,
        description: `You've spent ₹${monthTotal.toFixed(0)} this month vs ₹${lastTotal.toFixed(0)} last month. Good control!`,
        color: 'bg-frost-500/15 text-frost-400', category: 'Money',
      });
    }
  }

  // Event insights
  const upcomingEvents = events.filter(e => e.event_date >= today).slice(0, 5);
  const soonEvents = upcomingEvents.filter(e => { const d = daysUntil(e.event_date); return d !== null && d <= 7; });
  if (soonEvents.length > 0) {
    insights.push({
      icon: Calendar, title: `${soonEvents.length} event${soonEvents.length > 1 ? 's' : ''} in the next 7 days`,
      description: soonEvents.map(e => { const d = daysUntil(e.event_date); return `• ${e.title} — ${d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `In ${d} days`}`; }).join('\n'),
      color: 'bg-frost-500/15 text-frost-400', category: 'Calendar',
    });
  }

  // Family insights
  const upcomingBirthdays = members.filter(m => m.birthday).map(m => {
    const birth = new Date(m.birthday + 'T00:00:00');
    let next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
    if (next < now) next.setFullYear(next.getFullYear() + 1);
    return { member: m, days: daysUntil(toDateString(next))! };
  }).filter(b => b.days <= 30).sort((a, b) => a.days - b.days);

  if (upcomingBirthdays.length > 0) {
    insights.push({
      icon: Users, title: `${upcomingBirthdays.length} birthday${upcomingBirthdays.length > 1 ? 's' : ''} coming up`,
      description: upcomingBirthdays.map(b => `• ${b.member.name} — ${b.days === 0 ? 'Today!' : b.days === 1 ? 'Tomorrow' : `In ${b.days} days`}`).join('\n'),
      color: 'bg-pink-500/15 text-pink-400', category: 'Family',
    });
  }

  // Summary insight
  if (insights.length > 0) {
    const parts: string[] = [];
    if (todayTasks.length > 0) parts.push(`${todayTasks.length} tasks today`);
    if (overdueTasks.length > 0) parts.push(`${overdueTasks.length} overdue`);
    if (thisMonth.length > 0) parts.push(`₹${thisMonth.reduce((s, e) => s + e.amount, 0).toFixed(0)} spent this month`);
    if (soonEvents.length > 0) parts.push(`${soonEvents.length} events this week`);
    if (upcomingBirthdays.length > 0) parts.push(`${upcomingBirthdays.length} family birthdays soon`);

    insights.unshift({
      icon: Sparkles, title: 'Your day at a glance',
      description: parts.join(' · ') + '.',
      color: 'bg-ember-500/15 text-ember-400', category: 'Summary',
    });
  }

  return insights;
}

function toDateString(date: Date): string {
  const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
