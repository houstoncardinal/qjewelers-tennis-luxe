import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendReturnConfirmation } from "@/lib/email";
import { requireAdmin, getCurrentAdminId, writeAuditLog } from "@/lib/admin.functions";
import { checkHoneypot, checkRateLimit } from "@/lib/rate-limit";
import { createStripeRefund, isStripeConfigured } from "@/lib/payments/stripe.server";
import { createPaypalRefund, isPaypalConfigured } from "@/lib/payments/paypal.server";
import { alertAdminOnError } from "@/lib/error-alert";
import { AVAILABLE_SIZES, AVAILABLE_LENGTHS } from "@/lib/pricing";
import OpenAI from "openai";

// Lazy-init: only instantiated if OPENAI_API_KEY is set in env
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// New tables (promo_codes, returns, store_settings) are not in generated types.
const db = supabaseAdmin as any;

// ─── Product Images ────────────────────────────────────────────────────────────

export const getProductImagesAdmin = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; slug: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { data: images, error } = await (supabaseAdmin as any)
      .from("product_images")
      .select("*")
      .eq("product_slug", data.slug)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return { images: images ?? [] };
  });

export const addProductImage = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string;
    product_slug: string;
    url: string;
    alt_text?: string;
    is_primary?: boolean;
  }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { token: _t, ...fields } = data;
    // Get max sort_order for this product
    const { data: existing } = await (supabaseAdmin as any)
      .from("product_images")
      .select("sort_order")
      .eq("product_slug", fields.product_slug)
      .order("sort_order", { ascending: false })
      .limit(1);
    const maxOrder = (existing?.[0]?.sort_order ?? -1) + 1;
    const { data: created, error } = await (supabaseAdmin as any)
      .from("product_images")
      .insert({
        product_slug: fields.product_slug,
        url: fields.url,
        alt_text: fields.alt_text ?? "",
        sort_order: maxOrder,
        is_primary: fields.is_primary ?? false,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { image: created };
  });

export const updateProductImage = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string;
    id: string;
    url?: string;
    alt_text?: string;
    sort_order?: number;
    is_primary?: boolean;
  }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { token: _t, id, ...fields } = data;
    const { error } = await (supabaseAdmin as any)
      .from("product_images")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteProductImage = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { error } = await (supabaseAdmin as any)
      .from("product_images")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const reorderProductImages = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string;
    slug: string;
    order: { id: string; sort_order: number; is_primary?: boolean }[];
  }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const updates = data.order.map((item) =>
      (supabaseAdmin as any)
        .from("product_images")
        .update({ sort_order: item.sort_order, is_primary: item.is_primary ?? false })
        .eq("id", item.id)
    );
    await Promise.all(updates);
    return { success: true };
  });

// ─── Products (admin) ─────────────────────────────────────────────────────────

export const listAdminProductsAll = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return { products: products ?? [] };
  });

export const getAdminProduct = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; slug: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { data: product, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!product) throw new Error("Product not found");
    return { product };
  });

export const updateProduct = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string;
    slug: string;
    name?: string;
    short_description?: string;
    description?: string;
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string;
    tags?: string[];
    base_price?: number;
    sale_price?: number | null;
    sale_active?: boolean;
    image_url?: string;
    is_featured?: boolean;
    is_active?: boolean;
    sort_order?: number;
    admin_notes?: string;
    track_inventory?: boolean;
    stock_quantity?: number | null;
    color_images?: Record<string, string>;
    type?: string;
    color?: string;
    size?: string | null;
    length?: string | null;
  }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { slug, token: _t, ...fields } = data;
    const { error } = await supabaseAdmin
      .from("products")
      .update({ ...fields, updated_at: new Date().toISOString() } as any)
      .eq("slug", slug);
    if (error) throw new Error(error.message);
    writeAuditLog({
      adminUserId: getCurrentAdminId(),
      action: "product_updated",
      targetType: "products",
      targetId: slug,
      details: fields,
    }).catch((e) => console.warn("[AuditLog] product_updated failed:", e));
    return { success: true };
  });

export const createProduct = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string;
    slug: string;
    name: string;
    type: string;
    color: string;
    size?: string | null;
    length?: string | null;
    short_description: string;
    description: string;
    seo_title: string;
    seo_description: string;
    seo_keywords?: string;
    tags?: string[];
    base_price: number;
    image_url?: string;
    is_featured?: boolean;
    is_active?: boolean;
    sort_order?: number;
  }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { token: _t, ...fields } = data;
    const payload = {
      ...fields,
      image_url: fields.image_url || "/main.jpg",
      is_featured: fields.is_featured ?? false,
      is_active: fields.is_active ?? true,
      sort_order: fields.sort_order ?? 999,
      seo_keywords: fields.seo_keywords ?? "",
      tags: fields.tags ?? [],
    };
    const { data: created, error } = await supabaseAdmin
      .from("products")
      .insert(payload as any)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { product: created };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; slug: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("slug", data.slug);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const bulkUpdateProducts = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string;
    slugs: string[];
    updates: { is_active?: boolean; is_featured?: boolean };
  }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    if (!data.slugs.length) return { success: true };
    const { error } = await supabaseAdmin
      .from("products")
      .update({ ...data.updates, updated_at: new Date().toISOString() } as any)
      .in("slug", data.slugs);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const bulkDeleteProducts = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; slugs: string[] }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    if (!data.slugs.length) return { success: true };
    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .in("slug", data.slugs);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteAllProducts = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    // .neq("slug", "") matches every row (all slugs are non-empty)
    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .neq("slug", "");
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const duplicateProduct = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; slug: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { data: source, error: fetchErr } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (fetchErr || !source) throw new Error("Source product not found");
    // Build unique slug
    let newSlug = `${data.slug}-copy`;
    const { data: existing } = await supabaseAdmin
      .from("products")
      .select("slug")
      .eq("slug", newSlug)
      .maybeSingle();
    if (existing) newSlug = `${data.slug}-copy-${Date.now()}`;
    const { id: _id, created_at: _ca, updated_at: _ua, slug: _s, ...rest } = source as any;
    const { data: created, error } = await supabaseAdmin
      .from("products")
      .insert({
        ...rest,
        slug: newSlug,
        name: `${(source as any).name} (Copy)`,
        is_active: false,
      } as any)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { product: created, newSlug };
  });

export const quickUpdateProduct = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string;
    slug: string;
    is_active?: boolean;
    is_featured?: boolean;
    sale_active?: boolean;
    base_price?: number;
  }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { token: _t, slug, ...fields } = data;
    const { error } = await supabaseAdmin
      .from("products")
      .update({ ...fields, updated_at: new Date().toISOString() } as any)
      .eq("slug", slug);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Promo codes ──────────────────────────────────────────────────────────────

export const listPromoCodes = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { data: codes, error } = await db
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { codes: codes ?? [] };
  });

export const createPromoCode = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string;
    code: string;
    name: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    min_order_amount: number;
    max_uses?: number | null;
    expires_at?: string | null;
    active: boolean;
  }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { token: _t, ...fields } = data;
    const { data: created, error } = await db
      .from("promo_codes")
      .insert({ ...fields, code: fields.code.toUpperCase().trim() })
      .select()
      .single();
    if (error) throw new Error(error.message);
    writeAuditLog({
      adminUserId: getCurrentAdminId(),
      action: "promo_code_created",
      targetType: "promo_codes",
      targetId: created.id,
      details: { code: created.code },
    }).catch((e) => console.warn("[AuditLog] promo_code_created failed:", e));
    return { code: created };
  });

export const updatePromoCode = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string;
    id: string;
    name?: string;
    discount_type?: "percentage" | "fixed";
    discount_value?: number;
    min_order_amount?: number;
    max_uses?: number | null;
    expires_at?: string | null;
    active?: boolean;
  }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { token: _t, id, ...fields } = data;
    const { error } = await db
      .from("promo_codes")
      .update(fields as any)
      .eq("id", id);
    if (error) throw new Error(error.message);
    writeAuditLog({
      adminUserId: getCurrentAdminId(),
      action: "promo_code_updated",
      targetType: "promo_codes",
      targetId: id,
      details: fields,
    }).catch((e) => console.warn("[AuditLog] promo_code_updated failed:", e));
    return { success: true };
  });

export const deletePromoCode = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { error } = await db
      .from("promo_codes")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    writeAuditLog({
      adminUserId: getCurrentAdminId(),
      action: "promo_code_deleted",
      targetType: "promo_codes",
      targetId: data.id,
    }).catch((e) => console.warn("[AuditLog] promo_code_deleted failed:", e));
    return { success: true };
  });

// Public: validate a promo code at checkout
export const validatePromoCode = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; orderSubtotal: number }) => d)
  .handler(async ({ data }) => {
    const { data: promo, error } = await db
      .from("promo_codes")
      .select("*")
      .eq("code", data.code.toUpperCase().trim())
      .eq("active", true)
      .maybeSingle();

    if (error || !promo) throw new Error("Invalid promo code");

    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      throw new Error("This promo code has expired");
    }
    if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
      throw new Error("This promo code has reached its usage limit");
    }
    if (data.orderSubtotal < Number(promo.min_order_amount)) {
      throw new Error(`Minimum order of $${Number(promo.min_order_amount).toFixed(2)} required`);
    }

    const discountAmount =
      promo.discount_type === "percentage"
        ? Math.round((data.orderSubtotal * Number(promo.discount_value)) / 100)
        : Math.min(Number(promo.discount_value), data.orderSubtotal);

    return {
      valid: true as const,
      promoId: promo.id,
      code: promo.code as string,
      name: promo.name as string,
      discountType: promo.discount_type as string,
      discountValue: Number(promo.discount_value),
      discountAmount,
    };
  });

// ─── Returns ─────────────────────────────────────────────────────────────────

export const listReturns = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { data: returns, error } = await db
      .from("returns")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { returns: returns ?? [] };
  });

export const getReturn = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; returnId: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { data: ret, error } = await db
      .from("returns")
      .select("*")
      .eq("id", data.returnId)
      .single();
    if (error) throw new Error(error.message);
    return { return: ret };
  });

export const updateReturn = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string;
    returnId: string;
    status?: string;
    refund_amount?: number | null;
    tracking_number?: string;
    admin_notes?: string;
  }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { token: _t, returnId, ...fields } = data;
    const { error } = await db
      .from("returns")
      .update({ ...fields, updated_at: new Date().toISOString() } as any)
      .eq("id", returnId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// Executes a real refund against the order's original payment provider.
// Distinct from updateReturn — this is the only path that actually moves money.
export const executeReturnRefund = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; returnId: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);

    const { data: ret, error: retError } = await db
      .from("returns")
      .select("id, order_id, refund_amount, refund_status")
      .eq("id", data.returnId)
      .single();
    if (retError) throw new Error(retError.message);
    if (!ret) throw new Error("Return not found");
    if (ret.refund_status === "succeeded") throw new Error("This return has already been refunded");
    if (!ret.refund_amount || ret.refund_amount <= 0) throw new Error("Set a refund amount before processing");

    const { data: order, error: orderError } = await db
      .from("orders")
      .select("payment_method, payment_reference, total")
      .eq("id", ret.order_id)
      .single();
    if (orderError) throw new Error(orderError.message);
    if (!order) throw new Error("Linked order not found");
    if (ret.refund_amount > Number(order.total)) {
      throw new Error("Refund amount cannot exceed the order total");
    }

    await db.from("returns").update({ refund_status: "processing" }).eq("id", data.returnId);

    try {
      let refundId: string;
      const amountCents = Math.round(ret.refund_amount * 100);

      if (order.payment_method === "stripe") {
        if (!isStripeConfigured()) throw new Error("Stripe is not configured");
        if (!order.payment_reference) throw new Error("Order has no Stripe payment reference");
        const refund = await createStripeRefund({ paymentIntentId: order.payment_reference, amountCents });
        refundId = refund.refundId;
      } else if (order.payment_method === "paypal") {
        if (!isPaypalConfigured()) throw new Error("PayPal is not configured");
        if (!order.payment_reference) throw new Error("Order has no PayPal capture reference");
        const refund = await createPaypalRefund({
          captureId: order.payment_reference,
          amount: ret.refund_amount.toFixed(2),
        });
        refundId = refund.refundId;
      } else {
        throw new Error(`Unknown payment method: ${order.payment_method ?? "none"}`);
      }

      await db.from("returns").update({
        status: "refunded",
        refund_status: "succeeded",
        refund_reference: refundId,
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", data.returnId);

      writeAuditLog({
        adminUserId: getCurrentAdminId(),
        action: "refund_executed",
        targetType: "returns",
        targetId: data.returnId,
        details: { refundId, amount: ret.refund_amount, paymentMethod: order.payment_method },
      }).catch((e) => console.warn("[AuditLog] refund_executed failed:", e));

      return { success: true, refundId };
    } catch (e) {
      await db.from("returns").update({ refund_status: "failed" }).eq("id", data.returnId);
      alertAdminOnError(`executeReturnRefund (return ${data.returnId})`, e);
      throw e instanceof Error ? e : new Error("Refund failed");
    }
  });

// Public: customer submits a return request
export const submitReturn = createServerFn({ method: "POST" })
  .inputValidator((d: {
    order_number: string;
    customer_name: string;
    customer_email: string;
    reason: string;
    items: { name: string; quantity: number }[];
    _hp?: string;
  }) => d)
  .handler(async ({ data }) => {
    checkHoneypot(data._hp);
    checkRateLimit("submit-return", { windowMs: 15 * 60 * 1000, max: 6 });

    if (!data.order_number || !data.customer_email || !data.reason) {
      throw new Error("Missing required fields");
    }

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, order_number")
      .eq("order_number", data.order_number.toUpperCase().trim())
      .ilike("customer_email", data.customer_email.trim())
      .maybeSingle();

    if (!order) throw new Error("Order not found — please check your order number and email");

    const { error } = await db
      .from("returns")
      .insert({
        order_number: order.order_number,
        order_id: order.id,
        customer_name: data.customer_name,
        customer_email: data.customer_email.trim().toLowerCase(),
        reason: data.reason,
        items: data.items,
      });

    if (error) throw new Error(error.message);

    // Confirmation email (best-effort)
    sendReturnConfirmation({
      orderNumber:   order.order_number,
      customerName:  data.customer_name,
      customerEmail: data.customer_email.trim().toLowerCase(),
      reason:        data.reason,
    }).catch((e) => console.warn("[Email] Return confirmation failed:", e));

    return { success: true };
  });

// ─── Store Settings ───────────────────────────────────────────────────────────

export const getStoreSettings = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { data: rows, error } = await db
      .from("store_settings")
      .select("*")
      .order("key");
    if (error) throw new Error(error.message);
    const settings: Record<string, { value: string; label: string }> = {};
    for (const row of rows ?? []) {
      settings[row.key] = { value: row.value, label: row.label };
    }
    return { settings };
  });

export const updateStoreSetting = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; key: string; value: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { error } = await db
      .from("store_settings")
      .update({ value: data.value, updated_at: new Date().toISOString() })
      .eq("key", data.key);
    if (error) throw new Error(error.message);
    writeAuditLog({
      adminUserId: getCurrentAdminId(),
      action: "store_setting_updated",
      targetType: "store_settings",
      targetId: data.key,
      details: { value: data.value },
    }).catch((e) => console.warn("[AuditLog] store_setting_updated failed:", e));
    return { success: true };
  });

// ─── Dashboard extended stats ─────────────────────────────────────────────────

export const getDashboardExtended = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);

    const [returnsRes, promosRes] = await Promise.all([
      db.from("returns").select("status").eq("status", "pending"),
      db.from("promo_codes").select("id").eq("active", true),
    ]);

    return {
      pendingReturns: returnsRes.data?.length ?? 0,
      activePromos:   promosRes.data?.length ?? 0,
    };
  });

// ─── URL Product Importer ─────────────────────────────────────────────────────
// Scrapes a product page (supplier sites or most other listing
// sites) for images, description, and spec attributes via several
// site-agnostic heuristics — meta tags, JSON-LD, and the embedded JSON blobs
// these marketplaces ship product data in. There's no AI model involved: the
// "SEO title" step is a deterministic rule-based cleanup/recompose, not a
// generative one, so it only kicks in when it recognizes enough signal
// (moissanite + a known product type) to safely rewrite the title — otherwise
// it falls back to a cleaned, title-cased version of whatever was scraped.

// ─── Jina AI Reader — routes through headless browsers, bypasses bot walls ────
// https://r.jina.ai/{url} — free tier, no API key required.
// Set JINA_API_KEY env var for higher rate limits.
async function fetchViaJina(url: string): Promise<{
  title: string; content: string; images: string[];
} | null> {
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const headers: Record<string, string> = {
      "Accept": "application/json",
      "X-Return-Format": "markdown",
      "X-No-Cache": "true",
    };
    const apiKey = process.env.JINA_API_KEY;
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const res = await fetch(jinaUrl, {
      headers,
      signal: AbortSignal.timeout(28000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.code !== 200 || !json.data) return null;

    const images: string[] = Object.values(json.data.images ?? {})
      .filter((u): u is string => typeof u === "string" && u.startsWith("http"))
      .filter(u => /\.(jpe?g|png|webp|avif)/i.test(u) || u.includes("img") || u.includes("image"))
      .slice(0, 15);

    return {
      title: String(json.data.title ?? ""),
      content: String(json.data.content ?? json.data.description ?? ""),
      images,
    };
  } catch {
    return null;
  }
}

// ─── Multi-strategy URL fetcher ───────────────────────────────────────────────
// Tries up to 4 different browser fingerprints + mobile URL fallback before
// giving up. Each attempt is independent; we continue on any network or HTTP
// error so a single 403 or timeout doesn't abort the whole import.

async function fetchWithRetry(url: string): Promise<string> {
  const UAS: [string, Record<string, string>][] = [
    // Chrome macOS — most common, try first
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
     { "Sec-Fetch-Dest": "document", "Sec-Fetch-Mode": "navigate", "Sec-Fetch-Site": "none" }],
    // Chrome Windows + Google referer (helps with some bot checks)
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
     { "Referer": "https://www.google.com/", "Cache-Control": "no-cache" }],
    // Safari macOS — minimally fingerprinted
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15",
     { "Accept": "text/html,application/xhtml+xml,*/*;q=0.8" }],
    // iPhone Safari — mobile product pages often have fewer bot walls
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
     { "Accept": "text/html,application/xhtml+xml,*/*;q=0.9" }],
  ];

  // Build the list of (url, ua, extraHeaders) attempts.
  // Mobile variants of known marketplaces are inserted as additional attempts.
  const mobileUrl = url
    .replace("//www.alibaba.com/", "//m.alibaba.com/")
    .replace("//www.aliexpress.com/", "//m.aliexpress.com/")
    .replace("//www.1688.com/", "//m.1688.com/")
    .replace("//www.dhgate.com/", "//m.dhgate.com/");
  const hasMobile = mobileUrl !== url;

  const attempts: Array<{ url: string; ua: string; extra: Record<string, string> }> = [
    { url, ua: UAS[0][0], extra: UAS[0][1] },
    { url, ua: UAS[1][0], extra: UAS[1][1] },
    ...(hasMobile ? [{ url: mobileUrl, ua: UAS[3][0], extra: UAS[3][1] }] : []),
    { url, ua: UAS[2][0], extra: UAS[2][1] },
  ];

  let lastError = "Unknown error";
  for (const { url: targetUrl, ua, extra } of attempts) {
    try {
      const res = await fetch(targetUrl, {
        headers: {
          "User-Agent": ua,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          ...extra,
        },
        redirect: "follow",
        signal: AbortSignal.timeout(16000),
      });
      if (!res.ok) { lastError = `HTTP ${res.status}`; await pause(600); continue; }
      const html = await res.text();
      if (html.length < 3000 && /captcha|robot|verify\s+you're\s+human|access\s+denied/i.test(html)) {
        lastError = "Bot detection wall"; await pause(600); continue;
      }
      return html;
    } catch (e: any) {
      lastError = e?.message ?? "Network error";
      await pause(600);
    }
  }
  throw new Error(lastError);
}

const pause = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Extended spec detectors ──────────────────────────────────────────────────

function detectStoneShape(text: string): string | null {
  if (/\bround\s*brilliant\b/i.test(text))   return "round brilliant";
  if (/\boval\s*(?:cut|shape|brilliant)?\b/i.test(text)) return "oval";
  if (/\bcushion\s*(?:cut|shape)?\b/i.test(text)) return "cushion";
  if (/\bprincess\s*(?:cut|shape)?\b/i.test(text)) return "princess";
  if (/\bpear\s*(?:cut|shape)?\b/i.test(text)) return "pear";
  if (/\bemerald\s*cut\b/i.test(text))         return "emerald";
  if (/\bradiant\s*(?:cut|shape)?\b/i.test(text)) return "radiant";
  if (/\bheart\s*(?:cut|shape)?\b/i.test(text))  return "heart";
  if (/\bmarquise\b/i.test(text))              return "marquise";
  if (/\bround\b/i.test(text))                 return "round brilliant";
  return null;
}

function detectMetalPurity(text: string): string | null {
  if (/\b(?:s?925|sterling\s+silver|silver\s+925)\b/i.test(text)) return "S925";
  if (/\b18\s*[Kk]\b|\b18\s*karat\b|\b750\b/i.test(text)) return "18K";
  if (/\b14\s*[Kk]\b|\b14\s*karat\b|\b585\b/i.test(text)) return "14K";
  if (/\b10\s*[Kk]\b|\b10\s*karat\b/i.test(text))          return "10K";
  return null;
}

// ─── Supplier variant extractor ──────────────────────────────────────────────
// Alibaba / AliExpress / DHgate embed ALL variation data (SKU attributes +
// per-tier prices) as JSON inside <script> tags. This function tries every
// known pattern to surface the full matrix BEFORE handing off to GPT-4o,
// so the AI can reason about concrete numbers rather than guessing.

export interface ExtractedVariant {
  attributes: Record<string, string>; // { width:"3mm", color:"gold", length:"18in" }
  unitPrice:  number | null;          // per-unit cost at min MOQ
}

export function extractSupplierVariants(html: string): {
  variants:       ExtractedVariant[];
  minPrice:       number | null;
  rawPricingText: string;           // human-readable pricing lines for the AI prompt
} {
  const variants: ExtractedVariant[] = [];
  let minPrice: number | null = null;
  const pricingLines: string[] = [];

  const parsePrice = (s: string): number | null => {
    const n = parseFloat(String(s ?? "").replace(/[^0-9.]/g, ""));
    return (n > 0.1 && n < 5000) ? n : null;
  };
  const normKey = (s: string) =>
    s.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  const trackMin = (p: number | null) => {
    if (p && (!minPrice || p < minPrice)) minPrice = p;
  };

  // ── 1. AliExpress / Alibaba: window.runParams (skuModule) ─────────────────
  const rpM = html.match(/window\.runParams\s*=\s*(\{[\s\S]{500,500000}?\});\s*(?:window\.|var |let |const |\/\/|<)/);
  if (rpM) {
    try {
      const rp = JSON.parse(rpM[1]);
      const skuMod = rp?.data?.skuModule ?? rp?.skuModule;
      if (skuMod) {
        const salePropList: any[] = skuMod.productSKUPropertyList ?? skuMod.skuBase?.saleProp ?? [];
        const priceList: any[]    = skuMod.skuPriceList ?? [];
        for (const priceItem of priceList) {
          const attrs: Record<string, string> = {};
          const propIds = String(priceItem.skuPropIds ?? "").split(",");
          for (const prop of salePropList) {
            const pName = prop.skuPropertyName ?? prop.propertyName ?? "";
            for (const val of (prop.skuPropertyValues ?? prop.propertyValues ?? [])) {
              const valId = String(val.propertyValueId ?? val.skuPropertyValueId ?? "");
              if (propIds.includes(valId)) {
                attrs[normKey(pName)] = val.propertyValueName ?? val.skuPropertyValueName ?? valId;
              }
            }
          }
          const p = parsePrice(priceItem.skuAmount?.value ?? priceItem.skuVal?.actSkuCalPrice ?? "");
          variants.push({ attributes: attrs, unitPrice: p });
          trackMin(p);
        }
        // Also grab displayed sale properties as dimension summary
        for (const prop of salePropList) {
          const pName = prop.skuPropertyName ?? prop.propertyName ?? "";
          const vals: string[] = (prop.skuPropertyValues ?? []).map(
            (v: any) => v.propertyValueName ?? v.skuPropertyValueName ?? ""
          ).filter(Boolean);
          if (pName && vals.length) pricingLines.push(`${pName}: ${vals.join(", ")}`);
        }
      }
    } catch {}
  }

  // ── 2. Next.js pages: window.__NEXT_DATA__ ────────────────────────────────
  if (variants.length === 0) {
    const ndM = html.match(/window\.__NEXT_DATA__\s*=\s*(\{[\s\S]{500,800000}?\})\s*<\/script>/);
    if (ndM) {
      try {
        const nd = JSON.parse(ndM[1]);
        const prod =
          nd?.props?.pageProps?.data?.productInfo ??
          nd?.props?.pageProps?.data?.product ??
          nd?.props?.pageProps?.detailData ??
          nd?.props?.initialData?.data;
        const skus: any[] = prod?.skuList ?? prod?.variantList ?? prod?.skus ?? [];
        for (const sku of skus) {
          const attrs: Record<string, string> = {};
          const raw = sku.attributes ?? sku.attributeMap ?? sku.skuAttributes ?? {};
          if (Array.isArray(raw)) {
            for (const a of raw) attrs[normKey(String(a.name ?? a.key ?? ""))] = String(a.value ?? "");
          } else {
            for (const [k, v] of Object.entries(raw)) attrs[normKey(k)] = String(v);
          }
          const p = parsePrice(String(sku.price ?? sku.unitPrice ?? sku.salePrice ?? ""));
          variants.push({ attributes: attrs, unitPrice: p });
          trackMin(p);
        }
      } catch {}
    }
  }

  // ── 3. Generic skuList / variantList JSON blobs ────────────────────────────
  if (variants.length === 0) {
    for (const key of ["skuList", "skuStockList", "variantList", "skuBoardList", "productSkuList", "offerList"]) {
      const m = html.match(new RegExp(`"${key}"\\s*:\\s*(\\[\\s*\\{[\\s\\S]{10,80000}?\\}\\s*\\])`, "s"));
      if (!m) continue;
      try {
        const list = JSON.parse(m[1]) as any[];
        for (const sku of list) {
          const attrs: Record<string, string> = {};
          const rawA = sku.attributes ?? sku.skuAttributes ?? sku.attrList ?? sku.props ?? [];
          if (typeof rawA === "string") {
            for (const part of rawA.split(/[;,]/)) {
              const [k, v] = part.split(":").map((s: string) => s.trim());
              if (k && v) attrs[normKey(k)] = v;
            }
          } else if (Array.isArray(rawA)) {
            for (const a of rawA) {
              const k = a.name ?? a.attrName ?? a.key ?? a.prop ?? "";
              const v = a.value ?? a.attrValue ?? a.val ?? "";
              if (k) attrs[normKey(String(k))] = String(v);
            }
          }
          const p = parsePrice(String(sku.price ?? sku.unitPrice ?? sku.salePrice ?? sku.skuPrice ?? ""));
          if (Object.keys(attrs).length > 0 || p) { variants.push({ attributes: attrs, unitPrice: p }); trackMin(p); }
        }
        if (variants.length > 0) break;
      } catch {}
    }
  }

  // ── 4. attributeList / saleProps — variation dimensions (no per-SKU price) ─
  if (pricingLines.length === 0) {
    for (const key of ["attributeList", "saleProps", "skuProps", "productAttribute", "specifications"]) {
      const m = html.match(new RegExp(`"${key}"\\s*:\\s*(\\[[\\s\\S]{10,15000}?\\])`, "s"));
      if (!m) continue;
      try {
        const list = JSON.parse(m[1]) as any[];
        for (const prop of list) {
          const pName = prop.attrName ?? prop.skuPropertyName ?? prop.name ?? prop.key ?? "";
          const vals: any[] = prop.attrValues ?? prop.skuPropertyValues ?? prop.values ?? prop.valueList ?? [];
          const valStrs = vals.map((v: any) => v.attrValue ?? v.skuPropertyValueName ?? v.value ?? String(v)).filter(Boolean);
          if (pName && valStrs.length) pricingLines.push(`${pName}: ${valStrs.join(", ")}`);
        }
      } catch {}
    }
  }

  // ── 5. Tiered pricing text — "≥1 Piece US$X.XX" / "1-9 pcs: $X.XX" ────────
  const tierRe = [
    /(?:≥|>=?)\s*1\s*(?:pcs?|piece|unit|pair|set)[^$\n]{0,40}US?\$\s*([\d.]+)/gi,
    /1\s*[-–]\s*\d+\s*(?:pcs?|piece|unit)[^$\n]{0,30}US?\$\s*([\d.]+)/gi,
    /US?\$\s*([\d.]+)\s*\/\s*(?:pcs?|piece|unit)/gi,
    /"startPrice"\s*:\s*"?([\d.]+)"?/g,
    /"priceFrom"\s*:\s*"?([\d.]+)"?/g,
    /"min_price"\s*:\s*"?([\d.]+)"?/g,
  ];
  for (const re of tierRe) {
    for (const m of html.matchAll(re)) {
      const p = parsePrice(m[1]);
      if (p) { pricingLines.push(`Min unit price: $${p}`); trackMin(p); break; }
    }
  }

  return {
    variants: variants.slice(0, 80),
    minPrice,
    rawPricingText: pricingLines.slice(0, 25).join("\n"),
  };
}

// Extract the supplier's wholesale unit price in USD (for markup calculation).
function detectSupplierPrice(text: string): number | null {
  // Price range: US $5.00 - $15.00, $3.50-$8.99/pc, etc.
  const rangeRe = /US?\$\s*(\d+(?:\.\d{1,2})?)\s*[-–~to]+\s*US?\$?\s*(\d+(?:\.\d{1,2})?)/gi;
  for (const m of text.matchAll(rangeRe)) {
    const lo = parseFloat(m[1]), hi = parseFloat(m[2]);
    if (lo > 0 && hi > 0 && hi < 500) return parseFloat(((lo + hi) / 2).toFixed(2));
  }
  // Single price: $12.99 /piece, US$8.50, etc.
  const singleRe = /US?\$\s*(\d+(?:\.\d{1,2})?)\s*(?:\/\s*(?:pc|piece|unit|set|pair))?/gi;
  for (const m of text.matchAll(singleRe)) {
    const p = parseFloat(m[1]);
    if (p > 0.5 && p < 500) return p;
  }
  return null;
}

// ─── OpenAI GPT-4o enrichment ─────────────────────────────────────────────────
// Sends extracted raw product data to GPT-4o and gets back luxury retail copy +
// precision spec extraction. Falls back gracefully (returns null) if
// OPENAI_API_KEY is not configured or the call fails/times out.

interface AIEnrichment {
  luxuryTitle:        string;
  shortDescription:   string;
  fullDescription:    string;
  seoDescription:     string;
  productType:        string | null;
  stoneShape:         string | null;
  metalPurity:        string | null;
  supplierPrice:      number | null;  // min unit cost at lowest MOQ
  caratWeight:        string | null;
  stoneDiameter:      string | null;
  stoneCount:         number | null;
  clarity:            string | null;
  colorGrade:         string | null;
  additionalTags:     string[];
  confidence:         "high" | "medium" | "low";
  detectedVariations: Array<{
    width?:     string;
    length?:    string;
    color?:     string;
    other?:     string;
    unitPrice:  number | null;
  }>;
}

async function enrichWithAI(params: {
  rawName:         string;
  rawDescription:  string;
  attributes:      { name: string; value: string }[];
  fullText:        string;
  detectedType:    string | null;
  detectedColors:  string[];
  sourceUrl:       string;
  extractedVariants?: ExtractedVariant[];
  rawPricingText?:  string;
  extractedMinPrice?: number | null;
}): Promise<AIEnrichment | null> {
  if (!openai) return null;

  const COLOR_LABEL: Record<string, string> = {
    silver: "S925 sterling silver", gold: "18K yellow gold",
    rose_gold: "18K rose gold", white_gold: "18K white gold",
  };
  const colorHint = params.detectedColors.map(c => COLOR_LABEL[c] ?? c).join(", ") || "unknown metal";
  const specBlock = params.attributes.slice(0, 25).map(a => `${a.name}: ${a.value}`).join("\n");

  // Build structured variant block for the prompt
  const variantBlock = (() => {
    if (params.extractedVariants && params.extractedVariants.length > 0) {
      const lines = params.extractedVariants.slice(0, 40).map(v => {
        const attrStr = Object.entries(v.attributes).map(([k, val]) => `${k}=${val}`).join(", ");
        return `  { ${attrStr}${v.unitPrice != null ? `, price=$${v.unitPrice}` : ""} }`;
      });
      return `\nExtracted SKU variants (${params.extractedVariants.length} total):\n${lines.join("\n")}`;
    }
    if (params.rawPricingText) return `\nVariation/pricing text from page:\n${params.rawPricingText}`;
    return "";
  })();

  const systemPrompt = `You are the senior product intelligence analyst and luxury copywriter for Qureshi Jewelers — a premium moissanite jewelry boutique where customers pay $89–$2,000 per piece. Your copy reads at the level of Tiffany & Co. and Mejuri: confident, precise, aspirational, never pushy or clichéd.

BRAND POSITIONING:
- We sell VVS1 D-Color moissanite (GRA certified) set in solid S925 sterling silver with 18K gold/rose gold/white gold plating
- We position moissanite as the superior, ethical, brilliant-cut alternative — never as a "cheap diamond"
- Avoid: "iced out", "drip", "swag", "flashy", "blingy", "dope" — not our brand
- Use: "precision", "brilliance", "craftsmanship", "hand-set", "calibrated", "aspirational", "refined"

STRICT RULES:
- NEVER reveal the supplier, source URL, or wholesale origin
- NEVER use: wholesale, factory, MOQ, hot sale, OEM, dropship, bulk, pcs, lot, sample, alibaba, aliexpress, supplier
- NEVER fabricate specifications — if uncertain, use null
- Output ONLY valid JSON — no markdown fences, no commentary`;

  const userPrompt = `Analyze this wholesale product and produce luxury retail copy + extract every verifiable specification and ALL available variations.

═══ RAW SUPPLIER DATA ═══
Title: ${params.rawName || "(none)"}
Description: ${params.rawDescription.slice(0, 3000) || "(none)"}
Specifications:
${specBlock || "(none)"}
${variantBlock}
${params.extractedMinPrice != null ? `Detected minimum unit price: $${params.extractedMinPrice}` : ""}
Additional page text: ${params.fullText.slice(0, 5000)}
Detected metal finish: ${colorHint}
Detected product type: ${params.detectedType || "unknown"}
Source: ${params.sourceUrl.replace(/[?#].*$/, "").slice(0, 120)}

═══ OUTPUT INSTRUCTIONS ═══
1. luxuryTitle: 70–140 chars, SEO-optimized, luxury language. Include key stone spec, metal, product type.
2. shortDescription: Exactly 1 sentence, 110–200 chars, elegant & precise. No filler.
3. fullDescription: 4–6 substantial paragraphs (double newline between each). Hero statement → technical brilliance → craftsmanship → stone quality → styling/occasion. Weave specs naturally. No bullet points.
4. seoDescription: Under 155 chars, primary keyword first, conversion-focused.
5. productType: necklace | bracelet | earring | ring | anklet | pendant | null
6. stoneShape: round brilliant | oval | cushion | princess | pear | emerald | radiant | heart | marquise | null
7. metalPurity: S925 | 10K | 14K | 18K | null
8. supplierPrice: The LOWEST per-unit price at MINIMUM order quantity (1-piece price). Use the extracted min price if given. null only if truly not found.
9. caratWeight: total CTW e.g. "2.0 CTW" or null
10. stoneDiameter: diameter of individual stones e.g. "3mm" or null
11. stoneCount: total number of stones or null
12. clarity: VVS1 | VVS2 | VS1 | SI1 | null
13. colorGrade: D | E | F | G | null
14. additionalTags: 8–12 specific lowercase hyphenated SEO tags
15. confidence: "high" if 6+ concrete specs | "medium" if 3–5 | "low" if mostly inferred
16. detectedVariations: Array of ALL available variation combinations. Each object must have some of: width (e.g. "3mm"), length (e.g. "18 inch"), color (e.g. "gold", "white gold", "rose gold"), other (any extra attribute), and unitPrice (per-unit cost at min MOQ — null if not known). Extract from the SKU data above, variation tables, or any attribute selectors. If the product has no meaningful variations, return []. Cap at 30 entries.

Return ONLY this exact JSON (no markdown, no commentary):
{"luxuryTitle":"","shortDescription":"","fullDescription":"","seoDescription":"","productType":null,"stoneShape":null,"metalPurity":null,"supplierPrice":null,"caratWeight":null,"stoneDiameter":null,"stoneCount":null,"clarity":null,"colorGrade":null,"additionalTags":[],"confidence":"medium","detectedVariations":[]}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 3500,
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt   },
      ],
    });
    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    return JSON.parse(raw) as AIEnrichment;
  } catch {
    return null;
  }
}

// Merge the base parse result with AI enrichment, preferring AI where available.
function mergeWithAI(
  base: {
    name: string; rawName: string; shortDescription: string; description: string;
    sourcePagePreview: string; images: string[]; attributes: { name: string; value: string }[];
    detectedType: string | null; detectedColors: string[]; detectedSizes: string[];
    detectedLengths: string[]; stoneCount: number | null; caratWeight: string | null;
    stoneDiameter: string | null; chainType: string | null; suggestedTags: string[];
    suggestedPrice: number | null; isBlocked: boolean;
    stoneShape: string | null; metalPurity: string | null; supplierPrice: number | null;
  },
  ai: AIEnrichment | null,
  sourceUrl: string
) {
  const aiEnriched = ai !== null;
  return {
    ...base,
    sourceUrl,
    aiEnriched,
    confidence:         ai?.confidence          ?? null,
    name:               (ai?.luxuryTitle        || base.name),
    shortDescription:   (ai?.shortDescription   || base.shortDescription),
    description:        (ai?.fullDescription    || base.description),
    seoDescription:     ai?.seoDescription      ?? "",
    detectedType:       ai?.productType         ?? base.detectedType,
    stoneCount:         ai?.stoneCount          ?? base.stoneCount,
    caratWeight:        ai?.caratWeight         ?? base.caratWeight,
    stoneDiameter:      ai?.stoneDiameter       ?? base.stoneDiameter,
    stoneShape:         ai?.stoneShape          ?? base.stoneShape,
    metalPurity:        ai?.metalPurity         ?? base.metalPurity,
    supplierPrice:      base.supplierPrice      ?? ai?.supplierPrice  ?? null,
    clarity:            ai?.clarity             ?? null,
    colorGrade:         ai?.colorGrade          ?? null,
    suggestedTags:      [...new Set([...base.suggestedTags, ...(ai?.additionalTags ?? [])])].slice(0, 18),
    detectedVariations: ai?.detectedVariations  ?? [],
  };
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function clampWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

// ─── Attribute / spec extraction (best-effort, multiple strategies) ───────────

function extractAttributes(html: string): { name: string; value: string }[] {
  const attrs: { name: string; value: string }[] = [];
  const seen = new Set<string>();
  const push = (rawName: string, rawValue: string) => {
    const name = decodeHtmlEntities(clampWhitespace(rawName)).slice(0, 60);
    const value = decodeHtmlEntities(clampWhitespace(rawValue)).slice(0, 200);
    if (!name || !value) return;
    if (/^(loading|undefined|null|n\/a|please)/i.test(value)) return;
    const key = name.toLowerCase();
    if (seen.has(key) || attrs.length >= 20) return;
    seen.add(key);
    attrs.push({ name, value });
  };

  // Strategy 1: JSON-LD additionalProperty (schema.org PropertyValue list) —
  // only from the first @type:"Product" block, same reasoning as the name/
  // image extraction below: later blocks on the page are often unrelated
  // "related products" carousels and must not contaminate this listing.
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]{1,20000}?)<\/script>/gi)) {
    try {
      const obj = JSON.parse(m[1]);
      const types = Array.isArray(obj["@type"]) ? obj["@type"] : [obj["@type"]];
      if (!types.includes("Product")) continue;
      const props = obj.additionalProperty ?? obj.additionalProperties;
      if (Array.isArray(props)) {
        for (const p of props) if (p?.name && p?.value !== undefined) push(String(p.name), String(p.value));
      }
      break;
    } catch {}
  }

  // Strategy 2: embedded JSON attribute arrays — supplier-style
  // product data blobs (key names vary by marketplace, so try several).
  const jsonAttrKeys = ["attributes", "productAttribute", "productProps", "attributeList", "skuProps", "saleProps"];
  for (const key of jsonAttrKeys) {
    const m = html.match(new RegExp(`"${key}"\\s*:\\s*(\\[[^\\]]{5,6000}\\])`, "s"));
    if (!m) continue;
    try {
      const list = JSON.parse(m[1]) as any[];
      for (const item of list) {
        const name = item?.attrName ?? item?.name ?? item?.key ?? item?.propertyName ?? item?.prop_name;
        const value = item?.attrValue ?? item?.value ?? item?.val ?? item?.propertyValue ?? item?.prop_value;
        if (name && value !== undefined) push(String(name), String(value));
      }
    } catch {}
  }

  // Strategy 3: generic HTML spec tables — <tr><td>Label</td><td>Value</td></tr>,
  // the most common cross-marketplace "Specifications" pattern.
  for (const m of html.matchAll(/<tr[^>]*>\s*<t[hd][^>]*>([^<]{1,60})<\/t[hd]>\s*<t[hd][^>]*>([^<]{1,200})<\/t[hd]>\s*<\/tr>/gi)) {
    push(m[1], m[2]);
  }

  return attrs.slice(0, 20);
}

// ─── Type / variant detection — matched against this store's own catalog vocabulary ──

const TYPE_KEYWORDS: [string, RegExp][] = [
  ["necklace", /\b(necklace|chain|pendant)\b/i],
  ["bracelet", /\b(bracelet|bangle)\b/i],
  ["earring", /\b(earrings?|studs?)\b/i],
  ["ring", /\b(rings?)\b/i],
];

const COLOR_KEYWORDS: [string, RegExp][] = [
  ["rose_gold", /\brose\s*gold\b/i],
  ["white_gold", /\bwhite\s*gold\b/i],
  ["gold", /\b(yellow\s*gold|18\s*k\s*gold|\bgold\b)/i],
  ["silver", /\b(sterling\s*silver|s\s*925|925\s*silver|\bsilver\b)/i],
];

function detectType(text: string): string | null {
  for (const [type, re] of TYPE_KEYWORDS) if (re.test(text)) return type;
  return null;
}

function detectColors(text: string): string[] {
  const found: string[] = [];
  for (const [color, re] of COLOR_KEYWORDS) if (re.test(text) && !found.includes(color)) found.push(color);
  return found;
}

function findCandidates(text: string, candidates: readonly string[]): string[] {
  return candidates.filter(c => {
    const esc = c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?<![\\w.])${esc}(?![\\w])`, "i").test(text);
  });
}

// Sizes/lengths are only ever a real *variant axis* when the source page
// names them as one explicitly (a "Size"/"Length" spec row) — scanning the
// whole title+description+attributes blob caught unrelated numbers in
// marketing prose (e.g. a sentence mentioning an 8mm option for comparison)
// and falsely turned a single fixed-spec product into a multi-variant one,
// generating extra variant rows that didn't belong. Structured attributes
// are checked first and are authoritative; full-text scanning is only a
// fallback, and even then is capped to a single best match — a loose
// fallback finding multiple candidates is more likely noise than a real
// multi-option product.
function detectSizeOrLength(
  attributes: { name: string; value: string }[],
  attrNamePattern: RegExp,
  fullText: string,
  candidates: readonly string[]
): string[] {
  const namedValues = attributes.filter(a => attrNamePattern.test(a.name)).map(a => a.value).join(" ");
  if (namedValues) {
    const found = findCandidates(namedValues, candidates);
    if (found.length > 0) return found;
  }
  const fallback = findCandidates(fullText, candidates);
  return fallback.slice(0, 1);
}

// Construction/setting details worth calling out specifically — these are
// what make a title or description read as written for *this* product
// rather than a generic template.
function detectFeatures(text: string): string | null {
  const prongMatch = text.match(/\b([3-8])[\s-]?prong\b/i);
  const prong = prongMatch ? `${prongMatch[1]} Prong Setting` : null;
  const clasp =
    /\bdouble[\s-]?lock\b/i.test(text) ? "Double Lock Clasp" :
    /\bscrew[\s-]?back\b/i.test(text) ? "Screw-Back Closure" :
    /\bpush[\s-]?back\b/i.test(text) ? "Push-Back Closure" :
    /\bhalo\b/i.test(text) ? "Halo Setting" :
    /\bbezel\b/i.test(text) ? "Bezel Setting" :
    /\bpav[eé]\b/i.test(text) ? "Pavé Accent" : null;
  if (prong && clasp) return `${prong} With ${clasp}`;
  return prong ?? clasp;
}

// Attribute names that identify the source manufacturer/supplier rather than
// describing the product itself — these must never reach customer-facing
// copy, even though they're shown to the admin in the import preview.
const UNSAFE_ATTRIBUTE_NAME = /brand|manufactur|supplier|model\s*(no|number)?|company|origin|factory|\boem\b|\bodm\b|seller|store\s*name|trademark/i;

function isSafeAttribute(name: string): boolean {
  return !UNSAFE_ATTRIBUTE_NAME.test(name);
}

// ─── SEO title generator — deterministic cleanup + recompose, not AI ──────────

const TITLE_NOISE = [
  /\bwholesale\b/gi, /\bfactory\s*price\b/gi, /\bhot\s*sale\b/gi, /\boem\b/gi, /\bodm\b/gi,
  /\bfree\s*shipping\b/gi, /\bnew\s*arrival\b/gi, /\bbest\s*seller\b/gi, /\bdrop\s*shipping\b/gi,
  /\bin\s*stock\b/gi, /\bcustomi[sz]ed?\b/gi, /\blow\s*moq\b/gi, /\bmoq\s*\d+\s*pcs?\b/gi,
  /\bdirect\s*from\s*factory\b/gi, /[!]{1,}/g,
  /\bhigh\s*quality\b/gi, /\bhot\s*selling\b/gi, /\btrendy\b/gi, /\bluxury\s*design\b/gi,
  /\bsupplier\b/gi, /\bmanufacturer\b/gi, /\bfor\s+women\b/gi, /\bfor\s+men\b/gi,
  /\bgift\s*box(?:\s*included)?\b/gi, /\bwith\s*(?:free\s+)?box\b/gi,
  /\d+\s*pcs?\s*(?:lot|pack|set|min(?:imum)?)?/gi,
  /\/\s*\d+\s*(?:colors?|styles?)\s*available\b/gi,
  /\bbirthday\s*gift\b/gi, /\bparty\s*jewelry\b/gi, /\bfashion\s*jewelry\b/gi,
];

const MINOR_WORDS = new Set(["a", "an", "the", "and", "or", "but", "for", "of", "in", "on", "with", "to", "by"]);

function titleCase(s: string): string {
  return s.split(" ").filter(Boolean).map((w, i) => {
    if (/^[A-Z0-9]+$/.test(w) && w.length <= 5) return w; // preserve acronyms: VVS1, S925, 18K
    const lw = w.toLowerCase();
    if (i > 0 && MINOR_WORDS.has(lw)) return lw;
    return lw.charAt(0).toUpperCase() + lw.slice(1);
  }).join(" ");
}

const TYPE_LABEL: Record<string, string> = {
  necklace: "Tennis Chain", bracelet: "Tennis Bracelet", earring: "Stud Earrings", ring: "Solitaire Ring",
};
const COLOR_TITLE_LABEL: Record<string, string> = {
  gold: "18K Gold", rose_gold: "18K Rose Gold", white_gold: "18K White Gold", silver: "S925 Sterling Silver",
};
const COLOR_PHRASE: Record<string, string> = {
  gold: "18K yellow gold", rose_gold: "18K rose gold", white_gold: "18K white gold", silver: "S925 sterling silver",
};

// ─── Extended detection helpers ────────────────────────────────────────────────

function detectStoneCount(fullText: string): number | null {
  const patterns = [
    /\b(\d+)[\s-]?(?:stone|stones|pcs|pieces?)\s+(?:moissanite|diamond|gemstone|crystal)/i,
    /(?:moissanite|diamond|gemstone|crystal)s?\s+(?:count|qty)?:?\s*(\d+)/i,
    /\b(\d{2,3})[\s-]?(?:stone|stones)\b/i,
    /total\s+(?:of\s+)?(\d+)\s+(?:stone|stones|gems?|crystals?)/i,
  ];
  for (const re of patterns) {
    const m = fullText.match(re);
    if (m) {
      const n = parseInt(m[1] || m[2]);
      if (n >= 5 && n <= 500) return n;
    }
  }
  return null;
}

function detectCaratWeight(fullText: string): string | null {
  const m = fullText.match(/\b(\d+(?:\.\d+)?)\s*(?:ct(?:w)?|carat(?:s)?(?:\s*(?:total|weight|tw))?)\b/i);
  if (m) {
    const n = parseFloat(m[1]);
    if (n > 0 && n <= 100) return `${n} CTW`;
  }
  return null;
}

function detectChainType(fullText: string): string | null {
  if (/\btennis\b/i.test(fullText)) return "tennis";
  if (/\bcuban[\s-]?(?:link)?\b/i.test(fullText)) return "cuban-link";
  if (/\brope[\s-]?chain\b/i.test(fullText)) return "rope";
  if (/\bfigaro\b/i.test(fullText)) return "figaro";
  if (/\bbox[\s-]?chain\b/i.test(fullText)) return "box";
  if (/\bsnake[\s-]?chain\b/i.test(fullText)) return "snake";
  if (/\bherringbone\b/i.test(fullText)) return "herringbone";
  return null;
}

function detectStoneDiameter(fullText: string, attributes: { name: string; value: string }[]): string | null {
  for (const attr of attributes) {
    if (/stone\s*(?:size|diameter)|gem(?:stone)?\s*size/i.test(attr.name)) {
      const m = attr.value.match(/(\d+(?:\.\d+)?)\s*mm/i);
      if (m) return `${m[1]}mm`;
    }
  }
  const m = fullText.match(
    /\b(\d+(?:\.\d+)?)\s*mm\s+(?:stone|moissanite|diamond|gem)|(?:each\s+)?(?:stone|moissanite|diamond|gem)s?\s+(?:are\s+|is\s+)?(\d+(?:\.\d+)?)\s*mm/i
  );
  if (m) return `${m[1] || m[2]}mm`;
  return null;
}

function generateAutoTags(params: {
  type: string | null;
  colors: string[];
  isMoissanite: boolean;
  isVVS: boolean;
  isDColor: boolean;
  chainType: string | null;
  stoneCount: number | null;
}): string[] {
  const tags: string[] = [];
  const typeTagMap: Record<string, string[]> = {
    necklace: ["necklace", "tennis-chain", "chain-necklace"],
    bracelet: ["bracelet", "tennis-bracelet", "wrist-jewelry"],
    earring:  ["earrings", "stud-earrings", "ear-jewelry"],
    ring:     ["ring", "solitaire-ring"],
  };
  if (params.type) tags.push(...(typeTagMap[params.type] ?? []));
  if (params.isMoissanite) tags.push("moissanite");
  if (params.isVVS) tags.push("vvs", "vvs1");
  if (params.isDColor) tags.push("d-color", "d-colorless");
  if (params.isMoissanite && params.isVVS) tags.push("vvs-moissanite");
  const colorTagMap: Record<string, string[]> = {
    silver:     ["sterling-silver", "s925", "silver-jewelry"],
    gold:       ["gold", "18k-gold", "yellow-gold"],
    rose_gold:  ["rose-gold", "18k-rose-gold"],
    white_gold: ["white-gold", "18k-white-gold"],
  };
  for (const c of params.colors) tags.push(...(colorTagMap[c] ?? []));
  if (params.chainType === "cuban-link") tags.push("cuban-link");
  if (params.stoneCount && params.stoneCount >= 80) tags.push("full-eternity");
  tags.push("gra-certified", "luxury-jewelry", "fine-jewelry");
  return [...new Set(tags)].slice(0, 15);
}

// Suggested base price derived from our own pricing table (type × color).
const SUGGESTED_BASE_PRICES: Record<string, Record<string, number>> = {
  necklace: { silver: 189, gold: 219, rose_gold: 229, white_gold: 229 },
  bracelet: { silver: 129, gold: 159, rose_gold: 169, white_gold: 169 },
  earring:  { silver: 89,  gold: 119, rose_gold: 129, white_gold: 129 },
  ring:     { silver: 399, gold: 499, rose_gold: 549, white_gold: 549 },
};
function suggestBasePrice(type: string | null, colors: string[]): number | null {
  if (!type) return null;
  const priceMap = SUGGESTED_BASE_PRICES[type];
  if (!priceMap) return null;
  return priceMap[colors[0] ?? "silver"] ?? priceMap.silver;
}

// ─── Multi-template title generator ───────────────────────────────────────────

type TitleParams = {
  vvs: boolean; dColor: boolean; color: string | null;
  stoneCount: number | null; stoneDiameter: string | null; feature: string | null;
};

const TITLE_TEMPLATES: Record<string, Array<(p: TitleParams) => string>> = {
  necklace: [
    p => clampWhitespace([p.vvs ? "VVS1" : null, p.dColor ? "D" : null, "Moissanite Tennis Chain", p.color ? COLOR_TITLE_LABEL[p.color] : null].filter(Boolean).join(" ")),
    p => clampWhitespace([p.stoneDiameter ?? null, p.vvs ? "VVS" : null, "Moissanite Tennis Chain", p.color ? `- ${COLOR_TITLE_LABEL[p.color]}` : null].filter(Boolean).join(" ")),
    p => clampWhitespace(["Iced Out", p.vvs ? "VVS1" : "Premium", "Moissanite Chain", p.color ? `| ${COLOR_TITLE_LABEL[p.color]}` : null].filter(Boolean).join(" ")),
    p => clampWhitespace([p.stoneCount ? `${p.stoneCount}-Stone` : "Full Eternity", p.vvs ? "VVS" : null, "Moissanite Necklace", p.color ? COLOR_TITLE_LABEL[p.color] : null].filter(Boolean).join(" ")),
    p => clampWhitespace([p.vvs ? "VVS1 D Color" : "Premium", "Moissanite Tennis Chain", p.feature ? `with ${p.feature}` : null, p.color ? `| ${COLOR_TITLE_LABEL[p.color]}` : null].filter(Boolean).join(" ")),
    p => clampWhitespace(["Brilliant", p.vvs ? "VVS1" : null, "Moissanite Chain", p.color ? `- ${COLOR_TITLE_LABEL[p.color]}` : null, p.stoneCount ? `(${p.stoneCount} Stones)` : null].filter(Boolean).join(" ")),
  ],
  bracelet: [
    p => clampWhitespace([p.vvs ? "VVS1" : null, p.dColor ? "D" : null, "Moissanite Tennis Bracelet", p.color ? COLOR_TITLE_LABEL[p.color] : null].filter(Boolean).join(" ")),
    p => clampWhitespace([p.stoneDiameter ?? null, p.vvs ? "VVS" : null, "Moissanite Bracelet", p.color ? `- ${COLOR_TITLE_LABEL[p.color]}` : null].filter(Boolean).join(" ")),
    p => clampWhitespace(["Iced Out", p.vvs ? "VVS1 D" : "Premium", "Moissanite Bracelet", p.color ? `| ${COLOR_TITLE_LABEL[p.color]}` : null].filter(Boolean).join(" ")),
    p => clampWhitespace([p.stoneCount ? `${p.stoneCount}-Stone` : "Full Eternity", p.vvs ? "VVS" : null, "Moissanite Tennis Bracelet", p.color ? COLOR_TITLE_LABEL[p.color] : null].filter(Boolean).join(" ")),
    p => clampWhitespace([p.vvs ? "VVS1" : "Premium", "Moissanite Tennis Bracelet", p.feature ? `- ${p.feature}` : null, p.color ? `| ${COLOR_TITLE_LABEL[p.color]}` : null].filter(Boolean).join(" ")),
    p => clampWhitespace(["Brilliant", p.vvs ? "VVS1" : null, "Moissanite Wrist Stack", p.color ? `- ${COLOR_TITLE_LABEL[p.color]}` : null].filter(Boolean).join(" ")),
  ],
  earring: [
    p => clampWhitespace([p.vvs ? "VVS1" : null, p.dColor ? "D" : null, "Moissanite Stud Earrings", p.color ? COLOR_TITLE_LABEL[p.color] : null].filter(Boolean).join(" ")),
    p => clampWhitespace([p.stoneDiameter ?? null, p.vvs ? "VVS" : null, "Moissanite Studs", p.color ? `| ${COLOR_TITLE_LABEL[p.color]}` : null].filter(Boolean).join(" ")),
    p => clampWhitespace(["Brilliant", p.vvs ? "VVS1 D" : "Cut", "Moissanite Earrings", p.color ? `- ${COLOR_TITLE_LABEL[p.color]}` : null].filter(Boolean).join(" ")),
    p => clampWhitespace([p.vvs ? "VVS1 D Color" : "Premium", "Moissanite Stud Earrings", p.color ? `| ${COLOR_TITLE_LABEL[p.color]}` : null].filter(Boolean).join(" ")),
  ],
  ring: [
    p => clampWhitespace([p.vvs ? "VVS1" : null, p.dColor ? "D" : null, "Moissanite Solitaire Ring", p.color ? COLOR_TITLE_LABEL[p.color] : null].filter(Boolean).join(" ")),
    p => clampWhitespace([p.stoneDiameter ?? null, p.vvs ? "VVS" : null, "Moissanite Ring", p.color ? `- ${COLOR_TITLE_LABEL[p.color]}` : null].filter(Boolean).join(" ")),
    p => clampWhitespace(["Brilliant Cut", p.vvs ? "VVS1 D" : null, "Moissanite Ring", p.color ? `| ${COLOR_TITLE_LABEL[p.color]}` : null].filter(Boolean).join(" ")),
    p => clampWhitespace([p.stoneCount ? `${p.stoneCount}-Stone` : null, p.vvs ? "VVS" : "Premium", "Moissanite Eternity Ring", p.color ? COLOR_TITLE_LABEL[p.color] : null].filter(Boolean).join(" ")),
    p => clampWhitespace([p.vvs ? "VVS1 D Color" : "Premium", "Moissanite Solitaire", p.feature ? `with ${p.feature}` : null, p.color ? `| ${COLOR_TITLE_LABEL[p.color]}` : null].filter(Boolean).join(" ")),
  ],
};

function generateSeoTitle(rawTitle: string, fullText: string, type: string | null, colors: string[], extra?: {
  stoneCount?: number | null; stoneDiameter?: string | null; seed?: string;
}): string {
  let cleaned = rawTitle;
  for (const re of TITLE_NOISE) cleaned = cleaned.replace(re, " ");
  cleaned = cleaned.replace(/^\[[^\]]{1,30}\]\s*/, "").replace(/^[A-Z0-9]{2,8}-[A-Z0-9-]{2,12}\s+/, "");
  cleaned = clampWhitespace(cleaned);

  const isMoissanite = /moissanite/i.test(fullText);
  const isVVS = /\bvvs1?\b/i.test(fullText);
  const isDColor = /\bd[\s-]?colou?r(?:less)?\b/i.test(fullText);
  const feature = detectFeatures(fullText);

  if (isMoissanite && type) {
    const templates = TITLE_TEMPLATES[type];
    if (templates && extra?.seed) {
      const tparams: TitleParams = {
        vvs: isVVS, dColor: isDColor, color: colors[0] ?? null,
        stoneCount: extra.stoneCount ?? null, stoneDiameter: extra.stoneDiameter ?? null, feature,
      };
      const result = clampWhitespace(pickStable(templates, extra.seed)(tparams));
      if (result) return result.slice(0, 140);
    }
    // Fallback composition
    const parts = [
      isVVS ? "VVS1" : null, isDColor ? "D" : null, "Moissanite",
      TYPE_LABEL[type], colors[0] ? COLOR_TITLE_LABEL[colors[0]] : null,
    ].filter(Boolean) as string[];
    let title = parts.join(" ");
    if (feature) title += ` - ${feature}`;
    return title.slice(0, 140);
  }

  return (titleCase(cleaned) || rawTitle).slice(0, 140);
}

// ─── Description generator — original on-brand copy, never the scraped/
// manufacturer text. Built entirely from the signals already detected above. ──

const TYPE_COPY: Record<string, { setting: string; hooks: string[]; cta: string[] }> = {
  necklace: {
    setting: "hand-set in a continuous tennis-style chain",
    hooks: [
      "Pure brilliance, worn close.",
      "Brilliance that catches every light.",
      "A chain built to outshine.",
      "Where precision meets presence.",
      "Every stone placed to perfection.",
      "The chain that speaks before you do.",
    ],
    cta: [
      "Wear it alone or layer it — either way, it owns the room.",
      "Stack it, layer it, or let it lead. It's built for both.",
      "Dress it up or down — this chain works every angle.",
    ],
  },
  bracelet: {
    setting: "hand-set in a secure four-prong setting with a reinforced double-lock clasp",
    hooks: [
      "A masterclass in jewelry engineering.",
      "Built for daily brilliance.",
      "Stacked stones, zero compromise.",
      "Precision from clasp to clasp.",
      "The bracelet that never comes off.",
      "Wrist game, elevated.",
    ],
    cta: [
      "Stack it with other pieces or let it stand alone — it demands attention either way.",
      "Built to be worn daily. Crafted to last a lifetime.",
      "Layer it or let it breathe — it commands every wrist.",
    ],
  },
  earring: {
    setting: "hand-set in a secure four-prong setting",
    hooks: [
      "Pure brilliance. No compromises.",
      "Flawless brilliance, every angle.",
      "Small stones, serious fire.",
      "The studs that complete every look.",
      "Subtle? Never. Understated? Always.",
      "Two stones. Infinite impact.",
    ],
    cta: [
      "Pair with a tennis chain for the full look, or let these shine solo.",
      "Day-to-night versatility — from office to occasion without a second thought.",
      "The earrings that work with everything. Because brilliance is always on theme.",
    ],
  },
  ring: {
    setting: "hand-set in a polished solitaire setting",
    hooks: [
      "Flawless brilliance, set to last.",
      "One stone. Total brilliance.",
      "Brilliance, set in stone.",
      "The ring that says everything.",
      "A solitaire with nothing to prove — and everything to show.",
      "Cut for brilliance. Set for forever.",
    ],
    cta: [
      "Stack it or wear it solo — either way, this ring commands attention.",
      "Wear it on any finger. Own every room.",
      "A ring this brilliant doesn't need a story. It tells its own.",
    ],
  },
};

// Deterministic-but-varied pick so descriptions for the same product type
// don't all read identically, without needing any randomness/state.
function pickStable<T>(arr: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

function generateDescriptions(params: {
  type: string | null;
  colors: string[];
  sizes: string[];
  lengths: string[];
  isMoissanite: boolean;
  isVVS: boolean;
  isDColor: boolean;
  feature: string | null;
  safeAttributes: { name: string; value: string }[];
  seed: string;
  stoneCount?: number | null;
  caratWeight?: string | null;
  stoneDiameter?: string | null;
  chainType?: string | null;
}): { shortDescription: string; fullDescription: string } {
  const copy = TYPE_COPY[params.type ?? ""] ?? TYPE_COPY.necklace;
  const hook = pickStable(copy.hooks, params.seed);
  const cta = pickStable(copy.cta, params.seed + "cta");
  const stone = params.isMoissanite ? "moissanite" : "gemstone";

  const qualityBits = [params.isVVS ? "VVS1 clarity" : null, params.isDColor ? "D Colorless color" : null]
    .filter(Boolean).join(" and ");
  const qualityPrefix = qualityBits ? `${qualityBits.charAt(0).toUpperCase()}${qualityBits.slice(1)} ` : "Premium ";

  // Only metal-plated finishes (gold/rose gold/white gold) read naturally as
  // "finished in X" — plain silver is the base material itself, so calling
  // that out separately would just repeat "sterling silver" twice.
  const platedLabels = params.colors.filter(c => c !== "silver").map(c => COLOR_PHRASE[c]).filter((c): c is string => !!c);
  const baseClauseShort = platedLabels.length > 1
    ? `Solid S925 sterling silver base, available in ${platedLabels.slice(0, -1).join(", ")} and ${platedLabels[platedLabels.length - 1]} plating.`
    : platedLabels.length === 1
      ? `Solid S925 sterling silver base, finished in ${platedLabels[0]} plating.`
      : "Solid S925 sterling silver.";
  const baseClauseFull = platedLabels.length > 1
    ? `built on a solid S925 sterling silver foundation, available in ${platedLabels.slice(0, -1).join(", ")} and ${platedLabels[platedLabels.length - 1]} plating`
    : platedLabels.length === 1
      ? `built on a solid S925 sterling silver foundation and finished in ${platedLabels[0]} plating`
      : "built on a solid S925 sterling silver foundation";

  const sizePhrase = params.sizes.length > 0 ? ` Available in ${params.sizes.join(", ")}.` : "";
  const lengthPhrase = params.lengths.length > 0 ? ` Offered in ${params.lengths.join(", ")} lengths.` : "";
  const featurePhrase = params.feature ? ` Featuring a ${params.feature.toLowerCase()}.` : "";
  const caratPhrase = params.caratWeight ? ` Total stone weight: ${params.caratWeight}.` : "";

  // Stone-count paragraph (only when detected — adds specificity without being generic)
  const stoneParagraph = (params.stoneCount || params.stoneDiameter)
    ? "\n\n" + [
        params.stoneCount
          ? `${params.stoneCount} individually hand-placed stones run edge to edge — no gaps, no filler, no shortcuts.`
          : null,
        params.stoneDiameter
          ? `Each stone measures ${params.stoneDiameter} for a clean, consistent sparkle across every angle.`
          : null,
      ].filter(Boolean).join(" ")
    : "";

  const shortDescription = clampWhitespace(
    `${qualityPrefix}${stone} ${TYPE_LABEL[params.type ?? "necklace"]?.toLowerCase() ?? "jewelry"}. ${baseClauseShort}${featurePhrase} GRA certifiable.${params.stoneCount ? ` ${params.stoneCount} hand-set stones.` : ""}${sizePhrase}${lengthPhrase}`
  ).slice(0, 250);

  const specLines = params.safeAttributes.slice(0, 8).map(a => `• ${a.name}: ${a.value}`);
  const specBlock = specLines.length > 0 ? `\n\nSpecifications:\n${specLines.join("\n")}` : "";

  const fullDescription = `${hook}

This piece features ${qualityBits || "premium-grade"} ${stone}, ${copy.setting}, ${baseClauseFull}.${featurePhrase}${stoneParagraph}

Every stone can be independently GRA certified — verified clarity, color, and cut, never just a marketing claim.${sizePhrase}${lengthPhrase}${caratPhrase}

${cta}`.trim() + specBlock;

  return { shortDescription, fullDescription };
}

// ─── Core HTML parser — shared by both the URL-fetch and paste-source paths ───

function parseProductPage(html: string, seed: string) {
  // Meta tag extractor
  const getMeta = (prop: string): string => {
    const esc = prop.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const p1 = new RegExp(`<meta[^>]+(?:property|name)=["']${esc}["'][^>]+content=["']([^"']{1,500})["']`, "i");
    const p2 = new RegExp(`<meta[^>]+content=["']([^"']{1,500})["'][^>]+(?:property|name)=["']${esc}["']`, "i");
    return decodeHtmlEntities((html.match(p1) ?? html.match(p2))?.[1]?.trim() ?? "");
  };

  // Name
  const ogTitle = getMeta("og:title");
  const rawTitleHtml = html.match(/<title[^>]*>([^<]{1,300})<\/title>/i)?.[1] ?? "";
  let rawName = (ogTitle || decodeHtmlEntities(rawTitleHtml))
    .replace(/\s*[-|–—]\s*(?:Alibaba\.com|AliExpress|1688\.com|Amazon|DHgate|Temu|Shein).*$/i, "")
    .replace(/\s*[-|–—]\s*Buy\s+.+?online$/i, "")
    .replace(/\s*\|\s*Free Shipping.*$/i, "")
    .trim()
    .substring(0, 200);

  // Description
  const description = (getMeta("og:description") || getMeta("description")).substring(0, 1500);

  // Images — multiple strategies, no cap until final slice
  const seen = new Set<string>();
  const images: string[] = [];
  const addImg = (src: string) => {
    if (!src || typeof src !== "string") return;
    src = src.trim();
    src = src.startsWith("//") ? `https:${src}` : src;
    if (!src.startsWith("http")) return;
    if (src.startsWith("data:")) return;
    if (/\b(icon|logo|avatar|sprite|pixel|tracking|banner|badge|button|thumbnail_tiny|\.gif$)/i.test(src)) return;
    if (seen.has(src)) return;
    seen.add(src);
    images.push(src);
  };

  // 1. og:image meta tags
  const ogImgRe = /<meta[^>]+(?:property)=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property)=["']og:image(?::url)?["']/gi;
  for (const m of html.matchAll(ogImgRe)) addImg((m[1] || m[2] || "").trim());

  // 2. window.runParams JSON blob (most reliable source for some platforms)
  const runParamsM = html.match(/window\.runParams\s*=\s*(\{[\s\S]{200,200000}?\});\s*(?:window\.|var |\/\/)/);
  if (runParamsM) {
    try {
      const rp = JSON.parse(runParamsM[1]);
      const imgArr: any[] = rp?.data?.imageModule?.imagePathList
        ?? rp?.data?.imageModule?.mainImageList
        ?? rp?.imagePathList ?? rp?.mainImageList ?? [];
      for (const img of imgArr) addImg(typeof img === "string" ? img : (img?.url ?? img?.imageUrl ?? ""));
      if (!rawName && rp?.data?.titleModule?.subject) rawName = String(rp.data.titleModule.subject).substring(0, 200);
    } catch {}
  }

  // 3. JSON image arrays in script tags
  const jsonImgKeys = [
    "imagePathList", "mainImageList", "imageList", "subjectImageList",
    "skuImageList", "imageInfo", "slideImageList", "detailImageList",
    "summImageList", "imgList", "picList", "productImages",
  ];
  for (const key of jsonImgKeys) {
    const m = html.match(new RegExp(`"${key}"\\s*:\\s*(\\[[^\\]]{5,8000}\\])`, "s"));
    if (!m) continue;
    try {
      const list = JSON.parse(m[1]) as any[];
      for (const item of list) {
        if (typeof item === "string") addImg(item);
        else if (item && typeof item === "object") {
          addImg(item.url ?? item.imageUrl ?? item.src ?? item.image
            ?? item.fullPathImageURI ?? item.imgUrl ?? item.picUrl ?? "");
        }
      }
    } catch {}
  }

  // 4. JSON-LD Product structured data (first Product block only)
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]{1,20000}?)<\/script>/gi)) {
    try {
      const obj = JSON.parse(m[1]);
      const types = Array.isArray(obj["@type"]) ? obj["@type"] : [obj["@type"]];
      if (!types.includes("Product")) continue;
      if (!rawName && obj.name) rawName = decodeHtmlEntities(String(obj.name)).substring(0, 200);
      const imgSrc = obj.image ?? obj.thumbnail;
      if (imgSrc) {
        const imgs = Array.isArray(imgSrc) ? imgSrc : [imgSrc];
        for (const img of imgs) addImg(typeof img === "string" ? img : (img?.url ?? ""));
      }
      break;
    } catch {}
  }

  // 5. Generic inline JSON blobs: "images":["https://..."] or "pics":["https://..."]
  for (const key of ["images", "pics", "photos", "gallery"]) {
    const m = html.match(new RegExp(`["']${key}["']\\s*:\\s*(\\["https?://[^\\]]{10,8000}\\])`, "s"));
    if (!m) continue;
    try {
      const list = JSON.parse(m[1]) as string[];
      for (const img of list) addImg(img);
    } catch {}
  }

  // 6. data-src / data-lazy-src attributes (lazy-loaded images)
  for (const m of html.matchAll(/data-(?:src|lazy(?:-src)?|original|image)=["']([^"']{15,}\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi)) {
    addImg(m[1]);
  }

  // 7. Last resort: <img src> tags for large product images
  if (images.length === 0) {
    let count = 0;
    for (const m of html.matchAll(/<img[^>]+src=["']([^"']{15,}\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi)) {
      if (count >= 20) break;
      addImg(m[1]);
      count++;
    }
  }

  // Attributes / specs
  const attributes = extractAttributes(html);

  const fullText = `${rawName} ${description} ${attributes.map(a => `${a.name} ${a.value}`).join(" ")}`;
  const detectedType    = detectType(rawName) ?? detectType(fullText);
  const detectedColors  = detectColors(fullText);
  const detectedSizes   = detectSizeOrLength(attributes, /size|width|gauge|diameter|stone\s*size/i, fullText, AVAILABLE_SIZES);
  const detectedLengths = detectSizeOrLength(attributes, /length|chain\s*length|extension/i, fullText, AVAILABLE_LENGTHS);

  const isMoissanite = /moissanite/i.test(fullText);
  const isVVS        = /\bvvs1?\b/i.test(fullText);
  const isDColor     = /\bd[\s-]?colou?r(?:less)?\b/i.test(fullText);
  const feature      = detectFeatures(fullText);

  const stoneCount    = detectStoneCount(fullText);
  const caratWeight   = detectCaratWeight(fullText);
  const stoneDiameter = detectStoneDiameter(fullText, attributes);
  const chainType     = detectChainType(fullText);

  // Extended spec detection (new)
  const stoneShape    = detectStoneShape(fullText);
  const metalPurity   = detectMetalPurity(fullText);
  const supplierPrice = detectSupplierPrice(html.slice(0, 12000));

  const name = generateSeoTitle(rawName, fullText, detectedType, detectedColors, {
    stoneCount, stoneDiameter, seed,
  });

  const safeAttributes = attributes.filter(a => isSafeAttribute(a.name));
  const { shortDescription, fullDescription } = generateDescriptions({
    type: detectedType, colors: detectedColors, sizes: detectedSizes,
    lengths: detectedLengths, isMoissanite, isVVS, isDColor, feature,
    safeAttributes, seed, stoneCount, caratWeight, stoneDiameter, chainType,
  });

  const suggestedTags  = generateAutoTags({ type: detectedType, colors: detectedColors, isMoissanite, isVVS, isDColor, chainType, stoneCount });
  const suggestedPrice = suggestBasePrice(detectedType, detectedColors);

  const isBlocked = (
    images.length === 0 && !rawName &&
    /captcha|robot|verify|human|not available|access denied|403 forbidden/i.test(html.slice(0, 5000))
  );

  return {
    name, rawName, shortDescription, description: fullDescription,
    sourcePagePreview: description.slice(0, 300),
    images: images.slice(0, 24),
    attributes, detectedType, detectedColors, detectedSizes, detectedLengths,
    stoneCount, caratWeight, stoneDiameter, chainType,
    stoneShape, metalPurity, supplierPrice,
    suggestedTags, suggestedPrice,
    isBlocked,
  };
}

function buildBaseFromJina(title: string, content: string, images: string[], url: string) {
  const fullText = `${title}\n\n${content}`;
  const type = detectType(fullText);
  const colors = detectColors(fullText);
  const sizes = detectSizeOrLength([], /^size$/i, fullText, AVAILABLE_SIZES);
  const lengths = detectSizeOrLength([], /^length$/i, fullText, AVAILABLE_LENGTHS);
  const stoneShape = detectStoneShape(fullText);
  const metalPurity = detectMetalPurity(fullText);
  const supplierPrice = detectSupplierPrice(fullText);
  return {
    name: title,
    rawName: title,
    shortDescription: content.split("\n").find(l => l.trim().length > 30)?.trim().slice(0, 200) ?? title,
    description: content.slice(0, 800),
    sourcePagePreview: content.slice(0, 300),
    images,
    attributes: [] as Array<{ name: string; value: string }>,
    detectedType: type,
    detectedColors: colors,
    detectedSizes: sizes,
    detectedLengths: lengths,
    stoneCount: null,
    caratWeight: null,
    stoneDiameter: null,
    chainType: null,
    suggestedTags: [] as string[],
    suggestedPrice: null,
    isBlocked: false,
    stoneShape,
    metalPurity,
    supplierPrice,
  };
}

export const importProductFromUrl = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; url: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const url = data.url.trim();
    if (!url.startsWith("http")) throw new Error("Please enter a valid URL starting with http:// or https://");

    // Always attempt a direct HTML fetch in parallel with Jina — we need raw
    // HTML to run extractSupplierVariants (SKU JSON only exists in real HTML).
    const [jina, htmlResult] = await Promise.allSettled([
      fetchViaJina(url),
      fetchWithRetry(url).catch(() => null as string | null),
    ]);
    const jinaData  = jina.status  === "fulfilled" ? jina.value  : null;
    const rawHtml   = htmlResult.status === "fulfilled" ? htmlResult.value : null;

    // Extract structured variant data from raw HTML (Alibaba SKU JSON, tiered prices, etc.)
    const variantData = rawHtml ? extractSupplierVariants(rawHtml) : { variants: [], minPrice: null, rawPricingText: "" };

    if (jinaData && jinaData.content.length > 200) {
      const base = buildBaseFromJina(jinaData.title, jinaData.content, jinaData.images, url);
      // Prefer raw HTML's min price if Jina couldn't surface it
      if (!base.supplierPrice && variantData.minPrice) base.supplierPrice = variantData.minPrice;
      const ai = await Promise.race([
        enrichWithAI({
          rawName:            jinaData.title,
          rawDescription:     jinaData.content.slice(0, 3000),
          attributes:         [],
          fullText:           `${jinaData.title}\n\n${jinaData.content}`.slice(0, 12000),
          detectedType:       base.detectedType,
          detectedColors:     base.detectedColors,
          sourceUrl:          url,
          extractedVariants:  variantData.variants,
          rawPricingText:     variantData.rawPricingText,
          extractedMinPrice:  variantData.minPrice,
        }),
        new Promise<null>(resolve => setTimeout(() => resolve(null), 20000)),
      ]);
      return mergeWithAI(base, ai, url);
    }

    // Jina failed — use direct HTML
    if (!rawHtml) throw new Error("Could not fetch product page. Try again or check that the URL is correct.");

    const base = parseProductPage(rawHtml, url);
    if (base.isBlocked) {
      throw new Error("This supplier's page is heavily protected. Try again in a few seconds — each retry uses a different approach.");
    }
    if (!base.supplierPrice && variantData.minPrice) base.supplierPrice = variantData.minPrice;

    const ai = await Promise.race([
      enrichWithAI({
        rawName:           base.rawName,
        rawDescription:    base.sourcePagePreview,
        attributes:        base.attributes,
        fullText:          `${base.rawName} ${base.sourcePagePreview} ${base.attributes.map((a: any) => `${a.name} ${a.value}`).join(" ")}`.slice(0, 8000),
        detectedType:      base.detectedType,
        detectedColors:    base.detectedColors,
        sourceUrl:         url,
        extractedVariants: variantData.variants,
        rawPricingText:    variantData.rawPricingText,
        extractedMinPrice: variantData.minPrice,
      }),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 20000)),
    ]);

    return mergeWithAI(base, ai, url);
  });

// Accepts raw HTML pasted from the user's browser — bypasses supplier bot
// detection entirely because the user fetched the page themselves.
export const importProductFromHtml = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; html: string; sourceUrl?: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    if (!data.html || data.html.trim().length < 200) throw new Error("Paste the full page source — it looks too short.");
    const seed = data.sourceUrl ?? data.html.slice(0, 100);
    const base = parseProductPage(data.html, seed);
    const variantData = extractSupplierVariants(data.html);
    if (!base.supplierPrice && variantData.minPrice) base.supplierPrice = variantData.minPrice;

    const ai = await Promise.race([
      enrichWithAI({
        rawName:           base.rawName,
        rawDescription:    base.sourcePagePreview,
        attributes:        base.attributes,
        fullText:          `${base.rawName} ${base.sourcePagePreview} ${base.attributes.map(a => `${a.name} ${a.value}`).join(" ")}`.slice(0, 8000),
        detectedType:      base.detectedType,
        detectedColors:    base.detectedColors,
        sourceUrl:         data.sourceUrl ?? "",
        extractedVariants: variantData.variants,
        rawPricingText:    variantData.rawPricingText,
        extractedMinPrice: variantData.minPrice,
      }),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 20000)),
    ]);

    return mergeWithAI(base, ai, data.sourceUrl ?? "");
  });

// Simple fallback: accepts any pasted text about the product (title, description,
// specs — no raw HTML required). Claude extracts all details from clean text.
export const importProductFromText = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; text: string; sourceUrl?: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    if (!data.text || data.text.trim().length < 30) throw new Error("Paste at least some product details.");
    const text = data.text.trim();
    const base = buildBaseFromJina(
      text.split("\n")[0].slice(0, 200),
      text,
      [],
      data.sourceUrl ?? ""
    );
    const ai = await Promise.race([
      enrichWithAI({
        rawName: base.rawName,
        rawDescription: text.slice(0, 600),
        attributes: [],
        fullText: text.slice(0, 8000),
        detectedType: base.detectedType,
        detectedColors: base.detectedColors,
        sourceUrl: data.sourceUrl ?? "",
      }),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 12000)),
    ]);
    return mergeWithAI(base, ai, data.sourceUrl ?? "");
  });

// ─── Image re-hosting — downloads external supplier images server-
// side and re-uploads them to our own Supabase Storage so customers never see
// the supplier URL in browser devtools, network tabs, or image hover previews.
// Each original URL is mapped to a clean hosted URL; failures are per-image
// so one bad image doesn't abort the whole batch.
export const rehostImportImages = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; urls: string[] }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    if (data.urls.length > 20) throw new Error("Maximum 20 images per batch");

    // Rotate through a few realistic User-Agents so repeated imports don't
    // look like a bot to CDN rate-limiters.
    const UAS = [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15",
    ];

    const EXT_MAP: Record<string, string> = {
      "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png",
      "image/webp": "webp", "image/gif": "gif", "image/avif": "avif",
    };

    const results: { original: string; hosted: string | null; error?: string }[] = [];

    for (let i = 0; i < data.urls.length; i++) {
      const imgUrl = data.urls[i];
      try {
        const ua = UAS[i % UAS.length];
        const res = await fetch(imgUrl, {
          headers: {
            "User-Agent": ua,
            "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.alibaba.com/",
            "Sec-Fetch-Dest": "image",
            "Sec-Fetch-Mode": "no-cors",
            "Sec-Fetch-Site": "cross-site",
            "Cache-Control": "no-cache",
          },
          redirect: "follow",
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const contentType = (res.headers.get("content-type") ?? "image/jpeg").split(";")[0].trim();
        if (!contentType.startsWith("image/")) throw new Error("Not an image content-type");

        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.length > MAX_UPLOAD_BYTES) throw new Error("Image exceeds 10 MB");

        const extFromUrl = imgUrl.match(/\.(jpg|jpeg|png|webp|gif|avif)(?:[?#]|$)/i)?.[1]?.toLowerCase();
        const ext = (extFromUrl ?? EXT_MAP[contentType] ?? "jpg").replace(/^jpeg$/, "jpg");
        if (!ALLOWED_UPLOAD_EXT.includes(ext)) throw new Error("Unsupported image type");

        const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const fileName = `import-${unique}.${ext}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from(UPLOAD_BUCKET)
          .upload(fileName, buffer, { contentType, upsert: false });
        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        const { data: pub } = supabaseAdmin.storage.from(UPLOAD_BUCKET).getPublicUrl(fileName);
        results.push({ original: imgUrl, hosted: pub.publicUrl });
      } catch (e: any) {
        results.push({ original: imgUrl, hosted: null, error: e?.message ?? "Failed" });
      }
    }

    return { results };
  });

// ─── Inventory Alerts ─────────────────────────────────────────────────────────

export const getInventoryAlerts = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; threshold?: number }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const threshold = data.threshold ?? 5;
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("id, slug, name, type, color, stock_quantity, is_active")
      .eq("track_inventory" as any, true)
      .order("stock_quantity" as any, { ascending: true }) as any;
    if (error) throw new Error((error as any).message);
    const lowStock = ((products ?? []) as any[]).filter(
      (p: any) => p.stock_quantity !== null && Number(p.stock_quantity) <= threshold,
    );
    return { lowStock };
  });

// ─── Customer Notes ───────────────────────────────────────────────────────────

export const getCustomerNotes = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; email: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { data: notes, error } = await db
      .from("customer_notes")
      .select("*")
      .ilike("customer_email", data.email)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { notes: (notes ?? []) as any[] };
  });

export const addCustomerNote = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; email: string; note: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    if (!data.note.trim()) throw new Error("Note cannot be empty");
    const { error } = await db.from("customer_notes").insert({
      customer_email: data.email.toLowerCase().trim(),
      note: data.note.trim(),
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteCustomerNote = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; noteId: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { error } = await db.from("customer_notes").delete().eq("id", data.noteId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Product Variants ──────────────────────────────────────────────────────────

export interface ProductVariant {
  id: string;
  product_slug: string;
  color: string | null;
  size: string | null;
  length: string | null;
  price_override: number | null;
  sku: string | null;
  stock: number;
  weight_grams: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const getVariants = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; slug: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { data: variants, error } = await db
      .from("product_variants")
      .select("*")
      .eq("product_slug", data.slug)
      .order("color", { ascending: true })
      .order("size", { ascending: true })
      .order("length", { ascending: true });
    if (error) throw new Error(error.message);
    return { variants: (variants ?? []) as ProductVariant[] };
  });

export const upsertVariant = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string;
    product_slug: string;
    color?: string | null;
    size?: string | null;
    length?: string | null;
    price_override?: number | null;
    sku?: string | null;
    stock?: number;
    weight_grams?: number | null;
    is_active?: boolean;
  }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const row: any = {
      product_slug: data.product_slug,
      color: data.color ?? null,
      size: data.size ?? null,
      length: data.length ?? null,
    };
    if (data.price_override !== undefined) row.price_override = data.price_override;
    if (data.sku !== undefined) row.sku = data.sku;
    if (data.stock !== undefined) row.stock = data.stock;
    if (data.weight_grams !== undefined) row.weight_grams = data.weight_grams;
    if (data.is_active !== undefined) row.is_active = data.is_active;

    const { data: variant, error } = await db
      .from("product_variants")
      .upsert(row, { onConflict: "product_slug,color,size,length" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { variant: variant as ProductVariant };
  });

export const upsertVariantsBulk = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string;
    variants: Array<{
      product_slug: string;
      color?: string | null;
      size?: string | null;
      length?: string | null;
      price_override?: number | null;
      sku?: string | null;
      stock?: number;
      is_active?: boolean;
    }>;
  }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    if (data.variants.length === 0) return { count: 0 };

    const rows = data.variants.map(v => ({
      product_slug: v.product_slug,
      color: v.color ?? null,
      size: v.size ?? null,
      length: v.length ?? null,
      price_override: v.price_override ?? null,
      sku: v.sku ?? null,
      stock: v.stock ?? -1,
      is_active: v.is_active ?? true,
    }));

    const { data: inserted, error } = await db
      .from("product_variants")
      .upsert(rows, { onConflict: "product_slug,color,size,length" })
      .select();
    if (error) throw new Error(error.message);
    return { count: (inserted ?? []).length };
  });

export const updateVariant = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string;
    id: string;
    price_override?: number | null;
    sku?: string | null;
    stock?: number;
    weight_grams?: number | null;
    is_active?: boolean;
  }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const updates: any = {};
    if (data.price_override !== undefined) updates.price_override = data.price_override;
    if (data.sku !== undefined) updates.sku = data.sku;
    if (data.stock !== undefined) updates.stock = data.stock;
    if (data.weight_grams !== undefined) updates.weight_grams = data.weight_grams;
    if (data.is_active !== undefined) updates.is_active = data.is_active;

    const { error } = await db
      .from("product_variants")
      .update(updates)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteVariant = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { error } = await db.from("product_variants").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteVariantsBulk = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; ids: string[] }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    if (data.ids.length === 0) return { count: 0 };
    const { error } = await db.from("product_variants").delete().in("id", data.ids);
    if (error) throw new Error(error.message);
    return { count: data.ids.length };
  });

export const toggleVariantsBulk = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; ids: string[]; is_active: boolean }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    if (data.ids.length === 0) return { count: 0 };
    const { error } = await db
      .from("product_variants")
      .update({ is_active: data.is_active })
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return { count: data.ids.length };
  });

export const updateVariantsPriceBulk = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; slug: string; ids: string[]; price_override: number | null }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    if (data.ids.length === 0) return { count: 0 };
    const { error } = await db
      .from("product_variants")
      .update({ price_override: data.price_override })
      .in("id", data.ids)
      .eq("product_slug", data.slug);
    if (error) throw new Error(error.message);
    return { count: data.ids.length };
  });

export const updateVariantsStockBulk = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; slug: string; ids: string[]; stock: number }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    if (data.ids.length === 0) return { count: 0 };
    const { error } = await db
      .from("product_variants")
      .update({ stock: data.stock })
      .in("id", data.ids)
      .eq("product_slug", data.slug);
    if (error) throw new Error(error.message);
    return { count: data.ids.length };
  });

export const deleteAllVariants = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; slug: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { error } = await db
      .from("product_variants")
      .delete()
      .eq("product_slug", data.slug);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Public Folder Browser ────────────────────────────────────────────────────

export const listPublicImages = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { readdir } = await import("fs/promises");
    const path = await import("path");
    const publicDir = path.join(process.cwd(), "public");

    async function scanDir(dir: string, prefix: string = ""): Promise<{ path: string; name: string; folder: string }[]> {
      let entries;
      try { entries = await readdir(dir, { withFileTypes: true }); }
      catch { return []; }
      const results: { path: string; name: string; folder: string }[] = [];
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const sub = await scanDir(path.join(dir, entry.name), `${prefix}${entry.name}/`);
          results.push(...sub);
        } else if (/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(entry.name)) {
          results.push({
            path: `/${prefix}${entry.name}`,
            name: entry.name,
            folder: prefix ? prefix.replace(/\/$/, "") : "root",
          });
        }
      }
      return results;
    }

    const files = await scanDir(publicDir);
    const folders = [...new Set(files.map(f => f.folder))].sort();
    return { files, folders };
  });

const ALLOWED_UPLOAD_EXT = ["jpg", "jpeg", "png", "gif", "webp", "avif"];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

const UPLOAD_BUCKET = "product-images";

// Stored in Supabase Storage (not the local filesystem) — Netlify Functions
// run on an ephemeral, non-CDN-served filesystem, so a disk write here would
// succeed but the file would never actually be reachable at its URL in
// production. Storage gives every upload a durable, CDN-backed public URL
// that works identically in dev and prod.
export const uploadAdminImage = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; fileName: string; dataUrl: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);

    const match = /^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/.exec(data.dataUrl);
    if (!match) throw new Error("Invalid image data");
    const contentType = match[1];
    const base64 = match[2];
    const buffer = Buffer.from(base64, "base64");
    if (buffer.length > MAX_UPLOAD_BYTES) throw new Error("Image exceeds 10MB limit");

    const ext = (data.fileName.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_UPLOAD_EXT.includes(ext)) throw new Error("Unsupported image type");

    const safeBase = data.fileName
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 60) || "image";
    // Random suffix (not just Date.now()) so multiple files uploaded in the
    // same batch can't collide on the same millisecond.
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const fileName = `${safeBase}-${unique}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from(UPLOAD_BUCKET)
      .upload(fileName, buffer, { contentType, upsert: false });
    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data: pub } = supabaseAdmin.storage.from(UPLOAD_BUCKET).getPublicUrl(fileName);
    return { path: pub.publicUrl, name: fileName };
  });

// ─── Customer Account — public, email-verified via Supabase Auth ──────────────

export const getOrdersByEmail = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string }) => d)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    if (!email || !email.includes("@")) throw new Error("Invalid email");
    const { data: orders, error } = await (supabaseAdmin as any)
      .from("orders")
      .select("order_number, created_at, status, total, subtotal, shipping, tax, discount_amount, items, shipping_method, shipping_city, shipping_state, tracking_number, notes")
      .eq("customer_email", email)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { orders: (orders ?? []) as Array<{
      order_number: string; created_at: string; status: string;
      total: number; subtotal: number; shipping: number; tax: number;
      discount_amount: number; items: any[]; shipping_method: string;
      shipping_city: string; shipping_state: string;
      tracking_number: string | null; notes: string | null;
    }> };
  });

// ─── Admin Reviews Management ─────────────────────────────────────────────────

export const listAdminReviews = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; filter?: "all" | "pending" | "approved" }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    let query = (supabaseAdmin as any)
      .from("reviews")
      .select("id, product_slug, customer_name, customer_email, order_number, rating, title, body, verified, approved, created_at")
      .order("created_at", { ascending: false });
    if (data.filter === "pending") query = query.eq("approved", false);
    else if (data.filter === "approved") query = query.eq("approved", true);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return { reviews: (rows ?? []) as Array<{
      id: string; product_slug: string; customer_name: string; customer_email: string;
      order_number: string | null; rating: number; title: string | null; body: string;
      verified: boolean; approved: boolean; created_at: string;
    }> };
  });

export const approveReview = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { error } = await (supabaseAdmin as any)
      .from("reviews").update({ approved: true }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const rejectReview = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { error } = await (supabaseAdmin as any)
      .from("reviews").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Inner Circle: Subscribers ────────────────────────────────────────────────

export const listSubscribers = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { data: rows, error } = await db
      .from("subscribers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { subscribers: rows ?? [] };
  });

export const updateSubscriber = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: string; name?: string; status?: string; tags?: string[]; notes?: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { token: _t, id, ...fields } = data;
    const updates: any = { ...fields };
    if (fields.status === "unsubscribed") updates.unsubscribed_at = new Date().toISOString();
    if (fields.status === "active") updates.unsubscribed_at = null;
    const { error } = await db.from("subscribers").update(updates).eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteSubscriber = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { error } = await db.from("subscribers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Inner Circle: Campaigns ──────────────────────────────────────────────────

export const listCampaigns = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { data: rows, error } = await db
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { campaigns: rows ?? [] };
  });

export const saveCampaign = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string;
    id?: string;
    title: string;
    subject: string;
    body_text: string;
    campaign_type: string;
    tag_filter: string[];
  }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { token: _t, id, ...fields } = data;
    if (id) {
      const { error } = await db.from("campaigns").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await db.from("campaigns").insert(fields).select().single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const sendCampaign = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { data: camp } = await db.from("campaigns").select("*").eq("id", data.id).single();
    if (!camp) throw new Error("Campaign not found");

    let query = db.from("subscribers").select("email,name").eq("status", "active");
    if (camp.tag_filter && camp.tag_filter.length > 0) {
      query = query.overlaps("tags", camp.tag_filter);
    }
    const { data: subs } = await query;
    const recipients = subs ?? [];

    const { Resend } = await import("resend");
    const resendClient = new Resend(process.env.RESEND_API_KEY);
    const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "hello@qureshijewelers.com";
    const SITE_URL = (process.env.VITE_SITE_URL ?? "https://qureshijewelers.com").replace(/\/$/, "");
    const GOLD_C = "#C9A84C";

    let sent = 0;
    let failed = 0;
    for (const sub of recipients) {
      const firstName = (sub.name ?? "").split(" ")[0] || "";
      const greeting = firstName ? `Hi ${firstName},` : "Hi there,";
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{margin:0;padding:0;background:#faf9f7;font-family:'Georgia',serif;}</style></head><body>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf9f7;"><tr><td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
          <tr><td align="center" style="padding:32px 0 24px;border-bottom:1px solid #e8e3dc;"><a href="${SITE_URL}"><img src="${SITE_URL}/QURESHIJEWELERSLOGO.png" alt="Qureshi Jewelers" width="140" style="display:block;"/></a></td></tr>
          <tr><td style="height:2px;background:linear-gradient(90deg,transparent,${GOLD_C},transparent);"></td></tr>
          <tr><td style="background:#fff;padding:8px 16px 4px;text-align:center;"><p style="margin:0;font-size:10px;color:${GOLD_C};letter-spacing:0.32em;text-transform:uppercase;">The Inner Circle</p></td></tr>
          <tr><td style="background:#fff;padding:4px 48px 48px;">
            <p style="margin:0 0 20px;font-size:14px;color:#5a5550;line-height:1.75;">${greeting}</p>
            <div style="font-size:14px;color:#5a5550;line-height:1.85;">${camp.body_text.replace(/\n/g, "<br/>")}</div>
            <div style="height:1px;background:#e8e3dc;margin:28px 0;"></div>
            <div style="text-align:center;"><a href="${SITE_URL}/shop" style="display:inline-block;padding:14px 36px;background:#1a1814;color:#fff;text-decoration:none;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;">Shop Now</a></div>
          </td></tr>
          <tr><td style="height:1px;background:#e8e3dc;"></td></tr>
          <tr><td style="padding:24px 48px;background:#faf9f7;text-align:center;">
            <p style="margin:0 0 8px;font-size:10px;color:#9b9490;letter-spacing:0.16em;text-transform:uppercase;">Qureshi Jewelers · The Inner Circle</p>
            <p style="margin:0;font-size:10px;color:#c4bfb8;">You're receiving this because you joined The Inner Circle. <a href="${SITE_URL}" style="color:#9b9490;">Unsubscribe</a></p>
          </td></tr>
        </table></td></tr></table></body></html>`;

      try {
        if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith("re_your")) {
          await resendClient.emails.send({ from: FROM_EMAIL, to: sub.email, subject: camp.subject, html });
        }
        sent++;
      } catch { failed++; }
    }

    await db.from("campaigns").update({
      status: "sent",
      recipient_count: sent,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", data.id);

    return { sent, failed, total: recipients.length };
  });

export const deleteCampaign = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { error } = await db.from("campaigns").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Inner Circle: Internal Messages ─────────────────────────────────────────

export const sendSubscriberMessage = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; subscriber_email: string; subject: string; body: string; message_type: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { token: _t, ...fields } = data;
    const { error } = await db.from("subscriber_messages").insert({ ...fields, sent_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const listSubscriberMessages = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; email: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { data: rows, error } = await db
      .from("subscriber_messages")
      .select("*")
      .eq("subscriber_email", data.email)
      .order("sent_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { messages: rows ?? [] };
  });
