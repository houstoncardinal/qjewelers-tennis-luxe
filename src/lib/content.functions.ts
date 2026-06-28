import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdmin } from "@/lib/admin.functions";

// site_content is not in the generated Supabase types (migration applied separately),
// so we bypass the type-checker the same way admin_users / audit_logs are handled.
const db = supabaseAdmin as any;

// ─── Public ───────────────────────────────────────────────────────────────────

// Loads the full content map for SSR hydration in the root loader.
export const getSiteContent = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await db
    .from("site_content")
    .select("key, value");
  if (error) {
    console.error("[CMS] getSiteContent:", error.message);
    return {} as Record<string, string>;
  }
  return Object.fromEntries(
    (data ?? []).map((r: { key: string; value: string }) => [r.key, r.value])
  ) as Record<string, string>;
});

// ─── Admin ────────────────────────────────────────────────────────────────────

// Upsert a single content key — called on every inline edit blur.
export const updateSiteContent = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; key: string; value: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { error } = await db
      .from("site_content")
      .upsert(
        { key: data.key, value: data.value, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    if (error) throw new Error(error.message);
    return { success: true };
  });

// Bulk upsert — used by the admin content dashboard "Save all" action.
export const bulkUpdateSiteContent = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; updates: Array<{ key: string; value: string }> }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const now = new Date().toISOString();
    const rows = data.updates.map((u) => ({ key: u.key, value: u.value, updated_at: now }));
    const { error } = await db
      .from("site_content")
      .upsert(rows, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { success: true };
  });

// Full content table for the admin content dashboard.
export const listSiteContent = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { data: rows, error } = await db
      .from("site_content")
      .select("*")
      .order("section", { ascending: true })
      .order("label", { ascending: true });
    if (error) throw new Error(error.message);
    return { rows: (rows ?? []) as Array<{ key: string; value: string; type: string; section: string; label: string; updated_at: string }> };
  });

// Trigger a Netlify redeploy via a configured build hook URL.
// Content changes are live immediately (SSR reads DB on every request),
// so this is only needed to force a CDN cache purge or pick up code changes.
export const triggerNetlifyDeploy = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const hookUrl = process.env.NETLIFY_BUILD_HOOK_URL;
    if (!hookUrl) throw new Error("NETLIFY_BUILD_HOOK_URL is not configured in environment variables");
    const res = await fetch(hookUrl, { method: "POST", body: "" });
    if (!res.ok) throw new Error(`Deploy trigger failed (HTTP ${res.status})`);
    return { success: true };
  });
