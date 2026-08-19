import { supabase } from '../supabase';
import type { FamilyMember, FamilyMemberInsert, Memory, MemoryInsert } from '@/types';

export async function fetchAllFamilyMembers(): Promise<FamilyMember[]> {
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createFamilyMember(member: FamilyMemberInsert): Promise<FamilyMember> {
  const { data, error } = await supabase
    .from('family_members')
    .insert(member)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFamilyMember(id: string, updates: Partial<FamilyMemberInsert>): Promise<void> {
  const { error } = await supabase.from('family_members').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteFamilyMember(id: string): Promise<void> {
  const { error } = await supabase.from('family_members').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchAllMemories(): Promise<Memory[]> {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .order('date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createMemory(memory: MemoryInsert): Promise<Memory> {
  const { data, error } = await supabase
    .from('memories')
    .insert(memory)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMemory(id: string): Promise<void> {
  const { error } = await supabase.from('memories').delete().eq('id', id);
  if (error) throw error;
}
