-- Update tennis bracelet base_price to reflect the minimum computed price
-- (2mm · 6" = $107.50). The admin dashboard shows DB base_price,
-- so this keeps it consistent with what customers actually see.
UPDATE products
SET base_price = 107.50
WHERE slug LIKE '%tennis%'
  AND base_price < 107.50;
