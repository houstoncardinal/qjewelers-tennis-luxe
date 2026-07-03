-- Apply any missing columns to the orders table.
-- Safe to run multiple times (IF NOT EXISTS throughout).
-- Run in: Supabase Dashboard → SQL Editor

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_method   TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS payment_status    TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_method    TEXT,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
