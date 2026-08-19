/*
# Add authentication support: per-user data isolation, user profiles, app lock, private storage

## What this migration does

Converts the app from single-tenant (anon-accessible) to multi-user (authenticated, per-user isolated).
Every existing table gets a `user_id` column. New tables for user profiles and app lock (PIN).
Private storage bucket for documents/photos.

## Changes

### 1. Add user_id columns to all existing tables
- tasks, ai_conversations, ai_messages, expenses, documents, calendar_events, family_members, memories, app_settings
- All get `user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE`
- app_settings PK changed to composite (key, user_id)

### 2. New tables
- user_profiles (id = auth.users.id, display_name, avatar_url)
- app_lock (user_id unique, pin_hash — never raw PIN)

### 3. Storage
- Private bucket 'private-documents' with per-user folder policies

### 4. RLS: drop all old anon policies, replace with authenticated-only ownership-scoped policies

### 5. Trigger: auto-create user_profile on signup
*/

-- ── 1. Add user_id to existing tables ─────────────

DO $$ BEGIN
  ALTER TABLE tasks ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE ai_conversations ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE ai_messages ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE expenses ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE documents ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE calendar_events ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE family_members ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE memories ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE app_settings ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- app_settings: change PK to composite
DO $$ BEGIN
  ALTER TABLE app_settings DROP CONSTRAINT app_settings_pkey;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE app_settings ADD PRIMARY KEY (key, user_id);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
CREATE INDEX IF NOT EXISTS ai_conversations_user_id_idx ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS ai_messages_user_id_idx ON ai_messages(user_id);
CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON expenses(user_id);
CREATE INDEX IF NOT EXISTS documents_user_id_idx ON documents(user_id);
CREATE INDEX IF NOT EXISTS calendar_events_user_id_idx ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS family_members_user_id_idx ON family_members(user_id);
CREATE INDEX IF NOT EXISTS memories_user_id_idx ON memories(user_id);
CREATE INDEX IF NOT EXISTS app_settings_user_id_idx ON app_settings(user_id);

-- ── 2. New tables ──────────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_lock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_lock ENABLE ROW LEVEL SECURITY;

-- ── 3. Storage: private documents bucket ───────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('private-documents', 'private-documents', false)
ON CONFLICT (id) DO NOTHING;

-- ── 4. Drop old anon policies, create authenticated policies ──

-- Helper function to drop+create for a standard owner-scoped table
-- We do each table explicitly for clarity.

-- tasks
DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;
DROP POLICY IF EXISTS "tasks_select" ON tasks;
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_update" ON tasks;
DROP POLICY IF EXISTS "tasks_delete" ON tasks;

CREATE POLICY "tasks_select" ON tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_delete" ON tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ai_conversations
DROP POLICY IF EXISTS "anon_select_ai_conversations" ON ai_conversations;
DROP POLICY IF EXISTS "anon_insert_ai_conversations" ON ai_conversations;
DROP POLICY IF EXISTS "anon_update_ai_conversations" ON ai_conversations;
DROP POLICY IF EXISTS "anon_delete_ai_conversations" ON ai_conversations;
DROP POLICY IF EXISTS "ai_conversations_select" ON ai_conversations;
DROP POLICY IF EXISTS "ai_conversations_insert" ON ai_conversations;
DROP POLICY IF EXISTS "ai_conversations_update" ON ai_conversations;
DROP POLICY IF EXISTS "ai_conversations_delete" ON ai_conversations;

CREATE POLICY "ai_conversations_select" ON ai_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ai_conversations_insert" ON ai_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_conversations_update" ON ai_conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_conversations_delete" ON ai_conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ai_messages
DROP POLICY IF EXISTS "anon_select_ai_messages" ON ai_messages;
DROP POLICY IF EXISTS "anon_insert_ai_messages" ON ai_messages;
DROP POLICY IF EXISTS "anon_update_ai_messages" ON ai_messages;
DROP POLICY IF EXISTS "anon_delete_ai_messages" ON ai_messages;
DROP POLICY IF EXISTS "ai_messages_select" ON ai_messages;
DROP POLICY IF EXISTS "ai_messages_insert" ON ai_messages;
DROP POLICY IF EXISTS "ai_messages_update" ON ai_messages;
DROP POLICY IF EXISTS "ai_messages_delete" ON ai_messages;

CREATE POLICY "ai_messages_select" ON ai_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ai_messages_insert" ON ai_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_messages_update" ON ai_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_messages_delete" ON ai_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- expenses
DROP POLICY IF EXISTS "anon_select_expenses" ON expenses;
DROP POLICY IF EXISTS "anon_insert_expenses" ON expenses;
DROP POLICY IF EXISTS "anon_update_expenses" ON expenses;
DROP POLICY IF EXISTS "anon_delete_expenses" ON expenses;
DROP POLICY IF EXISTS "expenses_select" ON expenses;
DROP POLICY IF EXISTS "expenses_insert" ON expenses;
DROP POLICY IF EXISTS "expenses_update" ON expenses;
DROP POLICY IF EXISTS "expenses_delete" ON expenses;

CREATE POLICY "expenses_select" ON expenses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "expenses_insert" ON expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "expenses_update" ON expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "expenses_delete" ON expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- documents
DROP POLICY IF EXISTS "anon_select_documents" ON documents;
DROP POLICY IF EXISTS "anon_insert_documents" ON documents;
DROP POLICY IF EXISTS "anon_update_documents" ON documents;
DROP POLICY IF EXISTS "anon_delete_documents" ON documents;
DROP POLICY IF EXISTS "documents_select" ON documents;
DROP POLICY IF EXISTS "documents_insert" ON documents;
DROP POLICY IF EXISTS "documents_update" ON documents;
DROP POLICY IF EXISTS "documents_delete" ON documents;

CREATE POLICY "documents_select" ON documents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "documents_insert" ON documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "documents_update" ON documents FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "documents_delete" ON documents FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- calendar_events
DROP POLICY IF EXISTS "anon_select_calendar_events" ON calendar_events;
DROP POLICY IF EXISTS "anon_insert_calendar_events" ON calendar_events;
DROP POLICY IF EXISTS "anon_update_calendar_events" ON calendar_events;
DROP POLICY IF EXISTS "anon_delete_calendar_events" ON calendar_events;
DROP POLICY IF EXISTS "calendar_events_select" ON calendar_events;
DROP POLICY IF EXISTS "calendar_events_insert" ON calendar_events;
DROP POLICY IF EXISTS "calendar_events_update" ON calendar_events;
DROP POLICY IF EXISTS "calendar_events_delete" ON calendar_events;

CREATE POLICY "calendar_events_select" ON calendar_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "calendar_events_insert" ON calendar_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "calendar_events_update" ON calendar_events FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "calendar_events_delete" ON calendar_events FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- family_members
DROP POLICY IF EXISTS "anon_select_family_members" ON family_members;
DROP POLICY IF EXISTS "anon_insert_family_members" ON family_members;
DROP POLICY IF EXISTS "anon_update_family_members" ON family_members;
DROP POLICY IF EXISTS "anon_delete_family_members" ON family_members;
DROP POLICY IF EXISTS "family_members_select" ON family_members;
DROP POLICY IF EXISTS "family_members_insert" ON family_members;
DROP POLICY IF EXISTS "family_members_update" ON family_members;
DROP POLICY IF EXISTS "family_members_delete" ON family_members;

CREATE POLICY "family_members_select" ON family_members FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "family_members_insert" ON family_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "family_members_update" ON family_members FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "family_members_delete" ON family_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- memories
DROP POLICY IF EXISTS "anon_select_memories" ON memories;
DROP POLICY IF EXISTS "anon_insert_memories" ON memories;
DROP POLICY IF EXISTS "anon_update_memories" ON memories;
DROP POLICY IF EXISTS "anon_delete_memories" ON memories;
DROP POLICY IF EXISTS "memories_select" ON memories;
DROP POLICY IF EXISTS "memories_insert" ON memories;
DROP POLICY IF EXISTS "memories_update" ON memories;
DROP POLICY IF EXISTS "memories_delete" ON memories;

CREATE POLICY "memories_select" ON memories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "memories_insert" ON memories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "memories_update" ON memories FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "memories_delete" ON memories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- app_settings
DROP POLICY IF EXISTS "anon_select_app_settings" ON app_settings;
DROP POLICY IF EXISTS "anon_insert_app_settings" ON app_settings;
DROP POLICY IF EXISTS "anon_update_app_settings" ON app_settings;
DROP POLICY IF EXISTS "anon_delete_app_settings" ON app_settings;
DROP POLICY IF EXISTS "app_settings_select" ON app_settings;
DROP POLICY IF EXISTS "app_settings_insert" ON app_settings;
DROP POLICY IF EXISTS "app_settings_update" ON app_settings;
DROP POLICY IF EXISTS "app_settings_delete" ON app_settings;

CREATE POLICY "app_settings_select" ON app_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "app_settings_insert" ON app_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "app_settings_update" ON app_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "app_settings_delete" ON app_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- user_profiles
DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete" ON user_profiles;

CREATE POLICY "user_profiles_select" ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "user_profiles_insert" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "user_profiles_update" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "user_profiles_delete" ON user_profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- app_lock
DROP POLICY IF EXISTS "app_lock_select" ON app_lock;
DROP POLICY IF EXISTS "app_lock_insert" ON app_lock;
DROP POLICY IF EXISTS "app_lock_update" ON app_lock;
DROP POLICY IF EXISTS "app_lock_delete" ON app_lock;

CREATE POLICY "app_lock_select" ON app_lock FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "app_lock_insert" ON app_lock FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "app_lock_update" ON app_lock FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "app_lock_delete" ON app_lock FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── 5. Storage policies ───────────────────────────

DROP POLICY IF EXISTS "private_docs_select" ON storage.objects;
CREATE POLICY "private_docs_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'private-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "private_docs_insert" ON storage.objects;
CREATE POLICY "private_docs_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'private-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "private_docs_update" ON storage.objects;
CREATE POLICY "private_docs_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'private-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'private-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "private_docs_delete" ON storage.objects;
CREATE POLICY "private_docs_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'private-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ── 6. Trigger: auto-create user_profile on signup ──

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();