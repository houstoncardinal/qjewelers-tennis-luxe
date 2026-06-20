-- Atomic stock reservation system to prevent overselling.
-- Coexists with the legacy decrement_stock RPC (left in place, unused by the
-- new checkout flow, which calls commit_reservation instead).

CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug       text NOT NULL,
  variant_id         uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity           integer NOT NULL CHECK (quantity > 0),
  reservation_token  text NOT NULL,
  status             text NOT NULL DEFAULT 'active', -- active | committed | released
  expires_at         timestamptz NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_slug_active
  ON public.stock_reservations(product_slug, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_variant_active
  ON public.stock_reservations(variant_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_token
  ON public.stock_reservations(reservation_token);

ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_reservations" ON public.stock_reservations;
CREATE POLICY "service_role_all_reservations" ON public.stock_reservations
  FOR ALL USING (true) WITH CHECK (true);

-- Atomic reserve: locks the relevant product/variant row, checks
-- (stock - active non-expired reservations) >= qty, inserts a reservation
-- row if available, else raises. The row lock serializes concurrent callers
-- so two simultaneous buyers can never both reserve the last unit.
CREATE OR REPLACE FUNCTION public.reserve_stock(
  p_slug text,
  p_variant_id uuid,
  p_qty integer,
  p_token text,
  p_ttl_seconds integer DEFAULT 900
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
  v_track boolean;
  v_stock integer;
  v_reserved integer;
  v_available integer;
  v_id uuid;
BEGIN
  IF p_variant_id IS NOT NULL THEN
    SELECT stock INTO v_stock
    FROM public.product_variants
    WHERE id = p_variant_id
    FOR UPDATE;

    IF v_stock IS NULL THEN
      RAISE EXCEPTION 'Variant not found';
    END IF;

    IF v_stock = -1 THEN
      INSERT INTO public.stock_reservations (product_slug, variant_id, quantity, reservation_token, expires_at)
      VALUES (p_slug, p_variant_id, p_qty, p_token, now() + (p_ttl_seconds || ' seconds')::interval)
      RETURNING id INTO v_id;
      RETURN v_id;
    END IF;

    SELECT COALESCE(SUM(quantity), 0) INTO v_reserved
    FROM public.stock_reservations
    WHERE variant_id = p_variant_id AND status = 'active' AND expires_at > now();

    v_available := v_stock - v_reserved;
    IF v_available < p_qty THEN
      RAISE EXCEPTION 'Insufficient stock for variant %', p_variant_id;
    END IF;

    INSERT INTO public.stock_reservations (product_slug, variant_id, quantity, reservation_token, expires_at)
    VALUES (p_slug, p_variant_id, p_qty, p_token, now() + (p_ttl_seconds || ' seconds')::interval)
    RETURNING id INTO v_id;
    RETURN v_id;
  ELSE
    SELECT track_inventory, stock_quantity INTO v_track, v_stock
    FROM public.products
    WHERE slug = p_slug
    FOR UPDATE;

    IF v_track IS NOT TRUE OR v_stock IS NULL THEN
      INSERT INTO public.stock_reservations (product_slug, variant_id, quantity, reservation_token, expires_at)
      VALUES (p_slug, NULL, p_qty, p_token, now() + (p_ttl_seconds || ' seconds')::interval)
      RETURNING id INTO v_id;
      RETURN v_id;
    END IF;

    SELECT COALESCE(SUM(quantity), 0) INTO v_reserved
    FROM public.stock_reservations
    WHERE product_slug = p_slug AND variant_id IS NULL AND status = 'active' AND expires_at > now();

    v_available := v_stock - v_reserved;
    IF v_available < p_qty THEN
      RAISE EXCEPTION 'Insufficient stock for product %', p_slug;
    END IF;

    INSERT INTO public.stock_reservations (product_slug, variant_id, quantity, reservation_token, expires_at)
    VALUES (p_slug, NULL, p_qty, p_token, now() + (p_ttl_seconds || ' seconds')::interval)
    RETURNING id INTO v_id;
    RETURN v_id;
  END IF;
END;
$$;

-- Commit: payment succeeded — permanently decrement real stock for every
-- reservation under this token and mark them committed.
CREATE OR REPLACE FUNCTION public.commit_reservation(p_token text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM public.stock_reservations
    WHERE reservation_token = p_token AND status = 'active'
  LOOP
    IF r.variant_id IS NOT NULL THEN
      UPDATE public.product_variants
      SET stock = CASE WHEN stock = -1 THEN -1 ELSE GREATEST(stock - r.quantity, 0) END
      WHERE id = r.variant_id;
    ELSE
      UPDATE public.products
      SET stock_quantity = GREATEST(COALESCE(stock_quantity, 0) - r.quantity, 0)
      WHERE slug = r.product_slug AND track_inventory = true AND stock_quantity IS NOT NULL;
    END IF;

    UPDATE public.stock_reservations SET status = 'committed' WHERE id = r.id;
  END LOOP;
END;
$$;

-- Release: payment failed/expired — free the reservation so other buyers
-- can claim the stock again. No permanent stock was ever touched, so this
-- is just a status flip.
CREATE OR REPLACE FUNCTION public.release_reservation(p_token text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.stock_reservations
  SET status = 'released'
  WHERE reservation_token = p_token AND status = 'active';
END;
$$;
