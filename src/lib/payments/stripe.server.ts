import Stripe from "stripe";

let _stripe: Stripe | null = null;

// Lazy singleton — never throws at import time if the key is absent, so the
// rest of the app (and the build) works fine before the user adds real keys.
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Stripe is not configured");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export async function createStripePaymentIntent(params: {
  amountCents: number;
  currency: string;
  metadata: Record<string, string>;
}): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const intent = await getStripe().paymentIntents.create({
    amount: params.amountCents,
    currency: params.currency,
    metadata: params.metadata,
    automatic_payment_methods: { enabled: true },
  });
  if (!intent.client_secret) throw new Error("Stripe did not return a client secret");
  return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
}

export async function retrievePaymentIntent(id: string): Promise<Stripe.PaymentIntent> {
  return getStripe().paymentIntents.retrieve(id);
}

export function verifyStripeWebhookSignature(rawBody: string | Buffer, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("Stripe webhook secret is not configured");
  return getStripe().webhooks.constructEvent(rawBody, signature, secret);
}

// Omitting amountCents triggers a full refund of the PaymentIntent.
export async function createStripeRefund(params: {
  paymentIntentId: string;
  amountCents?: number;
}): Promise<{ refundId: string; status: string }> {
  const refund = await getStripe().refunds.create({
    payment_intent: params.paymentIntentId,
    ...(params.amountCents ? { amount: params.amountCents } : {}),
  });
  return { refundId: refund.id, status: refund.status ?? "unknown" };
}
