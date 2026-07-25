-- Product variants are public-readable, but only trusted server code may mutate them.
-- NULLS NOT DISTINCT makes (gold, NULL, NULL) a real unique combination instead
-- of allowing an unlimited number of visually identical rows.

UPDATE product_variants
SET color = NULLIF(BTRIM(color), ''),
    size = NULLIF(BTRIM(size), ''),
    length = NULLIF(BTRIM(length), ''),
    sku = NULLIF(BTRIM(sku), '');

WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY product_slug, color, size, length
           ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
         ) AS position
  FROM product_variants
)
DELETE FROM product_variants
WHERE id IN (SELECT id FROM ranked WHERE position > 1);

ALTER TABLE product_variants
  DROP CONSTRAINT IF EXISTS unique_variant_per_product;

ALTER TABLE product_variants
  ADD CONSTRAINT unique_variant_per_product
  UNIQUE NULLS NOT DISTINCT (product_slug, color, size, length);

ALTER TABLE product_variants
  DROP CONSTRAINT IF EXISTS product_variants_stock_valid,
  DROP CONSTRAINT IF EXISTS product_variants_price_valid,
  DROP CONSTRAINT IF EXISTS product_variants_weight_valid;

ALTER TABLE product_variants
  ADD CONSTRAINT product_variants_stock_valid CHECK (stock >= -1),
  ADD CONSTRAINT product_variants_price_valid CHECK (price_override IS NULL OR price_override >= 0),
  ADD CONSTRAINT product_variants_weight_valid CHECK (weight_grams IS NULL OR weight_grams >= 0);

-- Older auto-generated SKUs could collide because their color/size tokens were
-- abbreviated. Keep the most recently edited SKU unchanged and give every
-- additional collision a stable suffix derived from its variant UUID. This
-- preserves the variant and its inventory instead of deleting either row.
WITH duplicate_skus AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY LOWER(sku)
           ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
         ) AS position
  FROM product_variants
  WHERE sku IS NOT NULL AND BTRIM(sku) <> ''
)
UPDATE product_variants AS variant
SET sku = BTRIM(variant.sku) || '-' || SUBSTRING(REPLACE(variant.id::text, '-', '') FROM 1 FOR 8)
FROM duplicate_skus
WHERE variant.id = duplicate_skus.id
  AND duplicate_skus.position > 1;

CREATE UNIQUE INDEX IF NOT EXISTS product_variants_sku_unique
  ON product_variants (LOWER(sku))
  WHERE sku IS NOT NULL AND BTRIM(sku) <> '';

DROP POLICY IF EXISTS "product_variants_admin_all" ON product_variants;
