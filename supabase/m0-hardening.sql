-- STREETALK M0: prepared local hardening, not executed against a cloud database.
-- Apply only after reviewing the target schema/grants and preserving existing rows.
-- No deletion, retention interval, authentication model or public feed is introduced.
BEGIN;

ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry ENABLE ROW LEVEL SECURITY;

-- Revoke grants as well as policies: service_role normally bypasses RLS.
REVOKE ALL PRIVILEGES ON TABLE public.secrets, public.reports, public.telemetry
  FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reports TO service_role;

ALTER TABLE public.secrets ALTER COLUMN is_public SET DEFAULT false;

DROP POLICY IF EXISTS "Allow public read-only access to approved secrets" ON public.secrets;
DROP POLICY IF EXISTS "Allow inserting secrets" ON public.secrets;
DROP POLICY IF EXISTS "Disallow public read on reports" ON public.reports;
DROP POLICY IF EXISTS "Allow service_role and backend insert on reports" ON public.reports;
DROP POLICY IF EXISTS "Allow public read on telemetry" ON public.telemetry;
DROP POLICY IF EXISTS "Allow backend write on telemetry" ON public.telemetry;

-- These tables have no browser/client access model in M0. A restrictive deny
-- also blocks client access if a later permissive policy and grant are added.
-- Owners/superusers and BYPASSRLS roles remain privileged; they are not clients.
DROP POLICY IF EXISTS "M0 deny client access" ON public.secrets;
CREATE POLICY "M0 deny client access" ON public.secrets AS RESTRICTIVE
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS "M0 deny client access" ON public.reports;
CREATE POLICY "M0 deny client access" ON public.reports AS RESTRICTIVE
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS "M0 deny client access" ON public.telemetry;
CREATE POLICY "M0 deny client access" ON public.telemetry AS RESTRICTIVE
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

COMMIT;

