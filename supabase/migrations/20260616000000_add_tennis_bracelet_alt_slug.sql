-- Adds the alternative tennis bracelet product with the descriptive slug.
-- This is the same unified VVS1 Moissanite Tennis Bracelet but with a
-- human-readable slug that includes key features for SEO.

INSERT INTO products (
  slug, name, type, color, size, length,
  short_description, description,
  seo_title, seo_description, seo_keywords,
  base_price, image_url,
  is_featured, is_active, sort_order,
  tags
) VALUES (
  'vvs1-d-moissanite-tennis-bracelet-4-prong-setting-with-double-lock-clasp',

  'VVS1 D Moissanite Tennis Bracelet | 18K Gold Plated | S925 Sterling Silver',

  'bracelet',
  'gold',
  NULL,
  NULL,

  'D Colorless VVS1 moissanite tennis bracelet on a solid S925 sterling silver base, 5× 18K yellow or white gold plated. 4-prong claw inlay setting, double-locking box clasp. Hypoallergenic & GRA certified. Widths 2mm–6mm, lengths 6"–9".',

  $$Pure ice. Every stone. Both wrists.

Our VVS1 Moissanite Tennis Bracelet is built for the wrist that demands nothing less than the finest. Each stone is a D Colorless VVS1 moissanite in a precision round brilliant cut — the highest clarity and color grade available — held in a 4-prong claw inlay setting that maximises stone exposure and light return.

The base is solid S925 sterling silver, electroplated 5× in 18K gold. Choose 18K Yellow Gold for a warm, classic lustre or 18K White Gold for a clean, icy look. Five layers of plating — not the 1–2 coats of typical fashion jewellery — means lasting colour retention and durability.

A double-locking box clasp keeps the bracelet locked securely on the wrist during daily wear, travel, and sport.

• Stone: VVS1 Moissanite · D Colorless · Round Brilliant Cut
• Setting: 4-Prong Claw Inlay (maximises stone exposure)
• Base Metal: Solid S925 Sterling Silver (92.5% purity)
• Plating: 5× 18K Yellow Gold or 5× 18K White Gold
• Clasp: Double-Locking Box Clasp — secure, no spring hinge
• Widths: 2mm · 3mm · 4mm · 5mm · 6mm
• Lengths: 6" · 6.5" · 7" · 7.5" · 8" · 8.5" · 9"
• Gender: Unisex — Men & Women
• Health: Hypoallergenic · Nickel-Free · Lead-Free · Cadmium-Free
• Certificate: GRA Moissanite Certificate included with every order$$,

  'VVS1 D Moissanite Tennis Bracelet 4-Prong Setting Double-Lock Clasp | Qureshi Jewelers',

  'D Colorless VVS1 moissanite tennis bracelet with 4-prong claw setting and double-locking box clasp. Solid S925 sterling silver, 5× 18K gold plated. Widths 2mm–6mm, lengths 6"–9". GRA certified.',

  'VVS1 moissanite tennis bracelet, 4-prong setting tennis bracelet, double-lock clasp bracelet, D color tennis bracelet, 18K gold tennis bracelet, lab diamond tennis bracelet, sterling silver tennis bracelet, hypoallergenic bracelet, unisex tennis bracelet, 4-prong moissanite bracelet',

  99,

  '/TennisBracelet/whitegoldmain.jpg',

  true,
  true,
  3,

  ARRAY[
    'tennis-bracelet', 'moissanite', 'vvs1', 'd-color', 'round-brilliant',
    '4-prong', 'double-lock-clasp', 'hypoallergenic', 'unisex', 'double-locking-clasp',
    'lab-diamond', 'sterling-silver', '18k-gold', '5x-plated', 'bracelet'
  ]
)
ON CONFLICT (slug) DO UPDATE SET
  name              = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  description       = EXCLUDED.description,
  seo_title         = EXCLUDED.seo_title,
  seo_description   = EXCLUDED.seo_description,
  seo_keywords      = EXCLUDED.seo_keywords,
  base_price        = EXCLUDED.base_price,
  image_url         = EXCLUDED.image_url,
  is_featured       = EXCLUDED.is_featured,
  is_active         = EXCLUDED.is_active,
  tags              = EXCLUDED.tags,
  updated_at        = now();

-- Seed gallery images for this tennis bracelet product
INSERT INTO public.product_images (product_slug, url, alt_text, sort_order, is_primary) VALUES
  ('vvs1-d-moissanite-tennis-bracelet-4-prong-setting-with-double-lock-clasp', '/TennisBracelet/yellowgoldmain.jpg',   'VVS1 Moissanite Tennis Bracelet — 18K Yellow Gold',       0, false),
  ('vvs1-d-moissanite-tennis-bracelet-4-prong-setting-with-double-lock-clasp', '/TennisBracelet/whitegoldmain.jpg',   'VVS1 Moissanite Tennis Bracelet — 18K White Gold',        1, true),
  ('vvs1-d-moissanite-tennis-bracelet-4-prong-setting-with-double-lock-clasp', '/TennisBracelet/2mmbracelet.jpg',     '2mm Width — Slim and Elegant',                             2, false),
  ('vvs1-d-moissanite-tennis-bracelet-4-prong-setting-with-double-lock-clasp', '/TennisBracelet/3mmbracelet.jpg',     '3mm Width — Classic Everyday',                             3, false),
  ('vvs1-d-moissanite-tennis-bracelet-4-prong-setting-with-double-lock-clasp', '/TennisBracelet/4mmbracelet.jpg',     '4mm Width — Bold Statement',                               4, false),
  ('vvs1-d-moissanite-tennis-bracelet-4-prong-setting-with-double-lock-clasp', '/TennisBracelet/5mmbracelet.jpg',     '5mm Width — Maximum Ice',                                  5, false),
  ('vvs1-d-moissanite-tennis-bracelet-4-prong-setting-with-double-lock-clasp', '/TennisBracelet/65mmbracelet.jpg',    '6.5mm Width — Ultra Bold',                                 6, false),
  ('vvs1-d-moissanite-tennis-bracelet-4-prong-setting-with-double-lock-clasp', '/TennisBracelet/braceletslaidout.jpg','Tennis Bracelets Flat Lay — All Widths and Metals',        7, false),
  ('vvs1-d-moissanite-tennis-bracelet-4-prong-setting-with-double-lock-clasp', '/TennisBracelet/braceletsmultiple.jpg','Multiple Tennis Bracelets Stacked on Wrist',               8, false),
  ('vvs1-d-moissanite-tennis-bracelet-4-prong-setting-with-double-lock-clasp', '/TennisBracelet/braceletsadditional.jpg','Tennis Bracelet Natural Light — Moissanite Fire',          9, false),
  ('vvs1-d-moissanite-tennis-bracelet-4-prong-setting-with-double-lock-clasp', '/TennisBracelet/clasps.jpg',          'Double-Locking Box Clasp — Extreme Close-Up',              10, false),
  ('vvs1-d-moissanite-tennis-bracelet-4-prong-setting-with-double-lock-clasp', '/TennisBracelet/braceletsvariety.png','Tennis Bracelet Variety Grid — All Widths and Metals',     11, false)
ON CONFLICT DO NOTHING;