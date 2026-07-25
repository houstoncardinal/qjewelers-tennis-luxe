-- Launch security hardening: private commerce tables, least-privilege RPCs,
-- expiring inventory/promo reservations, and atomic refund claims.

-- Guest checkout is implemented exclusively by trusted server functions.
DROP POLICY IF EXISTS "orders_public_insert" ON public.orders;
DROP POLICY IF EXISTS "product_images_admin_all" ON public.product_images;
DROP POLICY IF EXISTS "service_role_all_reservations" ON public.stock_reservations;
DROP POLICY IF EXISTS "service_role_all_pending_orders" ON public.pending_orders;

DROP POLICY IF EXISTS "deny_anon_authenticated" ON public.orders;
CREATE POLICY "deny_anon_authenticated" ON public.orders
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "deny_anon_authenticated_write" ON public.product_images;
CREATE POLICY "deny_anon_authenticated_write" ON public.product_images
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- SELECT remains available through product_images_public_read. PostgreSQL ORs
-- policies, so the explicit deny affects writes without hiding public images.
DROP POLICY IF EXISTS "deny_anon_authenticated" ON public.stock_reservations;
CREATE POLICY "deny_anon_authenticated" ON public.stock_reservations
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "deny_anon_authenticated" ON public.pending_orders;
CREATE POLICY "deny_anon_authenticated" ON public.pending_orders
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.pending_orders
  ADD COLUMN IF NOT EXISTS processing_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.promo_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code text NOT NULL REFERENCES public.promo_codes(code) ON UPDATE CASCADE ON DELETE CASCADE,
  reservation_token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'committed', 'released')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS promo_reservations_code_active_idx
  ON public.promo_reservations(promo_code, status, expires_at);
ALTER TABLE public.promo_reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_anon_authenticated" ON public.promo_reservations;
CREATE POLICY "deny_anon_authenticated" ON public.promo_reservations
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.reserve_promo(
  p_code text,
  p_token text,
  p_ttl_seconds integer DEFAULT 900
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo public.promo_codes%ROWTYPE;
  v_reserved integer;
BEGIN
  SELECT * INTO v_promo
  FROM public.promo_codes
  WHERE code = upper(trim(p_code)) AND active = true
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid promo code'; END IF;
  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at <= now() THEN
    RAISE EXCEPTION 'Promo code expired';
  END IF;
  SELECT count(*) INTO v_reserved FROM public.promo_reservations
  WHERE promo_code = v_promo.code AND status = 'active' AND expires_at > now();
  IF v_promo.max_uses IS NOT NULL AND v_promo.used_count + v_reserved >= v_promo.max_uses THEN
    RAISE EXCEPTION 'Promo usage limit reached';
  END IF;
  INSERT INTO public.promo_reservations(promo_code, reservation_token, expires_at)
  VALUES (v_promo.code, p_token, now() + make_interval(secs => p_ttl_seconds));
END;
$$;

-- Recreate reservation functions as SECURITY DEFINER with a pinned search path,
-- then remove their default PUBLIC execution grants below.
ALTER FUNCTION public.reserve_stock(text, uuid, integer, text, integer)
  SECURITY DEFINER;
ALTER FUNCTION public.reserve_stock(text, uuid, integer, text, integer)
  SET search_path = public;
ALTER FUNCTION public.commit_reservation(text)
  SECURITY DEFINER;
ALTER FUNCTION public.commit_reservation(text)
  SET search_path = public;
ALTER FUNCTION public.release_reservation(text)
  SECURITY DEFINER;
ALTER FUNCTION public.release_reservation(text)
  SET search_path = public;

CREATE OR REPLACE FUNCTION public.release_reservation(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.stock_reservations SET status = 'released'
  WHERE reservation_token = p_token AND status = 'active';
  UPDATE public.promo_reservations SET status = 'released'
  WHERE reservation_token = p_token AND status = 'active';
END;
$$;

CREATE OR REPLACE FUNCTION public.commit_reservation(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_stock integer;
  v_reserved integer;
BEGIN
  -- Lock all relevant rows before changing any inventory. Expired reservations
  -- may still complete only if stock remains after honoring other active carts.
  FOR r IN SELECT * FROM public.stock_reservations
           WHERE reservation_token = p_token AND status = 'active'
           ORDER BY id FOR UPDATE
  LOOP
    IF r.variant_id IS NOT NULL THEN
      SELECT stock INTO v_stock FROM public.product_variants WHERE id = r.variant_id FOR UPDATE;
      IF v_stock IS NULL THEN RAISE EXCEPTION 'Variant no longer exists'; END IF;
      IF v_stock <> -1 THEN
        SELECT COALESCE(sum(quantity), 0) INTO v_reserved
        FROM public.stock_reservations
        WHERE variant_id = r.variant_id AND status = 'active' AND expires_at > now()
          AND reservation_token <> p_token;
        IF v_stock - v_reserved < r.quantity THEN RAISE EXCEPTION 'Inventory no longer available'; END IF;
      END IF;
    ELSE
      SELECT stock_quantity INTO v_stock FROM public.products
      WHERE slug = r.product_slug AND track_inventory = true FOR UPDATE;
      IF v_stock IS NOT NULL THEN
        SELECT COALESCE(sum(quantity), 0) INTO v_reserved
        FROM public.stock_reservations
        WHERE product_slug = r.product_slug AND variant_id IS NULL
          AND status = 'active' AND expires_at > now() AND reservation_token <> p_token;
        IF v_stock - v_reserved < r.quantity THEN RAISE EXCEPTION 'Inventory no longer available'; END IF;
      END IF;
    END IF;
  END LOOP;

  FOR r IN SELECT * FROM public.stock_reservations
           WHERE reservation_token = p_token AND status = 'active' ORDER BY id
  LOOP
    IF r.variant_id IS NOT NULL THEN
      UPDATE public.product_variants
      SET stock = CASE WHEN stock = -1 THEN -1 ELSE stock - r.quantity END
      WHERE id = r.variant_id;
    ELSE
      UPDATE public.products SET stock_quantity = stock_quantity - r.quantity
      WHERE slug = r.product_slug AND track_inventory = true AND stock_quantity IS NOT NULL;
    END IF;
    UPDATE public.stock_reservations SET status = 'committed' WHERE id = r.id;
  END LOOP;

  UPDATE public.promo_codes p SET used_count = used_count + 1
  FROM public.promo_reservations pr
  WHERE pr.reservation_token = p_token AND pr.status = 'active'
    AND p.code = pr.promo_code;
  UPDATE public.promo_reservations SET status = 'committed'
  WHERE reservation_token = p_token AND status = 'active';
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_checkout_reservations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  UPDATE public.stock_reservations SET status = 'released'
  WHERE status = 'active' AND expires_at <= now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  UPDATE public.promo_reservations SET status = 'released'
  WHERE status = 'active' AND expires_at <= now();
  UPDATE public.pending_orders SET status = 'expired'
  WHERE status = 'pending' AND expires_at <= now();
  UPDATE public.pending_orders SET status = 'pending', processing_started_at = NULL
  WHERE status = 'processing' AND processing_started_at < now() - interval '2 minutes';
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_return_refund(p_return_id uuid)
RETURNS public.returns
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_return public.returns%ROWTYPE;
BEGIN
  UPDATE public.returns SET refund_status = 'processing'
  WHERE id = p_return_id AND COALESCE(refund_status, 'pending') IN ('pending', 'failed')
  RETURNING * INTO v_return;
  IF NOT FOUND THEN RAISE EXCEPTION 'Refund is already processing or completed'; END IF;
  RETURN v_return;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_stock(text, uuid, integer, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.commit_reservation(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_reservation(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_promo(text, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.expire_checkout_reservations() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_return_refund(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.reserve_stock(text, uuid, integer, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.commit_reservation(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_reservation(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_promo(text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_checkout_reservations() TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_return_refund(uuid) TO service_role;
