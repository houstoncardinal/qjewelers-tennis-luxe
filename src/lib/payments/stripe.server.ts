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

// Find an existing Stripe Customer by email, or create one. Called at checkout
// so returning buyers see their saved cards in the PaymentElement automatically.
export async function getOrCreateStripeCustomer(email: string, name?: string): Promise<string> {
  const stripe = getStripe();
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data.length > 0) return existing.data[0].id;
  const customer = await stripe.customers.create({ email, ...(name ? { name } : {}) });
  return customer.id;
}

// Generates a short-lived Stripe Billing Portal URL so customers can manage
// saved cards entirely within Stripe's hosted UI — we never see card numbers.
export async function createStripePortalSession(
  customerId: string,
  returnUrl: string,
): Promise<string> {
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

export async function createStripePaymentIntent(params: {
  amountCents: number;
  currency: string;
  metadata: Record<string, string>;
  customerEmail?: string;
  customerName?: string;
  shipping?: {
    name: string;
    phone?: string;
    address: Stripe.AddressParam;
  };
}): Promise<{ clientSecret: string; paymentIntentId: string }> {
  let customerId: string | undefined;
  if (params.customerEmail) {
    try {
      customerId = await getOrCreateStripeCustomer(params.customerEmail, params.customerName);
    } catch {
      // Non-fatal — proceed without customer attachment
    }
  }

  const intent = await getStripe().paymentIntents.create(
    {
      amount: params.amountCents,
      currency: params.currency,
      metadata: params.metadata,
      receipt_email: params.customerEmail,
      shipping: params.shipping,
      // Redirect-based methods require durable checkout-return state. Until
      // that route exists, keep the Payment Element to cards/wallets that can
      // finish inline instead of sending a paid customer to a broken return.
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      ...(customerId ? { customer: customerId } : {}),
    },
    { idempotencyKey: `checkout-${params.metadata.reservation_token}` },
  );
  if (!intent.client_secret) throw new Error("Stripe did not return a client secret");
  return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
}

export interface TaxStatus {
  active: boolean;
  registrations: Array<{ country: string; state?: string }>;
}

// Drives the admin Launch Integrations panel — never throws (Stripe Tax may
// not be enabled yet on a fresh account).
export async function getTaxStatus(): Promise<TaxStatus> {
  if (!isStripeConfigured()) return { active: false, registrations: [] };
  try {
    const [settings, regs] = await Promise.all([
      getStripe().tax.settings.retrieve(),
      getStripe().tax.registrations.list({ limit: 100 }),
    ]);
    return {
      active: settings.status === "active",
      registrations: regs.data
        .filter((r) => r.status === "active")
        .map((r) => ({
          country: r.country,
          state: (r as any).country_options?.[r.country]?.state,
        })),
    };
  } catch {
    return { active: false, registrations: [] };
  }
}

export async function retrievePaymentIntent(id: string): Promise<Stripe.PaymentIntent> {
  return getStripe().paymentIntents.retrieve(id);
}

export interface TaxAddress {
  line1?: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string; // ISO 3166-1 alpha-2
}

export interface TaxResult {
  taxAmountCents: number;
  calculationId: string;
}

// Real-time, jurisdiction-aware tax via Stripe Tax — uses whatever origin
// address + registrations are configured in the Stripe Dashboard (Settings >
// Tax), so it only ever collects tax where the account is actually
// registered. Returns null (never throws) on any failure — callers fall back
// to the flat store_settings tax_rate so checkout is never blocked by this.
export async function calculateTax(params: {
  currency: string;
  lineItems: Array<{ reference: string; amountCents: number }>;
  shippingCostCents: number;
  address: TaxAddress;
}): Promise<TaxResult | null> {
  if (!isStripeConfigured()) return null;
  try {
    const calculation = await getStripe().tax.calculations.create({
      currency: params.currency,
      line_items: params.lineItems.map((li) => ({
        amount: li.amountCents,
        reference: li.reference,
        tax_behavior: "exclusive",
        tax_code: "txcd_99999999", // General - Tangible Goods
      })),
      ...(params.shippingCostCents > 0
        ? {
            shipping_cost: {
              amount: params.shippingCostCents,
              tax_behavior: "exclusive",
              tax_code: "txcd_92010001", // Shipping
            },
          }
        : {}),
      customer_details: {
        address: params.address,
        address_source: "shipping",
      },
    });
    return {
      taxAmountCents: calculation.tax_amount_exclusive,
      calculationId: calculation.id ?? "",
    };
  } catch (err) {
    console.error(
      "[stripe.calculateTax] falling back to flat rate:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

// Records the tax calculation as a formal transaction for filing/reporting
// once payment actually succeeds. Non-fatal — an order is never blocked or
// rolled back over this bookkeeping step.
export async function createTaxTransaction(
  calculationId: string,
  reference: string,
): Promise<void> {
  try {
    await getStripe().tax.transactions.createFromCalculation({
      calculation: calculationId,
      reference,
    });
  } catch (err) {
    console.error(
      "[stripe.createTaxTransaction] failed:",
      err instanceof Error ? err.message : err,
    );
  }
}

export function verifyStripeWebhookSignature(
  rawBody: string | Buffer,
  signature: string,
): Stripe.Event {
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
