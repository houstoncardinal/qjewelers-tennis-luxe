-- 1. Alter CHECK constraint to add 'white_gold' color
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_color_check;
ALTER TABLE public.products ADD CONSTRAINT products_color_check
  CHECK (color IN ('silver', 'gold', 'rose_gold', 'white_gold'));

-- 2. Add size column (optional — for size-specific product pages)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS size text;
-- Add size CHECK (optional future constraint)

-- 3. Seed: White Gold products
INSERT INTO public.products (slug, name, type, color, short_description, description, seo_title, seo_description, base_price, image_url, is_featured, sort_order) VALUES
('white-gold-moissanite-tennis-chain', 'Iced Out S925 Moissanite Tennis Chain — White Gold', 'necklace', 'white_gold',
 'White gold plated S925 tennis chain with VVS moissanite. Rhodium finish.',
 'A cool, brilliant white gold-plated finish over solid S925 sterling silver, layered five times with rhodium e-coating for a mirror-like finish that resists tarnish. VVS moissanite stones, four-prong set, GRA certified. Double-locking custom box clasp. Sizes 2-5mm. Lengths 18", 20", 24".',
 'White Gold Moissanite Tennis Chain | S925 VVS GRA Certified | Qureshi',
 'Iced out white gold plated moissanite tennis chain in S925 sterling silver. Rhodium finish, VVS clarity, GRA certified. 2-5mm widths.',
 229.00, '/main.jpg', true, 7),

('white-gold-moissanite-tennis-bracelet', 'Iced Out S925 Moissanite Tennis Bracelet — White Gold', 'bracelet', 'white_gold',
 '8" white gold plated S925 tennis bracelet. VVS moissanite. Rhodium finish.',
 'White gold plated S925 sterling silver tennis bracelet, 8 inches. Rhodium e-coating finish for brilliant shine. VVS moissanite, four-prong set, GRA certified. Double-locking custom box clasp. Lead, nickel, cadmium free.',
 'White Gold Moissanite Tennis Bracelet | S925 VVS GRA | Qureshi',
 'White gold plated S925 moissanite tennis bracelet, 8 inch. Rhodium finish, VVS clarity, GRA certified.',
 169.00, '/main.jpg', false, 8);

-- 4. Seed: Size-specific product entries for each color × size combo
-- We create additional products with the 'size' column populated for direct linking
-- Silver chains by size
INSERT INTO public.products (slug, name, type, color, size, short_description, description, seo_title, seo_description, base_price, image_url, is_featured, sort_order) VALUES
('silver-moissanite-tennis-chain-3mm', '5MM 18K White Gold Plated Moissanite Tennis Chain', 'necklace', 'white_gold', '5mm',
 'Bold 5mm white gold plated S925 tennis chain. VVS moissanite.',
 'Our boldest white gold tennis chain at 5mm width. Solid S925 sterling silver with rhodium e-coating. VVS moissanite, GRA certified.',
 '5MM White Gold Moissanite Tennis Chain | S925 VVS | Qureshi',
 '5mm bold white gold plated moissanite tennis chain. S925, VVS, GRA certified.',
 299.00, '/main.jpg', false, 20);

-- Note: The pricing engine already handles size multipliers, so the existing product pages
-- work for all sizes via the PDP selector. These additional seed entries enable direct
-- deep-linking to size-specific product pages for SEO and marketing.