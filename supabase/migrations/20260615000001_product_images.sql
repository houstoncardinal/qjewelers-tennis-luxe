-- Product images gallery support
-- Allows multiple images per product with ordering, primary selection, and alt text

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
CREATE POLICY "product_images_public_read" ON public.product_images
  FOR SELECT USING (true);

-- Allow admin full access via service role
CREATE POLICY "product_images_admin_all" ON public.product_images
  FOR ALL USING (true);

-- Index for fast lookups by product
CREATE INDEX IF NOT EXISTS idx_product_images_product_slug ON public.product_images(product_slug);
CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON public.product_images(product_slug, sort_order);

-- Seed the tennis bracelet images from the TennisBracelet folder
INSERT INTO public.product_images (product_slug, url, alt_text, sort_order, is_primary) VALUES
  ('vvs-moissanite-tennis-bracelet', '/TennisBracelet/yellowgoldmain.jpg',   'VVS1 Moissanite Tennis Bracelet — 18K Yellow Gold',       0, true),
  ('vvs-moissanite-tennis-bracelet', '/TennisBracelet/whitegoldmain.jpg',   'VVS1 Moissanite Tennis Bracelet — 18K White Gold',        1, false),
  ('vvs-moissanite-tennis-bracelet', '/TennisBracelet/2mmbracelet.jpg',     '2mm Width — Slim and Elegant',                             2, false),
  ('vvs-moissanite-tennis-bracelet', '/TennisBracelet/3mmbracelet.jpg',     '3mm Width — Classic Everyday',                             3, false),
  ('vvs-moissanite-tennis-bracelet', '/TennisBracelet/4mmbracelet.jpg',     '4mm Width — Bold Statement',                               4, false),
  ('vvs-moissanite-tennis-bracelet', '/TennisBracelet/5mmbracelet.jpg',     '5mm Width — Maximum Ice',                                  5, false),
  ('vvs-moissanite-tennis-bracelet', '/TennisBracelet/65mmbracelet.jpg',    '6.5mm Width — Ultra Bold',                                 6, false),
  ('vvs-moissanite-tennis-bracelet', '/TennisBracelet/braceletslaidout.jpg','Tennis Bracelets Flat Lay — All Widths and Metals',        7, false),
  ('vvs-moissanite-tennis-bracelet', '/TennisBracelet/braceletsmultiple.jpg','Multiple Tennis Bracelets Stacked on Wrist',               8, false),
  ('vvs-moissanite-tennis-bracelet', '/TennisBracelet/braceletsadditional.jpg','Tennis Bracelet Natural Light — Moissanite Fire',          9, false),
  ('vvs-moissanite-tennis-bracelet', '/TennisBracelet/clasps.jpg',          'Double-Locking Box Clasp — Extreme Close-Up',              10, false),
  ('vvs-moissanite-tennis-bracelet', '/TennisBracelet/braceletsvariety.png','Tennis Bracelet Variety Grid — All Widths and Metals',     11, false)
ON CONFLICT DO NOTHING;