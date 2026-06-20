ALTER TABLE public.returns
  ADD COLUMN IF NOT EXISTS refund_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS refund_reference text,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

ALTER TABLE public.returns
  ADD CONSTRAINT returns_refund_status_check
  CHECK (refund_status IN ('none', 'processing', 'succeeded', 'failed'));
