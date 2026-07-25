-- Factory cost: $88.18 per unit/pair as supplied by the merchant.
-- $309 / $88.18 = 3.5042x, preserving the requested minimum 3.5x multiple.
-- This migration is intentionally safe to run whether or not the broader
-- catalog-pricing repair migration has already been applied.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS supplier_unit_cost numeric(10,2),
  ADD COLUMN IF NOT EXISTS pricing_multiplier numeric(8,4);

UPDATE products
SET base_price = 309.00,
    supplier_unit_cost = 88.18,
    pricing_multiplier = 3.5042,
    color = 'gold,white_gold',
    size = 'Ring Size 7, Ring Size 8, Ring Size 9, Ring Size 10, Ring Size 11',
    updated_at = now()
WHERE slug = 'mens-vvs-moissanite-band-ring-8mm-sterling-silver-gold-plated';

-- The factory does not offer sizes 5 or 6 for this listing.
DELETE FROM product_variants
WHERE product_slug = 'mens-vvs-moissanite-band-ring-8mm-sterling-silver-gold-plated'
  AND size NOT IN ('Ring Size 7','Ring Size 8','Ring Size 9','Ring Size 10','Ring Size 11');

UPDATE product_variants
SET price_override = 309.00,
    updated_at = now()
WHERE product_slug = 'mens-vvs-moissanite-band-ring-8mm-sterling-silver-gold-plated'
  AND color IN ('gold','white_gold')
  AND size IN ('Ring Size 7','Ring Size 8','Ring Size 9','Ring Size 10','Ring Size 11');

DO $$
DECLARE
  priced_variants integer;
BEGIN
  SELECT COUNT(*) INTO priced_variants
  FROM product_variants
  WHERE product_slug = 'mens-vvs-moissanite-band-ring-8mm-sterling-silver-gold-plated'
    AND is_active = true
    AND price_override = 309.00
    AND color IN ('gold','white_gold')
    AND size IN ('Ring Size 7','Ring Size 8','Ring Size 9','Ring Size 10','Ring Size 11');

  IF priced_variants <> 10 THEN
    RAISE EXCEPTION 'Expected 10 active mens ring variants at $309, found %', priced_variants;
  END IF;
END $$;

