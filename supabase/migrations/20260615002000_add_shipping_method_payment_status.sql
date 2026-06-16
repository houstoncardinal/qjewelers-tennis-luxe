-- Add shipping_method and payment_status columns to orders table.
-- shipping_method: standard (free/$flat), express ($24.95), overnight ($49.95)
-- payment_status: pending until Stripe integration captures payment
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_method TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS payment_status  TEXT NOT NULL DEFAULT 'pending';
