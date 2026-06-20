// PayPal has no first-party Node SDK maintained for this flow — using plain
// fetch against the REST API, matching the existing fetch-based external-API
// pattern in admin-extended.functions.ts's importProductFromUrl.

function baseUrl(): string {
  return process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function isPaypalConfigured(): boolean {
  return !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("PayPal is not configured");

  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  const data = await res.json();

  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.token;
}

export async function createPaypalOrder(params: {
  amount: string; // decimal string, e.g. "49.99"
  currency: string;
  referenceId: string;
}): Promise<{ id: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${baseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: params.referenceId,
          amount: { currency_code: params.currency, value: params.amount },
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`PayPal order creation failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { id: data.id };
}

export async function capturePaypalOrder(orderId: string): Promise<{
  status: string;
  captureId: string | null;
}> {
  const token = await getAccessToken();
  const res = await fetch(`${baseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(`PayPal capture failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const captureId =
    data.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null;
  return { status: data.status, captureId };
}

export async function getPaypalOrder(orderId: string): Promise<{ status: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${baseUrl()}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`PayPal order lookup failed: ${res.status}`);
  const data = await res.json();
  return { status: data.status };
}

// Verifies a PayPal webhook using their transmission-signature verification
// API (simpler and more robust than reimplementing their CERT-based scheme
// by hand).
export async function verifyPaypalWebhookSignature(params: {
  headers: Record<string, string>;
  body: unknown;
}): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  const token = await getAccessToken();
  const res = await fetch(`${baseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      transmission_id: params.headers["paypal-transmission-id"],
      transmission_time: params.headers["paypal-transmission-time"],
      cert_url: params.headers["paypal-cert-url"],
      auth_algo: params.headers["paypal-auth-algo"],
      transmission_sig: params.headers["paypal-transmission-sig"],
      webhook_id: webhookId,
      webhook_event: params.body,
    }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.verification_status === "SUCCESS";
}

// Omitting amount triggers a full refund of the capture per PayPal's API.
export async function createPaypalRefund(params: {
  captureId: string;
  amount?: string;
  currency?: string;
}): Promise<{ refundId: string; status: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${baseUrl()}/v2/payments/captures/${params.captureId}/refund`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(
      params.amount
        ? { amount: { value: params.amount, currency_code: params.currency ?? "USD" } }
        : {}
    ),
  });
  if (!res.ok) throw new Error(`PayPal refund failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { refundId: data.id, status: data.status };
}

