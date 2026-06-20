// Netlify Function v2 (Node.js runtime) — dedicated PayPal webhook endpoint.
// Sibling of stripe-webhook.mts; PayPal's signature verification works against
// the parsed JSON body (unlike Stripe, which needs the raw bytes).
import { verifyPaypalWebhookSignature } from "../../src/lib/payments/paypal.server";
import { finalizeReservation, findReservationTokenByPaypalOrder } from "../../src/lib/payments/finalize";

export default async (request: Request) => {
  const body = await request.json().catch(() => null);
  if (!body) return new Response("Invalid body", { status: 400 });

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => { headers[key.toLowerCase()] = value; });

  const verified = await verifyPaypalWebhookSignature({ headers, body }).catch(() => false);
  if (!verified) return new Response("Invalid signature", { status: 400 });

  const eventType = (body as any).event_type;
  const orderId =
    eventType === "CHECKOUT.ORDER.APPROVED"
      ? (body as any).resource?.id
      : (body as any).resource?.supplementary_data?.related_ids?.order_id;

  if (orderId) {
    const token = await findReservationTokenByPaypalOrder(orderId);
    if (token) {
      // Durable backstop alongside the client's optimistic finalizeOrder call —
      // finalizeReservation is idempotent so whichever caller arrives first wins.
      try {
        await finalizeReservation(token);
      } catch (err) {
        console.error("[paypal-webhook] finalize failed:", err);
      }
    }
  }

  return new Response("ok", { status: 200 });
};
