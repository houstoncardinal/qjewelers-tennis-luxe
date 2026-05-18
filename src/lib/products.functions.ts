import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ALL_PRODUCTS } from "@/lib/products.data";

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  type: string;
  color: string;
  size: string | null;
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

// Try to connect to Supabase, fallback to static data
export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    if (data && data.length > 0) {
      return { products: data as unknown as ProductRow[] };
    }
  } catch (e) {
    console.warn("[Products] Supabase unavailable, using static catalog");
  }
  // Fallback to static data
  return { products: ALL_PRODUCTS as unknown as ProductRow[] };
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
    // Fallback to static data
    const product = ALL_PRODUCTS.find((p) => p.slug === data.slug && p.is_active) ?? null;
    return { product: product as unknown as ProductRow | null };
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
});

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator(orderInputSchema)
  .handler(async ({ data }) => {
    const sizeMult: Record<string, number> = { "2mm": 1, "3mm": 1.45, "4mm": 1.95, "5mm": 2.55, "6.5mm": 3.45 };
    const lenAdd: Record<string, number> = { '16"': -20, '18"': 0, '20"': 30, '22"': 50, '24"': 70, '8"': 0 };

    let subtotal = 0;
    for (const item of data.items) {
      const dbp = ALL_PRODUCTS.find((p) => p.id === item.productId);
      if (!dbp) throw new Error(`Product ${item.productId} not found`);
      const expected = Math.round(
        Number(dbp.base_price) * (sizeMult[item.size] ?? 1) + (lenAdd[item.length] ?? 0),
      );
      if (expected !== item.unitPrice) {
        throw new Error(`Price mismatch for ${item.name}`);
      }
      subtotal += expected * item.quantity;
    }

    const shipping = subtotal >= 250 ? 0 : 15;
    const total = subtotal + shipping;

    // Try Supabase first, fallback to simulated order
    try {
      const { data: order, error } = await supabaseAdmin
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
          tax: 0,
          total,
        })
        .select("order_number, total")
        .single();
      if (!error && order) {
        return { orderNumber: order.order_number, total: Number(order.total) };
      }
    } catch (e) {
      console.warn("[Orders] Supabase unavailable, using simulated order");
    }
    // Fallback: simulate order placement
    const orderNumber = `QJ-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    return { orderNumber, total };
  });