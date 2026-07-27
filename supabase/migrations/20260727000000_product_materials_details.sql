-- Add materials & details customization to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS materials_details jsonb DEFAULT NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_products_materials_details ON public.products USING GIN (materials_details);

-- Comment to document the structure
COMMENT ON COLUMN public.products.materials_details IS 'Customizable materials & details table data. Structure: { rows: [{ key: string, value: string, highlight: boolean }] }';
