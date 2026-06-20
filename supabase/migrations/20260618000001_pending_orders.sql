-- Draft orders created at "initiate checkout" time, before payment is
-- confirmed. Converted into a real `orders` row only once finalizeOrder
-- verifies the payment with the provider. Lets both the client's optimistic
-- finalize call AND the provider webhook race safely to the same outcome.

CREATE TABLE IF NOT EXISTS public.pending_orders (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_token           text NOT NULL UNIQUE,
  payment_method              text NOT NULL, -- 'stripe' | 'paypal'
  stripe_payment_intent_id    text,
  paypal_order_id             text,
  payload                     jsonb NOT NULL, -- full validated order data (items, totals, shipping, contact)
  status                      text NOT NULL DEFAULT 'pending', -- pending | finalized | failed | expired
  order_id                    uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  expires_at                  timestamptz NOT NULL,
  created_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_orders_token ON public.pending_orders(reservation_token);
CREATE INDEX IF NOT EXISTS idx_pending_orders_stripe_pi ON public.pending_orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_paypal_id ON public.pending_orders(paypal_order_id);

ALTER TABLE public.pending_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_pending_orders" ON public.pending_orders;
CREATE POLICY "service_role_all_pending_orders" ON public.pending_orders
  FOR ALL USING (true) WITH CHECK (true);
