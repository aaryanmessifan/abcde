/*
# Create tables for expenses, documents, calendar events, family members, memories, and app settings.

All tables use RLS with TO anon, authenticated (single-tenant, no auth screen).
*/

-- ── Expenses ──────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric NOT NULL CHECK (amount >= 0),
  category text NOT NULL DEFAULT 'other' CHECK (category IN ('food','groceries','travel','bills','shopping','health','entertainment','other')),
  description text NOT NULL DEFAULT '',
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS expenses_category_idx ON expenses(category);

-- ── Documents ─────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  category text NOT NULL DEFAULT 'general',
  file_size bigint NOT NULL DEFAULT 0,
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  storage_path text,
  ai_summary text,
  ai_analysis jsonb,
  analysis_status text NOT NULL DEFAULT 'pending' CHECK (analysis_status IN ('pending','analyzed','skipped')),
  upload_date timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS documents_category_idx ON documents(category);

-- ── Calendar Events ───────────────────────────
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time time,
  type text NOT NULL DEFAULT 'event' CHECK (type IN ('event','appointment','birthday','anniversary','reminder')),
  location text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS calendar_events_date_idx ON calendar_events(event_date);

-- ── Family Members ────────────────────────────
CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  relationship text NOT NULL DEFAULT 'family',
  birthday date,
  anniversary date,
  phone text,
  email text,
  notes text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Memories ──────────────────────────────────
CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  date date,
  photo_url text,
  family_member_id uuid REFERENCES family_members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── App Settings (key-value, single row) ──────
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── RLS Policies ──────────────────────────────
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Helper: generate CRUD policies for a table
-- Expenses
CREATE POLICY "anon_select_expenses" ON expenses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_expenses" ON expenses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_expenses" ON expenses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_expenses" ON expenses FOR DELETE TO anon, authenticated USING (true);

-- Documents
CREATE POLICY "anon_select_documents" ON documents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_documents" ON documents FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_documents" ON documents FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_documents" ON documents FOR DELETE TO anon, authenticated USING (true);

-- Calendar Events
CREATE POLICY "anon_select_calendar_events" ON calendar_events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_calendar_events" ON calendar_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_calendar_events" ON calendar_events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_calendar_events" ON calendar_events FOR DELETE TO anon, authenticated USING (true);

-- Family Members
CREATE POLICY "anon_select_family_members" ON family_members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_family_members" ON family_members FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_family_members" ON family_members FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_family_members" ON family_members FOR DELETE TO anon, authenticated USING (true);

-- Memories
CREATE POLICY "anon_select_memories" ON memories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_memories" ON memories FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_memories" ON memories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_memories" ON memories FOR DELETE TO anon, authenticated USING (true);

-- App Settings
CREATE POLICY "anon_select_app_settings" ON app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_app_settings" ON app_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_app_settings" ON app_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_app_settings" ON app_settings FOR DELETE TO anon, authenticated USING (true);