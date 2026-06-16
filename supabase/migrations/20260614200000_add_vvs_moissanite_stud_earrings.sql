-- Adds VVS Moissanite 3-Prong Stud Earrings to the product catalog.
-- Images are stored in /public/3 Prong Moissanite Earrings/ (7 images, URL-encoded).
-- Sizes: 3mm, 4mm, 5mm, 6.5mm, 8mm — priced via multiplier on base_price $89.

INSERT INTO products (
  slug,
  name,
  type,
  color,
  size,
  length,
  short_description,
  description,
  seo_title,
  seo_description,
  seo_keywords,
  tags,
  base_price,
  image_url,
  is_featured,
  is_active,
  sort_order,
  admin_notes
) VALUES (
  'vvs-moissanite-stud-earrings',

  'VVS Moissanite Stud Earrings — D Color Round Brilliant Cut | S925 Sterling Silver',

  'earring',
  'silver',
  NULL,
  NULL,

  'D Colorless VVS moissanite round brilliant cut studs in solid S925 sterling silver. 18K white or yellow gold plating option. Screw-back closure. Hypoallergenic, lead-free, nickel-free. Sizes 3mm–8mm.',

  $$Timeless luxury meets everyday brilliance in our 3-Prong VVS Moissanite Stud Earrings.

Featuring D Colorless VVS moissanite stones in a precision round brilliant cut, each pair is set in solid S925 sterling silver and available in 18K white gold or 18K yellow gold plating. The threaded screw-back closure locks your earrings securely in place — ideal for active wear, travel, or any occasion where you can't afford to lose a stone.

Crafted to be hypoallergenic, lead-free, nickel-free, and cadmium-free, making them safe for even the most sensitive ears. GRA moissanite certificate included with every order.

Available in five sizes from a subtle 3mm to a bold 8mm showstopper — choose the look that matches your style.

• Stone: D Colorless VVS Moissanite
• Cut: Round Brilliant, 3-Prong Setting
• Base Metal: Solid S925 Sterling Silver
• Plating: 18K White Gold & Yellow Gold available
• Closure: Screw-Back (Threaded)
• Gender: Unisex — Men's & Women's
• Health: Hypoallergenic · Lead-Free · Nickel-Free · Cadmium-Free
• Occasions: Daily wear, Anniversary, Engagement, Wedding, Gifting
• Certificate: GRA included$$,

  'VVS Moissanite Stud Earrings | D Color Round Brilliant | Screw Back | Qureshi Jewelers',

  'D Colorless VVS moissanite stud earrings in S925 sterling silver. Round brilliant cut, 3-prong, screw-back closure. Hypoallergenic. 18K gold plated. Sizes 3mm–8mm. Free US shipping over $250.',

  'VVS moissanite stud earrings, D color moissanite earrings, lab diamond earrings, screw back earrings, sterling silver stud earrings, 18K gold moissanite earrings, hypoallergenic earrings, round brilliant earrings, moissanite jewelry men women',

  ARRAY[
    'moissanite', 'studs', 'vvs', 'd-color', 'round-brilliant',
    'screw-back', 'hypoallergenic', 'unisex', '3-prong',
    'lab-diamond', 'sterling-silver', '18k-gold', 'earrings'
  ],

  89,

  '/3%20Prong%20Moissanite%20Earrings/yellowgoldfirstimage.png',

  true,
  true,
  1,

  'Gallery (in order): 1. yellowgoldfirstimage.png, 2. silverandwhitegoldsecondimage.jpg, 3. thirdimage.jpg, 4. fourthimagee.jpg, 5. fifthimage.jpg, 6. sixthimage.jpg, 7. seventhimage.jpg. Folder: public/3 Prong Moissanite Earrings/'
)
ON CONFLICT (slug) DO UPDATE SET
  name             = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  description      = EXCLUDED.description,
  seo_title        = EXCLUDED.seo_title,
  seo_description  = EXCLUDED.seo_description,
  seo_keywords     = EXCLUDED.seo_keywords,
  tags             = EXCLUDED.tags,
  base_price       = EXCLUDED.base_price,
  image_url        = EXCLUDED.image_url,
  is_featured      = EXCLUDED.is_featured,
  is_active        = EXCLUDED.is_active,
  sort_order       = EXCLUDED.sort_order,
  admin_notes      = EXCLUDED.admin_notes,
  updated_at       = now();
