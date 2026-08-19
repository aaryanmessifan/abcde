import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2, TrendingUp, Wallet, Receipt, ArrowDownRight } from 'lucide-react';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { LoadingSpinner, EmptyState, PageHeader } from '@/components/ui/Feedback';
import {
  fetchAllExpenses, createExpense, deleteExpense, parseExpenseFromText,
  fetchExpensesByMonth, EXPENSE_CATEGORIES,
} from '@/lib/services/expenseService';
import { todayString, toDateString } from '@/lib/date';
import type { Expense, ExpenseInsert, ExpenseCategory } from '@/types';

export function MoneyPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [quickInput, setQuickInput] = useState('');
  const [quickError, setQuickError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const data = await fetchAllExpenses();
      setExpenses(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const now = new Date();
  const thisMonth = expenses.filter(e => { const d = new Date(e.expense_date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const thisWeek = expenses.filter(e => { const d = new Date(e.expense_date); const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7); return d >= weekAgo; });

  const monthTotal = thisMonth.reduce((s, e) => s + e.amount, 0);
  const weekTotal = thisWeek.reduce((s, e) => s + e.amount, 0);

  const byCategory: Record<string, number> = {};
  thisMonth.forEach(e => { byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount; });
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

  // Last month comparison
  const lastMonth = new Date(now); lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthExpenses = expenses.filter(e => { const d = new Date(e.expense_date); return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear(); });
  const lastMonthTotal = lastMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const monthChange = lastMonthTotal > 0 ? ((monthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  const handleQuickAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    const parsed = parseExpenseFromText(quickInput.trim());
    if (!parsed) { setQuickError("I couldn't understand that. Try: ₹500 groceries"); return; }
    setQuickError(null);
    createExpense({ amount: parsed.amount, category: parsed.category as ExpenseCategory, description: parsed.description, expense_date: parsed.date })
      .then(() => { setQuickInput(''); loadData(); })
      .catch(() => setQuickError('Failed to add expense. Please try again.'));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await deleteExpense(deleteTarget.id); setDeleteTarget(null); loadData(); }
    catch (err) { console.error(err); }
  };

  const recentExpenses = expenses.slice(0, 8);

  // Simple bar chart data
  const chartData = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    amount: byCategory[cat.value] ?? 0,
  })).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

  const maxAmount = Math.max(...chartData.map(c => c.amount), 1);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-10 pb-24 md:pb-10">
      <PageHeader title="Money" subtitle="Track your spending with ease." />

      {/* Quick add */}
      <form onSubmit={handleQuickAdd} className="mb-6">
        <div className="flex gap-2.5">
          <div className="flex-1 relative">
            <Wallet size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={quickInput}
              onChange={e => setQuickInput(e.target.value)}
              placeholder="Add expense: e.g. ₹500 groceries"
              className="input-field w-full pl-10"
            />
          </div>
          <button type="submit" className="btn-primary text-sm flex items-center gap-2 flex-shrink-0">
            <Plus size={16} /> <span className="hidden sm:inline">Add</span>
          </button>
        </div>
        {quickError && <p className="text-xs text-red-400 mt-2">{quickError}</p>}
      </form>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="This Month" value={`₹${monthTotal.toFixed(0)}`} icon={TrendingUp} color="text-ember-400" />
        <StatCard label="This Week" value={`₹${weekTotal.toFixed(0)}`} icon={Wallet} color="text-frost-400" />
        <StatCard label="Transactions" value={String(thisMonth.length)} icon={Receipt} color="text-slate-300" />
        <StatCard label="Top Category" value={topCategory ? topCategory[0] : '—'} icon={ArrowDownRight} color="text-ember-400" />
      </div>

      {/* Month comparison insight */}
      {lastMonthTotal > 0 && (
        <div className="card p-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${monthChange > 0 ? 'bg-red-500/10' : 'bg-frost-500/10'}`}>
              <TrendingUp size={16} className={monthChange > 0 ? 'text-red-400' : 'text-frost-400'} />
            </div>
            <p className="text-sm text-slate-300">
              {monthChange > 0
                ? <>You've spent <span className="text-red-400 font-medium">{Math.abs(monthChange).toFixed(0)}% more</span> than last month (₹{lastMonthTotal.toFixed(0)}).</>
                : <>You've spent <span className="text-frost-400 font-medium">{Math.abs(monthChange).toFixed(0)}% less</span> than last month (₹{lastMonthTotal.toFixed(0)}). Good control!</>
              }
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Chart */}
        <div className="card p-5">
          <h3 className="text-sm font-display font-semibold text-white mb-4">Spending by Category</h3>
          {chartData.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">No spending recorded this month yet.</p>
          ) : (
            <div className="space-y-3">
              {chartData.map(cat => (
                <div key={cat.value}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">{cat.label}</span>
                    <span className="text-xs text-slate-300 font-mono">₹{cat.amount.toFixed(0)}</span>
                  </div>
                  <div className="h-2 bg-ink-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(cat.amount / maxAmount) * 100}%`, backgroundColor: cat.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent expenses */}
        <div className="card p-5">
          <h3 className="text-sm font-display font-semibold text-white mb-4">Recent Expenses</h3>
          {loading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : recentExpenses.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">No expenses recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {recentExpenses.map(exp => {
                const cat = EXPENSE_CATEGORIES.find(c => c.value === exp.category);
                return (
                  <div key={exp.id} className="group flex items-center justify-between py-2 px-2 -mx-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat?.color ?? '#2D333D' }} />
                      <div className="min-w-0">
                        <p className="text-sm text-slate-200 truncate">{exp.description}</p>
                        <p className="text-xs text-slate-500">{exp.category} · {new Date(exp.expense_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-mono text-slate-100">₹{exp.amount.toFixed(0)}</span>
                      <button onClick={() => setDeleteTarget(exp)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ExpenseFormModal open={showAdd} onClose={() => setShowAdd(false)} onSubmit={async (data) => { await createExpense(data); setShowAdd(false); loadData(); }} />

      <ConfirmDialog open={!!deleteTarget} title="Delete expense?" message="This will permanently remove this expense record." confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof Wallet; color: string }) {
  return (
    <div className="card card-hover p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={15} className={color} />
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <p className="text-xl font-display font-semibold text-white truncate">{value}</p>
    </div>
  );
}

function ExpenseFormModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (data: ExpenseInsert) => Promise<void> }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayString());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (open) { setAmount(''); setCategory('other'); setDescription(''); setDate(todayString()); setError(null); } }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError('Enter a valid amount'); return; }
    setSaving(true); setError(null);
    try { await onSubmit({ amount: amt, category, description: description.trim() || category, expense_date: date }); }
    catch { setError('Failed to save. Try again.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Expense" footer={<><button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button><button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Add Expense'}</button></>}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Amount (₹)</label>
          <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="input-field w-full" autoFocus />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)} className="input-field w-full cursor-pointer">
            {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Description</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="What was it for?" className="input-field w-full" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field w-full" />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}
