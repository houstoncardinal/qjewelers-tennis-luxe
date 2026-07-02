import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdmin } from "@/lib/admin.functions";

const db = supabaseAdmin as any;

// Validates that the calling user matches the userId claim in their Supabase token.
// Returns the verified user object, or throws Unauthorized.
async function verifyUser(token: string, userId: string) {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) throw new Error("Unauthorized");
  if (data.user.id !== userId) throw new Error("Unauthorized");
  return data.user;
}

// ─── Addresses ────────────────────────────────────────────────────────────────

export const getAddresses = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; userId: string }) => d)
  .handler(async ({ data }) => {
    await verifyUser(data.token, data.userId);
    const { data: rows, error } = await db
      .from("customer_addresses")
      .select("*")
      .eq("user_id", data.userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { addresses: (rows ?? []) as CustomerAddress[] };
  });

export const saveAddress = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string; userId: string;
    address: {
      id?: string; name: string; line1: string; line2?: string;
      city: string; state: string; zip: string; country: string;
      phone?: string; is_default?: boolean;
    };
  }) => d)
  .handler(async ({ data }) => {
    await verifyUser(data.token, data.userId);
    const { id, ...fields } = data.address;
    const now = new Date().toISOString();

    if (fields.is_default) {
      await db.from("customer_addresses")
        .update({ is_default: false })
        .eq("user_id", data.userId);
    }

    if (id) {
      const { error } = await db.from("customer_addresses")
        .update({ ...fields, updated_at: now })
        .eq("id", id)
        .eq("user_id", data.userId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await db.from("customer_addresses")
        .insert({ ...fields, user_id: data.userId, created_at: now, updated_at: now });
      if (error) throw new Error(error.message);
    }
    return { success: true };
  });

export const deleteAddress = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; userId: string; addressId: string }) => d)
  .handler(async ({ data }) => {
    await verifyUser(data.token, data.userId);
    const { error } = await db.from("customer_addresses")
      .delete()
      .eq("id", data.addressId)
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export type CustomerAddress = {
  id: string; user_id: string; name: string;
  line1: string; line2?: string;
  city: string; state: string; zip: string; country: string;
  phone?: string; is_default: boolean;
  created_at: string; updated_at: string;
};

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export const getWishlist = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; userId: string }) => d)
  .handler(async ({ data }) => {
    await verifyUser(data.token, data.userId);
    const { data: rows, error } = await db
      .from("wishlist_items")
      .select("id, product_slug, added_at")
      .eq("user_id", data.userId)
      .order("added_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: (rows ?? []) as WishlistItem[] };
  });

export const toggleWishlist = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; userId: string; productSlug: string }) => d)
  .handler(async ({ data }) => {
    await verifyUser(data.token, data.userId);
    const { data: existing } = await db
      .from("wishlist_items")
      .select("id")
      .eq("user_id", data.userId)
      .eq("product_slug", data.productSlug)
      .maybeSingle();

    if (existing) {
      await db.from("wishlist_items").delete().eq("id", existing.id);
      return { action: "removed" as const };
    }
    await db.from("wishlist_items")
      .insert({ user_id: data.userId, product_slug: data.productSlug });
    return { action: "added" as const };
  });

export type WishlistItem = { id: string; product_slug: string; added_at: string };

// ─── Abandoned Cart ───────────────────────────────────────────────────────────

export const saveAbandonedCart = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string; userId: string; userEmail: string;
    cartItems: any[]; cartTotal: number;
  }) => d)
  .handler(async ({ data }) => {
    await verifyUser(data.token, data.userId);
    if (data.cartItems.length === 0) return { success: true };
    const now = new Date().toISOString();
    const { error } = await db.from("abandoned_carts").upsert({
      user_id: data.userId,
      user_email: data.userEmail,
      cart_items: data.cartItems,
      cart_total: data.cartTotal,
      recovery_status: "pending",
      email_sent_at: null,
      recovered_at: null,
      updated_at: now,
    }, { onConflict: "user_id" });
    if (error && !error.message.includes("unique")) throw new Error(error.message);
    return { success: true };
  });

export const markCartRecovered = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; userId: string }) => d)
  .handler(async ({ data }) => {
    await verifyUser(data.token, data.userId);
    await db.from("abandoned_carts")
      .update({ recovery_status: "recovered", recovered_at: new Date().toISOString() })
      .eq("user_id", data.userId)
      .in("recovery_status", ["pending", "email_sent"]);
    return { success: true };
  });

// ─── Admin: Abandoned Cart Management ─────────────────────────────────────────

export const adminListAbandonedCarts = createServerFn({ method: "POST" })
  .inputValidator((d: { status?: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin("");
    const query = db.from("abandoned_carts")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(200);
    if (data.status && data.status !== "all") {
      query.eq("recovery_status", data.status);
    }
    const { data: carts, error } = await query;
    if (error) throw new Error(error.message);
    return { carts: (carts ?? []) as AbandonedCart[] };
  });

export const adminUpdateCartStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { cartId: string; status: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin("");
    const { error } = await db.from("abandoned_carts")
      .update({ recovery_status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.cartId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const adminGetCartSettings = createServerFn({ method: "GET" })
  .handler(async () => {
    requireAdmin("");
    const { data: rows, error } = await db.from("abandoned_cart_settings").select("key, value");
    if (error) throw new Error(error.message);
    const settings: Record<string, string> = {};
    for (const row of (rows ?? [])) settings[row.key] = row.value;
    return { settings };
  });

export const adminSaveCartSettings = createServerFn({ method: "POST" })
  .inputValidator((d: { settings: Record<string, string> }) => d)
  .handler(async ({ data }) => {
    requireAdmin("");
    const now = new Date().toISOString();
    for (const [key, value] of Object.entries(data.settings)) {
      await db.from("abandoned_cart_settings")
        .upsert({ key, value, updated_at: now }, { onConflict: "key" });
    }
    return { success: true };
  });

export type AbandonedCart = {
  id: string; user_id: string | null; user_email: string;
  cart_items: any[]; cart_total: number | null;
  recovery_status: string; email_sent_at: string | null;
  recovered_at: string | null; created_at: string; updated_at: string;
};
