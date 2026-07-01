-- Add color_images JSONB column to products table.
-- Stores a map of color key -> image URL, e.g.:
--   { "gold": "https://cdn.../gold-chain.jpg", "white_gold": "https://cdn.../white-chain.jpg" }
-- Used by the admin editor to assign a cover image per colorway,
-- and by the product page to auto-switch the hero image when a color chip is clicked.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS color_images jsonb NOT NULL DEFAULT '{}'::jsonb;
