-- Disable inventory tracking for "For Freddy" product so it's always available
-- Set variants to unlimited stock (-1) so they're always available

UPDATE products 
SET track_inventory = false,
    stock_quantity = null,
    updated_at = NOW()
WHERE name ILIKE '%Freddy%';

UPDATE product_variants
SET stock = -1,
    is_active = true
WHERE product_slug IN (
  SELECT slug FROM products 
  WHERE name ILIKE '%Freddy%'
);
