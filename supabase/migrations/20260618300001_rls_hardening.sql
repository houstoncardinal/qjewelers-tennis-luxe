-- The returns table's public-insert policy allowed any anon REST client to
-- insert a return row directly, bypassing the app's honeypot/rate-limit/
-- order-validation in submitReturn(). The app itself writes via the
-- service-role client (which bypasses RLS regardless), so dropping this is
-- a pure hardening win with zero app-behavior impact.
DROP POLICY IF EXISTS "returns_public_insert" ON public.returns;

-- Explicit deny-all for anon/authenticated on tables that should only ever
-- be touched by the app's service-role client. service_role bypasses RLS
-- entirely in Supabase regardless of policies, so these do not affect it.
-- This makes the lockdown explicit/audit-proof instead of relying on
-- Supabase's implicit default-deny when a table has zero policies.
DROP POLICY IF EXISTS "deny_anon_authenticated" ON public.customer_notes;
CREATE POLICY "deny_anon_authenticated" ON public.customer_notes
  FOR ALL TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "deny_anon_authenticated" ON public.returns;
CREATE POLICY "deny_anon_authenticated" ON public.returns
  FOR ALL TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "deny_anon_authenticated" ON public.promo_codes;
CREATE POLICY "deny_anon_authenticated" ON public.promo_codes
  FOR ALL TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "deny_anon_authenticated" ON public.store_settings;
CREATE POLICY "deny_anon_authenticated" ON public.store_settings
  FOR ALL TO anon, authenticated USING (false);
