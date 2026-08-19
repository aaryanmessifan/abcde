import { supabase } from '../supabase';
import type { CalendarEvent, CalendarEventInsert } from '@/types';

export async function fetchAllEvents(): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchEventsByMonth(year: number, month: number): Promise<CalendarEvent[]> {
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endMonth = month === 11 ? 0 : month + 1;
  const endYear = month === 11 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth + 1).padStart(2, '0')}-01`;
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .gte('event_date', startDate)
    .lt('event_date', endDate)
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function createEvent(event: CalendarEventInsert): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert(event)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('calendar_events').delete().eq('id', id);
  if (error) throw error;
}
