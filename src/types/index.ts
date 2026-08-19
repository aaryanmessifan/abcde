export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  priority: Priority;
  category: string;
  completed: boolean;
  completed_at: string | null;
  recurring: 'daily' | 'weekly' | 'monthly' | null;
  created_at: string;
  updated_at: string;
}

export type TaskInsert = Omit<Task, 'id' | 'created_at' | 'updated_at' | 'completed_at'> & {
  completed_at?: string | null;
};

export interface AIConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  actions: AIAction[] | null;
  created_at: string;
}

export interface AIAction {
  type: 'create_task' | 'complete_task' | 'delete_task' | 'query_tasks' | 'create_expense' | 'query_expenses' | 'create_event' | 'query_events' | 'answer';
  label: string;
  data?: Record<string, unknown>;
  success: boolean;
  message?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  actions?: AIAction[];
}

// ── Expenses ──────────────────────────────────
export type ExpenseCategory = 'food' | 'groceries' | 'travel' | 'bills' | 'shopping' | 'health' | 'entertainment' | 'other';

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  expense_date: string;
  created_at: string;
}

export type ExpenseInsert = Omit<Expense, 'id' | 'created_at'>;

// ── Documents ─────────────────────────────────
export type DocumentType = 'pdf' | 'image' | 'text' | 'other';
export type AnalysisStatus = 'pending' | 'analyzed' | 'skipped';

export interface DocumentItem {
  id: string;
  name: string;
  type: DocumentType;
  category: string;
  file_size: number;
  mime_type: string;
  storage_path: string | null;
  ai_summary: string | null;
  ai_analysis: Record<string, string> | null;
  analysis_status: AnalysisStatus;
  upload_date: string;
}

export type DocumentInsert = Omit<DocumentItem, 'id' | 'upload_date'>;

// ── Calendar Events ───────────────────────────
export type EventType = 'event' | 'appointment' | 'birthday' | 'anniversary' | 'reminder';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  type: EventType;
  location: string | null;
  created_at: string;
}

export type CalendarEventInsert = Omit<CalendarEvent, 'id' | 'created_at'>;

// ── Family Members ────────────────────────────
export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  birthday: string | null;
  anniversary: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
}

export type FamilyMemberInsert = Omit<FamilyMember, 'id' | 'created_at'>;

// ── Memories ──────────────────────────────────
export interface Memory {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  photo_url: string | null;
  family_member_id: string | null;
  created_at: string;
}

export type MemoryInsert = Omit<Memory, 'id' | 'created_at'>;

// ── App Settings ──────────────────────────────
export interface AppSettings {
  user_name: string;
  birthday_message: string;
  birthday_date: string;
  ai_personality: string;
  custom_categories: string[];
  creator_mode_enabled: boolean;
  family_members_seed: string;
  photos: string[];
  memories_seed: string;
}
