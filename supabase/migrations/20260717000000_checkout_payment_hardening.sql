-- Prevent duplicate orders when a payment webhook/client retry lands after the
-- order insert but before the pending-order link is updated.
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_unique_payment_reference
  ON public.orders(payment_method, payment_reference)
  WHERE payment_reference IS NOT NULL;

-- Usage is incremented only after a paid order is finalized. The service-role
-- checkout path calls this function; storefront clients cannot access the
-- promo_codes table because of RLS.
CREATE OR REPLACE FUNCTION public.increment_promo_usage(p_code text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.promo_codes
  SET used_count = used_count + 1
  WHERE code = upper(trim(p_code));
$$;

REVOKE ALL ON FUNCTION public.increment_promo_usage(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_promo_usage(text) TO service_role;
