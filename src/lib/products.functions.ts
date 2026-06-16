import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ALL_PRODUCTS } from "@/lib/products.data";
import { getTennisBraceletPrice } from "@/lib/pricing";
import { sendOrderConfirmation } from "@/lib/email";

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
  .inputValidator((d: { email: string; source?: string }) => d)
  .handler(async ({ data }) => {
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

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator(orderInputSchema)
  .handler(async ({ data }) => {
    const sizeMult: Record<string, number> = { "2mm": 1, "3mm": 1.45, "4mm": 1.95, "5mm": 2.55, "6.5mm": 3.45 };
    const earringSizeMult: Record<string, number> = { "3mm": 1, "4mm": 1.17, "5mm": 1.34, "6mm": 1.85, "8mm": 2.69 };
    const ringSizeMult: Record<string, number> = { "0.5ct": 1.0, "1ct": 2.0, "1.5ct": 3.2, "2ct": 4.8, "3ct": 8.0 };
    const lenAdd: Record<string, number> = { '16"': -20, '18"': 0, '20"': 30, '22"': 50, '24"': 70, '6"': -25, '7"': -12, '8"': 0, '9"': 18 };

    // Build a slug → {base_price, type} map: DB first, static fallback
    const slugs = [...new Set(data.items.map((i) => i.slug))];
    const productMap = new Map<string, { base_price: number; type: string }>();
    try {
      const { data: rows } = await supabaseAdmin
        .from("products")
        .select("slug, base_price, type")
        .in("slug", slugs as any);
      for (const row of rows ?? []) {
        productMap.set((row as any).slug, {
          base_price: Number((row as any).base_price),
          type: (row as any).type,
        });
      }
    } catch {}
    // Fill any still-missing slugs from static catalog
    for (const slug of slugs) {
      if (!productMap.has(slug)) {
        const s = ALL_PRODUCTS.find((p) => p.slug === slug);
        if (s) productMap.set(slug, { base_price: Number(s.base_price), type: s.type });
      }
    }

    // Read shipping + tax config from DB (authoritative)
    let freeShippingThreshold = 250;
    let flatShippingRate = 15;
    let taxRate = 0;
    try {
      const { data: settings } = await (supabaseAdmin as any)
        .from("store_settings")
        .select("key, value")
        .in("key", ["free_shipping_threshold", "flat_shipping_rate", "tax_rate"]);
      for (const s of settings ?? []) {
        if (s.key === "free_shipping_threshold") freeShippingThreshold = Number(s.value) || 250;
        if (s.key === "flat_shipping_rate")      flatShippingRate      = Number(s.value) || 15;
        if (s.key === "tax_rate")                taxRate               = Number(s.value) || 0;
      }
    } catch {}

    let subtotal = 0;
    for (const item of data.items) {
      const product = productMap.get(item.slug);
      if (!product) throw new Error(`Product not found: ${item.slug}`);

      let expected: number;
      if (item.slug.includes("tennis") && item.slug.includes("bracelet")) {
        expected = getTennisBraceletPrice(item.size, item.length);
      } else if (product.type === "earring") {
        expected = Math.round(product.base_price * (earringSizeMult[item.size] ?? 1));
      } else if (product.type === "ring") {
        expected = Math.max(299, Math.round(product.base_price * (ringSizeMult[item.size] ?? 1)));
      } else {
        expected = Math.round(
          product.base_price * (sizeMult[item.size] ?? 1) + (lenAdd[item.length] ?? 0),
        );
      }
      if (expected !== item.unitPrice) {
        throw new Error(`Price mismatch for ${item.name}`);
      }
      subtotal += expected * item.quantity;
    }

    const discount = Math.min(data.discount_amount ?? 0, subtotal);
    const method = data.shipping_method ?? "standard";
    let shipping: number;
    if (method === "express") {
      shipping = 24.95;
    } else if (method === "overnight") {
      shipping = 49.95;
    } else {
      shipping = (subtotal - discount) >= freeShippingThreshold ? 0 : flatShippingRate;
    }
    // Tax applied on (subtotal − discount), rounded to nearest cent
    const tax   = taxRate > 0 ? Math.round((subtotal - discount) * (taxRate / 100) * 100) / 100 : 0;
    const total = subtotal - discount + shipping + tax;

    try {
      const { data: order, error } = await (supabaseAdmin as any)
        .from("orders")
        .insert({
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
          items: data.items as any,
          subtotal,
          shipping,
          tax,
          total,
          promo_code: data.promo_code || null,
          discount_amount: discount,
          shipping_method: method,
          payment_status: "pending",
        })
        .select("order_number, total")
        .single();
      if (!error && order) {
        // Decrement stock (best-effort)
        try {
          for (const item of data.items) {
            await (supabaseAdmin as any).rpc("decrement_stock", {
              p_slug: item.slug,
              p_qty: item.quantity,
            });
          }
        } catch {}

        // Send order confirmation email (best-effort — never fails the order)
        const addressParts = [
          data.shipping_address_line1,
          data.shipping_address_line2,
          `${data.shipping_city}, ${data.shipping_state} ${data.shipping_zip}`,
          data.shipping_country !== "United States" ? data.shipping_country : null,
        ].filter(Boolean);
        sendOrderConfirmation({
          orderNumber:    order.order_number,
          customerName:   data.customer_name,
          customerEmail:  data.customer_email,
          items:          data.items as any,
          subtotal,
          discount,
          promoCode:      data.promo_code || null,
          shipping,
          tax,
          total:          Number(order.total),
          shippingMethod: method,
          shippingAddress: addressParts.join("<br/>"),
        }).catch((e) => console.warn("[Email] Order confirmation failed:", e));

        return { orderNumber: order.order_number, total: Number(order.total), tax };
      }
    } catch (e) {
      console.warn("[Orders] Supabase unavailable, using simulated order");
    }
    const orderNumber = `QJ-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    return { orderNumber, total, tax };
  });
