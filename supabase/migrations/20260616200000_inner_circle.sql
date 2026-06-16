-- ── Inner Circle: expand subscribers + add campaigns + messages ───────────────

-- Extend subscribers table
ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS name         TEXT,
  ADD COLUMN IF NOT EXISTS status       TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS tags         TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notes        TEXT,
  ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS subscribers_status_idx ON public.subscribers (status);
CREATE INDEX IF NOT EXISTS subscribers_tags_idx   ON public.subscribers USING GIN (tags);

-- ── Email Campaigns ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.campaigns (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  subject          TEXT NOT NULL,
  body_text        TEXT NOT NULL,
  campaign_type    TEXT NOT NULL DEFAULT 'broadcast',
  tag_filter       TEXT[] NOT NULL DEFAULT '{}',
  status           TEXT NOT NULL DEFAULT 'draft',
  recipient_count  INTEGER,
  sent_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role full access to campaigns"
  ON public.campaigns FOR ALL USING (true) WITH CHECK (true);

-- ── Internal Subscriber Messages ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.subscriber_messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_email TEXT NOT NULL,
  subject          TEXT NOT NULL,
  body             TEXT NOT NULL,
  message_type     TEXT NOT NULL DEFAULT 'message',
  is_read          BOOLEAN NOT NULL DEFAULT false,
  sent_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriber_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role full access to subscriber_messages"
  ON public.subscriber_messages FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS sub_messages_email_idx ON public.subscriber_messages (subscriber_email);
