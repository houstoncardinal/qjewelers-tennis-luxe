-- Adds the unified VVS1 Moissanite Tennis Bracelet product.
-- Single listing with size (2–6mm) + length (6"–9") + metal (yellow/white gold) selectors.
-- base_price = 99 (3mm at 8" — the most popular configuration, shown on listing cards).

INSERT INTO products (
  slug, name, type, color, size, length,
  short_description, description,
  seo_title, seo_description, seo_keywords,
  base_price, image_url,
  is_featured, is_active, sort_order,
  tags
) VALUES (
  'vvs-moissanite-tennis-bracelet',

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

  'VVS1 Moissanite Tennis Bracelet | 5× 18K Gold Plated | S925 | Qureshi Jewelers',

  'D Colorless VVS1 moissanite tennis bracelet. Solid S925 sterling silver, 5× 18K yellow or white gold plated. 4-prong claw setting, double-locking box clasp. Hypoallergenic. Widths 2mm–6mm, lengths 6"–9". GRA certified.',

  'VVS1 moissanite tennis bracelet, D color tennis bracelet, 18K gold tennis bracelet, lab diamond tennis bracelet, sterling silver tennis bracelet, 4-prong moissanite bracelet, hypoallergenic bracelet, unisex tennis bracelet',

  99,

  '/TennisBracelet/yellowgoldmain.jpg',

  true,
  true,
  2,

  ARRAY[
    'tennis-bracelet', 'moissanite', 'vvs1', 'd-color', 'round-brilliant',
    '4-prong', 'hypoallergenic', 'unisex', 'double-locking-clasp',
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
