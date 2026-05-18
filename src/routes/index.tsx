import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, Sparkles, Award, Truck, ArrowRight } from "lucide-react";
import { listProducts } from "@/lib/products.functions";
import { images, getProductThumb } from "@/lib/product-images";
import { formatUSD } from "@/lib/pricing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Qureshi Jewelers — S925 Moissanite Tennis Chains | Free US Shipping" },
      { name: "description", content: "Shop iced out S925 sterling silver VVS moissanite tennis chains and bracelets. GRA certified, hand-set, lifetime brilliance. America's #1 source." },
      { property: "og:title", content: "Qureshi Jewelers — S925 Moissanite Tennis Chains" },
      { property: "og:description", content: "Iced out S925 VVS moissanite tennis chains. GRA certified. Free US shipping over $250." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

function Index() {
  const fetchProducts = useServerFn(listProducts);
  const { data } = useQuery({ queryKey: ["products"], queryFn: () => fetchProducts() });
  const featured = (data?.products ?? []).slice(0, 4);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-16 pb-20 lg:pt-24 lg:pb-32 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 relative z-10">
            <p className="eyebrow"><span className="gold-text font-semibold">VVS Moissanite</span> · GRA Certified</p>
            <h1 className="mt-5 font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight">
              The new standard for <em className="italic text-foreground">iced out</em>.
            </h1>
            <p className="mt-6 text-base text-muted-foreground max-w-md leading-relaxed">
              Hand-set tennis chains in solid S925 sterling silver, finished with five layers
              of e-coating. Diamond-equal brilliance. Lifetime shine. Built in America's most
              demanding workshop.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/shop"
                className="group inline-flex items-center gap-3 bg-foreground text-background px-8 py-4 text-xs uppercase tracking-[0.22em] hover:bg-foreground/90 transition-colors"
              >
                Shop the collection
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/about" className="text-xs uppercase tracking-[0.22em] border-b border-foreground pb-1 hover:text-muted-foreground transition-colors">
                Why moissanite?
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-foreground" /> GRA Certified</span>
              <span className="flex items-center gap-2"><Award className="h-4 w-4 text-foreground" /> S925 Solid Silver</span>
              <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-foreground" /> Free US shipping $250+</span>
            </div>
          </div>
          <div className="lg:col-span-6 relative">
            <div className="aspect-[4/5] overflow-hidden rounded-sm" style={{ boxShadow: "var(--shadow-lift)" }}>
              <img src={images.heroModel} alt="Layered S925 moissanite tennis chains worn by model" className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-8 -left-6 hidden lg:flex bg-background border border-border px-6 py-5 max-w-[16rem]" style={{ boxShadow: "var(--shadow-soft)" }}>
              <div>
                <p className="eyebrow">Stones</p>
                <p className="mt-2 font-display text-2xl leading-tight">VVS clarity, D color moissanite</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="hairline mx-auto max-w-7xl" />

      {/* FEATURED PRODUCTS */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="eyebrow">The Collection</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl">Signature pieces</h2>
          </div>
          <Link to="/shop" className="hidden sm:inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] border-b border-foreground pb-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {featured.map((p) => (
            <Link key={p.id} to="/product/$slug" params={{ slug: p.slug }} className="group">
              <div className="aspect-square overflow-hidden bg-cream">
                <img
                  src={getProductThumb(p.slug)}
                  alt={p.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="mt-4">
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">{p.color.replace("_", " ")}</p>
                <h3 className="mt-1 font-display text-xl leading-tight">{p.name.split("—")[0].trim()}</h3>
                <p className="mt-1 text-sm">From {formatUSD(Number(p.base_price))}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CRAFT STRIP */}
      <section className="bg-cream border-y border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 grid lg:grid-cols-2 gap-16 items-center">
          <div className="aspect-[5/6] overflow-hidden">
            <img src={images.lifestyleWoman} alt="Woman wearing Qureshi tennis chain in daily life" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="eyebrow">The Craft</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl leading-tight">
              Five layers of plating. <em className="italic">One</em> standard of finish.
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Every Qureshi piece begins as solid 925 sterling silver. We then bond five layers
              of precious metal plating with our proprietary e-coating, a process used by Swiss
              watchmakers. The result: a chain that resists tarnish, water, and the rigors of
              daily wear — without losing a milligram of shine.
            </p>
            <ul className="mt-8 grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              {[
                ["Solid S925", "Sterling silver core"],
                ["5× e-coating", "Tarnish & water resistant"],
                ["VVS moissanite", "Hand-set, four-prong"],
                ["Double-lock clasp", "Custom box closure"],
                ["GRA certified", "Independently verified"],
                ["Hypoallergenic", "Lead / nickel / cadmium free"],
              ].map(([t, s]) => (
                <li key={t} className="flex gap-3">
                  <Sparkles className="h-4 w-4 text-foreground mt-1 shrink-0" />
                  <div>
                    <p className="font-medium">{t}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{s}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SIZE GUIDE STRIP */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <p className="eyebrow">Find your fit</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl">From whisper-thin to statement.</h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Available in 2mm, 3mm, 4mm and 5mm widths. Chain lengths in 18", 20" and 24" —
              or commission a custom length. Bracelets in 8".
            </p>
            <div className="mt-10 grid grid-cols-4 gap-4 text-center">
              {["2mm", "3mm", "4mm", "5mm"].map((s) => (
                <div key={s} className="border border-border py-6">
                  <p className="font-display text-2xl">{s}</p>
                  <p className="eyebrow mt-1 text-[0.6rem]">{s === "2mm" ? "Subtle" : s === "5mm" ? "Bold" : "Versatile"}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 lg:order-2 aspect-square overflow-hidden">
            <img src={images.sizesComparison} alt="Tennis chain widths comparison 2mm 3mm 4mm 5mm" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {/* CERTIFIED */}
      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="eyebrow" style={{ color: "oklch(0.7 0.1 75)" }}>Independently Verified</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl text-background">Every stone, GRA certified.</h2>
            <p className="mt-6 text-background/70 leading-relaxed max-w-md">
              Each Qureshi piece ships with a GRA (Gemological Research Academy) certificate
              of authenticity — your guarantee of VVS clarity, D color, and the optical
              brilliance that exceeds diamond.
            </p>
            <Link to="/shop" className="inline-flex mt-10 items-center gap-3 bg-background text-foreground px-8 py-4 text-xs uppercase tracking-[0.22em] hover:bg-background/90 transition-colors">
              Shop certified pieces <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="aspect-square overflow-hidden">
            <img src={images.graCertificate} alt="GRA moissanite certificate with diamond tester verifying authenticity" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>
    </>
  );
}
