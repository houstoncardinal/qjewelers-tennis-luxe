CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'staff')),
  totp_secret text,
  totp_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_user_id uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- service_role bypasses RLS regardless; these make the lockdown explicit.
CREATE POLICY "deny_anon_authenticated" ON public.admin_users
  FOR ALL TO anon, authenticated USING (false);
CREATE POLICY "deny_anon_authenticated" ON public.audit_logs
  FOR ALL TO anon, authenticated USING (false);

-- No seed row is created here deliberately — embedding even a hash of the
-- existing ADMIN_TOKEN secret into a git-committed migration is unsafe.
-- adminAuth() in admin.functions.ts lazily bootstraps the first admin_users
-- row (username "admin") the first time someone logs in with ADMIN_TOKEN
-- while this table is empty, so the existing solo-founder login keeps
-- working through this migration with no manual step.
