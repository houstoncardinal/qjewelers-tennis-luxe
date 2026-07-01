-- Drop the single-value check constraint on products.color so that
-- comma-separated multi-color values (e.g. "gold,white_gold") are allowed.
-- The color field stores available colorways as CSV keys matching COLOR_MAP
-- (silver | gold | rose_gold | white_gold), e.g. "gold,white_gold".

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_color_check;
