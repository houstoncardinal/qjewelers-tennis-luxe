import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendReturnConfirmation } from "@/lib/email";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "";

function requireAdmin(token: string) {
  if (!token || token !== ADMIN_TOKEN) throw new Error("Unauthorized");
}

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
  }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { slug, token: _t, ...fields } = data;
    const { error } = await supabaseAdmin
      .from("products")
      .update({ ...fields, updated_at: new Date().toISOString() } as any)
      .eq("slug", slug);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const createProduct = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string;
    slug: string;
    name: string;
    type: "necklace" | "bracelet" | "earring" | "ring";
    color: "silver" | "gold" | "rose_gold" | "white_gold";
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

// Public: customer submits a return request
export const submitReturn = createServerFn({ method: "POST" })
  .inputValidator((d: {
    order_number: string;
    customer_name: string;
    customer_email: string;
    reason: string;
    items: { name: string; quantity: number }[];
  }) => d)
  .handler(async ({ data }) => {
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

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

export const importProductFromUrl = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; url: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);

    const url = data.url.trim();
    if (!url.startsWith("http")) throw new Error("Please enter a valid URL starting with http:// or https://");

    let html: string;
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`Page returned HTTP ${res.status}`);
      html = await res.text();
    } catch (e: any) {
      throw new Error(`Could not fetch URL: ${e.message}`);
    }

    // Meta tag extractor
    const getMeta = (prop: string): string => {
      const esc = prop.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const p1 = new RegExp(`<meta[^>]+(?:property|name)=["']${esc}["'][^>]+content=["']([^"']{1,500})["']`, "i");
      const p2 = new RegExp(`<meta[^>]+content=["']([^"']{1,500})["'][^>]+(?:property|name)=["']${esc}["']`, "i");
      return decodeHtmlEntities((html.match(p1) ?? html.match(p2))?.[1]?.trim() ?? "");
    };

    // Name
    const ogTitle   = getMeta("og:title");
    const rawTitle  = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? "";
    let name = (ogTitle || decodeHtmlEntities(rawTitle))
      .replace(/\s*[-|–—]\s*(?:Alibaba\.com|AliExpress|1688\.com|Amazon|DHgate).*$/i, "")
      .replace(/\s*[-|–—]\s*Buy\s+.+?online$/i, "")
      .trim()
      .substring(0, 200);

    // Description
    const description = (getMeta("og:description") || getMeta("description")).substring(0, 1500);

    // Images — multiple extraction strategies
    const seen = new Set<string>();
    const images: string[] = [];
    const addImg = (src: string) => {
      if (!src) return;
      src = src.startsWith("//") ? `https:${src}` : src;
      if (!src.startsWith("http")) return;
      if (src.startsWith("data:")) return;
      // Skip tiny/icon images (heuristic: url contains icon/logo/avatar/sprite)
      if (/icon|logo|avatar|sprite|pixel|tracking/i.test(src)) return;
      if (seen.has(src)) return;
      seen.add(src);
      images.push(src);
    };

    // og:image meta tags
    const ogImgRe = /<meta[^>]+(?:property)=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property)=["']og:image(?::url)?["']/gi;
    for (const m of html.matchAll(ogImgRe)) addImg((m[1] || m[2] || "").trim());

    // Alibaba/AliExpress JSON image arrays embedded in script tags
    const jsonImgKeys = ["imagePathList", "mainImageList", "imageList", "subjectImageList", "skuImageList", "imageInfo", "slideImageList"];
    for (const key of jsonImgKeys) {
      const m = html.match(new RegExp(`"${key}"\\s*:\\s*(\\[[^\\]]{5,3000}\\])`, "s"));
      if (!m) continue;
      try {
        const list = JSON.parse(m[1]) as any[];
        for (const item of list) {
          if (typeof item === "string") addImg(item);
          else if (item?.url) addImg(item.url);
          else if (item?.imageUrl) addImg(item.imageUrl);
          else if (item?.src) addImg(item.src);
          else if (item?.image) addImg(item.image);
        }
      } catch {}
    }

    // JSON-LD structured data
    for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]{1,10000}?)<\/script>/gi)) {
      try {
        const obj = JSON.parse(m[1]);
        if (!name && obj.name) name = decodeHtmlEntities(String(obj.name)).substring(0, 200);
        const imgSrc = obj.image ?? obj.thumbnail;
        if (imgSrc) {
          const imgs = Array.isArray(imgSrc) ? imgSrc : [imgSrc];
          for (const img of imgs) addImg(typeof img === "string" ? img : (img?.url ?? ""));
        }
      } catch {}
    }

    // Fallback: scan img tags for large images
    if (images.length === 0) {
      let count = 0;
      for (const m of html.matchAll(/<img[^>]+src=["']([^"']{15,}\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi)) {
        if (count >= 6) break;
        addImg(m[1]);
        count++;
      }
    }

    return {
      name,
      description,
      images: images.slice(0, 12),
      sourceUrl: url,
    };
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
