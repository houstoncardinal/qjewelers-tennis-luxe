import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { listProducts } from "@/lib/products.functions";
import { getProductThumb } from "@/lib/product-images";
import { formatUSD, COLOR_MAP, COLOR_SHORT, SIZES_NECKLACE, SIZES_EARRING, SIZES_RING, getTennisBraceletPrice, getTennisChainPrice } from "@/lib/pricing";
import { useState, useEffect } from "react";
import { ArrowRight, SlidersHorizontal, ChevronDown } from "lucide-react";

const search = z.object({
  type: z.enum(["necklace", "bracelet", "earring", "ring"]).optional(),
  color: z.enum(["silver", "gold", "rose_gold", "white_gold"]).optional(),
  size: z.enum(["2mm", "3mm", "4mm", "5mm", "6.5mm", "0.5ct", "1ct", "1.5ct", "2ct", "3ct"]).optional(),
});

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://qureshijewelers.com").replace(/\/$/, "");

// Per-category SEO copy — each of these is a distinct, deliberately
// keyword-matched landing page for a top search intent (e.g. "moissanite
// engagement rings"), not just a UI filter label. Canonical/og:url below
// point at this exact query string so each gets indexed as its own page
// rather than collapsing into the generic /shop canonical.
const CATEGORY_SEO: Record<string, { title: string; description: string; h1Keyword: string }> = {
  necklace: {
    title: "Moissanite Tennis Chains — S925 Sterling Silver | Qureshi Jewelers",
    description: "Shop VVS moissanite tennis chains in solid S925 sterling silver, 18K gold, rose gold, or white gold. GRA certified, 2mm-5mm widths, 16\"-24\" lengths. Free US shipping over $250.",
    h1Keyword: "Moissanite Tennis Chains",
  },
  bracelet: {
    title: "Moissanite Tennis Bracelets — S925 Sterling Silver | Qureshi Jewelers",
    description: "Shop VVS moissanite tennis bracelets hand-set in solid S925 sterling silver with a double-lock clasp. GRA certified, 4 finishes. Free US shipping over $250.",
    h1Keyword: "Moissanite Tennis Bracelets",
  },
  earring: {
    title: "Moissanite Stud Earrings — VVS1 D Color | Qureshi Jewelers",
    description: "Shop VVS1 D Colorless moissanite stud earrings in S925 sterling silver, 18K gold, rose gold, or white gold. GRA certified, screw-back closure. Free US shipping over $250.",
    h1Keyword: "Moissanite Stud Earrings",
  },
  ring: {
    title: "Moissanite Engagement Rings — VVS1 GRA Certified | Qureshi Jewelers",
    description: "Shop moissanite engagement rings with VVS1 clarity and D color grading, hand-set in solid S925 sterling silver or 18K gold. GRA certified. Free US shipping over $250.",
    h1Keyword: "Moissanite Engagement Rings",
  },
};

export const Route = createFileRoute("/shop")({
  validateSearch: search,
  // SSR the catalog so crawlers that don't execute JS (GPTBot, ClaudeBot,
  // PerplexityBot, and Google's first indexing pass) see real products and
  // links in the initial HTML, not just an empty shell waiting on a client
  // fetch. The client useQuery below reuses this as initialData.
  loader: async () => {
    const res = await listProducts();
    return res;
  },
  head: ({ match, loaderData }) => {
    const type = match.search?.type as string | undefined;
    const cat = type ? CATEGORY_SEO[type] : undefined;
    const pageUrl = `${SITE_URL}/shop${type ? `?type=${type}` : ""}`;

    const title = cat?.title ?? "Moissanite Jewelry — Tennis Chains, Bracelets & Rings | Qureshi Jewelers";
    const description = cat?.description ?? "Browse S925 sterling silver VVS moissanite tennis chains, tennis bracelets, stud earrings, and engagement rings. GRA certified. Free US shipping over $250.";

    const breadcrumbItems: any[] = [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop` },
    ];
    if (cat) breadcrumbItems.push({ "@type": "ListItem", position: 3, name: cat.h1Keyword, item: pageUrl });

    const allProducts = ((loaderData as any)?.products ?? []) as any[];
    const categoryProducts = (type ? allProducts.filter((p) => p.type === type) : allProducts).slice(0, 24);
    const itemListElement = categoryProducts.map((p, idx) => {
      const productUrl = `${SITE_URL}/product/${p.slug}`;
      const imageUrl = p.image_url?.startsWith("http") ? p.image_url : `${SITE_URL}${p.image_url || "/QURESHIJEWELERSLOGO.png"}`;
      return {
        "@type": "ListItem",
        position: idx + 1,
        item: {
          "@type": "Product",
          "@id": `${productUrl}#product`,
          name: p.name,
          url: productUrl,
          image: imageUrl,
          offers: {
            "@type": "Offer",
            priceCurrency: "USD",
            price: Number(p.sale_active && p.sale_price ? p.sale_price : p.base_price),
            availability: p.is_active ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: productUrl,
          },
        },
      };
    });

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: pageUrl },
        { property: "og:type", content: "website" },
        { property: "og:image", content: `${SITE_URL}/QURESHIJEWELERSLOGO.png` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: `${SITE_URL}/QURESHIJEWELERSLOGO.png` },
      ],
      links: [{ rel: "canonical", href: pageUrl }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: cat?.h1Keyword ?? "Moissanite Jewelry Collection",
            description,
            url: pageUrl,
            isPartOf: { "@id": `${SITE_URL}/#website` },
          }),
        },
        // Real product entities — lets Google build a product carousel /
        // item-list rich result for this category page, and gives non-JS
        // crawlers (AI bots) the actual catalog instead of an empty page.
        ...(itemListElement.length > 0 ? [{
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: cat?.h1Keyword ?? "Moissanite Jewelry Collection",
            url: pageUrl,
            numberOfItems: itemListElement.length,
            itemListElement,
          }),
        }] : []),
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: breadcrumbItems,
          }),
        },
      ],
    };
  },
  component: Shop,
});

const TYPE_LABELS: Record<string, string> = {
  necklace: "Tennis Chains",
  bracelet: "Tennis Bracelets",
  earring:  "Stud Earrings",
  ring:     "Engagement Rings",
};

const TYPE_SHORT: Record<string, string> = {
  necklace: "Chains",
  bracelet: "Bracelets",
  earring:  "Earrings",
  ring:     "Rings",
};

const COLOR_LABELS: Record<string, string> = {
  silver:     "Sterling Silver",
  gold:       "Yellow Gold",
  rose_gold:  "Rose Gold",
  white_gold: "White Gold",
};

function Shop() {
  const { type, color, size } = Route.useSearch();
  const loaderData = Route.useLoaderData();
  const fetchProducts = useServerFn(listProducts);
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts(),
    initialData: loaderData,
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile panel when any filter changes
  useEffect(() => { setMobileOpen(false); }, [type, color, size]);

  let products = (data?.products ?? []) as any[];
  if (type)  products = products.filter((p: any) => p.type === type);
  if (color) products = products.filter((p: any) => (p.color ?? "").split(",").map((c: string) => c.trim()).includes(color));
  if (size)  products = products.filter((p: any) => p.size === size || !p.size);

  const displaySizes =
    type === "earring" ? SIZES_EARRING :
    type === "ring"    ? SIZES_RING    :
    SIZES_NECKLACE;

  const pageTitle =
    type ? TYPE_LABELS[type] ?? "Collection" : "All Pieces";

  const hasFilters = !!(type || color || size);
  const activeCount = [type, color, size].filter(Boolean).length;

  // Active filter summary for display
  const activeLabels = [
    type  ? TYPE_SHORT[type]    : null,
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

      </section>

      {/* ── Filters — compact sticky bar ───────────────── */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">

          {/* ── Mobile trigger row ── */}
          <div className="flex lg:hidden items-center h-11 gap-3">
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="flex items-center gap-1.5 shrink-0 text-[0.60rem] uppercase tracking-[0.2em] text-foreground"
            >
              <SlidersHorizontal className="h-3 w-3" />
              Filters
              {activeCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-foreground text-background text-[0.44rem] font-semibold">
                  {activeCount}
                </span>
              )}
              <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${mobileOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Active filter pills */}
            {hasFilters && (
              <div className="flex items-center gap-1.5 overflow-x-auto flex-1 min-w-0 scrollbar-none">
                {activeLabels.map(label => (
                  <span key={label as string} className="shrink-0 px-2 py-0.5 text-[0.48rem] uppercase tracking-[0.14em] bg-foreground text-background leading-none">
                    {label}
                  </span>
                ))}
              </div>
            )}

            {hasFilters && (
              <Link
                to="/shop"
                className="shrink-0 text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </Link>
            )}
          </div>

          {/* ── Mobile expanded panel ── */}
          {mobileOpen && (
            <div className="lg:hidden border-t border-border py-3 pb-4 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {(["", "necklace", "bracelet", "earring", "ring"] as const).map(t => {
                  const active = (!t && !type) || t === type;
                  return (
                    <Link key={t || "all"} to="/shop" search={t ? { type: t as any, color, size } : { color, size }}
                      className={`px-3 py-1.5 text-[0.56rem] uppercase tracking-[0.18em] border transition-colors duration-150 ${active ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>
                      {t ? TYPE_SHORT[t] : "All"}
                    </Link>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(COLOR_MAP).map(([key, val]) => {
                  const active = color === key;
                  return (
                    <Link key={key} to="/shop" search={{ type, color: key as any, size }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-[0.56rem] uppercase tracking-[0.18em] border transition-colors duration-150 ${active ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: val.hex }} />
                      {COLOR_SHORT[key]}
                    </Link>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {displaySizes.map(s => {
                  const active = size === s;
                  return (
                    <Link key={s} to="/shop" search={{ type, color, size: s as any }}
                      className={`px-3 py-1.5 text-[0.56rem] uppercase tracking-[0.18em] border transition-colors duration-150 ${active ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>
                      {s}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Desktop: all groups on one line with dividers ── */}
          <div className="hidden lg:flex items-center h-11 divide-x divide-border overflow-x-auto scrollbar-none">

            {/* Category */}
            <div className="flex items-center gap-1.5 pr-5 shrink-0">
              <span className="text-[0.44rem] uppercase tracking-[0.22em] text-muted-foreground/50 mr-1 shrink-0">Category</span>
              {(["", "necklace", "bracelet", "earring", "ring"] as const).map(t => {
                const active = (!t && !type) || t === type;
                return (
                  <Link key={t || "all"} to="/shop" search={t ? { type: t as any, color, size } : { color, size }}
                    className={`px-2.5 py-1 text-[0.53rem] uppercase tracking-[0.16em] border transition-colors duration-150 whitespace-nowrap ${active ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"}`}>
                    {t ? TYPE_SHORT[t] : "All"}
                  </Link>
                );
              })}
            </div>

            {/* Metal */}
            <div className="flex items-center gap-1.5 px-5 shrink-0">
              <span className="text-[0.44rem] uppercase tracking-[0.22em] text-muted-foreground/50 mr-1 shrink-0">Metal</span>
              {Object.entries(COLOR_MAP).map(([key, val]) => {
                const active = color === key;
                return (
                  <Link key={key} to="/shop" search={{ type, color: key as any, size }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-[0.53rem] uppercase tracking-[0.16em] border transition-colors duration-150 whitespace-nowrap ${active ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"}`}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: val.hex }} />
                    {COLOR_SHORT[key]}
                  </Link>
                );
              })}
            </div>

            {/* Size */}
            <div className="flex items-center gap-1.5 px-5 shrink-0">
              <span className="text-[0.44rem] uppercase tracking-[0.22em] text-muted-foreground/50 mr-1 shrink-0">Size</span>
              {displaySizes.map(s => {
                const active = size === s;
                return (
                  <Link key={s} to="/shop" search={{ type, color, size: s as any }}
                    className={`px-2.5 py-1 text-[0.53rem] uppercase tracking-[0.16em] border transition-colors duration-150 whitespace-nowrap ${active ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"}`}>
                    {s}
                  </Link>
                );
              })}
            </div>

            {/* Clear — right-aligned */}
            {hasFilters && (
              <div className="flex-1 flex justify-end pl-5">
                <Link to="/shop" className="text-[0.53rem] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                  Clear filters
                </Link>
              </div>
            )}
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
                    {/* Metal color swatches — dynamic per product */}
                    <div className="flex items-center ml-1">
                      {(p.color ?? "gold").split(",").map((c: string, i: number) => {
                        const cv = COLOR_MAP[c.trim()];
                        if (!cv) return null;
                        return (
                          <span
                            key={c.trim()}
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10${i > 0 ? " -ml-1" : ""}`}
                            style={{ backgroundColor: cv.hex }}
                            title={cv.label}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <h2 className="mt-2 font-display text-[1.45rem] sm:text-[1.6rem] leading-tight group-hover:text-gold transition-colors duration-300">
                    {p.name.split("—")[0].trim()}
                  </h2>
                  <p className="mt-2 text-sm text-foreground">
                    From <span className="font-medium">
                      {(p.slug?.includes("tennis-bracelet") || p.slug?.includes("tennis_bracelet"))
                        ? formatUSD(getTennisBraceletPrice("2mm", '6"'))
                        : (p.slug?.includes("tennis-chain") || p.slug?.includes("tennis_chain"))
                          ? formatUSD(getTennisChainPrice("3mm", '16"'))
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
