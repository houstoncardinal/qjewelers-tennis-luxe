-- Fix "For Freddy" product pricing and inventory
-- Set base price to $250, track inventory, set stock to 10

UPDATE products 
SET base_price = 250,
    track_inventory = true,
    stock_quantity = 10,
    updated_at = NOW()
WHERE name ILIKE '%Freddy%';
