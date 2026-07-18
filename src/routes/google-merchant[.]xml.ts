import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { buildGoogleMerchantXml, fetchMerchantProducts } from "@/lib/merchant-feed";

export const Route = createFileRoute("/google-merchant.xml")({
  server: {
    handlers: {
      GET: async () => {
        const products = await fetchMerchantProducts();
        const xml = buildGoogleMerchantXml(products);
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=1800",
          },
        });
      },
    },
  },
});
