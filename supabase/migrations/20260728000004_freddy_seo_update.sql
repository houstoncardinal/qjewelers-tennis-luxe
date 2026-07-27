-- Update "For Freddy" product with powerful SEO metadata
-- This will improve social sharing and search engine visibility

UPDATE products 
SET 
  seo_title = '1.5 CT Oval Moissanite Engagement Ring & Eternity Band Set - For Freddy | Qureshi Jewelers',
  seo_description = 'Stunning 1.5 CT oval moissanite engagement ring paired with a matching eternity band. Premium VVS moissanite, GRA certified, S925 sterling silver. The perfect symbol of eternal love and commitment. Free shipping available.',
  updated_at = NOW()
WHERE name ILIKE '%Freddy%';
