import crypto from "node:crypto";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { generateSecret as generateTotpSecret, generateURI as generateTotpURI, verify as verifyTotp } from "otplib";
import QRCode from "qrcode";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendShippingNotification } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

const db = supabaseAdmin as any; // admin_users / audit_logs not in generated types

const ADMIN_PIN = process.env.ADMIN_PIN ?? "011491";
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET ?? "";
const SESSION_COOKIE = "qj_admin_session";
const PENDING_2FA_COOKIE = "qj_admin_pending_2fa";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const PENDING_2FA_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Signed cookie values (HMAC-SHA256, hand-rolled, synchronous) ─────────────
// Deliberately not TanStack's async `useSession` — every existing
// `requireAdmin(...)` call site below is a bare synchronous statement, and
// switching to an async session API would require threading `await` through
// 60+ call sites across the admin routes, where a missed `await` fails
// silently. This keeps every call site's signature unchanged.
// Payload format is "<value>:<expiresAt>" — value never contains ":" (it's
// either a UUID or empty), so verify() can split unambiguously.

function signValue(value: string, expiresAt: number): string {
  if (!SESSION_SECRET) throw new Error("ADMIN_SESSION_SECRET is not configured");
  const payload = `${value}:${expiresAt}`;
  const hmac = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `${payload}.${hmac}`;
}

function verifyValue(cookieValue: string | undefined): string | null {
  if (!cookieValue || !SESSION_SECRET) return null;
  const dotIdx = cookieValue.lastIndexOf(".");
  if (dotIdx === -1) return null;
  const payload = cookieValue.slice(0, dotIdx);
  const hmac = cookieValue.slice(dotIdx + 1);
  if (!payload || !hmac) return null;

  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(hmac, "hex");
  if (expectedBuf.length !== actualBuf.length) return null;
  if (!crypto.timingSafeEqual(expectedBuf, actualBuf)) return null;

  const sepIdx = payload.lastIndexOf(":");
  if (sepIdx === -1) return null;
  const value = payload.slice(0, sepIdx);
  const expiresAt = Number(payload.slice(sepIdx + 1));
  if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) return null;
  return value;
}

// ─── Password hashing (Node's built-in crypto.scrypt, no new dependency) ─────

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// createServerOnlyFn (not a plain function) so TanStack's compiler swaps these
// out for throwing stubs in the client bundle — bare functions here would
// leave the literal getCookie() calls (and the @tanstack/react-start/server
// import they need) reachable from the client graph, since every call site is
// inside other createServerFn handlers, none of which is one of these macros.
export const requireAdmin = createServerOnlyFn((_token: string) => {
  if (!verifyValue(getCookie(SESSION_COOKIE))) {
    throw new Error("Unauthorized");
  }
});

// Resolves the acting admin's user id from the session cookie — call only
// after requireAdmin() has already confirmed the session is valid.
export const getCurrentAdminId = createServerOnlyFn((): string => {
  const id = verifyValue(getCookie(SESSION_COOKIE));
  if (!id) throw new Error("Unauthorized");
  return id;
});

// ─── Audit log ────────────────────────────────────────────────────────────────
// Plain async function (not a createServerFn) — called only from within other
// handlers' closures, so it never touches cookies directly and needs no
// createServerOnlyFn wrapping.
export async function writeAuditLog(params: {
  adminUserId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.from("audit_logs").insert({
      admin_user_id: params.adminUserId,
      action: params.action,
      target_type: params.targetType ?? null,
      target_id: params.targetId ?? null,
      details: params.details ?? null,
    });
  } catch (e) {
    console.warn("[AuditLog] Failed to write entry:", e);
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const adminAuth = createServerFn({ method: "POST" })
  .inputValidator((d: { pin: string }) => d)
  .handler(async ({ data }) => {
    checkRateLimit("admin-login", { windowMs: 15 * 60 * 1000, max: 10 });

    // Fail loudly on missing config rather than letting signValue() throw
    // later and have the login UI mislabel it as a wrong-PIN error.
    if (!SESSION_SECRET) throw new Error("Server misconfigured: ADMIN_SESSION_SECRET is not set");

    if (!data.pin || data.pin !== ADMIN_PIN) {
      throw new Error("Unauthorized");
    }

    // The PIN is the only credential — bootstrap (or reuse) a single "admin"
    // admin_users row purely so downstream features keyed off admin_users.id
    // (audit log FKs, staff management, optional TOTP) keep working unchanged.
    let { data: user } = await db.from("admin_users").select("*").eq("username", "admin").maybeSingle();
    if (!user) {
      const { data: created, error } = await db
        .from("admin_users")
        .insert({ username: "admin", password_hash: hashPassword(crypto.randomBytes(32).toString("hex")), role: "admin" })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      user = created;
    }

    if (user.totp_enabled) {
      setCookie(PENDING_2FA_COOKIE, signValue(user.id, Date.now() + PENDING_2FA_TTL_MS), {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: PENDING_2FA_TTL_MS / 1000,
      });
      return { success: true, requiresTotp: true };
    }

    setCookie(SESSION_COOKIE, signValue(user.id, Date.now() + SESSION_TTL_MS), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_MS / 1000,
    });
    return { success: true, requiresTotp: false };
  });

export const verifyTotpLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => d)
  .handler(async ({ data }) => {
    checkRateLimit("admin-login-2fa", { windowMs: 15 * 60 * 1000, max: 10 });

    const adminUserId = verifyValue(getCookie(PENDING_2FA_COOKIE));
    if (!adminUserId) throw new Error("Login expired — please sign in again");

    const { data: user } = await db.from("admin_users").select("*").eq("id", adminUserId).maybeSingle();
    if (!user?.totp_enabled || !user.totp_secret) throw new Error("Unauthorized");

    const result = await verifyTotp({ secret: user.totp_secret, token: data.code.trim() });
    if (!result.valid) {
      throw new Error("Invalid code");
    }

    deleteCookie(PENDING_2FA_COOKIE, { path: "/" });
    setCookie(SESSION_COOKIE, signValue(user.id, Date.now() + SESSION_TTL_MS), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_MS / 1000,
    });
    return { success: true };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie(SESSION_COOKIE, { path: "/" });
  deleteCookie(PENDING_2FA_COOKIE, { path: "/" });
  return { success: true };
});

export const checkAdminSession = createServerFn({ method: "GET" }).handler(async () => {
  return { authenticated: !!verifyValue(getCookie(SESSION_COOKIE)) };
});

// ─── TOTP Enrollment ────────────────────────────────────────────────────────

export const enrollTotp = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const adminUserId = getCurrentAdminId();

    const { data: user, error } = await db.from("admin_users").select("username").eq("id", adminUserId).single();
    if (error || !user) throw new Error("Admin user not found");

    const secret = generateTotpSecret();
    await db.from("admin_users").update({ totp_secret: secret }).eq("id", adminUserId);

    const otpauthUrl = generateTotpURI({ issuer: "Qureshi Jewelers Admin", label: user.username, secret });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return { secret, qrCodeDataUrl };
  });

export const confirmTotpEnrollment = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; code: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const adminUserId = getCurrentAdminId();

    const { data: user, error } = await db.from("admin_users").select("totp_secret").eq("id", adminUserId).single();
    if (error || !user?.totp_secret) throw new Error("No pending TOTP enrollment");

    const result = await verifyTotp({ secret: user.totp_secret, token: data.code.trim() });
    if (!result.valid) {
      throw new Error("Invalid code");
    }

    await db.from("admin_users").update({ totp_enabled: true }).eq("id", adminUserId);
    await writeAuditLog({ adminUserId, action: "totp_enrolled" });
    return { success: true };
  });

export const disableTotp = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const adminUserId = getCurrentAdminId();
    await db.from("admin_users").update({ totp_enabled: false, totp_secret: null }).eq("id", adminUserId);
    await writeAuditLog({ adminUserId, action: "totp_disabled" });
    return { success: true };
  });

// ─── Staff Management (admin role only) ───────────────────────────────────────

export const listAdminUsers = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { data: users, error } = await db
      .from("admin_users")
      .select("id, username, role, totp_enabled, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { users: users ?? [] };
  });

export const createAdminUser = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; username: string; password: string; role: "admin" | "staff" }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const actingId = getCurrentAdminId();

    const { data: acting } = await db.from("admin_users").select("role").eq("id", actingId).single();
    if (acting?.role !== "admin") throw new Error("Only admins can create staff accounts");

    const username = data.username.trim().toLowerCase();
    if (!username || !data.password) throw new Error("Username and password are required");

    const { data: created, error } = await db
      .from("admin_users")
      .insert({ username, password_hash: hashPassword(data.password), role: data.role })
      .select("id, username, role")
      .single();
    if (error) throw new Error(error.message);

    await writeAuditLog({ adminUserId: actingId, action: "admin_user_created", targetType: "admin_users", targetId: created.id, details: { username, role: data.role } });
    return { user: created };
  });

export const getAuditLog = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; limit?: number }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { data: logs, error } = await db
      .from("audit_logs")
      .select("*, admin_users(username)")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (error) throw new Error(error.message);
    return { logs: logs ?? [] };
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

    writeAuditLog({
      adminUserId: getCurrentAdminId(),
      action: "order_updated",
      targetType: "orders",
      targetId: data.orderId,
      details: { status: data.status, tracking_number: data.tracking_number },
    }).catch((e) => console.warn("[AuditLog] order_updated failed:", e));

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
