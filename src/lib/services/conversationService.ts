import { supabase } from '../supabase';
import type { AIConversation, AIMessage, ChatMessage } from '@/types';

export async function fetchConversations(): Promise<AIConversation[]> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createConversation(title = 'New Conversation'): Promise<AIConversation> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({ title })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteConversation(id: string): Promise<void> {
  const { error } = await supabase.from('ai_conversations').delete().eq('id', id);
  if (error) throw error;
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  const { error } = await supabase
    .from('ai_conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function fetchMessages(conversationId: string): Promise<AIMessage[]> {
  const { data, error } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function saveMessage(
  conversationId: string,
  message: ChatMessage
): Promise<AIMessage> {
  const { data, error } = await supabase
    .from('ai_messages')
    .insert({
      conversation_id: conversationId,
      role: message.role,
      content: message.content,
      actions: message.actions ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from('ai_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return data;
}
