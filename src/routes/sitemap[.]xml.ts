import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE_URL = "";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const staticPaths = ["/", "/shop", "/about", "/contact"];
        const { data: products } = await supabaseAdmin
          .from("products").select("slug").eq("is_active", true);

        const all = [
          ...staticPaths.map((p) => ({ path: p })),
          ...(products ?? []).map((p) => ({ path: `/product/${p.slug}` })),
        ];

        const urls = all.map(
          (e) => `  <url><loc>${BASE_URL}${e.path}</loc><changefreq>weekly</changefreq></url>`,
        );
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
