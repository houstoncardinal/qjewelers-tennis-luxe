import { supabaseAdmin } from "../../src/integrations/supabase/client.server";
import { cancelPaymentIntent } from "../../src/lib/payments/stripe.server";

export const config = { schedule: "*/5 * * * *" };

export default async () => {
  const db = supabaseAdmin as any;
  const { data: expired, error } = await db
    .from("pending_orders")
    .select("id, stripe_payment_intent_id")
    .eq("status", "pending")
    .lte("expires_at", new Date().toISOString())
    .limit(200);
  if (error) throw error;

  await Promise.allSettled(
    (expired ?? [])
      .map((row: any) => row.stripe_payment_intent_id as string | null)
      .filter((id: string | null): id is string => !!id)
      .map((id: string) => cancelPaymentIntent(id)),
  );

  const { data: released, error: expirationError } = await db.rpc("expire_checkout_reservations");
  if (expirationError) throw expirationError;
  return new Response(JSON.stringify({ expired: expired?.length ?? 0, reservationsReleased: released ?? 0 }), {
    headers: { "content-type": "application/json" },
  });
};

