/*
# Create tasks and AI conversation tables (single-tenant, no auth)

1. New Tables
- `tasks`: Stores user tasks and reminders with priority, category, due dates, and recurrence.
  - id (uuid, primary key)
  - title (text, not null)
  - description (text, nullable)
  - due_date (date, nullable) - when the task is due
  - due_time (time, nullable) - specific time for reminders
  - priority (text, default 'medium') - low, medium, high
  - category (text, default 'general') - flexible categorization
  - completed (boolean, default false)
  - completed_at (timestamptz, nullable)
  - recurring (text, nullable) - daily, weekly, monthly, or null
  - created_at (timestamptz, default now())
  - updated_at (timestamptz, default now())

- `ai_conversations`: Stores AI chat conversation sessions.
  - id (uuid, primary key)
  - title (text, default 'New Conversation')
  - created_at (timestamptz, default now())
  - updated_at (timestamptz, default now())

- `ai_messages`: Stores individual messages within AI conversations.
  - id (uuid, primary key)
  - conversation_id (uuid, foreign key to ai_conversations, cascade delete)
  - role (text, not null) - 'user' or 'assistant'
  - content (text, not null)
  - actions (jsonb, nullable) - any actions performed by the AI
  - created_at (timestamptz, default now())

2. Indexes
- tasks_due_date_idx: for querying tasks by due date
- tasks_completed_idx: for filtering completed/incomplete tasks
- ai_messages_conversation_idx: for querying messages by conversation

3. Security
- RLS enabled on all tables.
- All tables use `TO anon, authenticated` policies since this is a single-tenant app with no sign-in screen.
- Full CRUD access for anon and authenticated roles (data is intentionally shared).
*/

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  due_date date,
  due_time time,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category text NOT NULL DEFAULT 'general',
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  recurring text CHECK (recurring IS NULL OR recurring IN ('daily', 'weekly', 'monthly')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks(due_date);
CREATE INDEX IF NOT EXISTS tasks_completed_idx ON tasks(completed);
CREATE INDEX IF NOT EXISTS tasks_category_idx ON tasks(category);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'New Conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  actions jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_messages_conversation_idx ON ai_messages(conversation_id);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
CREATE POLICY "anon_select_tasks" ON tasks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
CREATE POLICY "anon_insert_tasks" ON tasks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
CREATE POLICY "anon_update_tasks" ON tasks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;
CREATE POLICY "anon_delete_tasks" ON tasks FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_ai_conversations" ON ai_conversations;
CREATE POLICY "anon_select_ai_conversations" ON ai_conversations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_ai_conversations" ON ai_conversations;
CREATE POLICY "anon_insert_ai_conversations" ON ai_conversations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_ai_conversations" ON ai_conversations;
CREATE POLICY "anon_update_ai_conversations" ON ai_conversations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_ai_conversations" ON ai_conversations;
CREATE POLICY "anon_delete_ai_conversations" ON ai_conversations FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_ai_messages" ON ai_messages;
CREATE POLICY "anon_select_ai_messages" ON ai_messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_ai_messages" ON ai_messages;
CREATE POLICY "anon_insert_ai_messages" ON ai_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_ai_messages" ON ai_messages;
CREATE POLICY "anon_update_ai_messages" ON ai_messages FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_ai_messages" ON ai_messages;
CREATE POLICY "anon_delete_ai_messages" ON ai_messages FOR DELETE
  TO anon, authenticated USING (true);
