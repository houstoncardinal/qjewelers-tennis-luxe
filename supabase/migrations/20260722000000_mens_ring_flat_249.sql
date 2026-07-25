-- Flat $249 price for the mens VVS moissanite band ring, regardless of color
-- or ring size. Supersedes the earlier $309 / 3.5x-margin pricing
-- (20260718030000_mens_ring_margin_pricing.sql) — same supplier cost
-- ($88.18/unit), new markup (~2.82x). Data already applied live via the
-- service-role client on 2026-07-22; this migration exists so the change is
-- reproducible from a fresh database and isn't lost if it's ever rebuilt.

UPDATE products
SET base_price = 249.00,
    pricing_multiplier = 2.8238,
    updated_at = now()
WHERE slug = 'mens-vvs-moissanite-band-ring-8mm-sterling-silver-gold-plated';

UPDATE product_variants
SET price_override = 249.00,
    updated_at = now()
WHERE product_slug = 'mens-vvs-moissanite-band-ring-8mm-sterling-silver-gold-plated';

DO $$
DECLARE
  priced_variants integer;
BEGIN
  SELECT COUNT(*) INTO priced_variants
  FROM product_variants
  WHERE product_slug = 'mens-vvs-moissanite-band-ring-8mm-sterling-silver-gold-plated'
    AND is_active = true
    AND price_override = 249.00;

  IF priced_variants <> 10 THEN
    RAISE EXCEPTION 'Expected 10 active mens ring variants at $249, found %', priced_variants;
  END IF;
END $$;
