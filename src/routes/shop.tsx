import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { listProducts } from "@/lib/products.functions";
import { getProductThumb } from "@/lib/product-images";
import { formatUSD, COLOR_MAP, COLOR_SHORT, SIZES_NECKLACE, SIZES_EARRING, SIZES_RING, getTennisBraceletPrice } from "@/lib/pricing";
import { ArrowRight, SlidersHorizontal } from "lucide-react";

const search = z.object({
  type: z.enum(["necklace", "bracelet", "earring", "ring"]).optional(),
  color: z.enum(["silver", "gold", "rose_gold", "white_gold"]).optional(),
  size: z.enum(["2mm", "3mm", "4mm", "5mm", "6.5mm", "0.5ct", "1ct", "1.5ct", "2ct", "3ct"]).optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Shop S925 Moissanite Jewelry | Qureshi Jewelers" },
      { name: "description", content: "Browse S925 sterling silver VVS moissanite tennis chains, bracelets, stud earrings, and engagement rings. GRA certified. Free US shipping over $250." },
      { property: "og:title", content: "Shop the Collection | Qureshi Jewelers" },
      { property: "og:description", content: "S925 VVS moissanite jewelry. GRA certified. 4 finishes, multiple sizes." },
      { property: "og:url", content: "/shop" },
    ],
    links: [{ rel: "canonical", href: "/shop" }],
  }),
  component: Shop,
});

const TYPE_LABELS: Record<string, string> = {
  necklace: "Tennis Chains",
  bracelet: "Tennis Bracelets",
  earring:  "Stud Earrings",
  ring:     "Engagement Rings",
};

const COLOR_LABELS: Record<string, string> = {
  silver:     "Sterling Silver",
  gold:       "Yellow Gold",
  rose_gold:  "Rose Gold",
  white_gold: "White Gold",
};

function Shop() {
  const { type, color, size } = Route.useSearch();
  const fetchProducts = useServerFn(listProducts);
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts(),
  });

  let products = (data?.products ?? []) as any[];
  if (type)  products = products.filter((p: any) => p.type === type);
  if (color) products = products.filter((p: any) => p.color === color);
  if (size)  products = products.filter((p: any) => p.size === size || !p.size);

  const displaySizes =
    type === "earring" ? SIZES_EARRING :
    type === "ring"    ? SIZES_RING    :
    SIZES_NECKLACE;

  const pageTitle =
    type ? TYPE_LABELS[type] ?? "Collection" : "All Pieces";

  const hasFilters = !!(type || color || size);

  // Active filter summary for display
  const activeLabels = [
    type  ? TYPE_LABELS[type]   : null,
    color ? COLOR_LABELS[color] : null,
    size  ? size                : null,
  ].filter(Boolean);

  return (
    <>
      {/* ── Page header ────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 pt-14 sm:pt-16 pb-10 sm:pb-12">
        <p className="eyebrow">The Collection</p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl lg:text-7xl leading-[1.04]">
          {pageTitle}
        </h1>
        <p className="mt-4 text-muted-foreground max-w-md">
          S925 sterling silver. VVS moissanite. GRA certified. Four precious metal finishes.
        </p>

        {/* Active filter summary */}
        {hasFilters && activeLabels.length > 0 && (
          <div className="mt-5 flex items-center gap-3 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
            <SlidersHorizontal className="h-3 w-3" />
            <span>{activeLabels.join("  ·  ")}</span>
            <Link
              to="/shop"
              className="text-foreground border-b border-foreground pb-0 leading-none hover:text-muted-foreground transition-colors"
            >
              Clear
            </Link>
          </div>
        )}
      </section>

      {/* ── Filters ────────────────────────────────────── */}
      <div className="border-y border-border bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-4 sm:py-5 space-y-3">

          {/* Type filters */}
          <div className="flex flex-wrap gap-2">
            {(["", "necklace", "bracelet", "earring", "ring"] as const).map(t => {
              const active = (!t && !type) || t === type;
              const label = t ? TYPE_LABELS[t] : "All";
              return (
                <Link
                  key={label}
                  to="/shop"
                  search={t ? { type: t as any, color, size } : { color, size }}
                  className={`px-5 py-2 text-[0.65rem] uppercase tracking-[0.2em] border transition-all duration-200 ${
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                    }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Color filters */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(COLOR_MAP).map(([key, val]) => {
              const active = color === key;
              return (
                <Link
                  key={key}
                  to="/shop"
                  search={{ type, color: key as any, size }}
                  className={`flex items-center gap-2 px-4 py-2 text-[0.65rem] uppercase tracking-[0.2em] border transition-all duration-200 ${
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                    }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: val.hex }}
                  />
                  {COLOR_SHORT[key]}
                </Link>
              );
            })}
          </div>

          {/* Size filters */}
          <div className="flex flex-wrap gap-2">
            {displaySizes.map(s => {
              const active = size === s;
              return (
                <Link
                  key={s}
                  to="/shop"
                  search={{ type, color, size: s as any }}
                  className={`px-4 py-2 text-[0.65rem] uppercase tracking-[0.2em] border transition-all duration-200 ${
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                    }`}
                >
                  {s}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Product grid ───────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-10 sm:py-14 pb-24 sm:pb-28">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-12">
            {[...Array(8)].map((_, i) => (
              <div key={i}>
                <div className="aspect-[3/4] bg-cream animate-pulse" />
                <div className="mt-4 h-3 bg-cream animate-pulse w-1/2" />
                <div className="mt-2 h-5 bg-cream animate-pulse w-3/4" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-32">
            <p className="font-display text-3xl text-foreground">No pieces match these filters.</p>
            <p className="mt-3 text-sm text-muted-foreground">Try removing a filter to see more.</p>
            <Link
              to="/shop"
              className="inline-flex mt-8 items-center gap-2 text-[0.65rem] uppercase tracking-[0.22em] border-b border-foreground pb-1 hover:text-muted-foreground transition-colors"
            >
              Clear all filters <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-12">
            {products.map((p: any) => (
              <Link
                key={p.id}
                to="/product/$slug"
                params={{ slug: p.slug }}
                className="group"
              >
                {/* Image — taller aspect ratio for editorial feel */}
                <div className="aspect-[3/4] overflow-hidden bg-cream relative">
                  <img
                    src={getProductThumb(p.slug, p.image_url)}
                    alt={p.name}
                    loading="lazy"
                    decoding="async"
                    width="400"
                    height="533"
                    className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                  {/* Type label */}
                  <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-2.5 py-1 text-[0.45rem] uppercase tracking-[0.2em] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {TYPE_LABELS[p.type] ?? p.type}
                  </div>
                </div>

                {/* Info */}
                <div className="mt-4">
                  <div className="flex items-center gap-1.5">
                    {/* Base metal badge */}
                    <span className="text-[0.48rem] uppercase tracking-[0.12em] text-gray-400 font-mono border border-gray-200 px-1.5 py-0.5 leading-none">
                      S925
                    </span>
                    {/* Metal color swatches — show all available metals */}
                    <div className="flex items-center gap-0.5 ml-1">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10" style={{ backgroundColor: "#D4AF37" }} title="18K Yellow Gold" />
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10 -ml-1" style={{ backgroundColor: "#E8E8F4" }} title="18K White Gold" />
                    </div>
                  </div>
                  <h2 className="mt-2 font-display text-[1.45rem] sm:text-[1.6rem] leading-tight group-hover:text-gold transition-colors duration-300">
                    {p.name.split("—")[0].trim()}
                  </h2>
                  <p className="mt-2 text-sm text-foreground">
                    From <span className="font-medium">
                      {(p.slug?.includes("tennis-bracelet") || p.slug?.includes("tennis_bracelet"))
                        ? formatUSD(getTennisBraceletPrice("2mm", '6"'))
                        : formatUSD(Number(p.base_price))}
                    </span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Result count */}
        {!isLoading && products.length > 0 && (
          <p className="mt-14 text-center text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground/50">
            {products.length} {products.length === 1 ? "piece" : "pieces"}
            {hasFilters ? " matching your filters" : " in the collection"}
          </p>
        )}
      </section>
    </>
  );
}
