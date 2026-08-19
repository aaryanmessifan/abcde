import { supabase } from '../supabase';
import type { Expense, ExpenseInsert, ExpenseCategory } from '@/types';
import { todayString, toDateString } from '../date';

export async function fetchAllExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchExpensesByMonth(year: number, month: number): Promise<Expense[]> {
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endMonth = month === 11 ? 0 : month + 1;
  const endYear = month === 11 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth + 1).padStart(2, '0')}-01`;
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .gte('expense_date', startDate)
    .lt('expense_date', endDate)
    .order('expense_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createExpense(expense: ExpenseInsert): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

export function parseExpenseFromText(input: string): { amount: number; category: ExpenseCategory; description: string; date: string } | null {
  const lower = input.toLowerCase();

  const amountMatch = input.match(/[₹$]?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/);
  if (!amountMatch) return null;
  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  if (isNaN(amount) || amount <= 0) return null;

  const categoryMap: Record<string, ExpenseCategory> = {
    groceries: 'groceries', grocery: 'groceries', food: 'food', lunch: 'food', dinner: 'food',
    breakfast: 'food', snack: 'food', travel: 'travel', cab: 'travel', taxi: 'travel', uber: 'travel',
    auto: 'travel', petrol: 'travel', fuel: 'travel', bill: 'bills', bills: 'bills', electricity: 'bills',
    water: 'bills', phone: 'bills', internet: 'bills', gas: 'bills', shopping: 'shopping', clothes: 'shopping',
    health: 'health', doctor: 'health', medicine: 'health', pharmacy: 'health', hospital: 'health',
    entertainment: 'entertainment', movie: 'entertainment', netflix: 'entertainment',
  };

  let category: ExpenseCategory = 'other';
  for (const [keyword, cat] of Object.entries(categoryMap)) {
    if (lower.includes(keyword)) { category = cat; break; }
  }

  let description = input.replace(amountMatch[0], '').trim();
  for (const keyword of Object.keys(categoryMap)) {
    description = description.replace(new RegExp(keyword, 'gi'), '');
  }
  description = description.replace(/\b(spent|on|for|at|bought|paid|add|₹|rs\.?|inr)\b/gi, '').trim();
  if (!description) description = category.charAt(0).toUpperCase() + category.slice(1);

  let date = todayString();
  if (/\byesterday\b/i.test(input)) {
    const t = new Date(); t.setDate(t.getDate() - 1);
    date = toDateString(t);
  }

  return { amount, category, description, date };
}

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; color: string }[] = [
  { value: 'food', label: 'Food', color: '#FF8A3D' },
  { value: 'groceries', label: 'Groceries', color: '#38C3FF' },
  { value: 'travel', label: 'Travel', color: '#75D8FF' },
  { value: 'bills', label: 'Bills', color: '#FFB370' },
  { value: 'shopping', label: 'Shopping', color: '#FF6B1A' },
  { value: 'health', label: 'Health', color: '#0EA8E8' },
  { value: 'entertainment', label: 'Entertainment', color: '#F45706' },
  { value: 'other', label: 'Other', color: '#2D333D' },
];
