// Relative imports (not the "@/" alias) so this module's import graph stays
// resolvable by Netlify's plain-esbuild Functions bundler, which doesn't read
// tsconfig path aliases — the webhook functions import this file directly.
import { supabaseAdmin } from "../../integrations/supabase/client.server";
import { sendOrderConfirmation } from "../email";
import { alertAdminOnError } from "../error-alert";
import { retrievePaymentIntent, isStripeConfigured } from "./stripe.server";
import { capturePaypalOrder, getPaypalOrder, isPaypalConfigured } from "./paypal.server";

const db = supabaseAdmin as any;

export interface OrderPayload {
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address_line1: string;
  shipping_address_line2: string | null;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_country: string;
  notes: string | null;
  items: Array<{ name: string; color: string; size: string; length: string; unitPrice: number; quantity: number }>;
  subtotal: number;
  discount_amount: number;
  promo_code: string | null;
  shipping: number;
  tax: number;
  total: number;
  shipping_method: "standard" | "express" | "overnight";
}

export interface FinalizedOrder {
  orderNumber: string;
  total: number;
  tax: number;
  shipping_method: string;
  customer_name: string;
}

function rowToFinalized(order: any): FinalizedOrder {
  return {
    orderNumber: order.order_number,
    total: Number(order.total),
    tax: Number(order.tax),
    shipping_method: order.shipping_method,
    customer_name: order.customer_name,
  };
}

async function waitForFinalization(pendingId: string): Promise<FinalizedOrder> {
  // Another caller (client vs. webhook) is mid-finalize for this token —
  // poll briefly rather than double-charge or double-insert the order.
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const { data: row } = await db.from("pending_orders").select("*").eq("id", pendingId).maybeSingle();
    if (row?.status === "finalized" && row.order_id) {
      const { data: order } = await db.from("orders").select("order_number, total, tax, shipping_method, customer_name").eq("id", row.order_id).single();
      if (order) return rowToFinalized(order);
    }
    if (row?.status === "failed") throw new Error("Payment was not completed for this order");
  }
  throw new Error("Order is still being processed — please check your order status shortly");
}

// Idempotent: safe to call multiple times (once optimistically from the
// client right after the provider confirms payment, and again from the
// provider's webhook as a durable backstop). Re-verifies payment status
// directly against the provider — never trusts the caller's say-so.
export async function finalizeReservation(reservationToken: string): Promise<FinalizedOrder> {
  const { data: pending, error } = await db
    .from("pending_orders")
    .select("*")
    .eq("reservation_token", reservationToken)
    .maybeSingle();
  if (error || !pending) throw new Error("Order not found");

  if (pending.status === "finalized" && pending.order_id) {
    const { data: order } = await db.from("orders").select("order_number, total, tax, shipping_method, customer_name").eq("id", pending.order_id).single();
    if (order) return rowToFinalized(order);
  }
  if (pending.status === "failed" || pending.status === "expired") {
    throw new Error("Payment was not completed for this order");
  }

  // Atomic claim: only one caller proceeds past this point per token.
  const { data: claimed } = await db
    .from("pending_orders")
    .update({ status: "processing" })
    .eq("id", pending.id)
    .eq("status", "pending")
    .select()
    .maybeSingle();

  if (!claimed) return waitForFinalization(pending.id);

  let verified = false;
  let paymentReference = "";

  if (claimed.payment_method === "stripe") {
    if (!isStripeConfigured()) throw new Error("Stripe is not configured");
    const intent = await retrievePaymentIntent(claimed.stripe_payment_intent_id);
    verified = intent.status === "succeeded";
    paymentReference = intent.id;
  } else if (claimed.payment_method === "paypal") {
    if (!isPaypalConfigured()) throw new Error("PayPal is not configured");
    try {
      const captured = await capturePaypalOrder(claimed.paypal_order_id);
      verified = captured.status === "COMPLETED";
      paymentReference = captured.captureId ?? claimed.paypal_order_id;
    } catch {
      // Already captured by a prior attempt — check status instead of failing.
      const existing = await getPaypalOrder(claimed.paypal_order_id);
      verified = existing.status === "COMPLETED";
      paymentReference = claimed.paypal_order_id;
    }
  } else {
    throw new Error(`Unknown payment method: ${claimed.payment_method}`);
  }

  if (!verified) {
    await db.rpc("release_reservation", { p_token: reservationToken });
    await db.from("pending_orders").update({ status: "failed" }).eq("id", claimed.id);
    throw new Error("Payment was not completed");
  }

  const payload = claimed.payload as OrderPayload;

  const { data: order, error: insertErr } = await db
    .from("orders")
    .insert({
      customer_name: payload.customer_name,
      customer_email: payload.customer_email,
      customer_phone: payload.customer_phone,
      shipping_address_line1: payload.shipping_address_line1,
      shipping_address_line2: payload.shipping_address_line2,
      shipping_city: payload.shipping_city,
      shipping_state: payload.shipping_state,
      shipping_zip: payload.shipping_zip,
      shipping_country: payload.shipping_country,
      notes: payload.notes,
      items: payload.items,
      subtotal: payload.subtotal,
      shipping: payload.shipping,
      tax: payload.tax,
      total: payload.total,
      promo_code: payload.promo_code,
      discount_amount: payload.discount_amount,
      shipping_method: payload.shipping_method,
      payment_status: "paid",
      payment_method: claimed.payment_method,
      payment_reference: paymentReference,
    })
    .select("id, order_number, total, tax, shipping_method, customer_name")
    .single();
  if (insertErr) {
    // Payment already succeeded but the order row failed to insert — this
    // needs human attention immediately, not a customer-facing retry.
    alertAdminOnError(`finalizeReservation order insert (token ${reservationToken})`, insertErr);
    throw new Error(insertErr.message);
  }

  await db.rpc("commit_reservation", { p_token: reservationToken });
  await db.from("pending_orders").update({ status: "finalized", order_id: order.id }).eq("id", claimed.id);

  const addressParts = [
    payload.shipping_address_line1,
    payload.shipping_address_line2,
    `${payload.shipping_city}, ${payload.shipping_state} ${payload.shipping_zip}`,
    payload.shipping_country !== "United States" ? payload.shipping_country : null,
  ].filter(Boolean);
  sendOrderConfirmation({
    orderNumber: order.order_number,
    customerName: payload.customer_name,
    customerEmail: payload.customer_email,
    items: payload.items,
    subtotal: payload.subtotal,
    discount: payload.discount_amount,
    promoCode: payload.promo_code,
    shipping: payload.shipping,
    tax: payload.tax,
    total: Number(order.total),
    shippingMethod: payload.shipping_method,
    shippingAddress: addressParts.join("<br/>"),
  }).catch((e) => console.warn("[Email] Order confirmation failed:", e));

  return rowToFinalized(order);
}

// Looks up the reservation token for a given provider payment id — used by
// webhooks, which only know the Stripe PaymentIntent id or PayPal order id.
export async function findReservationTokenByStripeIntent(paymentIntentId: string): Promise<string | null> {
  const { data } = await db
    .from("pending_orders")
    .select("reservation_token")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();
  return data?.reservation_token ?? null;
}

export async function findReservationTokenByPaypalOrder(paypalOrderId: string): Promise<string | null> {
  const { data } = await db
    .from("pending_orders")
    .select("reservation_token")
    .eq("paypal_order_id", paypalOrderId)
    .maybeSingle();
  return data?.reservation_token ?? null;
}
