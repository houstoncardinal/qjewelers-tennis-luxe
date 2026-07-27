-- Fix "For Freddy" product variants
-- Set all variants to $250 price_override, 10 stock, and active

UPDATE product_variants
SET price_override = 250,
    stock = 10,
    is_active = true
WHERE product_slug IN (
  SELECT slug FROM products 
  WHERE name ILIKE '%Freddy%'
);
