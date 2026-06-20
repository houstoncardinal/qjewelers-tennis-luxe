import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ALL_PRODUCTS } from "@/lib/products.data";
import { getTennisBraceletPrice } from "@/lib/pricing";

// Mirrors src/lib/pricing.ts's multiplier tables exactly — kept as a separate
// server-side copy (rather than importing calculatePrice/calculateEarringPrice/
// calculateRingPrice) because those apply a price floor (Math.max(99/59/299, ...))
// that this validation path has never enforced; switching to them would change
// which historical prices are accepted.
const SIZE_MULT: Record<string, number> = { "2mm": 1, "3mm": 1.45, "4mm": 1.95, "5mm": 2.55, "6.5mm": 3.45 };
const EARRING_SIZE_MULT: Record<string, number> = { "3mm": 1, "4mm": 1.17, "5mm": 1.34, "6mm": 1.85, "8mm": 2.69 };
const RING_SIZE_MULT: Record<string, number> = { "0.5ct": 1.0, "1ct": 2.0, "1.5ct": 3.2, "2ct": 4.8, "3ct": 8.0 };
const LEN_ADD: Record<string, number> = { '16"': -20, '18"': 0, '20"': 30, '22"': 50, '24"': 70, '6"': -25, '7"': -12, '8"': 0, '9"': 18 };

export interface PricedOrderItem {
  productId: string;
  slug: string;
  name: string;
  color: string;
  size: string;
  length: string;
  unitPrice: number;
  quantity: number;
}

export interface PricingResult {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  shippingMethod: "standard" | "express" | "overnight";
}

// Re-validates every line item's price server-side against the authoritative
// product catalog (DB first, static fallback), then computes shipping/tax/total
// from store_settings. Throws if any item's client-supplied price doesn't match
// what the catalog says it should be — this is the price-tamper guard.
export async function validateAndPriceOrder(
  items: PricedOrderItem[],
  opts: { discountAmount?: number; shippingMethod?: "standard" | "express" | "overnight" } = {},
): Promise<PricingResult> {
  const slugs = [...new Set(items.map((i) => i.slug))];
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
  for (const slug of slugs) {
    if (!productMap.has(slug)) {
      const s = ALL_PRODUCTS.find((p) => p.slug === slug);
      if (s) productMap.set(slug, { base_price: Number(s.base_price), type: s.type });
    }
  }

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
      if (s.key === "flat_shipping_rate") flatShippingRate = Number(s.value) || 15;
      if (s.key === "tax_rate") taxRate = Number(s.value) || 0;
    }
  } catch {}

  let subtotal = 0;
  for (const item of items) {
    const product = productMap.get(item.slug);
    if (!product) throw new Error(`Product not found: ${item.slug}`);

    let expected: number;
    if (item.slug.includes("tennis") && item.slug.includes("bracelet")) {
      expected = getTennisBraceletPrice(item.size, item.length);
    } else if (product.type === "earring") {
      expected = Math.round(product.base_price * (EARRING_SIZE_MULT[item.size] ?? 1));
    } else if (product.type === "ring") {
      expected = Math.max(299, Math.round(product.base_price * (RING_SIZE_MULT[item.size] ?? 1)));
    } else {
      expected = Math.round(
        product.base_price * (SIZE_MULT[item.size] ?? 1) + (LEN_ADD[item.length] ?? 0),
      );
    }
    if (expected !== item.unitPrice) {
      throw new Error(`Price mismatch for ${item.name}`);
    }
    subtotal += expected * item.quantity;
  }

  const discount = Math.min(opts.discountAmount ?? 0, subtotal);
  const method = opts.shippingMethod ?? "standard";
  let shipping: number;
  if (method === "express") {
    shipping = 24.95;
  } else if (method === "overnight") {
    shipping = 49.95;
  } else {
    shipping = subtotal - discount >= freeShippingThreshold ? 0 : flatShippingRate;
  }
  const tax = taxRate > 0 ? Math.round((subtotal - discount) * (taxRate / 100) * 100) / 100 : 0;
  const total = subtotal - discount + shipping + tax;

  return { subtotal, discount, shipping, tax, total, shippingMethod: method };
}
