import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return { products: data ?? [] };
});

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const { data: product, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { product };
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
    // Server-side price re-verification against DB
    const productIds = [...new Set(data.items.map((i) => i.productId))];
    const { data: dbProducts, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id, base_price")
      .in("id", productIds);
    if (pErr) throw new Error(pErr.message);

    const sizeMult: Record<string, number> = { "2mm": 1, "3mm": 1.45, "4mm": 1.95, "5mm": 2.55 };
    const lenAdd: Record<string, number> = { '18"': 0, '20"': 30, '24"': 70, '8"': 0 };

    let subtotal = 0;
    for (const item of data.items) {
      const dbp = dbProducts?.find((p) => p.id === item.productId);
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
    const tax = Math.round(subtotal * 0.0); // collected at checkout in future
    const total = subtotal + shipping + tax;

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
        items: data.items,
        subtotal,
        shipping,
        tax,
        total,
      })
      .select("order_number, total")
      .single();

    if (error) throw new Error(error.message);
    return { orderNumber: order.order_number, total: Number(order.total) };
  });
