
-- Products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('necklace','bracelet')),
  color text NOT NULL CHECK (color IN ('silver','gold','rose_gold')),
  short_description text NOT NULL,
  description text NOT NULL,
  seo_title text NOT NULL,
  seo_description text NOT NULL,
  base_price numeric(10,2) NOT NULL,
  image_url text NOT NULL,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_public_read" ON public.products
  FOR SELECT USING (is_active = true);

-- Orders table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL DEFAULT ('QJ-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  shipping_address_line1 text NOT NULL,
  shipping_address_line2 text,
  shipping_city text NOT NULL,
  shipping_state text NOT NULL,
  shipping_zip text NOT NULL,
  shipping_country text NOT NULL DEFAULT 'United States',
  items jsonb NOT NULL,
  subtotal numeric(10,2) NOT NULL,
  shipping numeric(10,2) NOT NULL DEFAULT 0,
  tax numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Anyone can place an order (guest checkout)
CREATE POLICY "orders_public_insert" ON public.orders
  FOR INSERT WITH CHECK (true);

-- No public read on orders (admin only via service role)

-- Seed products
INSERT INTO public.products (slug, name, type, color, short_description, description, seo_title, seo_description, base_price, image_url, is_featured, sort_order) VALUES
('silver-moissanite-tennis-chain', 'Iced Out S925 Moissanite Tennis Chain — Silver', 'necklace', 'silver',
 'VVS moissanite tennis chain in solid 925 sterling silver. GRA certified.',
 'Our signature S925 sterling silver tennis chain, hand-set with VVS-clarity moissanite stones in a four-prong setting. Each stone delivers a diamond-equal brilliance verified by GRA certificate. Finished with our double-locking custom box clasp and 5x rhodium e-coating for lifetime shine. Available in 2mm, 3mm, 4mm and 5mm. Lengths: 18", 20", 24" or custom.',
 'S925 Moissanite Tennis Chain Silver | VVS GRA Certified | Qureshi Jewelers',
 'Shop the iced out S925 sterling silver moissanite tennis chain. VVS clarity, GRA certified, double-locking clasp. 2-5mm sizes. Free US shipping.',
  189.00, '/main.jpg', true, 1),

('gold-moissanite-tennis-chain', 'Iced Out S925 Moissanite Tennis Chain — Gold', 'necklace', 'gold',
 '18K gold plated S925 tennis chain with VVS moissanite. Five-layer plating.',
 'A warm 18K gold-plated finish over solid S925 sterling silver, layered five times with our proprietary e-coating to resist tarnish and color shift. VVS moissanite stones, four-prong set, GRA certified. Double-locking custom box clasp. Sizes 2-5mm. Lengths 18", 20", 24".',
 '18K Gold Tennis Chain Moissanite | S925 VVS Iced Out | Qureshi Jewelers',
 'Iced out 18K gold plated moissanite tennis chain in S925 sterling silver. VVS clarity GRA certified. 2-5mm widths, 18-24in lengths.',
  219.00, '/main.jpg', true, 2),

('rose-gold-moissanite-tennis-chain', 'Iced Out S925 Moissanite Tennis Chain — Rose Gold', 'necklace', 'rose_gold',
 'Rose gold plated S925 tennis chain. VVS moissanite. Tarnish resistant.',
 'A romantic rose gold-plated S925 sterling silver tennis chain. VVS moissanite, GRA certified, finished with 5x e-coating and a double-locking custom box clasp. Lead, nickel, and cadmium free. Sizes 2-5mm. Lengths 18", 20", 24".',
 'Rose Gold Moissanite Tennis Chain | S925 VVS GRA Certified | Qureshi',
 'Rose gold plated S925 moissanite tennis chain. VVS clarity, GRA certified, hypoallergenic. 2-5mm, 18-24in.',
  229.00, '/main.jpg', false, 3),

('silver-moissanite-tennis-bracelet', 'Iced Out S925 Moissanite Tennis Bracelet — Silver', 'bracelet', 'silver',
 '8" S925 sterling silver moissanite tennis bracelet. VVS GRA certified.',
 'The matching 8-inch tennis bracelet in solid S925 sterling silver, four-prong set with VVS moissanite. Double-locking custom box clasp ensures it stays on. GRA certificate included. Sizes 2mm, 3mm, 4mm, 5mm.',
 'S925 Moissanite Tennis Bracelet Silver | VVS GRA | Qureshi Jewelers',
 'Shop the S925 sterling silver moissanite tennis bracelet. 8 inch, VVS, GRA certified, double-locking clasp.',
  129.00, '/main.jpg', true, 4),

('gold-moissanite-tennis-bracelet', 'Iced Out S925 Moissanite Tennis Bracelet — Gold', 'bracelet', 'gold',
 '8" 18K gold plated tennis bracelet with VVS moissanite stones.',
 'The 8-inch tennis bracelet in 18K gold-plated S925, layered five times with e-coating for lasting shine. VVS moissanite, GRA certified, double-locking custom box clasp. 2-5mm sizes available.',
 '18K Gold Moissanite Tennis Bracelet | S925 VVS | Qureshi Jewelers',
 'Iced out 18K gold plated S925 moissanite tennis bracelet. VVS, GRA certified, tarnish resistant. 2-5mm.',
  159.00, '/main.jpg', false, 5),

('rose-gold-moissanite-tennis-bracelet', 'Iced Out S925 Moissanite Tennis Bracelet — Rose Gold', 'bracelet', 'rose_gold',
 '8" rose gold plated S925 tennis bracelet. VVS moissanite. Hypoallergenic.',
 'Rose gold plated S925 sterling silver tennis bracelet, 8 inches. VVS moissanite, four-prong set, GRA certified. 5x e-coating, double-locking custom box clasp. Lead, nickel, cadmium free.',
 'Rose Gold Moissanite Tennis Bracelet | S925 VVS GRA | Qureshi',
 'Rose gold plated S925 moissanite tennis bracelet, 8 inch. VVS clarity, GRA certified, hypoallergenic.',
  169.00, '/main.jpg', false, 6);
