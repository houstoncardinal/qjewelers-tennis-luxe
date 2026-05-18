import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { listProducts } from "@/lib/products.functions";
import { getProductThumb } from "@/lib/product-images";
import { formatUSD, COLOR_MAP, COLOR_SHORT, SIZES_NECKLACE, SIZE_DESCRIPTIONS } from "@/lib/pricing";
import { ArrowRight } from "lucide-react";

const search = z.object({
  type: z.enum(["necklace", "bracelet"]).optional(),
  color: z.enum(["silver", "gold", "rose_gold", "white_gold"]).optional(),
  size: z.enum(["2mm", "3mm", "4mm", "5mm", "6.5mm"]).optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Shop S925 Moissanite Tennis Chains & Bracelets | Qureshi Jewelers" },
      { name: "description", content: "Browse 30+ S925 sterling silver VVS moissanite tennis chains and bracelets. S925 Sterling Silver, 18K Yellow Gold, 18K Rose Gold, 18K White Gold. 2mm-6.5mm widths. GRA certified. Free US shipping over $250." },
      { property: "og:title", content: "Shop Tennis Chains & Bracelets | Qureshi Jewelers" },
      { property: "og:description", content: "S925 VVS moissanite tennis chains and bracelets. GRA certified. 4 finishes, 5 widths." },
      { property: "og:url", content: "/shop" },
    ],
    links: [{ rel: "canonical", href: "/shop" }],
  }),
  component: Shop,
});

function Shop() {
  const { type, color, size } = Route.useSearch();
  const fetchProducts = useServerFn(listProducts);
  const { data, isLoading } = useQuery({ queryKey: ["products"], queryFn: () => fetchProducts() });

  let products = (data?.products ?? []) as any[];
  if (type) products = products.filter((p: any) => p.type === type);
  if (color) products = products.filter((p: any) => p.color === color);
  if (size) products = products.filter((p: any) => p.size === size || !p.size);

  const filterChip = (label: string, active: boolean, href: any) => (
    <Link
      {...href}
      className={`px-4 py-2 text-xs uppercase tracking-[0.18em] border transition-colors ${
        active ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <>
      <section className="mx-auto max-w-7xl px-6 lg:px-10 pt-16 pb-10">
        <p className="eyebrow">The Collection</p>
        <h1 className="mt-3 font-display text-5xl sm:text-6xl">
          {type === "bracelet" ? "Tennis Bracelets" : type === "necklace" ? "Tennis Chains" : "All Pieces"}
        </h1>
        <p className="mt-4 text-muted-foreground max-w-xl">
          S925 sterling silver. VVS moissanite. GRA certified. 4 precious metal finishes. 5 widths from 2mm to 6.5mm. 5 lengths from 16" to 24".
        </p>

        <div className="mt-10 space-y-4">
          <div className="flex flex-wrap gap-3">
            {filterChip("All", !type, { to: "/shop" })}
            {filterChip("Chains", type === "necklace", { to: "/shop", search: { type: "necklace", color, size } })}
            {filterChip("Bracelets", type === "bracelet", { to: "/shop", search: { type: "bracelet", color, size } })}
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(COLOR_MAP).map(([key, val]) => (
              filterChip(val.label, color === key, { to: "/shop", search: { type, color: key, size } })
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {SIZES_NECKLACE.map((s) => (
              filterChip(s, size === s, { to: "/shop", search: { type, color, size: s } })
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 lg:px-10 pb-24">
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No pieces match these filters.</p>
            <Link to="/shop" className="inline-flex mt-4 items-center gap-2 text-xs uppercase tracking-[0.22em] border-b border-foreground pb-1">
              Clear filters <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
            {products.map((p: any) => (
              <Link key={p.id} to="/product/$slug" params={{ slug: p.slug }} className="group">
                <div className="aspect-square overflow-hidden bg-cream">
                  <img
                    src={getProductThumb(p.slug)}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="mt-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: COLOR_MAP[p.color]?.hex || '#C0C0C0' }} />
                    <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                      {COLOR_SHORT[p.color] ?? p.color.replace("_", " ")} {p.size ? `· ${p.size}` : ""}
                    </p>
                  </div>
                  <h2 className="mt-1.5 font-display text-2xl leading-tight">{p.name.split("—")[0].trim()}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{p.short_description}</p>
                  <p className="mt-3 text-sm">From {formatUSD(Number(p.base_price))}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}