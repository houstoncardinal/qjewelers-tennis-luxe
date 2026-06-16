-- ── Subscribers ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscribers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  source     TEXT NOT NULL DEFAULT 'footer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT subscribers_email_unique UNIQUE (email)
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role full access to subscribers"
  ON public.subscribers FOR ALL USING (true) WITH CHECK (true);

-- ── Product Reviews ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug  TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  order_number  TEXT,
  rating        INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title         TEXT,
  body          TEXT NOT NULL,
  verified      BOOLEAN NOT NULL DEFAULT false,
  approved      BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role full access to reviews"
  ON public.reviews FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS reviews_product_slug_idx ON public.reviews (product_slug);
CREATE INDEX IF NOT EXISTS reviews_approved_idx ON public.reviews (approved);
