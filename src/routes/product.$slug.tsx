import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheck, Truck, Sparkles, Award, ArrowRight, Minus, Plus,
  Eye, Info, Diamond, Gem, ShoppingBag, Check, Heart, Share2,
} from "lucide-react";
import { getProductBySlug } from "@/lib/products.functions";
import { getProductImages } from "@/lib/product-images";
import {
  calculatePrice, formatUSD, SIZES_NECKLACE, LENGTHS_NECKLACE,
  LENGTH_BRACELET, type Size, type Length,
  COLOR_MAP, COLOR_SHORT, SIZE_DESCRIPTIONS, LENGTH_DESCRIPTIONS,
  MOISSANITE_QUALITY, MOISSANITE_VS_DIAMOND,
} from "@/lib/pricing";
import { useCart } from "@/lib/cart";
import { EmailCapture } from "@/components/marketing/email-capture";

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
  const { product: p } = Route.useLoaderData();
  const product = p!;
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const isBracelet = product.type === "bracelet";

  // Smart pre-selection: parse slug for size and auto-select it
  const slugSize = ((["2mm", "3mm", "4mm", "5mm", "6.5mm"] as const).find((s) => slug.includes(s)) || "3mm") as Size;
  const slugLength = ((['16"', '18"', '20"', '22"', '24"'] as const).find((l) => slug.includes(l.replace('"', ''))) || '20"') as Length;

  const [size, setSize] = useState<Size>(slugSize);
  const [length, setLength] = useState<Length>(isBracelet ? LENGTH_BRACELET : slugLength);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [showEdu, setShowEdu] = useState(false);
  const [addedToBag, setAddedToBag] = useState(false);

  const gallery = getProductImages(slug);
  const price = calculatePrice(Number(product.base_price), size, length);
  const colorInfo = COLOR_MAP[product.color];

  // All size prices for comparison
  const sizePrices = SIZES_NECKLACE.map((s) => ({
    size: s,
    price: calculatePrice(Number(product.base_price), s, length),
  }));

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
    setAddedToBag(true);
    setTimeout(() => setAddedToBag(false), 3000);
    toast.success(`${product.name.split("—")[0].trim()} added to bag`);
    if (goToCart) navigate({ to: "/cart" });
  };

  // Build cross-sell suggestions based on color
  const siblingProductSlug = isBracelet
    ? product.slug.replace("bracelet", "chain")
    : product.slug.replace("chain", "bracelet");

  return (
    <>
      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-12 lg:py-16">
        <nav className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-8 flex flex-wrap gap-x-2">
          <Link to="/" className="hover:text-foreground">Home</Link> <span className="mx-1">/</span>
          <Link to="/shop" className="hover:text-foreground">Shop</Link> <span className="mx-1">/</span>
          {product.type === "necklace" ? (
            <Link to="/shop" search={{ type: "necklace" }} className="hover:text-foreground">Chains</Link>
          ) : (
            <Link to="/shop" search={{ type: "bracelet" }} className="hover:text-foreground">Bracelets</Link>
          )}
          <span className="mx-1">/</span>
          <span className="text-foreground">{product.name.split("—")[0].trim()}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden bg-cream relative group">
              <img src={gallery[activeImg]} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              {/* Color badge */}
              {colorInfo && (
                <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-4 py-2 text-xs uppercase tracking-[0.2em] border border-border">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: colorInfo.hex }} />
                    {colorInfo.label} · {colorInfo.plated}
                  </span>
                </div>
              )}
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
            <p className="eyebrow">
              {colorInfo?.label ?? product.color.replace("_", " ")} · S925 · VVS · GRA
            </p>
            <h1 className="mt-3 font-display text-4xl sm:text-5xl leading-tight">{product.name.split("—")[0].trim()}</h1>
            <p className="mt-4 text-muted-foreground leading-relaxed">{product.short_description}</p>

            {/* Price + Payment info */}
            <div className="mt-6 flex items-baseline gap-3">
              <span className="font-display text-3xl">{formatUSD(price)}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                USD · or <span className="underline">4 interest-free payments</span>
              </span>
            </div>

            {/* Price breakdown by size */}
            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[0.6rem] uppercase tracking-[0.1em] text-muted-foreground">
              {sizePrices.map((sp) => (
                <div key={sp.size} className={`py-1 ${size === sp.size ? "text-foreground font-medium" : ""}`}>
                  <span>{sp.size}: {formatUSD(sp.price)}</span>
                </div>
              ))}
            </div>

            <div className="hairline my-6" />

            {/* Width - Size Selector with descriptions */}
            <div>
              <div className="flex justify-between items-baseline">
                <p className="eyebrow">Width</p>
                <span className="text-xs text-muted-foreground">{SIZE_DESCRIPTIONS[size]}</span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {SIZES_NECKLACE.map((s) => {
                  const sPrice = calculatePrice(Number(product.base_price), s, length);
                  return (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`py-3 text-sm border transition-all ${
                        size === s
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      <span className="block">{s}</span>
                      <span className={`block text-[0.55rem] uppercase tracking-[0.1em] mt-0.5 ${size === s ? "text-background/70" : "text-muted-foreground"}`}>
                        {formatUSD(sPrice)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Length */}
            <div className="mt-6">
              <p className="eyebrow">Length</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {isBracelet ? (
                  <button className="py-3 text-sm border border-foreground bg-foreground text-background col-span-3">8" (standard bracelet)</button>
                ) : (
                  LENGTHS_NECKLACE.map((l) => {
                    const lPrice = calculatePrice(Number(product.base_price), size, l);
                    return (
                      <button
                        key={l}
                        onClick={() => setLength(l)}
                        className={`py-3 text-sm border transition-all ${
                          length === l
                            ? "border-foreground bg-foreground text-background"
                            : "border-border hover:border-foreground"
                        }`}
                      >
                        <span className="block">{l}</span>
                        <span className={`block text-[0.55rem] uppercase tracking-[0.1em] mt-0.5 ${length === l ? "text-background/70" : "text-muted-foreground"}`}>
                          {formatUSD(lPrice)}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
              <Link to="/size-guide" className="inline-flex mt-2 text-xs text-muted-foreground hover:text-foreground underline gap-1 items-center">
                Size guide <ArrowRight className="h-3 w-3" />
              </Link>
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
                className="flex-1 bg-foreground text-background py-4 text-xs uppercase tracking-[0.22em] hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
              >
                {addedToBag ? (
                  <><Check className="h-4 w-4" /> Added</>
                ) : (
                  <><ShoppingBag className="h-4 w-4" /> Add to bag</>
                )}
              </button>
            </div>
            <button
              onClick={() => handleAdd(true)}
              className="w-full mt-3 border border-foreground py-4 text-xs uppercase tracking-[0.22em] hover:bg-foreground hover:text-background transition-colors"
            >
              Buy now
            </button>

            {/* Trust badges */}
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-foreground" /> GRA Certified</li>
              <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-foreground" /> Free shipping $250+</li>
              <li className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-foreground" /> VVS · D Color</li>
              <li className="flex items-center gap-2"><Award className="h-4 w-4 text-foreground" /> Lifetime brilliance</li>
              <li className="flex items-center gap-2"><Gem className="h-4 w-4 text-foreground" /> Solid S925 base</li>
              <li className="flex items-center gap-2"><Heart className="h-4 w-4 text-foreground" /> 14-day returns</li>
            </ul>

            {/* Cross-sell: Complete the set */}
            <div className="mt-8 bg-cream border border-border p-6">
              <p className="eyebrow text-xs">Complete the set</p>
              <div className="mt-3 flex gap-4 items-center">
                <div className="w-16 h-16 bg-cream border border-border shrink-0 overflow-hidden">
                  <img src={gallery[0]} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm">
                    {isBracelet ? "Add the matching chain" : "Add the matching bracelet"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Same color · S925 · VVS</p>
                </div>
                <Link
                  to="/product/$slug"
                  params={{ slug: siblingProductSlug }}
                  className="shrink-0 bg-foreground text-background px-4 py-2 text-[0.6rem] uppercase tracking-[0.2em] hover:bg-foreground/90 transition-colors"
                >
                  View
                </Link>
              </div>
            </div>

            {/* Moissanite Education Panel */}
            <div className="mt-8">
              <button
                onClick={() => setShowEdu(!showEdu)}
                className="w-full flex items-center justify-between border border-border p-4 text-sm hover:bg-cream transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Diamond className="h-4 w-4 text-foreground/60" />
                  <span className="font-medium">Why VVS moissanite?</span>
                </span>
                <span className="text-xs text-muted-foreground">{showEdu ? "Close" : "Learn"}</span>
              </button>
              {showEdu && (
                <div className="border-x border-b border-border p-6 space-y-6">
                  {/* The 4Cs */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { icon: Eye, ...MOISSANITE_QUALITY.clarity },
                      { icon: Award, ...MOISSANITE_QUALITY.color },
                      { icon: Diamond, ...MOISSANITE_QUALITY.cut },
                      { icon: ShieldCheck, ...MOISSANITE_QUALITY.certificate },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="p-4 border border-border">
                          <Icon className="h-5 w-5 text-foreground/60" />
                          <h4 className="mt-2 text-sm font-medium">{item.label}</h4>
                          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Moissanite vs Diamond mini table */}
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">Moissanite vs Diamond</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 pr-3 font-medium">Attribute</th>
                            <th className="text-left py-2 pr-3 font-medium">Moissanite</th>
                            <th className="text-left py-2 font-medium">Diamond</th>
                          </tr>
                        </thead>
                        <tbody>
                          {MOISSANITE_VS_DIAMOND.slice(0, 5).map((row) => (
                            <tr key={row.attribute} className="border-b border-border/50">
                              <td className="py-2 pr-3">{row.attribute}</td>
                              <td className="py-2 pr-3 text-foreground font-medium">{row.moissanite}</td>
                              <td className="py-2 text-muted-foreground">{row.diamond}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Link to="/moissanite-guide" className="inline-flex mt-3 items-center gap-1 text-xs border-b border-foreground pb-0.5">
                      Full guide <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="hairline my-8" />
            <div>
              <p className="eyebrow">Details</p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
              <dl className="mt-6 grid grid-cols-2 gap-y-3 text-sm">
                {[
                  ["Material", "925 Sterling Silver (S925)"],
                  ["Plating", `${colorInfo?.plated ?? "Rhodium"} · 5× e-coating`],
                  ["Stone", "VVS Moissanite · D Color"],
                  ["Stone color", "D (colorless)"],
                  ["Clasp", "Double-locking box"],
                  ["Finish", "Tarnish-resistant"],
                  ["Hypoallergenic", "Lead, nickel, cadmium free"],
                  ["Certificate", "GRA included"],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <dt className="text-muted-foreground w-24 shrink-0">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-10 flex gap-6">
              <Link to="/shop" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] border-b border-foreground pb-1">
                Continue shopping <ArrowRight className="h-3 w-3" />
              </Link>
              <Link to="/faq" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] border-b border-foreground pb-1">
                FAQ <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Complete the look - suggestions */}
      <section className="bg-cream border-y border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16">
          <p className="eyebrow">Complete the look</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">Pair with your piece</h2>
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Matching Bracelet", slug: siblingProductSlug, img: gallery[1] },
              { name: "Matching Chain", slug: siblingProductSlug, img: gallery[2] },
              { name: "All Silver Collection", slug: "silver-moissanite-tennis-chain", img: gallery[3] },
              { name: "All Gold Collection", slug: "gold-moissanite-tennis-chain", img: gallery[0] },
            ].map((sugg) => (
              <Link key={sugg.name} to="/product/$slug" params={{ slug: sugg.slug }} className="group">
                <div className="aspect-square overflow-hidden bg-background">
                  <img src={sugg.img} alt={sugg.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <p className="mt-3 text-sm font-medium">{sugg.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Email capture */}
      <EmailCapture />
    </>
  );
}