-- Add tracking and admin fields to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS tracking_carrier text,
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- Add size and length to products for full catalog support
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS size text,
  ADD COLUMN IF NOT EXISTS length text;

-- Widen type and color constraints to support full catalog
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_type_check;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_color_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_type_check
    CHECK (type IN ('necklace','bracelet','earring','ring'));

ALTER TABLE public.products
  ADD CONSTRAINT products_color_check
    CHECK (color IN ('silver','gold','rose_gold','white_gold'));
