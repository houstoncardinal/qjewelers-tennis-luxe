import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, useMemo } from "react";
import { ArrowRight, ShieldCheck, Gem, Award, Truck, Star, Check, Sparkles, Eye } from "lucide-react";
import { listProducts } from "@/lib/products.functions";
import { images, getProductThumb } from "@/lib/product-images";
import { formatUSD, COLOR_MAP, COLOR_SHORT, getTennisBraceletPrice } from "@/lib/pricing";
import { EmailCapture } from "@/components/marketing/email-capture";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Qureshi Jewelers — S925 VVS Moissanite · GRA Certified" },
      { name: "description", content: "Hand-set VVS moissanite tennis chains, bracelets, stud earrings and engagement rings in solid S925 sterling silver. GRA certified. Free US shipping over $250." },
      { property: "og:title", content: "Qureshi Jewelers — VVS Moissanite Jewelry" },
      { property: "og:image", content: "/hero.jpg" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

// ─── Scroll Reveal ────────────────────────────────────────────────────────────

function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
    );
    document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// ─── Sparkles ─────────────────────────────────────────────────────────────────

const SPARKS = [
  { top: "14%", left: "11%", delay: "0s",    dur: "2.9s", s: 12 },
  { top: "21%", left: "79%", delay: "1.0s",  dur: "3.3s", s: 16 },
  { top: "55%", left: "7%",  delay: "1.7s",  dur: "2.6s", s: 10 },
  { top: "70%", left: "86%", delay: "0.4s",  dur: "3.5s", s: 13 },
  { top: "36%", left: "52%", delay: "2.3s",  dur: "2.3s", s:  9 },
  { top: "80%", left: "31%", delay: "1.1s",  dur: "3.1s", s: 15 },
  { top: "9%",  left: "44%", delay: "1.9s",  dur: "2.8s", s:  9 },
  { top: "62%", left: "61%", delay: "0.6s",  dur: "3.4s", s: 12 },
  { top: "43%", left: "24%", delay: "2.6s",  dur: "3.0s", s: 10 },
  { top: "28%", left: "91%", delay: "1.5s",  dur: "2.5s", s: 13 },
];

const GOLD     = "oklch(0.90 0.10 84)";
const GOLD_MID = "oklch(0.82 0.10 80 / 0.75)";

function SparkleEffects() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {SPARKS.map((s, i) => (
        <div
          key={i}
          className="absolute"
          style={{ top: s.top, left: s.left, animation: `sparkle ${s.dur} ${s.delay} ease-in-out infinite` }}
        >
          <div style={{ position: "relative", width: s.s, height: s.s }}>
            <div style={{
              position: "absolute", top: "50%", left: 0, right: 0, height: 1,
              transform: "translateY(-50%)",
              background: `linear-gradient(90deg, transparent, ${GOLD_MID}, transparent)`,
            }} />
            <div style={{
              position: "absolute", left: "50%", top: 0, bottom: 0, width: 1,
              transform: "translateX(-50%)",
              background: `linear-gradient(180deg, transparent, ${GOLD_MID}, transparent)`,
            }} />
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              width: Math.round(s.s * 0.28), height: Math.round(s.s * 0.28),
              transform: "translate(-50%, -50%)", borderRadius: "50%",
              background: GOLD, boxShadow: `0 0 ${s.s * 0.8}px ${GOLD}`,
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Ticker ───────────────────────────────────────────────────────────────────

const TICKER_ITEMS = [
  "Hand-Set VVS Moissanite",
  "Solid S925 Sterling Silver",
  "GRA Certified Authenticity",
  "D Color · Colorless",
  "Refractive Index 2.65",
  "5× E-Coat Protection",
  "Free US Shipping $250+",
  "14-Day Returns",
  "Professional Tester Verified",
  "9.25 Mohs Hardness",
];

function Ticker({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`overflow-hidden py-4 ${dark ? "border-b border-white/5" : "border-b border-border"}`}>
      <div className="marquee-wrapper">
        <div className={`marquee-inner text-[0.57rem] uppercase tracking-[0.28em] ${dark ? "text-white/28" : "text-muted-foreground"}`}>
          {[0, 1].map(copy =>
            TICKER_ITEMS.map((item, i) => (
              <span key={`${copy}-${i}`} className="inline-flex items-center shrink-0">
                <span className="px-8">{item}</span>
                <span className={`text-[0.38rem] ${dark ? "text-white/10" : "text-gold/35"}`}>◆</span>
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Product Card (white, shadow hover) ──────────────────────────────────────

function ProductCard({ p }: { p: any }) {
  return (
    <Link to="/product/$slug" params={{ slug: p.slug }} className="group block product-shadow bg-background">
      <div className="aspect-[3/4] overflow-hidden relative bg-[oklch(0.97_0.004_75)]">
        <img
          src={getProductThumb(p.slug, p.image_url)}
          alt={p.name}
          loading="lazy"
          className="h-full w-full object-cover tile-img"
        />
        {/* Gold top edge on hover */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left"
          style={{ background: "var(--gradient-gold-h)" }}
        />
      </div>
      <div className="px-4 pt-4 pb-5 space-y-1.5 border border-t-0 border-border">
        <div className="flex items-center gap-1.5">
          <span className="text-[0.43rem] uppercase tracking-[0.10em] text-gray-400 font-mono border border-gray-200 px-1 py-0.5 leading-none">
            S925
          </span>
          <div className="flex items-center gap-0.5 ml-0.5">
            <span className="w-2 h-2 rounded-full shrink-0 ring-1 ring-black/10" style={{ backgroundColor: "#D4AF37" }} title="18K Yellow Gold" />
            <span className="w-2 h-2 rounded-full shrink-0 ring-1 ring-black/10 -ml-0.5" style={{ backgroundColor: "#E8E8F4" }} title="18K White Gold" />
          </div>
        </div>
        <h3 className="font-display text-[1.25rem] leading-tight group-hover:text-gold transition-colors duration-300">
          {p.name}
        </h3>
        <p className="text-[0.72rem] text-muted-foreground">
          From <span className="text-foreground font-medium">
            {(p.slug?.includes("tennis-bracelet") || p.slug?.includes("tennis_bracelet"))
              ? formatUSD(getTennisBraceletPrice("2mm", '6"'))
              : formatUSD(Number(p.base_price))}
          </span>
        </p>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-background border border-border">
      <div className="aspect-[3/4] bg-[oklch(0.96_0.004_75)] animate-pulse" />
      <div className="px-4 pt-4 pb-5 space-y-2">
        <div className="h-2 w-16 bg-[oklch(0.94_0.004_75)] animate-pulse" />
        <div className="h-5 w-4/5 bg-[oklch(0.94_0.004_75)] animate-pulse" />
        <div className="h-3 w-14 bg-[oklch(0.94_0.004_75)] animate-pulse" />
      </div>
    </div>
  );
}

// ─── Hero tabs ────────────────────────────────────────────────────────────────

const HERO_TABS = [
  { key: "all",      label: "All" },
  { key: "necklace", label: "Chains" },
  { key: "bracelet", label: "Bracelets" },
  { key: "earring",  label: "Earrings" },
  { key: "ring",     label: "Rings" },
];

// ─── Category Tile ────────────────────────────────────────────────────────────

interface CategoryTileProps {
  image: string;
  label: string;
  shopType: string;
}

function CategoryTile({ image, label, shopType }: CategoryTileProps) {
  return (
    <Link
      to="/shop"
      search={{ type: shopType as any }}
      className="group block tile-hover"
    >
      <div className="aspect-[3/4] overflow-hidden bg-[oklch(0.97_0.004_75)] relative">
        <img
          src={image}
          alt={label}
          loading="lazy"
          className="h-full w-full object-cover tile-img"
        />
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-500" />
      </div>
      <div className="pt-4 pb-2 text-center">
        <p className="font-display text-[1.35rem] leading-none mb-1.5">{label}</p>
        <p className="text-[0.52rem] uppercase tracking-[0.28em] text-muted-foreground group-hover:text-foreground transition-colors duration-300">
          Shop →
        </p>
      </div>
    </Link>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────

function ReviewCard({ name, text, rating, location }: { name: string; text: string; rating: number; location: string }) {
  return (
    <div className="bg-white border border-border p-6 rounded-lg hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
        ))}
      </div>
      <p className="text-[0.82rem] text-foreground leading-[1.75] mb-4">{text}</p>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-[0.65rem] font-semibold text-amber-800">
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-[0.72rem] font-medium text-foreground">{name}</p>
          <p className="text-[0.55rem] text-muted-foreground">{location}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function Index() {
  const fetchProducts = useServerFn(listProducts);
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts(),
  });

  useReveal();

  const sig = (data?.products ?? []).filter((p: any) => p.is_active);

  const [heroType, setHeroType] = useState("all");
  const heroProducts = useMemo(() => {
    const pool = heroType === "all" ? sig : sig.filter((p: any) => p.type === heroType);
    const colorOrder: Record<string, number> = { gold: 0, rose_gold: 1, silver: 2, white_gold: 3 };
    return [...pool]
      .sort((a: any, b: any) => (colorOrder[a.color] ?? 9) - (colorOrder[b.color] ?? 9))
      .slice(0, 12);
  }, [sig, heroType]);

  // One per category, gold color variant preferred, max 4 total
  const goldOr = (type: string) =>
    sig.find((p: any) => p.type === type && p.color === "gold") ??
    sig.find((p: any) => p.type === type);

  const featuredProducts = [
    goldOr("necklace"),
    goldOr("bracelet"),
    goldOr("earring"),
    goldOr("ring"),
  ].filter(Boolean);

  return (
    <>
      {/* ════════════════════════════════════════════════════════
          HERO — cinematic full-bleed photo + product browser dock
      ════════════════════════════════════════════════════════ */}
      <section
        className="flex flex-col overflow-hidden h-[70svh] lg:h-[85svh]"
        style={{ minHeight: "460px" }}
      >

        {/* ── Photo zone: fills all remaining height ─────────── */}
        <div className="relative flex-1 min-h-0 overflow-hidden">
          <img
            src={images.hero}
            alt="VVS moissanite tennis jewelry — Qureshi Jewelers"
            loading="eager"
            decoding="sync"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />

          {/* Light frosted overlay — left-to-right white gradient */}
          <div className="absolute inset-0 bg-white/20" />
          {/* Left-to-right: warm white → translucent → transparent (reveals image on right) */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to right, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.90) 28%, rgba(255,255,255,0.65) 48%, rgba(255,255,255,0.22) 67%, transparent 84%)" }}
          />
          {/* Bottom gradient for dock transition */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, transparent 60%, rgba(255,255,255,0.60) 100%)" }}
          />

          {/* Editorial content */}
          <div className="absolute inset-0 flex items-center px-5 sm:px-8 lg:px-14 xl:px-20">
            <div className="max-w-lg">

              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-3 sm:mb-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <div className="h-px w-6 shrink-0" style={{ background: "linear-gradient(to right, oklch(0.72 0.10 80), transparent)" }} />
                <span className="text-[0.44rem] uppercase tracking-[0.40em] text-black/38 font-medium">
                  VVS1 · D Color · GRA Certified
                </span>
              </div>

              {/* Headline — 2 lines guaranteed (whitespace-nowrap + safe clamp for Cormorant Garamond) */}
              <h1 className="font-display leading-[0.90] mb-4 sm:mb-5">
                <span
                  className="block text-black animate-fade-up whitespace-nowrap"
                  style={{ fontSize: "clamp(1.5rem, 5.5vw, 5rem)", animationDelay: "0.26s" }}
                >
                  The World's Most
                </span>
                <span
                  className="block text-black animate-fade-up whitespace-nowrap"
                  style={{ fontSize: "clamp(1.5rem, 5.5vw, 5rem)", animationDelay: "0.40s" }}
                >
                  Brilliant Gemstone.
                </span>
              </h1>

              {/* Description — 2 lines on mobile to keep hero compact */}
              <p
                className="text-black/48 text-[0.79rem] leading-[1.70] max-w-[380px] mb-5 sm:mb-7 animate-fade-up line-clamp-2 sm:line-clamp-none"
                style={{ animationDelay: "0.50s" }}
              >
                D Colorless moissanite with more fire than diamond — hand-set in 18K gold-plated sterling silver. Every piece independently GRA certified.
              </p>

              {/* CTAs */}
              <div className="flex items-center gap-2.5 animate-fade-up" style={{ animationDelay: "0.62s" }}>
                <Link
                  to="/shop"
                  className="group relative overflow-hidden bg-black text-white px-7 sm:px-9 py-3 sm:py-3.5 text-[0.57rem] uppercase tracking-[0.26em] font-semibold hover:bg-black/90 transition-all duration-300 shadow-[0_4px_18px_rgba(0,0,0,0.14)]"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Shop Collection
                    <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </Link>
                <Link
                  to="/moissanite-guide"
                  className="border border-black/20 text-black/55 px-7 sm:px-9 py-3 sm:py-3.5 text-[0.57rem] uppercase tracking-[0.26em] font-medium hover:border-black/40 hover:text-black transition-all duration-300"
                >
                  Our Stone
                </Link>
              </div>

              {/* Trust row — hidden on mobile to keep hero height compact */}
              <div
                className="hidden sm:flex items-center gap-6 mt-7 animate-fade-in"
                style={{ animationDelay: "0.85s" }}
              >
                {[
                  { icon: ShieldCheck, text: "GRA Certified" },
                  { icon: Gem,         text: "VVS1 D Color" },
                  { icon: Truck,       text: "Free US Shipping" },
                ].map(({ icon: Icon, text }) => (
                  <span key={text} className="flex items-center gap-1.5">
                    <Icon className="h-3 w-3 text-black/25" />
                    <span className="text-[0.44rem] uppercase tracking-[0.16em] text-black/35 font-medium">{text}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Product browser dock ──────────────────────────── */}
        <div className="flex-shrink-0 bg-background border-t border-border">

          {/* Tab bar */}
          <div
            className="relative border-b border-border flex overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <div className="flex items-stretch px-5 lg:px-10 min-w-max">
              <span className="hidden sm:flex items-center text-[0.42rem] uppercase tracking-[0.38em] text-muted-foreground/28 pr-5 shrink-0">
                Browse
              </span>
              {HERO_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setHeroType(t.key)}
                  className={`px-4 lg:px-5 py-3.5 text-[0.52rem] uppercase tracking-[0.14em] shrink-0 relative transition-colors duration-200 whitespace-nowrap ${
                    heroType === t.key ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                  {heroType === t.key && (
                    <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-foreground" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex-1 min-w-2" />
            <Link
              to="/shop"
              search={heroType !== "all" ? { type: heroType as any } : {}}
              className="px-5 lg:px-10 flex items-center text-[0.52rem] uppercase tracking-[0.20em] text-muted-foreground hover:text-foreground transition-colors duration-200 whitespace-nowrap"
            >
              View All →
            </Link>
          </div>

          {/* Product horizontal scroll */}
          <div
            className="flex gap-3 lg:gap-4 px-5 lg:px-10 py-4 overflow-x-auto"
            style={{
              scrollbarWidth: "none",
              maskImage: "linear-gradient(to right, transparent, black 4%, black 93%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black 4%, black 93%, transparent)",
            }}
          >
            {isLoading
              ? [...Array(10)].map((_, i) => (
                  <div key={i} className="shrink-0 w-[88px] animate-pulse">
                    <div className="w-[88px] h-[106px] bg-[oklch(0.96_0.004_78)] mb-2" />
                    <div className="h-1.5 bg-[oklch(0.95_0.004_78)] w-4/5 mb-1.5" />
                    <div className="h-1.5 bg-[oklch(0.95_0.004_78)] w-1/2" />
                  </div>
                ))
              : heroProducts.map((p: any) => (
                  <Link
                    key={p.id}
                    to="/product/$slug"
                    params={{ slug: p.slug }}
                    className="shrink-0 group w-[88px]"
                  >
                    <div className="w-[88px] h-[106px] overflow-hidden bg-[oklch(0.97_0.004_75)] mb-2 relative">
                      <img
                        src={getProductThumb(p.slug, p.image_url)}
                        alt={p.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.07]"
                      />
                      <div
                        className="absolute top-0 left-0 right-0 h-[2px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
                        style={{ background: "var(--gradient-gold-h)" }}
                      />
                    </div>
                    <p className="text-[0.50rem] font-medium text-foreground truncate mb-0.5 leading-tight">{p.name}</p>
                    <p className="text-[0.46rem] text-muted-foreground">
                      From {(p.slug?.includes("tennis-bracelet") || p.slug?.includes("tennis_bracelet"))
                        ? formatUSD(getTennisBraceletPrice("2mm", '6"'))
                        : formatUSD(Number(p.base_price))}
                    </p>
                  </Link>
                ))
            }
            <div className="shrink-0 w-2 lg:w-4" />
          </div>
        </div>
      </section>

      {/* ── Ticker ── */}
      <Ticker />

      {/* ════════════════════════════════════════════════════════
          SHOP BY CATEGORY — 4 portrait tiles (Brilliant Earth style)
      ════════════════════════════════════════════════════════ */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1360px] px-5 lg:px-10 py-20 lg:py-28">
          <div className="text-center mb-14 reveal">
            <p className="eyebrow mb-3">Collections</p>
            <h2 className="font-display" style={{ fontSize: "clamp(2.2rem, 4.5vw, 4rem)" }}>
              Shop by Category
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 reveal" style={{ transitionDelay: "0.1s" }}>
            <CategoryTile
              image="/tennischain.png"
              label="Tennis Chains"
              shopType="necklace"
            />
            <CategoryTile
              image="/TennisBracelet/yellowgoldmain.jpg"
              label="Tennis Bracelets"
              shopType="bracelet"
            />
            <CategoryTile
              image="/3%20Prong%20Moissanite%20Earrings/silverandwhitegoldsecondimage.jpg"
              label="Stud Earrings"
              shopType="earring"
            />
            <CategoryTile
              image="/ring.jpg"
              label="Engagement Rings"
              shopType="ring"
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          OUR SIGNATURE — 4 product cards, white bg
      ════════════════════════════════════════════════════════ */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1360px] px-5 lg:px-10 py-20 lg:py-28">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-14 reveal">
            <div>
              <p className="eyebrow mb-3">Signature Pieces</p>
              <h2 className="font-display" style={{ fontSize: "clamp(2.2rem, 4.5vw, 4rem)" }}>
                Our Signature
              </h2>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.28em] lux-link text-muted-foreground hover:text-foreground transition-colors duration-300 shrink-0 mb-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 reveal" style={{ transitionDelay: "0.15s" }}>
            {isLoading
              ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
              : featuredProducts.slice(0, 4).map((p: any) => <ProductCard key={p.id} p={p} />)
            }
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          WHY MOISSANITE — comparison section (replaces "The Stone")
      ════════════════════════════════════════════════════════ */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1360px] px-5 lg:px-10 py-24 lg:py-36">
          <div className="text-center mb-16 reveal">
            <p className="eyebrow mb-3">The Science of Brilliance</p>
            <h2 className="font-display leading-[0.95]" style={{ fontSize: "clamp(2.2rem, 4.5vw, 4rem)" }}>
              Why Moissanite?
            </h2>
            <p className="mt-4 text-muted-foreground text-[0.85rem] leading-[1.75] max-w-xl mx-auto">
              Not a substitute. A discovery. Moissanite outperforms diamond in every measurable way — and costs a fraction of the price.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 reveal" style={{ transitionDelay: "0.1s" }}>
            {[
              {
                icon: Sparkles,
                title: "More Fire",
                desc: "Dispersion of 0.104 — nearly 3× that of diamond. The rainbow flashes you see in our jewelry are real, not a filter.",
                stat: "0.104",
                statLabel: "Fire Dispersion",
              },
              {
                icon: Eye,
                title: "More Brilliance",
                desc: "Refractive index of 2.65 — the highest of any gemstone on earth. Light enters and bounces back with unmatched intensity.",
                stat: "2.65",
                statLabel: "Refractive Index",
              },
              {
                icon: ShieldCheck,
                title: "More Durable",
                desc: "9.25 on the Mohs scale — harder than ruby, sapphire, and emerald. Only diamond is harder. Built to last a lifetime.",
                stat: "9.25",
                statLabel: "Mohs Hardness",
              },
            ].map(({ icon: Icon, title, desc, stat, statLabel }) => (
              <div
                key={title}
                className="bg-white border border-border p-8 rounded-lg hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="font-display text-[1.5rem] mb-3">{title}</h3>
                <p className="text-[0.82rem] text-muted-foreground leading-[1.75] mb-6">{desc}</p>
                <div className="pt-4 border-t border-border">
                  <div
                    className="font-display text-[2rem] leading-none mb-1"
                    style={{
                      background: "var(--gradient-gold)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {stat}
                  </div>
                  <div className="text-[0.46rem] uppercase tracking-[0.20em] text-muted-foreground">{statLabel}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12 reveal" style={{ transitionDelay: "0.2s" }}>
            <Link
              to="/moissanite-guide"
              className="inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.28em] lux-link text-muted-foreground hover:text-foreground transition-colors duration-350"
            >
              The full story <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════
          METAL FINISHES — white bg, refined circles
      ════════════════════════════════════════════════════════ */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1360px] px-5 lg:px-10 py-24 lg:py-32">
          <div className="text-center mb-16 reveal">
            <p className="eyebrow mb-4">Every Piece, Every Finish</p>
            <h2 className="font-display leading-[1.03]" style={{ fontSize: "clamp(2.2rem, 4.5vw, 4rem)" }}>
              Four precious metals.
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {Object.entries(COLOR_MAP).map(([key, val], i) => (
              <Link
                key={key}
                to="/shop"
                search={{ color: key as any }}
                className="group bg-background/88 hover:bg-[oklch(0.978_0.005_80)] transition-colors duration-400 overflow-hidden reveal"
                style={{ transitionDelay: `${i * 0.09}s` }}
              >
                <div className="p-8 pb-10 text-center">
                  <div
                    className="w-14 h-14 rounded-full mx-auto mb-6 transition-transform duration-500 group-hover:scale-110"
                    style={{
                      backgroundColor: val.hex,
                      boxShadow: `0 4px 16px ${val.hex}44, 0 0 0 1px var(--color-border)`,
                    }}
                  />
                  <p className="font-display text-[1.35rem] mb-1.5">{val.label}</p>
                  <p className="text-[0.46rem] uppercase tracking-[0.18em] text-muted-foreground leading-relaxed">{val.plated}</p>
                  <p className="mt-5 text-[0.5rem] uppercase tracking-[0.22em] text-gold opacity-0 group-hover:opacity-100 transition-opacity duration-350 flex items-center justify-center gap-1.5">
                    Shop {COLOR_SHORT[key]} <ArrowRight className="h-2.5 w-2.5" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CERTIFICATION — GRA badge + trust signals
      ════════════════════════════════════════════════════════ */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1360px] px-5 lg:px-10 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="reveal">
              <p className="eyebrow mb-6">Certified Authenticity</p>
              <h2 className="font-display leading-[0.95]" style={{ fontSize: "clamp(2.2rem, 4.5vw, 4rem)" }}>
                Every stone,
                <br />
                <em
                  className="italic"
                  style={{
                    background: "var(--gradient-gold)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  independently verified.
                </em>
              </h2>
            </div>

            <div className="reveal space-y-7" style={{ transitionDelay: "0.18s" }}>
              <p className="text-muted-foreground leading-[1.95] text-[0.9rem]">
                Every Qureshi piece comes with a GRA (Gemological Research Academy) certificate.
                This is not a marketing claim — it's a third-party verification of clarity, color,
                cut, and carat weight. Your stone is tested, graded, and documented.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: ShieldCheck, label: "GRA Certified", desc: "Independent verification" },
                  { icon: Gem, label: "VVS Clarity", desc: "VVS1 · Eye-clean" },
                  { icon: Award, label: "D Color", desc: "Colorless grade" },
                  { icon: Check, label: "Tester Verified", desc: "Professional grade" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div
                    key={label}
                    className="border border-border bg-background px-5 py-5 hover:border-foreground/15 transition-colors duration-350"
                  >
                    <Icon className="h-4 w-4 text-gold/70 mb-2" />
                    <p className="text-[0.72rem] font-semibold text-foreground mb-0.5">{label}</p>
                    <p className="text-[0.55rem] text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>

              <Link
                to="/moissanite-guide"
                className="inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.28em] lux-link text-muted-foreground hover:text-foreground transition-colors duration-350"
              >
                Learn about certification <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CUSTOMER REVIEWS — social proof
      ════════════════════════════════════════════════════════ */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1360px] px-5 lg:px-10 py-24 lg:py-32">
          <div className="text-center mb-16 reveal">
            <p className="eyebrow mb-3">What Our Customers Say</p>
            <h2 className="font-display" style={{ fontSize: "clamp(2.2rem, 4.5vw, 4rem)" }}>
              Trusted by thousands.
            </h2>
            <p className="mt-4 text-muted-foreground text-[0.85rem] leading-[1.75] max-w-xl mx-auto">
              Real reviews from real customers who chose brilliance over compromise.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 reveal" style={{ transitionDelay: "0.1s" }}>
            <ReviewCard
              name="Sarah M."
              text="I was skeptical about moissanite, but the fire on this tennis bracelet is unreal. My friends think it's a $10K diamond. The GRA certificate sealed the deal."
              rating={5}
              location="New York, NY"
            />
            <ReviewCard
              name="James T."
              text="Bought the 3mm tennis chain in yellow gold for my wife's birthday. She hasn't taken it off since. The quality is incredible for the price. Will be buying more."
              rating={5}
              location="Los Angeles, CA"
            />
            <ReviewCard
              name="Priya K."
              text="The stud earrings are stunning. I've worn them every day for 3 months and they still look brand new. The e-coating really works. Best jewelry purchase I've made."
              rating={5}
              location="Chicago, IL"
            />
          </div>

          <div className="text-center mt-12 reveal" style={{ transitionDelay: "0.2s" }}>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.28em] lux-link text-muted-foreground hover:text-foreground transition-colors duration-350"
            >
              Shop the collection <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          TRUST STRIP — light, white background
      ════════════════════════════════════════════════════════ */}
      <section className="bg-background border-b border-border">
        <div className="mx-auto max-w-[1360px] px-5 lg:px-10 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
            {[
              { icon: ShieldCheck, label: "GRA Certified",      sub: "Every stone, every piece" },
              { icon: Gem,         label: "VVS · D Color",      sub: "Highest clarity & colorless" },
              { icon: Award,       label: "RI 2.65",            sub: "Highest of any gemstone" },
              { icon: Truck,       label: "Free Shipping $250+", sub: "Continental US" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center text-center px-6 py-10 gap-3">
                <Icon className="h-5 w-5 text-gold/70" />
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-foreground">{label}</p>
                <p className="text-[0.58rem] uppercase tracking-[0.12em] text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <EmailCapture />
    </>
  );
}