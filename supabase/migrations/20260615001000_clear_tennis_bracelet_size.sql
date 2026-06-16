-- Tennis bracelet is a multi-size product; the customer picks width on the product page.
-- The DB row should NOT have a fixed "size" value, or it gets excluded from the
-- homepage "sig" filter (which requires !p.size for signature/featured listings).
UPDATE products
SET size = NULL
WHERE slug ILIKE '%tennis%'
   OR name ILIKE '%tennis bracelet%';
