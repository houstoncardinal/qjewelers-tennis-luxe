-- Corrects VVS Moissanite Stud Earrings:
--   base_price 89 → 59  (so 3mm=$59 through 8mm=$159 at ~5× cost)
--   color 'silver' → 'gold' (default listing shows yellow gold hero image)
--   name / descriptions updated: VVS1, 3-prong, 5× plating, sizes 3mm/4mm/5mm/6mm/8mm

UPDATE products SET
  name              = 'VVS1 Moissanite 3-Prong Stud Earrings | D Colorless Round Brilliant | S925 Sterling Silver 5× 18K Gold Plated',
  color             = 'gold',
  base_price        = 59,

  short_description = 'D Colorless VVS1 moissanite round brilliant cut studs. Solid S925 sterling silver base, 5× 18K white or yellow gold plated. Threaded screw-back closure. Hypoallergenic. GRA certified. Sizes 3mm–8mm.',

  description       = $$Pure brilliance. No compromises.

Our 3-Prong VVS1 Moissanite Stud Earrings feature D Colorless stones — the highest clarity and color grades available — in a precision round brilliant cut that outshines diamond in fire and brilliance.

Each pair is built on a solid S925 sterling silver base and electroplated 5× in 18K gold (choose white gold or yellow gold). Five layers of plating means exceptional durability and colour retention — far beyond the 1–2× coating on typical fashion jewellery.

The threaded screw-back closure keeps every stone locked securely in place, making these ideal for travel, sports, and daily wear.

• Stone: VVS1 Moissanite · D Colorless · Round Brilliant Cut
• Setting: 3-Prong (maximises stone exposure and light return)
• Base Metal: Solid S925 Sterling Silver
• Plating: 5× 18K Yellow Gold or 5× 18K White Gold
• Closure: Screw-Back (Threaded) — secure, no spring hinge
• Sizes: 3mm · 4mm · 5mm · 6mm · 8mm
• Gender: Unisex — Men & Women
• Health: Hypoallergenic · Lead-Free · Nickel-Free · Cadmium-Free
• Certificate: GRA Moissanite Certificate included with every order$$,

  seo_title         = 'VVS1 Moissanite 3-Prong Stud Earrings | D Color | 5× 18K Gold Plated | Qureshi Jewelers',

  seo_description   = 'D Colorless VVS1 moissanite stud earrings on S925 sterling silver, 5× 18K gold plated. 3-prong round brilliant, screw-back closure. Hypoallergenic. Sizes 3mm–8mm. Free US shipping over $250.',

  seo_keywords      = 'VVS1 moissanite stud earrings, D color moissanite earrings, 3-prong moissanite studs, screw back earrings, 18K gold moissanite earrings, lab diamond earrings men, sterling silver stud earrings, hypoallergenic stud earrings',

  tags              = ARRAY[
    'moissanite', 'studs', 'vvs1', 'd-color', 'round-brilliant',
    'screw-back', 'hypoallergenic', 'unisex', '3-prong',
    'lab-diamond', 'sterling-silver', '18k-gold', 'earrings', '5x-plated'
  ],

  updated_at        = now()

WHERE slug = 'vvs-moissanite-stud-earrings';
