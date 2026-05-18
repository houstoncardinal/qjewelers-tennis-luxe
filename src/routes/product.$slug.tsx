import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Truck, Sparkles, Award, ArrowRight, Minus, Plus } from "lucide-react";
import { getProductBySlug } from "@/lib/products.functions";
import { getProductImages } from "@/lib/product-images";
import { calculatePrice, formatUSD, SIZES_NECKLACE, LENGTHS_NECKLACE, LENGTH_BRACELET, type Size, type Length } from "@/lib/pricing";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const res = await getProductBySlug({ data: { slug: params.slug } });
    if (!res.product) throw notFound();
    return res;
  },
  head: ({ loaderData, params }) => {
    const p = loaderData?.product;
    if (!p) return { meta: [{ title: "Product" }] };
    return {
      meta: [
        { title: p.seo_title },
        { name: "description", content: p.seo_description },
        { property: "og:title", content: p.seo_title },
        { property: "og:description", content: p.seo_description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: `/product/${params.slug}` },
        { property: "product:price:currency", content: "USD" },
      ],
      links: [{ rel: "canonical", href: `/product/${params.slug}` }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: p.description,
          brand: { "@type": "Brand", name: "Qureshi Jewelers" },
          offers: {
            "@type": "Offer",
            priceCurrency: "USD",
            price: Number(p.base_price),
            availability: "https://schema.org/InStock",
          },
        }),
      }],
    };
  },
  component: ProductPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl">Couldn't load this piece</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <Link to="/shop" className="inline-block mt-6 text-xs uppercase tracking-[0.2em] border-b border-foreground">Back to shop</Link>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl">Piece not found</h1>
      <Link to="/shop" className="inline-block mt-6 text-xs uppercase tracking-[0.2em] border-b border-foreground">Browse the collection</Link>
    </div>
  ),
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const isBracelet = product.type === "bracelet";

  const [size, setSize] = useState<Size>("3mm");
  const [length, setLength] = useState<Length>(isBracelet ? LENGTH_BRACELET : '20"');
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  const gallery = getProductImages(slug);
  const price = calculatePrice(Number(product.base_price), size, length);

  const handleAdd = (goToCart = false) => {
    add({
      id: `${product.id}-${size}-${length}`,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      color: product.color,
      size,
      length,
      unitPrice: price,
      image: gallery[0],
    }, qty);
    toast.success(`${product.name.split("—")[0].trim()} added to bag`);
    if (goToCart) navigate({ to: "/cart" });
  };

  return (
    <section className="mx-auto max-w-7xl px-6 lg:px-10 py-12 lg:py-16">
      <nav className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-8">
        <Link to="/" className="hover:text-foreground">Home</Link> <span className="mx-2">/</span>
        <Link to="/shop" className="hover:text-foreground">Shop</Link> <span className="mx-2">/</span>
        <span className="text-foreground">{product.name.split("—")[0].trim()}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden bg-cream">
            <img src={gallery[activeImg]} alt={product.name} className="h-full w-full object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {gallery.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`aspect-square overflow-hidden border ${activeImg === i ? "border-foreground" : "border-border"}`}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="lg:pl-6 lg:pt-4">
          <p className="eyebrow">{product.color.replace("_", " ")} · S925 · VVS</p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl leading-tight">{product.name.split("—")[0].trim()}</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">{product.short_description}</p>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-display text-3xl">{formatUSD(price)}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">USD · or 4 interest-free payments</span>
          </div>

          <div className="hairline my-8" />

          {/* Width */}
          <div>
            <div className="flex justify-between items-baseline">
              <p className="eyebrow">Width</p>
              <span className="text-xs text-muted-foreground">{size === "2mm" ? "Subtle" : size === "5mm" ? "Statement" : "Versatile"}</span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {SIZES_NECKLACE.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`py-3 text-sm border transition-colors ${
                    size === s ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Length */}
          <div className="mt-6">
            <p className="eyebrow">Length</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {isBracelet ? (
                <button className="py-3 text-sm border border-foreground bg-foreground text-background col-span-3">8" (bracelet)</button>
              ) : (
                LENGTHS_NECKLACE.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLength(l)}
                    className={`py-3 text-sm border transition-colors ${
                      length === l ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"
                    }`}
                  >
                    {l}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Qty + CTA */}
          <div className="mt-8 flex gap-3">
            <div className="flex items-center border border-border">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3" aria-label="Decrease"><Minus className="h-4 w-4" /></button>
              <span className="w-10 text-center text-sm">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="p-3" aria-label="Increase"><Plus className="h-4 w-4" /></button>
            </div>
            <button
              onClick={() => handleAdd(false)}
              className="flex-1 bg-foreground text-background py-4 text-xs uppercase tracking-[0.22em] hover:bg-foreground/90 transition-colors"
            >
              Add to bag
            </button>
          </div>
          <button
            onClick={() => handleAdd(true)}
            className="w-full mt-3 border border-foreground py-4 text-xs uppercase tracking-[0.22em] hover:bg-foreground hover:text-background transition-colors"
          >
            Buy now
          </button>

          {/* Trust */}
          <ul className="mt-8 grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-foreground" /> GRA Certified</li>
            <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-foreground" /> Free shipping $250+</li>
            <li className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-foreground" /> VVS · D color</li>
            <li className="flex items-center gap-2"><Award className="h-4 w-4 text-foreground" /> Lifetime brilliance</li>
          </ul>

          {/* Details */}
          <div className="hairline my-10" />
          <div>
            <p className="eyebrow">Details</p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
            <dl className="mt-6 grid grid-cols-2 gap-y-3 text-sm">
              {[
                ["Material", "925 Sterling Silver"],
                ["Stone", "VVS Moissanite"],
                ["Finish", "5× e-coating"],
                ["Clasp", "Double-locking box"],
                ["Stone color", "D (colorless)"],
                ["Hypoallergenic", "Yes"],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="text-muted-foreground w-28">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-10">
            <Link to="/shop" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] border-b border-foreground pb-1">
              Continue shopping <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
