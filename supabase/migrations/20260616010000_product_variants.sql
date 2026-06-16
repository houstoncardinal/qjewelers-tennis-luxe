-- Product Variants system
-- Supports Color × Size × Length combinations with per-variant pricing, stock, and SKU

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_slug ON public.product_variants(product_slug);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON public.product_variants(product_slug, is_active);

-- Row-level security
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_variants_public_read" ON public.product_variants
  FOR SELECT USING (true);

CREATE POLICY "product_variants_admin_all" ON public.product_variants
  FOR ALL USING (true);

-- Auto-update updated_at
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