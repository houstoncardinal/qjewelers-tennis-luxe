-- Update SEO metadata for all products that don't have proper titles/descriptions
-- This ensures all products have search-optimized metadata

UPDATE products 
SET 
  seo_title = CASE 
    WHEN seo_title IS NULL OR seo_title = '' THEN 
      name || ' | Qureshi Jewelers'
    ELSE seo_title
  END,
  seo_description = CASE 
    WHEN seo_description IS NULL OR seo_description = '' THEN 
      'Premium ' || name || ' — VVS moissanite hand-set in solid S925 sterling silver. GRA certified, 5× 18K gold plating. Free US shipping over $250.'
    ELSE seo_description
  END,
  updated_at = NOW()
WHERE seo_title IS NULL 
   OR seo_title = ''
   OR seo_description IS NULL 
   OR seo_description = '';
