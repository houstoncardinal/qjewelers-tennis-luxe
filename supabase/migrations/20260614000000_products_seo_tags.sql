-- Product SEO keywords, tags, and store settings

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seo_keywords text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- Store-level settings (key/value)
CREATE TABLE IF NOT EXISTS public.store_settings (
  key        text PRIMARY KEY,
  value      text NOT NULL DEFAULT '',
  label      text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.store_settings (key, value, label) VALUES
  ('free_shipping_threshold', '250', 'Free Shipping Threshold ($)'),
  ('flat_shipping_rate',      '15',  'Flat Shipping Rate ($)'),
  ('store_name',              'Qureshi Jewelers', 'Store Display Name'),
  ('support_email',           'support@qureshijewelers.com', 'Support Email')
ON CONFLICT (key) DO NOTHING;
