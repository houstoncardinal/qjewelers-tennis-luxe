import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://qureshijewelers.com").replace(/\/$/, "");

// changefreq/priority are weak hints to crawlers, not guarantees — set
// conservatively. lastmod is the signal that actually matters; it's omitted
// for static marketing pages we can't track edits to, and populated from
// `updated_at` for products so Google knows when to re-crawl a listing.
const STATIC_PAGES: { path: string; changefreq: string; priority: string }[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/shop", changefreq: "daily", priority: "0.9" },
  { path: "/shop?type=necklace", changefreq: "daily", priority: "0.85" },
  { path: "/shop?type=bracelet", changefreq: "daily", priority: "0.85" },
  { path: "/shop?type=earring", changefreq: "daily", priority: "0.85" },
  { path: "/shop?type=ring", changefreq: "daily", priority: "0.85" },
  { path: "/moissanite-guide", changefreq: "monthly", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/faq", changefreq: "monthly", priority: "0.6" },
  { path: "/size-guide", changefreq: "monthly", priority: "0.6" },
  { path: "/track-order", changefreq: "yearly", priority: "0.3" },
  { path: "/returns", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.2" },
  { path: "/terms-of-service", changefreq: "yearly", priority: "0.2" },
  { path: "/refund-policy", changefreq: "yearly", priority: "0.2" },
];

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { data: products } = await supabaseAdmin
          .from("products")
          .select("slug, name, updated_at, image_url")
          .eq("is_active", true);

        const staticEntries = STATIC_PAGES.map(
          (p) =>
            `  <url><loc>${escapeXml(`${SITE_URL}${p.path}`)}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`
        );

        const productEntries = (products ?? []).map((p) => {
          const lastmod = p.updated_at ? `<lastmod>${new Date(p.updated_at).toISOString().slice(0, 10)}</lastmod>` : "";
          const imageUrl = p.image_url?.startsWith("http") ? p.image_url : p.image_url ? `${SITE_URL}${p.image_url}` : "";
          const imageTag = imageUrl
            ? `\n    <image:image><image:loc>${escapeXml(imageUrl)}</image:loc><image:title>${escapeXml(p.name ?? "")}</image:title><image:caption>${escapeXml(`${p.name ?? ""} — VVS Moissanite | Qureshi Jewelers`)}</image:caption></image:image>`
            : "";
          return `  <url><loc>${escapeXml(`${SITE_URL}/product/${p.slug}`)}</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.7</priority>${imageTag}\n  </url>`;
        });

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
          ...staticEntries,
          ...productEntries,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
