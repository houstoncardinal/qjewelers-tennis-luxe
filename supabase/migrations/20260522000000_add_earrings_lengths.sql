-- 1. Alter CHECK constraint to add 'earring' type
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_type_check;
ALTER TABLE public.products ADD CONSTRAINT products_type_check
  CHECK (type IN ('necklace', 'bracelet', 'earring'));

-- 2. Add length column (for bracelet length variations: 6", 7", 8", 9")
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS length text;

-- 3. Add earring base price to new bpEarring column (optional — can be set in static data)
-- No column needed — earring pricing handled by the multiplier in the pricing engine