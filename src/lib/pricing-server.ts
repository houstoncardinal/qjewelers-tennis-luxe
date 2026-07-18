import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ALL_PRODUCTS } from "@/lib/products.data";
import { getTennisBraceletPrice } from "@/lib/pricing";
import { calculateTax, type TaxAddress } from "@/lib/payments/stripe.server";
import { countryNameToISO } from "@/lib/countries";

// Mirrors src/lib/pricing.ts's multiplier tables exactly — kept as a separate
// server-side copy (rather than importing calculatePrice/calculateEarringPrice/
// calculateRingPrice) because those apply a price floor (Math.max(99/59/299, ...))
// that this validation path has never enforced; switching to them would change
// which historical prices are accepted.
const SIZE_MULT: Record<string, number> = {
  "2mm": 1,
  "3mm": 1.45,
  "4mm": 1.95,
  "5mm": 2.55,
  "6.5mm": 3.45,
};
const EARRING_SIZE_MULT: Record<string, number> = {
  "3mm": 1,
  "4mm": 1.17,
  "5mm": 1.34,
  "6mm": 1.85,
  "8mm": 2.69,
};
const RING_SIZE_MULT: Record<string, number> = {
  "0.5ct": 1.0,
  "1ct": 2.0,
  "1.5ct": 3.2,
  "2ct": 4.8,
  "3ct": 8.0,
};
const LEN_ADD: Record<string, number> = {
  '16"': -20,
  '18"': 0,
  '20"': 30,
  '22"': 50,
  '24"': 70,
  '6"': -25,
  '7"': -12,
  '8"': 0,
  '9"': 18,
};

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
  taxCalculationId?: string;
  reservationVariantIds: Array<string | null>;
}

export interface ShippingAddressInput {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string; // display name, e.g. "United States" — converted to ISO2 internally
}

// Re-validates every line item's price server-side against the authoritative
// product catalog (DB first, static fallback), then computes shipping/tax/total
// from store_settings. Throws if any item's client-supplied price doesn't match
// what the catalog says it should be — this is the price-tamper guard.
export async function validateAndPriceOrder(
  items: PricedOrderItem[],
  opts: {
    promoCode?: string;
    shippingMethod?: "standard" | "express" | "overnight";
    shippingAddress?: ShippingAddressInput;
  } = {},
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

  // Promotions are always looked up and calculated here on the server. Never
  // accept a browser-supplied discount amount: it is trivial for a shopper to
  // alter a server-function request in devtools.
  let discount = 0;
  const normalizedPromoCode = opts.promoCode?.trim().toUpperCase() ?? "";
  if (normalizedPromoCode) {
    const { data: promo, error } = await (supabaseAdmin as any)
      .from("promo_codes")
      .select(
        "code, discount_type, discount_value, min_order_amount, max_uses, used_count, expires_at, active",
      )
      .eq("code", normalizedPromoCode)
      .eq("active", true)
      .maybeSingle();
    if (error || !promo) throw new Error("Invalid promo code");
    if (promo.expires_at && new Date(promo.expires_at).getTime() <= Date.now()) {
      throw new Error("This promo code has expired");
    }
    if (promo.max_uses !== null && Number(promo.used_count) >= Number(promo.max_uses)) {
      throw new Error("This promo code has reached its usage limit");
    }
    if (subtotal < Number(promo.min_order_amount)) {
      throw new Error(`Minimum order of $${Number(promo.min_order_amount).toFixed(2)} required`);
    }
    discount =
      promo.discount_type === "percentage"
        ? Math.round(subtotal * Number(promo.discount_value)) / 100
        : Math.min(Number(promo.discount_value), subtotal);
    discount = Math.max(0, Math.min(discount, subtotal));
  }

  // Resolve the actual inventory variants from authoritative attributes. The
  // client does not choose the database id, which prevents reserving one cheap
  // variant while buying another configuration.
  const reservationVariantIds: Array<string | null> = items.map(() => null);
  try {
    const { data: variants } = await (supabaseAdmin as any)
      .from("product_variants")
      .select("id, product_slug, color, size, length, is_active")
      .in("product_slug", slugs)
      .eq("is_active", true);
    items.forEach((item, index) => {
      const candidates = (variants ?? []).filter(
        (variant: any) =>
          variant.product_slug === item.slug &&
          (variant.color == null || variant.color === item.color) &&
          (variant.size == null || variant.size === item.size) &&
          (variant.length == null || variant.length === item.length),
      );
      candidates.sort(
        (a: any, b: any) =>
          Number(b.color != null) +
          Number(b.size != null) +
          Number(b.length != null) -
          Number(a.color != null) -
          Number(a.size != null) -
          Number(a.length != null),
      );
      reservationVariantIds[index] = candidates[0]?.id ?? null;
    });
  } catch {
    // Product-level inventory remains a safe fallback for catalogs that have
    // not migrated to variants yet.
  }
  const method = opts.shippingMethod ?? "standard";
  let shipping: number;
  if (method === "express") {
    shipping = 24.95;
  } else if (method === "overnight") {
    shipping = 49.95;
  } else {
    shipping = subtotal - discount >= freeShippingThreshold ? 0 : flatShippingRate;
  }
  // Default: flat store-wide tax_rate (legacy behavior, used as a fallback).
  let tax = taxRate > 0 ? Math.round((subtotal - discount) * (taxRate / 100) * 100) / 100 : 0;
  let taxCalculationId: string | undefined;

  // Intelligent path: real-time, destination-based tax via Stripe Tax. Only
  // ever collects tax in jurisdictions the Stripe account is registered in —
  // everywhere else correctly comes back as $0, same as the flat-rate default.
  const address = opts.shippingAddress;
  const merchandiseCents = Math.round((subtotal - discount) * 100);
  if (address && merchandiseCents > 0) {
    const iso2 = countryNameToISO(address.country);
    if (iso2) {
      const taxAddress: TaxAddress = {
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        country: iso2,
      };
      const result = await calculateTax({
        currency: "usd",
        lineItems: [{ reference: "order-items", amountCents: merchandiseCents }],
        shippingCostCents: Math.round(shipping * 100),
        address: taxAddress,
      });
      if (result) {
        tax = Math.round(result.taxAmountCents) / 100;
        taxCalculationId = result.calculationId;
      }
    }
  }

  const total = subtotal - discount + shipping + tax;

  return {
    subtotal,
    discount,
    shipping,
    tax,
    total,
    shippingMethod: method,
    taxCalculationId,
    reservationVariantIds,
  };
}
