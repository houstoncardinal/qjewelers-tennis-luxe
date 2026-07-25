import crypto from "node:crypto";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { generateSecret as generateTotpSecret, generateURI as generateTotpURI, verify as verifyTotp } from "otplib";
import QRCode from "qrcode";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendShippingNotification, sendOrderStatusUpdate } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { getMerchantFeedReadiness } from "@/lib/merchant-feed";
import { getTaxStatus } from "@/lib/payments/stripe.server";

const db = supabaseAdmin as any; // admin_users / audit_logs not in generated types

const ADMIN_BOOTSTRAP_PASSWORD = process.env.ADMIN_BOOTSTRAP_PASSWORD ?? "";
const ADMIN_PIN = process.env.ADMIN_PIN ?? "";
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

function verifyPassword(password: string, encoded: string): boolean {
  const [salt, expectedHex] = encoded.split(":");
  if (!salt || !expectedHex) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

type AdminRole = "admin" | "staff";
function sessionIdentity(): { id: string; role: AdminRole } | null {
  const value = verifyValue(getCookie(SESSION_COOKIE));
  if (!value) return null;
  const [id, role] = value.split("|");
  if (!id || (role !== "admin" && role !== "staff")) return null;
  return { id, role };
}

// createServerOnlyFn (not a plain function) so TanStack's compiler swaps these
// out for throwing stubs in the client bundle — bare functions here would
// leave the literal getCookie() calls (and the @tanstack/react-start/server
// import they need) reachable from the client graph, since every call site is
// inside other createServerFn handlers, none of which is one of these macros.
export const requireAdmin = createServerOnlyFn((_token: string) => {
  if (!sessionIdentity()) {
    throw new Error("Unauthorized");
  }
});

export const requireAdminRole = createServerOnlyFn((allowed: AdminRole[]) => {
  const identity = sessionIdentity();
  if (!identity || !allowed.includes(identity.role)) throw new Error("Forbidden");
  return identity;
});

// Resolves the acting admin's user id from the session cookie — call only
// after requireAdmin() has already confirmed the session is valid.
export const getCurrentAdminId = createServerOnlyFn((): string => {
  const identity = sessionIdentity();
  if (!identity) throw new Error("Unauthorized");
  return identity.id;
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
  .inputValidator((d: { username: string; password: string }) => d)
  .handler(async ({ data }) => {
    checkRateLimit("admin-login", { windowMs: 15 * 60 * 1000, max: 10 });

    // Fail loudly on missing config rather than letting signValue() throw
    // later and have the login UI mislabel it as a wrong-PIN error.
    if (!SESSION_SECRET) throw new Error("Server misconfigured: ADMIN_SESSION_SECRET is not set");
    const username = data.username.trim().toLowerCase();
    if (!username || !data.password) throw new Error("Unauthorized");
    let { data: user } = await db.from("admin_users").select("*").eq("username", username).maybeSingle();
    if (!user) {
      if (username !== "admin" || !ADMIN_BOOTSTRAP_PASSWORD || data.password !== ADMIN_BOOTSTRAP_PASSWORD) {
        throw new Error("Unauthorized");
      }
      const { data: created, error } = await db
        .from("admin_users")
        .insert({ username: "admin", password_hash: hashPassword(data.password), role: "admin" })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      user = created;
    }
    let passwordValid = verifyPassword(data.password, user.password_hash);
    // One-time migration for the legacy bootstrap row whose original password
    // was deliberately random and unknowable. Remove ADMIN_BOOTSTRAP_PASSWORD
    // from Netlify immediately after the first successful login.
    if (!passwordValid && username === "admin" && ADMIN_BOOTSTRAP_PASSWORD && data.password === ADMIN_BOOTSTRAP_PASSWORD) {
      const password_hash = hashPassword(data.password);
      const { error } = await db.from("admin_users").update({ password_hash }).eq("id", user.id);
      if (error) throw new Error(error.message);
      user.password_hash = password_hash;
      passwordValid = true;
    }
    if (!passwordValid) throw new Error("Unauthorized");

    if (user.totp_enabled) {
      setCookie(PENDING_2FA_COOKIE, signValue(user.id, Date.now() + PENDING_2FA_TTL_MS), {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "lax",
        path: "/",
        maxAge: PENDING_2FA_TTL_MS / 1000,
      });
      return { success: true, requiresTotp: true };
    }

    setCookie(SESSION_COOKIE, signValue(`${user.id}|${user.role}`, Date.now() + SESSION_TTL_MS), {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_MS / 1000,
    });
    return { success: true, requiresTotp: false };
  });

// Temporary owner PIN entry point. The PIN remains server-only and grants the
// same signed, expiring HttpOnly admin session used by password authentication.
export const adminPinAuth = createServerFn({ method: "POST" })
  .inputValidator((d: { pin: string }) => d)
  .handler(async ({ data }) => {
    checkRateLimit("admin-pin-login", { windowMs: 15 * 60 * 1000, max: 8 });
    if (!SESSION_SECRET) throw new Error("Server misconfigured: ADMIN_SESSION_SECRET is not set");
    if (!/^\d{6}$/.test(ADMIN_PIN)) throw new Error("Server misconfigured: ADMIN_PIN must be six digits");

    const supplied = Buffer.from(data.pin);
    const expected = Buffer.from(ADMIN_PIN);
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
      throw new Error("Unauthorized");
    }

    let { data: user, error } = await db
      .from("admin_users")
      .select("id, role")
      .eq("username", "admin")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!user) {
      const created = await db
        .from("admin_users")
        .insert({
          username: "admin",
          password_hash: hashPassword(crypto.randomBytes(32).toString("hex")),
          role: "admin",
        })
        .select("id, role")
        .single();
      if (created.error) throw new Error(created.error.message);
      user = created.data;
    }

    setCookie(SESSION_COOKIE, signValue(`${user.id}|admin`, Date.now() + SESSION_TTL_MS), {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_MS / 1000,
    });
    await writeAuditLog({
      adminUserId: user.id,
      action: "admin_pin_login",
      targetType: "admin_users",
      targetId: user.id,
    });
    return { success: true };
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
    setCookie(SESSION_COOKIE, signValue(`${user.id}|${user.role}`, Date.now() + SESSION_TTL_MS), {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
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
  const identity = sessionIdentity();
  return { authenticated: !!identity, role: identity?.role ?? null };
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
    requireAdminRole(["admin"]);
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
    if (!/^[a-z0-9._-]{3,50}$/.test(username)) throw new Error("Use a valid username (3–50 characters)");
    if (data.password.length < 12) throw new Error("Administrative passwords must be at least 12 characters");

    const { data: created, error } = await db
      .from("admin_users")
      .insert({ username, password_hash: hashPassword(data.password), role: data.role })
      .select("id, username, role")
      .single();
    if (error) throw new Error(error.message);

    await writeAuditLog({ adminUserId: actingId, action: "admin_user_created", targetType: "admin_users", targetId: created.id, details: { username, role: data.role } });
    return { user: created };
  });

export const deleteAdminUser = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; userId: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const actingId = getCurrentAdminId();
    const { data: acting } = await db.from("admin_users").select("role").eq("id", actingId).single();
    if (acting?.role !== "admin") throw new Error("Only admins can delete staff accounts");
    if (data.userId === actingId) throw new Error("You cannot delete your own account");
    const { error } = await db.from("admin_users").delete().eq("id", data.userId);
    if (error) throw new Error(error.message);
    await writeAuditLog({ adminUserId: actingId, action: "admin_user_deleted", targetType: "admin_users", targetId: data.userId, details: {} });
    return { success: true };
  });

export const getAuditLog = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; limit?: number }) => d)
  .handler(async ({ data }) => {
    requireAdminRole(["admin"]);
    const { data: logs, error } = await db
      .from("audit_logs")
      .select("*, admin_users(username)")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (error) throw new Error(error.message);
    return { logs: logs ?? [] };
  });

// ─── Launch Integrations ─────────────────────────────────────────────────────

export const getLaunchReadiness = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    requireAdminRole(["admin"]);
    const siteUrl = (process.env.VITE_SITE_URL ?? "https://qureshijewelers.com").replace(/\/$/, "");
    const merchant = await getMerchantFeedReadiness();
    const stripeSecret = process.env.STRIPE_SECRET_KEY ?? "";
    const stripePublishable = process.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "";
    const tax = await getTaxStatus();

    return {
      siteUrl,
      merchant,
      tax: {
        active: tax.active,
        registrations: tax.registrations,
        settingsUrl: "https://dashboard.stripe.com/settings/tax",
        registrationsUrl: "https://dashboard.stripe.com/tax/registrations",
      },
      stripe: {
        configured: Boolean(stripeSecret && stripePublishable),
        secretKeyMode: stripeSecret.startsWith("sk_live_") ? "live" : stripeSecret.startsWith("sk_test_") ? "test" : "missing",
        publishableKeyMode: stripePublishable.startsWith("pk_live_") ? "live" : stripePublishable.startsWith("pk_test_") ? "test" : "missing",
        webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
        publishableKeyLast4: stripePublishable ? stripePublishable.slice(-4) : "",
        checkoutReady: Boolean(stripeSecret && stripePublishable && process.env.STRIPE_WEBHOOK_SECRET),
        webhookUrl: `${siteUrl}/.netlify/functions/stripe-webhook`,
        dashboardUrl: "https://dashboard.stripe.com/register",
        apiKeysUrl: "https://dashboard.stripe.com/apikeys",
        webhooksUrl: "https://dashboard.stripe.com/webhooks",
      },
      requiredEnv: [
        "STRIPE_SECRET_KEY",
        "VITE_STRIPE_PUBLISHABLE_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "VITE_SITE_URL",
      ],
    };
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

    // Fetched before the write so we can tell what actually changed — an
    // admin re-saving the same status/tracking shouldn't re-notify the customer.
    const { data: before, error: beforeErr } = await db
      .from("orders")
      .select("status, tracking_number, tracking_carrier, customer_name, customer_email, order_number, shipping_city, shipping_state, shipping_country")
      .eq("id", data.orderId)
      .single();
    if (beforeErr) throw new Error(beforeErr.message);

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

    const newTrackingNumber = data.tracking_number || null;
    const newTrackingCarrier = data.tracking_carrier || null;
    const statusChanged = before.status !== data.status;
    const trackingChanged =
      before.tracking_number !== newTrackingNumber || before.tracking_carrier !== newTrackingCarrier;
    const shippingAddress = [before.shipping_city, before.shipping_state, before.shipping_country]
      .filter(Boolean)
      .join(", ");

    if (data.status === "shipped" && (statusChanged || trackingChanged)) {
      sendShippingNotification({
        orderNumber:     before.order_number,
        customerName:    before.customer_name,
        customerEmail:   before.customer_email,
        trackingNumber:  newTrackingNumber,
        trackingCarrier: newTrackingCarrier,
        shippingAddress,
      }).catch((e) => console.warn("[Email] Shipping notification failed:", e));
    } else if (
      statusChanged &&
      (data.status === "processing" || data.status === "delivered" || data.status === "cancelled" || data.status === "refunded")
    ) {
      sendOrderStatusUpdate({
        orderNumber:   before.order_number,
        customerName:  before.customer_name,
        customerEmail: before.customer_email,
        status:        data.status,
      }).catch((e) => console.warn("[Email] Order status update email failed:", e));
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
