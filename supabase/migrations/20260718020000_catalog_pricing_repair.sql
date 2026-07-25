-- Normalize the live catalog so every selectable combination is one row with
-- an explicit retail price. Product.base_price becomes the lowest price a
-- customer can actually purchase, which keeps cards, feeds and checkout honest.

DO $$
DECLARE
  bracelet_slug constant text := 'vvs1-d-moissanite-tennis-bracelet-4-prong-setting-with-double-lock-clasp';
  chain_slug constant text := 'vvs1-d-moissanite-tennis-chain-in-18k-yellow-gold-s925-sterling-silver-base-gra-certified';
BEGIN
  -- Remove aggregate/import rows. Exact rows already exist for all 60 chain
  -- combinations, so no customer option or inventory is lost.
  DELETE FROM product_variants
  WHERE product_slug = chain_slug
    AND (color LIKE '%,%' OR size LIKE '%,%' OR length LIKE '%,%');

  -- 6.5mm/8mm and the color-only $600 bracelet row were accidental imports.
  -- The supported retail grid is 2/3/4/5/6mm x 6--9 inches x two metals.
  DELETE FROM product_variants
  WHERE product_slug = bracelet_slug
    AND (size IS NULL OR length IS NULL OR size NOT IN ('2mm','3mm','4mm','5mm','6mm'));
END $$;

-- Correct customer-facing option metadata.
UPDATE products SET
  length = '18", 20", 24"',
  base_price = 800
WHERE slug = 'miami-cuban-link-chain-necklace-6mm-moissanite-sterling-silver';

UPDATE products SET
  color = 'gold,white_gold',
  size = '2mm, 3mm, 4mm, 5mm',
  base_price = 100
WHERE slug = 'vvs1-moissanite-hoop-earrings-925-sterling-silver-base-18k-white-gold-or-18k-yellow-gold-plated';

UPDATE products SET size = 'Ring Size 7', base_price = 299
WHERE slug = 'classic-solitaire-engagement-ring-12-carat-moissanite-sterling-silver';

UPDATE products SET size = '5mm, 6mm, 6.5mm, 8mm', base_price = 65
WHERE slug = 'exquisite-vvs1-black-moissanite-solitaire-stud-earrings-in-18k-white-gold-plated-s925-sterling-silver';

UPDATE products SET color = 'gold,silver,white_gold', size = '2mm, 3mm, 4mm, 5mm', base_price = 80
WHERE slug = 'vvs1-d-moissanite-stud-earrings-18k-gold-plated-s925-sterling-silver-base';

UPDATE products SET base_price = 199
WHERE slug = '1ct-to-5ct-moissanite-pendant-necklace-in-18k-gold-plated-s925-sterling-silver';

UPDATE products SET base_price = 300, size = 'Ring Size 7'
WHERE slug = 'moissanite-solitaire-ring-18k-gold';

UPDATE products SET base_price = 149
WHERE slug = 'vvs1-moissanite-teardrop-pendant-necklace-18k-gold-plated-s925-sterling-silver-gra-certified';

UPDATE products SET base_price = 299
WHERE slug = '1ct-2ct-oval-moissanite-ring-in-18k-gold-plated-s925-sterling-silver';

UPDATE products SET base_price = 309, size = 'Ring Size 7, Ring Size 8, Ring Size 9, Ring Size 10, Ring Size 11'
WHERE slug = 'mens-vvs-moissanite-band-ring-8mm-sterling-silver-gold-plated';

UPDATE products SET base_price = 120
WHERE slug = 'vvs1-emerald-cut-moissanite-stud-earrings-in-18k-gold-plated-sterling-silver';

UPDATE products SET base_price = 107.50, size = '2mm, 3mm, 4mm, 5mm, 6mm'
WHERE slug = 'vvs1-d-moissanite-tennis-bracelet-4-prong-setting-with-double-lock-clasp';

UPDATE products SET base_price = 425
WHERE slug = 'vvs1-d-moissanite-tennis-chain-in-18k-yellow-gold-s925-sterling-silver-base-gra-certified';

-- Use physical ring sizes in variants. Stone weight remains product content,
-- never overloaded into the fulfillment size field.
UPDATE product_variants SET size = 'Ring Size 7'
WHERE product_slug = 'moissanite-solitaire-ring-18k-gold' AND size = '1ct';

-- Expand color-only stud variants into exact color x stone-size combinations.
WITH deleted AS (
  DELETE FROM product_variants
  WHERE product_slug = 'vvs1-d-moissanite-stud-earrings-18k-gold-plated-s925-sterling-silver-base'
  RETURNING color, stock, is_active, weight_grams
), source AS (
  SELECT DISTINCT color, stock, is_active, weight_grams FROM deleted
), sizes(size, retail_price) AS (
  VALUES ('2mm',80::numeric),('3mm',80),('4mm',94),('5mm',107)
)
INSERT INTO product_variants (product_slug, color, size, length, price_override, stock, is_active, weight_grams)
SELECT 'vvs1-d-moissanite-stud-earrings-18k-gold-plated-s925-sterling-silver-base',
       source.color, sizes.size, NULL, sizes.retail_price, source.stock, source.is_active, source.weight_grams
FROM source CROSS JOIN sizes;

-- Expand the broad pendant color rows into exact color x carat combinations.
WITH deleted AS (
  DELETE FROM product_variants
  WHERE product_slug = '1ct-to-5ct-moissanite-pendant-necklace-in-18k-gold-plated-s925-sterling-silver'
  RETURNING color, stock, is_active, weight_grams
), source AS (
  SELECT DISTINCT color, stock, is_active, weight_grams FROM deleted
), sizes(size) AS (VALUES ('1.7ct'),('2.8ct'),('5ct'))
INSERT INTO product_variants (product_slug, color, size, length, price_override, stock, is_active, weight_grams)
SELECT '1ct-to-5ct-moissanite-pendant-necklace-in-18k-gold-plated-s925-sterling-silver',
       source.color, sizes.size, '18"', 199, source.stock, source.is_active, source.weight_grams
FROM source CROSS JOIN sizes;

-- Make every existing combination's current retail price explicit.
UPDATE product_variants SET price_override = CASE size
  WHEN '2mm' THEN 100 WHEN '3mm' THEN 100 WHEN '4mm' THEN 117 WHEN '5mm' THEN 134 END
WHERE product_slug = 'vvs1-moissanite-hoop-earrings-925-sterling-silver-base-18k-white-gold-or-18k-yellow-gold-plated';

UPDATE product_variants SET price_override = 299
WHERE product_slug IN (
  'classic-solitaire-engagement-ring-12-carat-moissanite-sterling-silver',
  '1ct-2ct-oval-moissanite-ring-in-18k-gold-plated-s925-sterling-silver'
);

DELETE FROM product_variants
WHERE product_slug = 'mens-vvs-moissanite-band-ring-8mm-sterling-silver-gold-plated'
  AND size NOT IN ('Ring Size 7','Ring Size 8','Ring Size 9','Ring Size 10','Ring Size 11');

UPDATE product_variants SET price_override = 309
WHERE product_slug = 'mens-vvs-moissanite-band-ring-8mm-sterling-silver-gold-plated';

UPDATE product_variants SET price_override = 514
WHERE product_slug = '1ct-emerald-cut-moissanite-necklace-in-18k-gold-plated-sterling-silver';

UPDATE product_variants SET price_override = 329
WHERE product_slug = '5mm-vvs1-pear-cut-moissanite-necklace-in-18k-gold-plated-s925-sterling-silver';

UPDATE product_variants SET price_override = CASE size
  WHEN '2mm' THEN CASE length WHEN '6"' THEN 107.50 WHEN '6.5"' THEN 116.68 WHEN '7"' THEN 125.42 WHEN '7.5"' THEN 134.60 WHEN '8"' THEN 143.34 WHEN '8.5"' THEN 152.08 WHEN '9"' THEN 160.82 END
  WHEN '3mm' THEN CASE length WHEN '6"' THEN 149.46 WHEN '6.5"' THEN 162.12 WHEN '7"' THEN 174.36 WHEN '7.5"' THEN 187.04 WHEN '8"' THEN 199.28 WHEN '8.5"' THEN 211.94 WHEN '9"' THEN 224.18 END
  WHEN '4mm' THEN CASE length WHEN '6"' THEN 209.32 WHEN '6.5"' THEN 226.80 WHEN '7"' THEN 244.28 WHEN '7.5"' THEN 261.32 WHEN '8"' THEN 279.24 WHEN '8.5"' THEN 295.84 WHEN '9"' THEN 312.90 END
  WHEN '5mm' THEN CASE length WHEN '6"' THEN 224.62 WHEN '6.5"' THEN 243.40 WHEN '7"' THEN 261.76 WHEN '7.5"' THEN 280.56 WHEN '8"' THEN 299.34 WHEN '8.5"' THEN 318.14 WHEN '9"' THEN 333.86 END
  WHEN '6mm' THEN CASE length WHEN '6"' THEN 313.32 WHEN '6.5"' THEN 339.98 WHEN '7"' THEN 366.20 WHEN '7.5"' THEN 397.24 WHEN '8"' THEN 419.96 WHEN '8.5"' THEN 446.18 WHEN '9"' THEN 472.84 END
END
WHERE product_slug = 'vvs1-d-moissanite-tennis-bracelet-4-prong-setting-with-double-lock-clasp';

UPDATE product_variants SET price_override = CASE size
  WHEN '3mm' THEN CASE length WHEN '16"' THEN 425 WHEN '18"' THEN 485 WHEN '20"' THEN 545 WHEN '22"' THEN 605 WHEN '24"' THEN 665 END
  WHEN '4mm' THEN CASE length WHEN '16"' THEN 599 WHEN '18"' THEN 689 WHEN '20"' THEN 779 WHEN '22"' THEN 869 WHEN '24"' THEN 959 END
  WHEN '5mm' THEN CASE length WHEN '16"' THEN 779 WHEN '18"' THEN 899 WHEN '20"' THEN 1019 WHEN '22"' THEN 1139 WHEN '24"' THEN 1259 END
  WHEN '6mm' THEN CASE length WHEN '16"' THEN 1019 WHEN '18"' THEN 1169 WHEN '20"' THEN 1319 WHEN '22"' THEN 1469 WHEN '24"' THEN 1619 END
END
WHERE product_slug = 'vvs1-d-moissanite-tennis-chain-in-18k-yellow-gold-s925-sterling-silver-base-gra-certified';

-- Deterministic, globally unique fulfillment SKUs for every missing variant.
UPDATE product_variants
SET sku = UPPER(
  'QJ-' || SUBSTRING(MD5(product_slug) FROM 1 FOR 8) || '-' ||
  SUBSTRING(MD5(COALESCE(color,'') || '|' || COALESCE(size,'') || '|' || COALESCE(length,'') || '|' || id::text) FROM 1 FOR 10)
)
WHERE sku IS NULL OR BTRIM(sku) = '';

-- Products with variants use variant inventory exclusively. This avoids a
-- contradictory product-level stock number appearing in feeds/admin screens.
UPDATE products AS product
SET track_inventory = false,
    stock_quantity = NULL
WHERE EXISTS (
  SELECT 1 FROM product_variants AS variant
  WHERE variant.product_slug = product.slug AND variant.is_active = true
);
