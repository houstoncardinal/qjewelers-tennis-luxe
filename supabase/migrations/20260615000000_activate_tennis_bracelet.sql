-- Ensure tennis bracelet product is active and properly typed for storefront display.
-- The admin dashboard shows all products (active or not), so the bracelet
-- may have been created with is_active = false by default.
UPDATE products
SET
  is_active  = true,
  type       = COALESCE(NULLIF(type, ''), 'bracelet'),
  base_price = GREATEST(COALESCE(base_price::numeric, 107.50), 107.50)
WHERE
  (slug  ILIKE '%tennis%' OR name ILIKE '%tennis bracelet%')
  AND (is_active IS NULL OR is_active = false);
