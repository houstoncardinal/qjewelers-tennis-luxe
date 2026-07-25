-- White-gold solitaire engagement ring factory options:
--   1ct / Ring Size 7 costs $23.06 -> $185 retail (8.0225x)
--   2ct / Ring Size 7 costs $27.42 -> $220 retail (8.0233x)

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS supplier_unit_cost numeric(10,2),
  ADD COLUMN IF NOT EXISTS pricing_multiplier numeric(8,4);

ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS supplier_unit_cost numeric(10,2),
  ADD COLUMN IF NOT EXISTS pricing_multiplier numeric(8,4);

UPDATE products
SET base_price = 185.00,
    supplier_unit_cost = 23.06,
    pricing_multiplier = 8.0225,
    color = 'white_gold',
    size = '1ct, 2ct',
    length = 'Ring Size 7',
    track_inventory = false,
    stock_quantity = NULL,
    updated_at = now()
WHERE slug = 'classic-solitaire-engagement-ring-12-carat-moissanite-sterling-silver';

-- Replace the old row, which stored the physical ring size in the stone-size
-- field, with two exact carat + fulfillment-size variants.
WITH removed AS (
  DELETE FROM product_variants
  WHERE product_slug = 'classic-solitaire-engagement-ring-12-carat-moissanite-sterling-silver'
  RETURNING stock, is_active, weight_grams
), source AS (
  SELECT
    COALESCE(MAX(stock), -1) AS stock,
    COALESCE(BOOL_OR(is_active), true) AS is_active,
    MAX(weight_grams) AS weight_grams
  FROM removed
), options(size, supplier_cost, retail_price, multiple, sku_suffix) AS (
  VALUES
    ('1ct', 23.06::numeric, 185.00::numeric, 8.0225::numeric, '1CT-R7'),
    ('2ct', 27.42::numeric, 220.00::numeric, 8.0233::numeric, '2CT-R7')
)
INSERT INTO product_variants (
  product_slug, color, size, length, price_override, supplier_unit_cost,
  pricing_multiplier, sku, stock, is_active, weight_grams
)
SELECT
  'classic-solitaire-engagement-ring-12-carat-moissanite-sterling-silver',
  'white_gold', options.size, 'Ring Size 7', options.retail_price,
  options.supplier_cost, options.multiple, 'QJ-SOL-WG-' || options.sku_suffix,
  source.stock, source.is_active, source.weight_grams
FROM source CROSS JOIN options;

DO $$
DECLARE
  invalid_count integer;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM product_variants
  WHERE product_slug = 'classic-solitaire-engagement-ring-12-carat-moissanite-sterling-silver'
    AND (
      color <> 'white_gold'
      OR size NOT IN ('1ct','2ct')
      OR length <> 'Ring Size 7'
      OR price_override / NULLIF(supplier_unit_cost, 0) < 8
    );

  IF invalid_count <> 0 THEN
    RAISE EXCEPTION 'Solitaire ring contains % invalid or below-8x variants', invalid_count;
  END IF;
END $$;

