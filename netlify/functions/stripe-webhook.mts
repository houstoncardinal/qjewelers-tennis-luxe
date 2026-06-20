// Netlify Function v2 (Node.js runtime) — dedicated Stripe webhook endpoint.
// Lives outside the TanStack Start SSR route so it gets the raw, unparsed
// request body that Stripe's signature verification requires.
import { verifyStripeWebhookSignature } from "../../src/lib/payments/stripe.server";
import { finalizeReservation, findReservationTokenByStripeIntent } from "../../src/lib/payments/finalize";

export default async (request: Request) => {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const rawBody = await request.text();

  let event;
  try {
    event = verifyStripeWebhookSignature(rawBody, signature);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as { id: string; metadata?: Record<string, string> };
    const token = intent.metadata?.reservation_token ?? (await findReservationTokenByStripeIntent(intent.id));
    if (token) {
      // Durable backstop alongside the client's optimistic finalizeOrder call —
      // finalizeReservation is idempotent so whichever caller arrives first wins.
      try {
        await finalizeReservation(token);
      } catch (err) {
        console.error("[stripe-webhook] finalize failed:", err);
      }
    }
  }

  return new Response("ok", { status: 200 });
};
