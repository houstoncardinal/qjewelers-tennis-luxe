-- =============================================================================
-- Comprehensive migration to fix all missing columns and tables
-- This ensures the admin dashboard can save all product fields
-- Run this in the Supabase SQL Editor
-- =============================================================================

-- ─── Products table: add all missing columns ─────────────────────────────────
-- These columns are required by the admin product editor

-- Inventory tracking
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_quantity integer,
  ADD COLUMN IF NOT EXISTS track_inventory boolean NOT NULL DEFAULT false;

-- SEO fields (may already exist from base schema, but ensure they're there)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seo_title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_keywords text NOT NULL DEFAULT '';

-- Tags
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- Admin notes
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- Sale pricing
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sale_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS sale_active boolean NOT NULL DEFAULT false;

-- Featured and sort
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Short description
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS short_description text NOT NULL DEFAULT '';

-- Image URL
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_url text NOT NULL DEFAULT '/main.jpg';

-- ─── Product images table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text NOT NULL REFERENCES public.products(slug) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Allow public read on product images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'product_images_public_read'
  ) THEN
    CREATE POLICY "product_images_public_read" ON public.product_images
      FOR SELECT USING (true);
  END IF;
END $$;

-- Allow admin full access via service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'product_images_admin_all'
  ) THEN
    CREATE POLICY "product_images_admin_all" ON public.product_images
      FOR ALL USING (true);
  END IF;
END $$;

-- Indexes for product images
CREATE INDEX IF NOT EXISTS idx_product_images_product_slug ON public.product_images(product_slug);
CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON public.product_images(product_slug, sort_order);

-- ─── Product variants table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text NOT NULL REFERENCES public.products(slug) ON DELETE CASCADE,

  -- Variant attributes (each nullable = not applicable to this product type)
  color text,          -- silver | gold | rose_gold | white_gold
  size text,           -- 2mm | 3mm | 4mm | 5mm | 6.5mm | 3mm | 5mm | 6mm | 8mm | 0.5ct | 1ct | 1.5ct | 2ct | 3ct
  length text,         -- 16" | 18" | 20" | 22" | 24" | 6" | 6.5" | 7" | 7.5" | 8" | 8.5" | 9"

  -- Optional overrides (NULL = use product base_price + pricing function)
  price_override numeric(10,2),  -- manual price override for this specific variant
  sku text,                      -- unique SKU code
  stock integer DEFAULT -1,      -- -1 = unlimited, 0 = out of stock, >0 = tracked
  weight_grams integer,          -- optional weight for shipping

  -- Status
  is_active boolean NOT NULL DEFAULT true,

  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Ensure unique variant per product (no duplicate color+size+length)
  CONSTRAINT unique_variant_per_product
    UNIQUE (product_slug, color, size, length)
);

-- Indexes for product variants
CREATE INDEX IF NOT EXISTS idx_product_variants_slug ON public.product_variants(product_slug);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON public.product_variants(product_slug, is_active);

-- Row-level security for product variants
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'product_variants_public_read'
  ) THEN
    CREATE POLICY "product_variants_public_read" ON public.product_variants
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'product_variants_admin_all'
  ) THEN
    CREATE POLICY "product_variants_admin_all" ON public.product_variants
      FOR ALL USING (true);
  END IF;
END $$;

-- ─── Customer notes table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customer_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email text NOT NULL,
  note       text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all'
  ) THEN
    CREATE POLICY "service_role_all" ON public.customer_notes
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── Subscribers table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscribers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text UNIQUE NOT NULL,
  source     text NOT NULL DEFAULT 'footer',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'subscribers_public_insert'
  ) THEN
    CREATE POLICY "subscribers_public_insert" ON public.subscribers
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ─── Reviews table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text NOT NULL REFERENCES public.products(slug) ON DELETE CASCADE,
  customer_name text NOT NULL DEFAULT '',
  customer_email text NOT NULL DEFAULT '',
  rating      integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title       text NOT NULL DEFAULT '',
  body        text NOT NULL DEFAULT '',
  is_approved boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'reviews_public_read'
  ) THEN
    CREATE POLICY "reviews_public_read" ON public.reviews
      FOR SELECT USING (is_approved = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'reviews_public_insert'
  ) THEN
    CREATE POLICY "reviews_public_insert" ON public.reviews
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ─── Functions ───────────────────────────────────────────────────────────────

-- Decrement stock function
CREATE OR REPLACE FUNCTION public.decrement_stock(p_slug text, p_qty integer)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = GREATEST(COALESCE(stock_quantity, 0) - p_qty, 0)
  WHERE slug = p_slug AND track_inventory = true AND stock_quantity IS NOT NULL;
END;
$$;

-- Auto-update updated_at for products
CREATE OR REPLACE FUNCTION public.update_product_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_product_timestamp ON public.products;
CREATE TRIGGER trigger_product_timestamp
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_timestamp();

-- Auto-update updated_at for product variants
CREATE OR REPLACE FUNCTION public.update_variant_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_variant_timestamp ON public.product_variants;
CREATE TRIGGER trigger_variant_timestamp
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_variant_timestamp();

-- ─── Store settings ──────────────────────────────────────────────────────────
INSERT INTO public.store_settings (key, value, label) VALUES
  ('tax_rate',                 '0',                                                          'Tax Rate (%)'),
  ('announcement_bar_enabled', 'false',                                                      'Announcement Bar Enabled'),
  ('announcement_bar_text',    'Free shipping on orders over $250 · GRA Certified Moissanite', 'Announcement Bar Text'),
  ('contact_phone',            '',                                                           'Contact Phone Number'),
  ('instagram_url',            '',                                                           'Instagram URL'),
  ('tiktok_url',               '',                                                           'TikTok URL'),
  ('return_window_days',       '30',                                                         'Return Window (days)')
ON CONFLICT (key) DO NOTHING;

-- ─── Verify ──────────────────────────────────────────────────────────────────
-- Run this to verify all columns exist:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'products' ORDER BY ordinal_position;