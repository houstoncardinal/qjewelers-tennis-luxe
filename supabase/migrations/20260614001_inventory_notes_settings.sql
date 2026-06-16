-- Inventory tracking on products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_quantity integer,
  ADD COLUMN IF NOT EXISTS track_inventory boolean NOT NULL DEFAULT false;

-- Customer admin notes
CREATE TABLE IF NOT EXISTS public.customer_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email text NOT NULL,
  note       text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "service_role_all" ON public.customer_notes
  TO service_role USING (true) WITH CHECK (true);

-- Stored procedure to safely decrement stock (only when track_inventory = true)
CREATE OR REPLACE FUNCTION public.decrement_stock(p_slug text, p_qty integer)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = GREATEST(COALESCE(stock_quantity, 0) - p_qty, 0)
  WHERE slug = p_slug AND track_inventory = true AND stock_quantity IS NOT NULL;
END;
$$;

-- Additional store settings
INSERT INTO public.store_settings (key, value, label) VALUES
  ('tax_rate',                 '0',                                                          'Tax Rate (%)'),
  ('announcement_bar_enabled', 'false',                                                      'Announcement Bar Enabled'),
  ('announcement_bar_text',    'Free shipping on orders over $250 · GRA Certified Moissanite', 'Announcement Bar Text'),
  ('contact_phone',            '',                                                           'Contact Phone Number'),
  ('instagram_url',            '',                                                           'Instagram URL'),
  ('tiktok_url',               '',                                                           'TikTok URL'),
  ('return_window_days',       '30',                                                         'Return Window (days)')
ON CONFLICT (key) DO NOTHING;
