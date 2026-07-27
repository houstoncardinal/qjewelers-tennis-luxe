-- Debug: Check the Freddy product and its variants
SELECT 'Product info:' as info;
SELECT id, slug, name, track_inventory, stock_quantity, is_active 
FROM products 
WHERE name ILIKE '%Freddy%';

SELECT 'Variants info:' as info;
SELECT id, product_slug, color, size, length, price_override, stock, is_active 
FROM product_variants 
WHERE product_slug IN (SELECT slug FROM products WHERE name ILIKE '%Freddy%');
