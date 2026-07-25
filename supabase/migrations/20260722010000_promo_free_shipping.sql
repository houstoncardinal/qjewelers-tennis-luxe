-- Lets a promo code waive standard shipping in addition to (or instead of) a
-- percentage/fixed discount, so a single code can offer "15% off + free
-- shipping" without inventing a second discount mechanism. Only applies to
-- standard shipping — express/overnight remain paid, matching normal retail
-- practice for "free shipping" offers.

ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS free_shipping boolean NOT NULL DEFAULT false;
