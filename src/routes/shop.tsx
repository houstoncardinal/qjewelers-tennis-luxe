import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { listProducts } from "@/lib/products.functions";
import { getProductThumb } from "@/lib/product-images";
import { formatUSD } from "@/lib/pricing";

const search = z.object({
  type: z.enum(["necklace", "bracelet"]).optional(),
  color: z.enum(["silver", "gold", "rose_gold"]).optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Shop S925 Moissanite Tennis Chains & Bracelets | Qureshi Jewelers" },
      { name: "description", content: "Browse our full collection of S925 sterling silver VVS moissanite tennis chains and bracelets. Silver, gold, rose gold. GRA certified. Free US shipping over $250." },
      { property: "og:title", content: "Shop Tennis Chains & Bracelets | Qureshi Jewelers" },
      { property: "og:description", content: "S925 VVS moissanite tennis chains and bracelets. GRA certified." },
      { property: "og:url", content: "/shop" },
    ],
    links: [{ rel: "canonical", href: "/shop" }],
  }),
  component: Shop,
});

function Shop() {
  const { type, color } = Route.useSearch();
  const fetchProducts = useServerFn(listProducts);
  const { data, isLoading } = useQuery({ queryKey: ["products"], queryFn: () => fetchProducts() });

  let products = data?.products ?? [];
  if (type) products = products.filter((p) => p.type === type);
  if (color) products = products.filter((p) => p.color === color);

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
          S925 sterling silver. VVS moissanite. GRA certified. Choose your width, length, and finish.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          {filterChip("All", !type, { to: "/shop" })}
          {filterChip("Chains", type === "necklace", { to: "/shop", search: { type: "necklace" } })}
          {filterChip("Bracelets", type === "bracelet", { to: "/shop", search: { type: "bracelet" } })}
          <span className="w-px bg-border mx-2" />
          {filterChip("Silver", color === "silver", { to: "/shop", search: { type, color: "silver" } })}
          {filterChip("Gold", color === "gold", { to: "/shop", search: { type, color: "gold" } })}
          {filterChip("Rose Gold", color === "rose_gold", { to: "/shop", search: { type, color: "rose_gold" } })}
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
          <p className="text-muted-foreground py-20 text-center">No pieces match these filters.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
            {products.map((p) => (
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
                  <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                    {p.color.replace("_", " ")} · {p.type}
                  </p>
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
