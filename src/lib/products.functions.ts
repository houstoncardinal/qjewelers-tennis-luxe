import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ALL_PRODUCTS } from "@/lib/products.data";
import { checkHoneypot, checkRateLimit } from "@/lib/rate-limit";
import { validateAndPriceOrder } from "@/lib/pricing-server";
import { isStripeConfigured, createStripePaymentIntent } from "@/lib/payments/stripe.server";
import { isPaypalConfigured, createPaypalOrder } from "@/lib/payments/paypal.server";
import { finalizeReservation } from "@/lib/payments/finalize";
import { alertAdminOnError } from "@/lib/error-alert";

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  type: string;
  color: string;
  size: string | null;
  length: string | null;
  short_description: string;
  description: string;
  seo_title: string;
  seo_description: string;
  base_price: number;
  sale_price: number | null;
  sale_active: boolean;
  image_url: string;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

// Public: announcement bar settings for storefront (no auth)
export const getAnnouncementBar = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data } = await (supabaseAdmin as any)
      .from("store_settings")
      .select("key, value")
      .in("key", ["announcement_bar_enabled", "announcement_bar_text"]);
    const s: Record<string, string> = {};
    for (const row of (data ?? [])) s[row.key] = row.value;
    return {
      enabled: s["announcement_bar_enabled"] === "true",
      text: s["announcement_bar_text"] ?? "",
    };
  } catch {
    return { enabled: false, text: "" };
  }
});

// Public: save an email subscriber (best-effort — never throws)
export const subscribeEmail = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; source?: string; _hp?: string }) => d)
  .handler(async ({ data }) => {
    checkHoneypot(data._hp);
    checkRateLimit("subscribe-email", { windowMs: 10 * 60 * 1000, max: 8 });

    const email = data.email.trim().toLowerCase();
    if (!email || !email.includes("@")) throw new Error("Invalid email");
    try {
      await (supabaseAdmin as any)
        .from("subscribers")
        .upsert({ email, source: data.source ?? "footer" }, { onConflict: "email" });
    } catch (e) {
      console.warn("[Subscribe] DB write failed:", e);
    }
    return { success: true };
  });

// Returns live DB products. Only falls back to static catalog when Supabase is unreachable.
export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    // DB is reachable — return whatever is there, even if empty
    return { products: (data ?? []) as unknown as ProductRow[] };
  } catch (e) {
    console.warn("[Products] Supabase unavailable, using static catalog");
    return { products: ALL_PRODUCTS as unknown as ProductRow[] };
  }
});

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    try {
      const { data: product, error } = await supabaseAdmin
        .from("products")
        .select("*")
        .eq("slug", data.slug)
        .eq("is_active", true)
        .maybeSingle();
      if (!error && product) {
        return { product: product as unknown as ProductRow };
      }
    } catch (e) {
      console.warn("[Products] Supabase unavailable for slug lookup");
    }
    const product = ALL_PRODUCTS.find((p) => p.slug === data.slug && p.is_active) ?? null;
    return { product: product as unknown as ProductRow | null };
  });

// Public: fetch ordered gallery images for a product (no auth required)
export const getProductGallery = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    try {
      const { data: imgs, error } = await (supabaseAdmin as any)
        .from("product_images")
        .select("url, alt_text, sort_order, is_primary")
        .eq("product_slug", data.slug)
        .order("sort_order", { ascending: true });
      if (!error) return { images: (imgs ?? []) as Array<{ url: string; alt_text: string; sort_order: number; is_primary: boolean }> };
    } catch {}
    return { images: [] };
  });

// Public: fetch active variants for a product (no auth required) — lets the
// storefront page show only the color/size combinations a product actually
// offers, instead of a blanket universal list regardless of real availability.
export const getProductVariants = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    try {
      const { data: rows, error } = await (supabaseAdmin as any)
        .from("product_variants")
        .select("id, color, size, length, price_override, stock, is_active")
        .eq("product_slug", data.slug)
        .eq("is_active", true);
      if (!error) return { variants: (rows ?? []) as Array<{
        id: string; color: string | null; size: string | null; length: string | null;
        price_override: number | null; stock: number; is_active: boolean;
      }> };
    } catch {}
    return { variants: [] };
  });

// Public: read shipping + tax config from store_settings, fallback to defaults
export const getShippingConfig = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data: rows } = await (supabaseAdmin as any)
      .from("store_settings")
      .select("key, value")
      .in("key", ["free_shipping_threshold", "flat_shipping_rate", "tax_rate"]);
    if (rows?.length) {
      const t  = rows.find((r: any) => r.key === "free_shipping_threshold");
      const r  = rows.find((r: any) => r.key === "flat_shipping_rate");
      const tx = rows.find((r: any) => r.key === "tax_rate");
      return {
        freeShippingThreshold: t  ? Number(t.value)  || 250 : 250,
        flatShippingRate:      r  ? Number(r.value)  || 15  : 15,
        taxRate:               tx ? Number(tx.value) || 0   : 0,
      };
    }
  } catch {}
  return { freeShippingThreshold: 250, flatShippingRate: 15, taxRate: 0 };
});

const orderItemSchema = z.object({
  productId: z.string(),
  slug: z.string(),
  name: z.string(),
  color: z.string(),
  size: z.string(),
  length: z.string(),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().min(1).max(50),
});

const orderInputSchema = z.object({
  customer_name: z.string().trim().min(1).max(120),
  customer_email: z.string().trim().email().max(255),
  customer_phone: z.string().trim().max(30).optional().or(z.literal("")),
  shipping_address_line1: z.string().trim().min(1).max(200),
  shipping_address_line2: z.string().trim().max(200).optional().or(z.literal("")),
  shipping_city: z.string().trim().min(1).max(100),
  shipping_state: z.string().trim().min(1).max(100),
  shipping_zip: z.string().trim().min(3).max(20),
  shipping_country: z.string().trim().min(2).max(100).default("United States"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  items: z.array(orderItemSchema).min(1).max(50),
  promo_code: z.string().optional().or(z.literal("")),
  discount_amount: z.number().nonnegative().optional(),
  shipping_method: z.enum(["standard", "express", "overnight"]).default("standard"),
  payment_method: z.enum(["stripe", "paypal"]),
  _hp: z.string().optional().or(z.literal("")),
});

// ─── Product Reviews ──────────────────────────────────────────────────────────

export const listReviews = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    try {
      const { data: rows, error } = await (supabaseAdmin as any)
        .from("reviews")
        .select("id, customer_name, rating, title, body, verified, created_at")
        .eq("product_slug", data.slug)
        .eq("approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return { reviews: (rows ?? []) as Array<{
        id: string; customer_name: string; rating: number;
        title: string | null; body: string; verified: boolean; created_at: string;
      }> };
    } catch {
      return { reviews: [] };
    }
  });

export const submitReview = createServerFn({ method: "POST" })
  .inputValidator((d: {
    product_slug: string;
    customer_name: string;
    customer_email: string;
    order_number?: string;
    rating: number;
    title?: string;
    body: string;
  }) => d)
  .handler(async ({ data }) => {
    if (!data.product_slug || !data.customer_name || !data.body || !data.rating) {
      throw new Error("Missing required fields");
    }
    if (data.rating < 1 || data.rating > 5) throw new Error("Rating must be 1–5");

    // Verify the order number + email if provided (marks as verified)
    let verified = false;
    if (data.order_number && data.customer_email) {
      const { data: order } = await (supabaseAdmin as any)
        .from("orders")
        .select("id")
        .eq("order_number", data.order_number.toUpperCase().trim())
        .ilike("customer_email", data.customer_email.trim())
        .maybeSingle();
      if (order) verified = true;
    }

    const { error } = await (supabaseAdmin as any)
      .from("reviews")
      .insert({
        product_slug:   data.product_slug,
        customer_name:  data.customer_name.trim(),
        customer_email: data.customer_email?.trim().toLowerCase() ?? "",
        order_number:   data.order_number?.toUpperCase().trim() ?? null,
        rating:         data.rating,
        title:          data.title?.trim() ?? null,
        body:           data.body.trim(),
        verified,
        approved:       false,
      });
    if (error) throw new Error(error.message);
    return { success: true };
  });

// Public: which payment providers are currently configured — drives which
// payment UI checkout.tsx renders. Returns false for both before real keys
// are added; never a fake/always-true default.
export const getPaymentMethodsAvailable = createServerFn({ method: "GET" }).handler(async () => {
  return { stripe: isStripeConfigured(), paypal: isPaypalConfigured() };
});

// Reserve → pay → finalize: this is step 1. Validates prices server-side,
// atomically reserves stock (preventing overselling), opens a draft
// pending_orders row, and creates a Stripe PaymentIntent or PayPal order.
// No `orders` row exists yet — that only happens once finalizeOrder verifies
// payment actually succeeded.
export const initiateCheckout = createServerFn({ method: "POST" })
  .inputValidator(orderInputSchema)
  .handler(async ({ data }) => {
    checkHoneypot(data._hp);
    checkRateLimit("checkout", { windowMs: 10 * 60 * 1000, max: 8 });

    if (data.payment_method === "stripe" && !isStripeConfigured()) {
      throw new Error("Card payments are not available yet — please try PayPal or check back soon.");
    }
    if (data.payment_method === "paypal" && !isPaypalConfigured()) {
      throw new Error("PayPal is not available yet — please try a card or check back soon.");
    }

    const priced = await validateAndPriceOrder(data.items, {
      discountAmount: data.discount_amount,
      shippingMethod: data.shipping_method,
    });

    const db = supabaseAdmin as any;
    const reservationToken = crypto.randomUUID();
    const reserved: string[] = [];

    try {
      for (const item of data.items) {
        const { error: resErr } = await db.rpc("reserve_stock", {
          p_slug: item.slug,
          p_variant_id: null,
          p_qty: item.quantity,
          p_token: reservationToken,
          p_ttl_seconds: 900,
        });
        if (resErr) throw new Error(`${item.name} just sold out — please remove it and try again.`);
        reserved.push(item.slug);
      }
    } catch (e) {
      await db.rpc("release_reservation", { p_token: reservationToken }).catch(() => {});
      throw e;
    }

    const payload = {
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone || null,
      shipping_address_line1: data.shipping_address_line1,
      shipping_address_line2: data.shipping_address_line2 || null,
      shipping_city: data.shipping_city,
      shipping_state: data.shipping_state,
      shipping_zip: data.shipping_zip,
      shipping_country: data.shipping_country,
      notes: data.notes || null,
      items: data.items,
      subtotal: priced.subtotal,
      discount_amount: priced.discount,
      promo_code: data.promo_code || null,
      shipping: priced.shipping,
      tax: priced.tax,
      total: priced.total,
      shipping_method: priced.shippingMethod,
    };

    const { error: pendingErr } = await db.from("pending_orders").insert({
      reservation_token: reservationToken,
      payment_method: data.payment_method,
      payload,
      status: "pending",
      expires_at: new Date(Date.now() + 900_000).toISOString(),
    });
    if (pendingErr) {
      await db.rpc("release_reservation", { p_token: reservationToken }).catch(() => {});
      alertAdminOnError(`initiateCheckout pending_orders insert (token ${reservationToken})`, pendingErr);
      throw new Error(pendingErr.message);
    }

    if (data.payment_method === "stripe") {
      const { clientSecret, paymentIntentId } = await createStripePaymentIntent({
        amountCents: Math.round(priced.total * 100),
        currency: "usd",
        metadata: { reservation_token: reservationToken },
      });
      await db.from("pending_orders").update({ stripe_payment_intent_id: paymentIntentId }).eq("reservation_token", reservationToken);
      return { provider: "stripe" as const, clientSecret, reservationToken, total: priced.total };
    }

    const paypalOrder = await createPaypalOrder({
      amount: priced.total.toFixed(2),
      currency: "USD",
      referenceId: reservationToken,
    });
    await db.from("pending_orders").update({ paypal_order_id: paypalOrder.id }).eq("reservation_token", reservationToken);
    return { provider: "paypal" as const, paypalOrderId: paypalOrder.id, reservationToken, total: priced.total };
  });

// Step 2: called by the client right after the provider confirms payment,
// AND independently by the provider's webhook — finalizeReservation is
// idempotent so both calls land safely on the same outcome. Never trusts
// client-supplied payment ids; re-verifies directly against the provider.
export const finalizeOrder = createServerFn({ method: "POST" })
  .inputValidator((d: { reservationToken: string }) => d)
  .handler(async ({ data }) => {
    return finalizeReservation(data.reservationToken);
  });
