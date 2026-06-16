-- Admin expansion: promo codes, returns, product sale prices, order discounts

-- ─── Promo codes ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text UNIQUE NOT NULL,
  name          text NOT NULL DEFAULT '',
  discount_type text NOT NULL DEFAULT 'percentage'
                  CHECK (discount_type IN ('percentage','fixed')),
  discount_value  numeric(10,2) NOT NULL DEFAULT 0,
  min_order_amount numeric(10,2) NOT NULL DEFAULT 0,
  max_uses      integer,
  used_count    integer NOT NULL DEFAULT 0,
  expires_at    timestamptz,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- ─── Returns / refunds ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.returns (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     text NOT NULL,
  order_id         uuid,
  customer_name    text NOT NULL DEFAULT '',
  customer_email   text NOT NULL DEFAULT '',
  reason           text NOT NULL DEFAULT '',
  items            jsonb NOT NULL DEFAULT '[]',
  status           text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','approved','rejected','refunded','shipped_back')),
  refund_amount    numeric(10,2),
  tracking_number  text,
  admin_notes      text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

-- Customers can submit return requests
CREATE POLICY "returns_public_insert" ON public.returns
  FOR INSERT WITH CHECK (true);

-- ─── Product sale prices ─────────────────────────────────────────────────────

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sale_price  numeric(10,2),
  ADD COLUMN IF NOT EXISTS sale_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- ─── Order discount tracking ─────────────────────────────────────────────────

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS promo_code       text,
  ADD COLUMN IF NOT EXISTS discount_amount  numeric(10,2) NOT NULL DEFAULT 0;
