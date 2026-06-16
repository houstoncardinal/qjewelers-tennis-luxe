-- =============================================================================
-- Qureshi Jewelers — Complete Database Bootstrap
-- Run this in the Supabase SQL Editor on a fresh project to initialize
-- all tables, policies, and seed the full 92-product catalog.
-- Project: bstyuyzlhrkskeqpypka
-- =============================================================================

-- ─── Drop existing tables (clean slate) ──────────────────────────────────────
DROP TABLE IF EXISTS public.store_settings CASCADE;
DROP TABLE IF EXISTS public.returns        CASCADE;
DROP TABLE IF EXISTS public.promo_codes    CASCADE;
DROP TABLE IF EXISTS public.orders         CASCADE;
DROP TABLE IF EXISTS public.products       CASCADE;

-- ─── Products ─────────────────────────────────────────────────────────────────
CREATE TABLE public.products (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text          UNIQUE NOT NULL,
  name              text          NOT NULL,
  type              text          NOT NULL CHECK (type IN ('necklace','bracelet','earring','ring')),
  color             text          NOT NULL CHECK (color IN ('silver','gold','rose_gold','white_gold')),
  size              text,
  length            text,
  short_description text          NOT NULL DEFAULT '',
  description       text          NOT NULL DEFAULT '',
  seo_title         text          NOT NULL DEFAULT '',
  seo_description   text          NOT NULL DEFAULT '',
  seo_keywords      text          NOT NULL DEFAULT '',
  tags              text[]        NOT NULL DEFAULT '{}',
  base_price        numeric(10,2) NOT NULL,
  sale_price        numeric(10,2),
  sale_active       boolean       NOT NULL DEFAULT false,
  image_url         text          NOT NULL DEFAULT '/main.jpg',
  is_featured       boolean       NOT NULL DEFAULT false,
  is_active         boolean       NOT NULL DEFAULT true,
  sort_order        integer       NOT NULL DEFAULT 0,
  admin_notes       text,
  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_public_read" ON public.products
  FOR SELECT USING (is_active = true);

-- ─── Orders ───────────────────────────────────────────────────────────────────
CREATE TABLE public.orders (
  id                     uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number           text          UNIQUE NOT NULL DEFAULT ('QJ-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  customer_name          text          NOT NULL,
  customer_email         text          NOT NULL,
  customer_phone         text,
  shipping_address_line1 text          NOT NULL,
  shipping_address_line2 text,
  shipping_city          text          NOT NULL,
  shipping_state         text          NOT NULL,
  shipping_zip           text          NOT NULL,
  shipping_country       text          NOT NULL DEFAULT 'United States',
  items                  jsonb         NOT NULL,
  subtotal               numeric(10,2) NOT NULL,
  shipping               numeric(10,2) NOT NULL DEFAULT 0,
  tax                    numeric(10,2) NOT NULL DEFAULT 0,
  total                  numeric(10,2) NOT NULL,
  notes                  text,
  status                 text          NOT NULL DEFAULT 'pending',
  tracking_number        text,
  tracking_carrier       text,
  admin_notes            text,
  promo_code             text,
  discount_amount        numeric(10,2) NOT NULL DEFAULT 0,
  created_at             timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_public_insert" ON public.orders
  FOR INSERT WITH CHECK (true);

-- ─── Promo Codes ──────────────────────────────────────────────────────────────
CREATE TABLE public.promo_codes (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text          UNIQUE NOT NULL,
  name             text          NOT NULL DEFAULT '',
  discount_type    text          NOT NULL DEFAULT 'percentage'
                                   CHECK (discount_type IN ('percentage','fixed')),
  discount_value   numeric(10,2) NOT NULL DEFAULT 0,
  min_order_amount numeric(10,2) NOT NULL DEFAULT 0,
  max_uses         integer,
  used_count       integer       NOT NULL DEFAULT 0,
  expires_at       timestamptz,
  active           boolean       NOT NULL DEFAULT true,
  created_at       timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- ─── Returns ──────────────────────────────────────────────────────────────────
CREATE TABLE public.returns (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number    text          NOT NULL,
  order_id        uuid,
  customer_name   text          NOT NULL DEFAULT '',
  customer_email  text          NOT NULL DEFAULT '',
  reason          text          NOT NULL DEFAULT '',
  items           jsonb         NOT NULL DEFAULT '[]',
  status          text          NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending','approved','rejected','refunded','shipped_back')),
  refund_amount   numeric(10,2),
  tracking_number text,
  admin_notes     text,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "returns_public_insert" ON public.returns
  FOR INSERT WITH CHECK (true);

-- ─── Store Settings ───────────────────────────────────────────────────────────
CREATE TABLE public.store_settings (
  key        text        PRIMARY KEY,
  value      text        NOT NULL DEFAULT '',
  label      text        NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.store_settings (key, value, label) VALUES
  ('free_shipping_threshold', '250',                         'Free Shipping Threshold ($)'),
  ('flat_shipping_rate',      '15',                          'Flat Shipping Rate ($)'),
  ('store_name',              'Qureshi Jewelers',            'Store Display Name'),
  ('support_email',           'support@qureshijewelers.com', 'Support Email');

-- =============================================================================
-- Seed: Full 92-product catalog
-- Generated by looping the same logic as src/lib/products.data.ts
-- =============================================================================

DO $MIGRATION$
DECLARE
  -- ── Color data ───────────────────────────────────────────────────────────
  c_key    text[]    := ARRAY['silver','gold','rose_gold','white_gold'];
  c_label  text[]    := ARRAY['S925 Sterling Silver','18K Yellow Gold','18K Rose Gold','18K White Gold'];
  c_short  text[]    := ARRAY['Sterling Silver','Yellow Gold','Rose Gold','White Gold'];
  c_plated text[]    := ARRAY[
    '5x rhodium e-coating over s925 sterling silver base',
    '5x 18k yellow gold plating with e-coating over s925 sterling silver base',
    '5x 18k rose gold plating with e-coating over s925 sterling silver base',
    '5x 18k white gold rhodium plating with e-coating over s925 sterling silver base'
  ];
  n_bp  numeric[] := ARRAY[189, 219, 229, 229];
  b_bp  numeric[] := ARRAY[129, 159, 169, 169];
  e_bp  numeric[] := ARRAY[89,  119, 129, 129];
  r_bp  numeric[] := ARRAY[399, 499, 549, 549];

  -- ── Necklace / bracelet sizes ─────────────────────────────────────────────
  s_key  text[]    := ARRAY['2mm','3mm','4mm','5mm','6.5mm'];
  s_mult numeric[] := ARRAY[1.0, 1.45, 1.95, 2.55, 3.45];

  -- ── Earring sizes ─────────────────────────────────────────────────────────
  es_key  text[]    := ARRAY['3mm','4mm','5mm','6.5mm'];
  es_mult numeric[] := ARRAY[1.0, 1.35, 1.85, 2.5];

  -- ── Ring stone sizes ──────────────────────────────────────────────────────
  rs_key     text[]    := ARRAY['0.5ct','1ct','1.5ct','2ct','3ct'];
  rs_slugkey text[]    := ARRAY['0-5ct','1ct','1-5ct','2ct','3ct'];
  rs_label   text[]    := ARRAY['0.5 Carat','1 Carat','1.5 Carat','2 Carat','3 Carat'];
  rs_mult    numeric[] := ARRAY[1.0, 2.0, 3.2, 4.8, 8.0];

  -- ── Bracelet images ───────────────────────────────────────────────────────
  b_size_img text[] := ARRAY['/2mmbracelet.jpg','/3mmbracelet.jpg','/4mmbracelet.jpg','/5mmbracelet.jpg','/65mmbracelet.jpg'];
  b_sig_img  text[] := ARRAY['/braceletsmultiple.jpg','/clasps.jpg','/braceletsvariety.png','/braceletslaidout.jpg'];

  -- ── Bracelet personality text (for description body) ─────────────────────
  b_personality text[] := ARRAY[
    'Delicate enough for everyday wear and built for stacking — a constant, refined glimmer on the wrist that never feels heavy or overwhelming.',
    'The everyday icon. Substantial enough to command attention, refined enough to wear anywhere. This is the width most of our customers reach for first.',
    'Bold and unmistakable. Four millimeters of continuous round brilliant-cut fire across the wrist — the definitive statement piece in our lineup.',
    'Maximum wrist presence. At 5mm, every stone is clearly visible from across the room. This bracelet does not go unnoticed.',
    'The full iced-out experience. Each individual stone at 6.5mm is enormous, and worn as a complete bracelet the effect is nothing short of breathtaking.'
  ];

  -- ── Bracelet taglines (for short_description) ────────────────────────────
  b_tagline text[] := ARRAY[
    'Delicate daily wear — effortless brilliance you never take off.',
    'The everyday icon — the width worn most, for good reason.',
    'Bold statement piece — four millimeters of continuous fire.',
    'Maximum wrist presence — every stone impossible to miss.',
    'The full iced-out experience — enormous stones, breathtaking effect.'
  ];

  ci      integer;
  si      integer;
  v_sort  integer := 1;
  v_slug  text;
  v_name  text;
  v_sdesc text;
  v_desc  text;
  v_seot  text;
  v_seod  text;
  v_price numeric;
  v_feat  boolean;
BEGIN

  -- ═══════════════════════════════════════════════════════════════════════════
  -- NECKLACES  (sort 1–24)
  -- ═══════════════════════════════════════════════════════════════════════════

  -- Sized necklaces (sort 1–20): outer=color, inner=size
  FOR ci IN 1..4 LOOP
    FOR si IN 1..5 LOOP
      v_slug  := s_key[si] || '-' || c_key[ci] || '-moissanite-tennis-chain';
      v_name  := s_key[si] || ' ' || c_label[ci] || ' Moissanite Tennis Chain';
      v_price := ROUND(n_bp[ci] * s_mult[si]);
      v_feat  := s_key[si] = '3mm' OR (s_key[si] = '4mm' AND c_key[ci] = 'silver');
      v_sdesc := s_key[si] || ' ' || c_short[ci] || ' moissanite tennis chain. S925 base with 5x plating and e-coating. VVS clarity, GRA certified.';
      v_desc  :=
        'Hand-set VVS moissanite tennis chain featuring genuine S925 sterling silver as the base metal, with premium ' ||
        c_plated[ci] ||
        ' applied in 5 layers and sealed with our proprietary e-coating for tarnish resistance, water resistance, and lifetime brilliance. Each stone is independently GRA certified at VVS clarity, D color.' ||
        chr(10) || chr(10) ||
        'Available in 2mm, 3mm, 4mm, 5mm, and 6.5mm widths. Necklace lengths: 16", 18", 20", 22", 24". Features a double-locking custom box clasp. Hypoallergenic, lead/nickel/cadmium free.' ||
        chr(10) || chr(10) ||
        'What makes this ' || s_key[si] || ' chain different:' || chr(10) ||
        '. S925 sterling silver core' || chr(10) ||
        '. 5x ' || c_short[ci] || ' plating with e-coating' || chr(10) ||
        '. VVS clarity, D color moissanite' || chr(10) ||
        '. GRA certificate of authenticity included' || chr(10) ||
        '. Double-locking clasp for security' || chr(10) ||
        '. Lifetime brilliance';
      v_seot  := s_key[si] || ' ' || c_short[ci] || ' Moissanite Tennis Chain | S925 VVS GRA Certified | Qureshi Jewelers';
      v_seod  := 'Shop the ' || s_key[si] || ' ' || c_short[ci] || ' moissanite tennis chain. S925 sterling silver base with 5x precious metal plating and e-coating. VVS clarity, GRA certified. Free US shipping over $250.';

      INSERT INTO public.products
        (slug, name, type, color, size, short_description, description, seo_title, seo_description, base_price, image_url, is_featured, sort_order)
      VALUES
        (v_slug, v_name, 'necklace', c_key[ci], s_key[si], v_sdesc, v_desc, v_seot, v_seod, v_price, '/main.jpg', v_feat, v_sort);
      v_sort := v_sort + 1;
    END LOOP;
  END LOOP;

  -- Signature necklaces (sort 21–24): one per color
  FOR ci IN 1..4 LOOP
    v_slug  := c_key[ci] || '-moissanite-tennis-chain';
    v_name  := c_label[ci] || ' Moissanite Tennis Chain';
    v_feat  := c_key[ci] IN ('silver','gold');
    v_sdesc := c_short[ci] || ' moissanite tennis chain. S925 base with 5x ' || c_short[ci] || ' plating + e-coating. 2mm-6.5mm. VVS GRA certified.';
    v_desc  :=
      'Hand-set VVS moissanite tennis chain featuring genuine S925 sterling silver as the base metal, with premium ' ||
      c_plated[ci] ||
      ' applied in 5 layers and sealed with our proprietary e-coating for tarnish resistance, water resistance, and lifetime brilliance. Each stone is independently GRA certified at VVS clarity, D color.' ||
      chr(10) || chr(10) ||
      'Available in 2mm, 3mm, 4mm, 5mm, and 6.5mm widths. Necklace lengths: 16", 18", 20", 22", 24". Features a double-locking custom box clasp. Hypoallergenic, lead/nickel/cadmium free.' ||
      chr(10) || chr(10) ||
      'What makes this signature chain different:' || chr(10) ||
      '. S925 sterling silver core' || chr(10) ||
      '. 5x ' || c_short[ci] || ' plating with e-coating' || chr(10) ||
      '. VVS clarity, D color moissanite' || chr(10) ||
      '. GRA certificate of authenticity included' || chr(10) ||
      '. Double-locking clasp for security' || chr(10) ||
      '. Lifetime brilliance';
    v_seot  := c_short[ci] || ' Moissanite Tennis Chain | S925 VVS GRA | Qureshi Jewelers';
    v_seod  := 'Shop the ' || c_short[ci] || ' moissanite tennis chain. S925 sterling silver base with 5x ' || c_short[ci] || ' plating and e-coating. VVS clarity, GRA certified. 2mm-6.5mm widths. Free US shipping.';

    INSERT INTO public.products
      (slug, name, type, color, size, short_description, description, seo_title, seo_description, base_price, image_url, is_featured, sort_order)
    VALUES
      (v_slug, v_name, 'necklace', c_key[ci], NULL, v_sdesc, v_desc, v_seot, v_seod, n_bp[ci], '/main.jpg', v_feat, v_sort);
    v_sort := v_sort + 1;
  END LOOP;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- BRACELETS  (sort 25–48)
  -- Each color: 5 sized + 1 signature = 6 per color
  -- ═══════════════════════════════════════════════════════════════════════════

  FOR ci IN 1..4 LOOP
    FOR si IN 1..5 LOOP
      v_slug  := s_key[si] || '-' || c_key[ci] || '-moissanite-tennis-bracelet';
      v_name  := s_key[si] || ' ' || c_label[ci] || ' Moissanite Tennis Bracelet';
      v_price := ROUND(b_bp[ci] * s_mult[si]);
      v_sdesc := s_key[si] || ' ' || c_short[ci] || ' VVS moissanite tennis bracelet. ' || b_tagline[si] || ' S925 sterling silver base, 5x ' || c_short[ci] || ' plating, e-coat sealed. GRA certified. Lengths 6"-9".';
      v_desc  :=
        'Hand-set VVS moissanite tennis bracelet on a genuine S925 sterling silver base, finished with premium ' ||
        c_plated[ci] ||
        ' applied in 5 layers and sealed with our proprietary e-coating for tarnish resistance and lasting brilliance.' ||
        chr(10) || chr(10) ||
        b_personality[si] ||
        chr(10) || chr(10) ||
        'Every stone is round brilliant-cut, independently GRA certified at VVS clarity and D color — the highest grades available in moissanite. Each bracelet is verified using a professional Selector II moissanite tester before it ships. Your GRA Moissanite Report arrives with your order.' ||
        chr(10) || chr(10) ||
        'The double-locking box clasp is machined to the same standard used in fine jewelry. Four lengths available: 6" (petite), 7" (standard), 8" (relaxed, most popular), and 9" (loose fit). Hypoallergenic — lead-free, nickel-free, cadmium-free.' ||
        chr(10) || chr(10) ||
        'What sets this bracelet apart:' || chr(10) ||
        '. Genuine S925 sterling silver core' || chr(10) ||
        '. 5x ' || c_short[ci] || ' plating with e-coat seal' || chr(10) ||
        '. VVS clarity, D color moissanite' || chr(10) ||
        '. Professional moissanite tester verified' || chr(10) ||
        '. GRA Moissanite Report included' || chr(10) ||
        '. Double-locking box clasp' || chr(10) ||
        '. Hypoallergenic: zero lead, nickel, or cadmium';
      v_seot  := s_key[si] || ' ' || c_short[ci] || ' VVS Moissanite Tennis Bracelet | GRA Certified | Double-Locking Clasp | Qureshi Jewelers';
      v_seod  := 'Shop the ' || s_key[si] || ' ' || c_short[ci] || ' VVS moissanite tennis bracelet. Genuine S925 sterling silver base, 5x ' || c_short[ci] || ' plating, e-coat sealed. GRA Moissanite Report included. Double-locking box clasp. Lengths 6"-9". Free US shipping over $250.';

      INSERT INTO public.products
        (slug, name, type, color, size, short_description, description, seo_title, seo_description, base_price, image_url, is_featured, sort_order)
      VALUES
        (v_slug, v_name, 'bracelet', c_key[ci], s_key[si], v_sdesc, v_desc, v_seot, v_seod, v_price, b_size_img[si], false, v_sort);
      v_sort := v_sort + 1;
    END LOOP;

    -- Bracelet signature
    v_slug  := c_key[ci] || '-moissanite-tennis-bracelet';
    v_name  := c_label[ci] || ' Moissanite Tennis Bracelet';
    v_sdesc := c_short[ci] || ' VVS moissanite tennis bracelet — 2mm to 6.5mm widths. S925 sterling silver base, 5x ' || c_short[ci] || ' plating, e-coat sealed. GRA certified. Lengths 6"-9".';
    v_desc  :=
      'Hand-set VVS moissanite tennis bracelet on a genuine S925 sterling silver base, finished with premium ' ||
      c_plated[ci] ||
      ' applied in 5 layers and sealed with our proprietary e-coating for tarnish resistance and lasting brilliance.' ||
      chr(10) || chr(10) ||
      'Available in five widths — 2mm (delicate), 3mm (everyday icon), 4mm (bold statement), 5mm (maximum presence), and 6.5mm (full iced-out) — each a completely different personality on the wrist.' ||
      chr(10) || chr(10) ||
      'Every stone is round brilliant-cut, independently GRA certified at VVS clarity and D color. Professional Selector II moissanite tester verified. GRA Moissanite Report included.' ||
      chr(10) || chr(10) ||
      'Four lengths: 6" (petite), 7" (standard), 8" (relaxed), 9" (loose). Hypoallergenic — lead-free, nickel-free, cadmium-free.' ||
      chr(10) || chr(10) ||
      'What sets this bracelet apart:' || chr(10) ||
      '. Genuine S925 sterling silver core' || chr(10) ||
      '. 5x ' || c_short[ci] || ' plating with e-coat seal' || chr(10) ||
      '. VVS clarity, D color moissanite' || chr(10) ||
      '. GRA Moissanite Report included' || chr(10) ||
      '. Double-locking box clasp' || chr(10) ||
      '. Hypoallergenic: zero lead, nickel, or cadmium';
    v_seot  := c_short[ci] || ' VVS Moissanite Tennis Bracelet | 2mm-6.5mm | GRA Certified | Qureshi Jewelers';
    v_seod  := 'Shop the ' || c_short[ci] || ' moissanite tennis bracelet collection. Genuine S925 sterling silver base, 5x ' || c_short[ci] || ' plating, e-coat sealed. VVS clarity, D color — GRA Moissanite Report included. Widths 2mm-6.5mm, lengths 6"-9". Free US shipping over $250.';

    INSERT INTO public.products
      (slug, name, type, color, size, short_description, description, seo_title, seo_description, base_price, image_url, is_featured, sort_order)
    VALUES
      (v_slug, v_name, 'bracelet', c_key[ci], NULL, v_sdesc, v_desc, v_seot, v_seod, b_bp[ci], b_sig_img[ci], false, v_sort);
    v_sort := v_sort + 1;
  END LOOP;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- EARRINGS  (sort 49–68)
  -- Each color: 4 sized + 1 signature = 5 per color
  -- ═══════════════════════════════════════════════════════════════════════════

  FOR ci IN 1..4 LOOP
    FOR si IN 1..4 LOOP
      v_slug  := es_key[si] || '-' || c_key[ci] || '-moissanite-stud-earrings';
      v_name  := es_key[si] || ' ' || c_label[ci] || ' Moissanite Stud Earrings';
      v_price := ROUND(e_bp[ci] * es_mult[si]);
      v_feat  := es_key[si] = '4mm' OR (es_key[si] = '6.5mm' AND c_key[ci] = 'silver');
      v_sdesc := es_key[si] || ' ' || c_short[ci] || ' moissanite stud earrings. S925 base with 5x plating and e-coating. VVS GRA certified. Sold as a pair.';
      v_desc  :=
        'Hand-set VVS moissanite stud earrings featuring genuine S925 sterling silver as the base metal, with premium ' ||
        c_plated[ci] ||
        ' applied in 5 layers and sealed with our proprietary e-coating for tarnish resistance and lasting brilliance. Each stone is independently GRA certified at VVS clarity, D color.' ||
        chr(10) || chr(10) ||
        'Available in 3mm, 4mm, 5mm, and 6.5mm sizes. Features push-back posts with secure friction backing. Hypoallergenic, lead/nickel/cadmium free. Sold as a pair.' ||
        chr(10) || chr(10) ||
        'What makes these ' || es_key[si] || ' stud earrings different:' || chr(10) ||
        '. S925 sterling silver core' || chr(10) ||
        '. 5x ' || c_short[ci] || ' plating with e-coating' || chr(10) ||
        '. VVS clarity, D color moissanite' || chr(10) ||
        '. GRA certificate included' || chr(10) ||
        '. Secure push-back posts' || chr(10) ||
        '. Lifetime brilliance';
      v_seot  := es_key[si] || ' ' || c_short[ci] || ' Moissanite Stud Earrings | S925 VVS GRA Certified | Qureshi Jewelers';
      v_seod  := 'Shop the ' || es_key[si] || ' ' || c_short[ci] || ' moissanite stud earrings. S925 sterling silver base with 5x precious metal plating and e-coating. VVS clarity, GRA certified. Free US shipping over $250.';

      INSERT INTO public.products
        (slug, name, type, color, size, short_description, description, seo_title, seo_description, base_price, image_url, is_featured, sort_order)
      VALUES
        (v_slug, v_name, 'earring', c_key[ci], es_key[si], v_sdesc, v_desc, v_seot, v_seod, v_price, '/main.jpg', v_feat, v_sort);
      v_sort := v_sort + 1;
    END LOOP;

    -- Earring signature
    v_slug  := c_key[ci] || '-moissanite-stud-earrings';
    v_name  := c_label[ci] || ' Moissanite Stud Earrings';
    v_sdesc := c_short[ci] || ' moissanite stud earrings. S925 base with 5x ' || c_short[ci] || ' plating + e-coating. 3mm-6.5mm. VVS GRA certified.';
    v_desc  :=
      'Hand-set VVS moissanite stud earrings featuring genuine S925 sterling silver as the base metal, with premium ' ||
      c_plated[ci] ||
      ' applied in 5 layers and sealed with our proprietary e-coating for tarnish resistance and lasting brilliance. Each stone is independently GRA certified at VVS clarity, D color.' ||
      chr(10) || chr(10) ||
      'Available in 3mm, 4mm, 5mm, and 6.5mm sizes. Features push-back posts with secure friction backing. Hypoallergenic, lead/nickel/cadmium free. Sold as a pair.' ||
      chr(10) || chr(10) ||
      'What makes these signature stud earrings different:' || chr(10) ||
      '. S925 sterling silver core' || chr(10) ||
      '. 5x ' || c_short[ci] || ' plating with e-coating' || chr(10) ||
      '. VVS clarity, D color moissanite' || chr(10) ||
      '. GRA certificate included' || chr(10) ||
      '. Secure push-back posts' || chr(10) ||
      '. Lifetime brilliance';
    v_seot  := c_short[ci] || ' Moissanite Stud Earrings | S925 VVS GRA | Qureshi Jewelers';
    v_seod  := 'Shop the ' || c_short[ci] || ' moissanite stud earrings. S925 sterling silver base with 5x ' || c_short[ci] || ' plating and e-coating. VVS clarity, GRA certified. 3mm-6.5mm sizes. Free US shipping.';

    INSERT INTO public.products
      (slug, name, type, color, size, short_description, description, seo_title, seo_description, base_price, image_url, is_featured, sort_order)
    VALUES
      (v_slug, v_name, 'earring', c_key[ci], NULL, v_sdesc, v_desc, v_seot, v_seod, e_bp[ci], '/main.jpg', false, v_sort);
    v_sort := v_sort + 1;
  END LOOP;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- RINGS  (sort 69–92)
  -- Each color: 5 stone sizes + 1 signature = 6 per color
  -- ═══════════════════════════════════════════════════════════════════════════

  FOR ci IN 1..4 LOOP
    FOR si IN 1..5 LOOP
      v_slug  := rs_slugkey[si] || '-' || c_key[ci] || '-solitaire-moissanite-ring';
      v_name  := rs_label[si] || ' ' || c_label[ci] || ' Solitaire Moissanite Ring';
      v_price := ROUND(r_bp[ci] * rs_mult[si]);
      v_feat  := rs_key[si] = '1ct' AND c_key[ci] IN ('silver','gold');
      v_sdesc := rs_label[si] || ' ' || c_short[ci] || ' solitaire moissanite ring. S925 base with 5x plating and e-coating. VVS clarity, GRA certified. US sizes 4-12.';
      v_desc  :=
        'Classic 4-prong solitaire engagement ring featuring a hand-set VVS moissanite center stone, set in genuine S925 sterling silver with premium ' ||
        c_plated[ci] ||
        ' applied in 5 layers and sealed with our proprietary e-coating. Each stone is independently GRA certified at VVS clarity, D color.' ||
        chr(10) || chr(10) ||
        'Available in 0.5ct, 1ct, 1.5ct, 2ct, and 3ct center stone sizes. Band width: 2mm. All rings are available in US sizes 4-12 — please specify your ring size in the order notes at checkout.' ||
        chr(10) || chr(10) ||
        'What makes this ' || rs_label[si] || ' solitaire different:' || chr(10) ||
        '. S925 sterling silver core' || chr(10) ||
        '. 5x ' || c_short[ci] || ' plating with e-coating' || chr(10) ||
        '. VVS clarity, D color moissanite center stone' || chr(10) ||
        '. GRA certificate of authenticity included' || chr(10) ||
        '. Classic 4-prong solitaire setting' || chr(10) ||
        '. Available in US ring sizes 4-12';
      v_seot  := rs_label[si] || ' ' || c_short[ci] || ' Solitaire Moissanite Engagement Ring | S925 VVS GRA | Qureshi Jewelers';
      v_seod  := 'Shop the ' || rs_label[si] || ' ' || c_short[ci] || ' solitaire moissanite engagement ring. S925 sterling silver base with 5x precious metal plating and e-coating. VVS clarity, GRA certified. US sizes 4-12. Free US shipping over $250.';

      INSERT INTO public.products
        (slug, name, type, color, size, short_description, description, seo_title, seo_description, base_price, image_url, is_featured, sort_order)
      VALUES
        (v_slug, v_name, 'ring', c_key[ci], rs_key[si], v_sdesc, v_desc, v_seot, v_seod, v_price, '/main.jpg', v_feat, v_sort);
      v_sort := v_sort + 1;
    END LOOP;

    -- Ring signature
    v_slug  := c_key[ci] || '-solitaire-moissanite-ring';
    v_name  := c_label[ci] || ' Solitaire Moissanite Ring';
    v_sdesc := c_short[ci] || ' solitaire moissanite ring. S925 base with 5x ' || c_short[ci] || ' plating + e-coating. 0.5ct-3ct center stones. VVS GRA certified.';
    v_desc  :=
      'Classic 4-prong solitaire engagement ring featuring a hand-set VVS moissanite center stone, set in genuine S925 sterling silver with premium ' ||
      c_plated[ci] ||
      ' applied in 5 layers and sealed with our proprietary e-coating. Each stone is independently GRA certified at VVS clarity, D color.' ||
      chr(10) || chr(10) ||
      'Available in 0.5ct, 1ct, 1.5ct, 2ct, and 3ct center stone sizes. Band width: 2mm. All rings are available in US sizes 4-12 — please specify your ring size in the order notes at checkout.' ||
      chr(10) || chr(10) ||
      'What makes this signature solitaire different:' || chr(10) ||
      '. S925 sterling silver core' || chr(10) ||
      '. 5x ' || c_short[ci] || ' plating with e-coating' || chr(10) ||
      '. VVS clarity, D color moissanite center stone' || chr(10) ||
      '. GRA certificate of authenticity included' || chr(10) ||
      '. Classic 4-prong solitaire setting' || chr(10) ||
      '. Available in US ring sizes 4-12';
    v_seot  := c_short[ci] || ' Solitaire Moissanite Engagement Ring | S925 VVS GRA | Qureshi Jewelers';
    v_seod  := 'Shop the ' || c_short[ci] || ' solitaire moissanite engagement ring. S925 sterling silver base with 5x ' || c_short[ci] || ' plating and e-coating. VVS clarity, GRA certified. 0.5ct-3ct sizes. Free US shipping.';

    INSERT INTO public.products
      (slug, name, type, color, size, short_description, description, seo_title, seo_description, base_price, image_url, is_featured, sort_order)
    VALUES
      (v_slug, v_name, 'ring', c_key[ci], NULL, v_sdesc, v_desc, v_seot, v_seod, r_bp[ci], '/main.jpg', false, v_sort);
    v_sort := v_sort + 1;
  END LOOP;

END;
$MIGRATION$;

-- ─── Verify row count ─────────────────────────────────────────────────────────
SELECT
  type,
  COUNT(*) AS count
FROM public.products
GROUP BY type
ORDER BY type;
-- Expected: bracelet=24, earring=20, necklace=24, ring=24 → total 92
