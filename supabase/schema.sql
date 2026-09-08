-- =======================================================
-- STREETALK DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- Architecture: Zero PII, Anonymous Confessions & Security
-- =======================================================

-- 1. SECRETS TABLE (Wall of Street Confessions)
CREATE TABLE IF NOT EXISTS public.secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL CHECK (char_length(content) >= 3 AND char_length(content) <= 90),
  mood TEXT NOT NULL CHECK (mood IN ('cazzeggio', 'sfogati', 'flirt')),
  likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast ordering and filtering by mood
CREATE INDEX IF NOT EXISTS idx_secrets_mood_created ON public.secrets(mood, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_secrets_public_created ON public.secrets(is_public, created_at DESC);

-- Enable RLS for secrets
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon) to read public secrets
CREATE POLICY "Allow public read-only access to approved secrets"
  ON public.secrets
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- Allow server backend (service_role or anon with insert) to insert confessions
CREATE POLICY "Allow inserting secrets"
  ON public.secrets
  FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (char_length(content) >= 3 AND char_length(content) <= 90);


-- 2. REPORTS TABLE (Abuse Moderation & Safe Community Shield)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT,
  reason TEXT NOT NULL,
  reporter_ip_hash TEXT NOT NULL,
  reported_ip_hash TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'jailed')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for moderation queries
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON public.reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reported_hash ON public.reports(reported_ip_hash);

-- Enable RLS for reports (RESTRICTED: Zero public read)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Disallow public read on reports"
  ON public.reports
  FOR SELECT
  TO authenticated, service_role
  USING (true);

CREATE POLICY "Allow service_role and backend insert on reports"
  ON public.reports
  FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);


-- 3. TELEMETRY TABLE (Live Performance & Realtime Stats)
CREATE TABLE IF NOT EXISTS public.telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_matches INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  peak_concurrent INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on telemetry"
  ON public.telemetry
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow backend write on telemetry"
  ON public.telemetry
  FOR INSERT
  TO service_role, authenticated, anon
  WITH CHECK (true);

-- =======================================================
-- INITIAL SEED CONFESSIONS (Urban Underground Street Vibe)
-- =======================================================
INSERT INTO public.secrets (content, mood, likes_count, is_public)
VALUES
  ('A volte salgo sull''ultimo vagone della metro solo per ascoltare il rumore dei binari.', 'sfogati', 42, true),
  ('Ho detto a tutti che ero a una festa, ma stavo programmando al buio con le cuffie.', 'cazzeggio', 88, true),
  ('Ti ho incrociato sui gradini della stazione e non ho avuto il coraggio di dirti che sei stupenda.', 'flirt', 105, true)
ON CONFLICT DO NOTHING;
