import { supabase } from '../supabase';
import type { Task, TaskInsert } from '@/types';
import { todayString } from '../date';

export async function fetchAllTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('completed', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchTasksByDate(date: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('due_date', date)
    .eq('completed', false)
    .order('due_time', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchTodayTasks(): Promise<Task[]> {
  return fetchTasksByDate(todayString());
}

export async function createTask(task: TaskInsert): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(id: string, updates: Partial<TaskInsert>): Promise<void> {
  const payload = { ...updates, updated_at: new Date().toISOString() };
  const { error } = await supabase.from('tasks').update(payload).eq('id', id);
  if (error) throw error;
}

export async function toggleTaskComplete(task: Task): Promise<void> {
  const completed = !task.completed;
  await updateTask(task.id, {
    completed,
    completed_at: completed ? new Date().toISOString() : null,
  });
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}
