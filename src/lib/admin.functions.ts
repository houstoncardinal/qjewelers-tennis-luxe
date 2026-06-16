import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendShippingNotification } from "@/lib/email";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "";

function requireAdmin(token: string) {
  if (!token || token !== ADMIN_TOKEN) {
    throw new Error("Unauthorized");
  }
}

// ─── Rate limiter (in-memory, per server instance) ────────────────────────────

const _loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkLoginRateLimit(ip: string): void {
  const now = Date.now();
  const WINDOW_MS  = 15 * 60 * 1000; // 15 minutes
  const MAX_TRIES  = 10;

  let entry = _loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    _loginAttempts.set(ip, entry);
  }
  entry.count++;
  if (entry.count > MAX_TRIES) {
    const waitMin = Math.ceil((entry.resetAt - now) / 60_000);
    throw new Error(`Too many login attempts. Try again in ${waitMin} minute${waitMin !== 1 ? "s" : ""}.`);
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const adminAuth = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; _ip?: string }) => d)
  .handler(async ({ data }) => {
    const ip = data._ip ?? "unknown";
    checkLoginRateLimit(ip);
    if (!data.password || data.password !== ADMIN_TOKEN) {
      throw new Error("Unauthorized");
    }
    // Clear rate limit on success
    _loginAttempts.delete(ip);
    return { token: ADMIN_TOKEN };
  });

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export const getDashboardStats = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);

    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("total, status, created_at");

    if (error) throw new Error(error.message);

    const all = orders ?? [];

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const todayOrders = all.filter((o) => o.created_at >= todayISO);

    return {
      totalRevenue:     all.reduce((s, o) => s + Number(o.total), 0),
      totalOrders:      all.length,
      todayRevenue:     todayOrders.reduce((s, o) => s + Number(o.total), 0),
      todayOrderCount:  todayOrders.length,
      pendingOrders:    all.filter((o) => o.status === "pending").length,
      processingOrders: all.filter((o) => o.status === "processing").length,
      shippedOrders:    all.filter((o) => o.status === "shipped").length,
      deliveredOrders:  all.filter((o) => o.status === "delivered").length,
      cancelledOrders:  all.filter((o) => o.status === "cancelled").length,
    };
  });

// ─── List Orders ──────────────────────────────────────────────────────────────

export const listAdminOrders = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);

    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return { orders: orders ?? [] };
  });

// ─── Single Order ─────────────────────────────────────────────────────────────

export const getAdminOrder = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; orderId: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", data.orderId)
      .single();

    if (error) throw new Error(error.message);
    return { order };
  });

// ─── Update Order ─────────────────────────────────────────────────────────────

export const updateAdminOrder = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string;
    orderId: string;
    status: string;
    tracking_number?: string;
    tracking_carrier?: string;
    admin_notes?: string;
  }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);

    const { error } = await supabaseAdmin
      .from("orders")
      .update({
        status: data.status,
        tracking_number: data.tracking_number || null,
        tracking_carrier: data.tracking_carrier || null,
        admin_notes: data.admin_notes || null,
      } as any)
      .eq("id", data.orderId);

    if (error) throw new Error(error.message);

    // Send shipping notification when status changes to "shipped"
    if (data.status === "shipped") {
      try {
        const { data: order } = await supabaseAdmin
          .from("orders")
          .select("customer_name, customer_email, order_number, shipping_city, shipping_state, shipping_country")
          .eq("id", data.orderId)
          .single();
        if (order) {
          const addr = [order.shipping_city, order.shipping_state, order.shipping_country]
            .filter(Boolean).join(", ");
          sendShippingNotification({
            orderNumber:     order.order_number,
            customerName:    order.customer_name,
            customerEmail:   order.customer_email,
            trackingNumber:  data.tracking_number ?? null,
            trackingCarrier: data.tracking_carrier ?? null,
            shippingAddress: addr,
          }).catch((e) => console.warn("[Email] Shipping notification failed:", e));
        }
      } catch (e) {
        console.warn("[Email] Could not fetch order for shipping email:", e);
      }
    }

    return { success: true };
  });

// ─── Customer Order Lookup (public) ───────────────────────────────────────────

export const lookupOrder = createServerFn({ method: "GET" })
  .inputValidator((d: { email: string; orderNumber: string }) => d)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    const orderNumber = data.orderNumber.trim().toUpperCase();

    if (!email || !orderNumber) throw new Error("Missing fields");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "order_number, status, created_at, total, subtotal, shipping, items, " +
        "tracking_number, tracking_carrier, " +
        "shipping_city, shipping_state, shipping_country"
      )
      .eq("order_number", orderNumber)
      .ilike("customer_email", email)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!order) throw new Error("Order not found");

    return { order };
  });
