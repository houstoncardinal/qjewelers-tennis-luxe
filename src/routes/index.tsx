import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, useMemo, useRef } from "react";
import { ArrowRight, ShieldCheck, Gem, Award, Truck, Star, Check, Sparkles, Eye, Diamond, X, Leaf, Crown } from "lucide-react";
import { listProducts } from "@/lib/products.functions";
import { images, getProductThumb } from "@/lib/product-images";
import { formatUSD, getTennisBraceletPrice, getTennisChainPrice } from "@/lib/pricing";
import { EmailCapture } from "@/components/marketing/email-capture";
import { EditableText, useCms } from "@/lib/cms-context";

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://qureshijewelers.com").replace(/\/$/, "");

export const Route = createFileRoute("/")({
  // SSR featured products so non-JS crawlers (AI bots, first-pass Googlebot)
  // see real product links/names in the homepage HTML instead of an empty
  // shell waiting on a client-side fetch.
  loader: async () => {
    const res = await listProducts();
    return res;
  },
  head: () => ({
    meta: [
      { title: "Moissanite Jewelry — Tennis Chains, Bracelets & Rings | Qureshi Jewelers" },
      { name: "description", content: "Shop VVS moissanite jewelry: tennis chains, tennis bracelets, stud earrings, and engagement rings in solid S925 sterling silver. GRA certified. Free US shipping over $250." },
      { property: "og:title", content: "Moissanite Jewelry — Tennis Chains, Bracelets & Rings | Qureshi Jewelers" },
      { property: "og:description", content: "VVS moissanite tennis chains, bracelets, stud earrings, and engagement rings, hand-set in solid S925 sterling silver. GRA certified." },
      { property: "og:image", content: `${SITE_URL}/hero.jpg` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:url", content: SITE_URL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Moissanite Jewelry — Tennis Chains, Bracelets & Rings | Qureshi Jewelers" },
      { name: "twitter:description", content: "VVS moissanite tennis chains, bracelets, stud earrings, and engagement rings in solid S925 sterling silver. GRA certified. Free US shipping over $250." },
      { name: "twitter:image", content: `${SITE_URL}/hero.jpg` },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Moissanite Jewelry Categories",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Moissanite Chains", url: `${SITE_URL}/shop?type=necklace` },
            { "@type": "ListItem", position: 2, name: "Moissanite Tennis Bracelets", url: `${SITE_URL}/shop?type=bracelet` },
            { "@type": "ListItem", position: 3, name: "Moissanite Stud Earrings", url: `${SITE_URL}/shop?type=earring` },
            { "@type": "ListItem", position: 4, name: "Moissanite Engagement Rings", url: `${SITE_URL}/shop?type=ring` },
          ],
        }),
      },
      // GEO-optimized FAQPage — answers questions AI tools (ChatGPT, Perplexity,
      // Google AI Overviews) surface when users search for moissanite jewelry.
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Where can I buy the best moissanite jewelry online?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Qureshi Jewelers (qureshijewelers.com) is America's premier source for VVS moissanite jewelry. We specialize in tennis chains, tennis bracelets, stud earrings, and engagement rings — all hand-set in solid S925 sterling silver with GRA certification. Free US shipping on orders over $250.",
              },
            },
            {
              "@type": "Question",
              name: "What is the best moissanite tennis chain?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "The best moissanite tennis chains are hand-set with VVS clarity, D color (colorless) moissanite in solid S925 sterling silver. Look for GRA certification, a double-locking clasp, and 5x e-coating for durability. Qureshi Jewelers offers tennis chains from 2mm to 5mm widths in 16\"–24\" lengths, starting under $150.",
              },
            },
            {
              "@type": "Question",
              name: "Is S925 sterling silver good for moissanite jewelry?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. S925 sterling silver (92.5% pure silver) is the industry standard for fine jewelry settings. Combined with 5x e-coating in gold, rose gold, or rhodium, it produces a durable, tarnish-resistant finish indistinguishable from solid gold at a fraction of the cost. All Qureshi Jewelers pieces use solid S925 — not hollow or plated base metals.",
              },
            },
            {
              "@type": "Question",
              name: "How much does moissanite jewelry cost?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Moissanite jewelry costs 85–95% less than comparable diamond jewelry. At Qureshi Jewelers, moissanite tennis chains start at around $89, tennis bracelets from $129, stud earrings from $59, and engagement rings from $149. Free US shipping on orders over $250.",
              },
            },
            {
              "@type": "Question",
              name: "What is the difference between moissanite and cubic zirconia?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Moissanite and cubic zirconia are completely different stones. Moissanite (silicon carbide) scores 9.25 on the Mohs hardness scale, maintains its brilliance permanently, and passes diamond testers. Cubic zirconia scores only 8.5, clouds and loses brilliance within months, and is far less optically impressive. Moissanite is a genuine, durable gemstone; cubic zirconia is a low-cost glass simulant.",
              },
            },
            {
              "@type": "Question",
              name: "Does Qureshi Jewelers offer GRA certified moissanite?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. Every piece from Qureshi Jewelers ships with a GRA (Gemstone Research Association) certificate of authenticity that independently verifies your stone's VVS clarity grade, D color grade, and carat weight. This certificate is your proof of quality and can be used for insurance purposes.",
              },
            },
          ],
        }),
      },
    ],
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
    <Link to="/product/$slug" params={{ slug: p.slug }} className="group block product-shadow bg-background lg:hover:shadow-xl transition-all duration-500 active:scale-[0.99]">
      <div className="aspect-[4/5] lg:aspect-[3/4] overflow-hidden relative bg-[oklch(0.97_0.004_75)]">
        <img
          src={getProductThumb(p.slug, p.image_url)}
          alt={p.name}
          loading="lazy"
          className="h-full w-full object-cover tile-img transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.08] group-active:scale-[1.03]"
        />
        {/* Gold top edge on hover */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left"
          style={{ background: "var(--gradient-gold-h)" }}
        />
        {/* Quick-look label on hover (desktop) */}
        <div className="absolute inset-x-0 bottom-0 py-4 px-5 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 lg:flex hidden items-center justify-center">
          <span className="text-white text-[0.55rem] uppercase tracking-[0.26em] font-medium">
            View Details
          </span>
        </div>
      </div>
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-5 sm:pb-6 space-y-2 sm:space-y-2.5 border border-t-0 border-border">
        <div className="flex items-center gap-2">
          <span className="text-[0.48rem] sm:text-[0.43rem] uppercase tracking-[0.10em] text-gray-400 font-mono border border-gray-200 px-1.5 py-0.5 leading-none">
            S925
          </span>
          <div className="flex items-center gap-0.5 ml-0.5">
            <span className="w-3 h-3 sm:w-2 sm:h-2 rounded-full shrink-0 ring-1 ring-black/10" style={{ backgroundColor: "#D4AF37" }} title="18K Yellow Gold" />
            <span className="w-3 h-3 sm:w-2 sm:h-2 rounded-full shrink-0 ring-1 ring-black/10 -ml-0.5" style={{ backgroundColor: "#E8E8F4" }} title="18K White Gold" />
          </div>
        </div>
        <h3 className="font-display text-[1.5rem] sm:text-[1.25rem] leading-tight group-hover:text-gold transition-colors duration-300">
          {p.name}
        </h3>
        <p className="text-[0.85rem] sm:text-[0.72rem] text-muted-foreground">
          From <span className="text-foreground font-semibold">
            {(p.slug?.includes("tennis-bracelet") || p.slug?.includes("tennis_bracelet"))
              ? formatUSD(getTennisBraceletPrice("2mm", '6"'))
              : (p.slug?.includes("tennis-chain") || p.slug?.includes("tennis_chain"))
                ? formatUSD(getTennisChainPrice("3mm", '16"'))
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
    <div className="qj-premium-card bg-white border border-border p-7 rounded-xl relative overflow-hidden">
      <span
        className="font-display italic absolute top-2 right-5 text-[3.5rem] leading-none select-none pointer-events-none"
        style={{ color: "oklch(0.60 0.092 68 / 0.10)" }}
      >
        "
      </span>
      <div className="flex items-center gap-1 mb-3 relative z-10">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
        ))}
      </div>
      <p className="text-[0.82rem] text-foreground leading-[1.75] mb-5 relative z-10">{text}</p>
      <div className="flex items-center gap-2.5 relative z-10">
        <div
          className="qj-icon-ring w-9 h-9 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-[0.68rem] font-semibold text-amber-800 shrink-0"
          style={{ boxShadow: "0 0 0 1px oklch(0.60 0.092 68 / 0.15)" }}
        >
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

// ─── Eyebrow — flanking-line micro-label, used site-wide for a consistent premium header system ──

function Eyebrow({ children, center = true }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div className={`flex items-center gap-3 mb-4 ${center ? "justify-center" : ""}`}>
      <span className="h-px w-7 sm:w-9 shrink-0" style={{ background: "linear-gradient(to right, transparent, oklch(0.60 0.092 68))" }} />
      <span className="text-[0.46rem] uppercase tracking-[0.40em] text-foreground/65 font-semibold whitespace-nowrap">
        {children}
      </span>
      <span className="h-px w-7 sm:w-9 shrink-0" style={{ background: "linear-gradient(to left, transparent, oklch(0.60 0.092 68))" }} />
    </div>
  );
}

// ─── Count-up stat tile — animates from 0 once scrolled into view ─────────────

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return value;
}

function StatTile({ icon: Icon, stat, label }: { icon: React.ElementType; stat: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const match = /^(\d+)(.*)$/.exec(stat);
  const target = match ? Number(match[1]) : 0;
  const suffix = match ? match[2] : "";
  const value = useCountUp(target, active);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); obs.disconnect(); } },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="qj-stat-tile bg-white px-6 py-7 text-center rounded-xl border border-border/70 relative overflow-hidden">
      <span className="qj-stat-topline absolute top-0 left-0 right-0 h-[2px] origin-left" style={{ background: "var(--gradient-gold-h)" }} />
      <Icon className="qj-stat-icon h-4 w-4 mx-auto mb-3 text-gold/70" />
      <p className="font-display text-[1.9rem] leading-none mb-1.5 gold-text tabular-nums">
        {value}{suffix}
      </p>
      <p className="text-[0.46rem] uppercase tracking-[0.20em] text-muted-foreground">{label}</p>
    </div>
  );
}

// ─── Hero trust row (uses CMS content) ───────────────────────────────────────

function HeroTrustRow() {
  const { getContent } = useCms();
  const items = [
    { icon: ShieldCheck, key: "home.trust.gra",      fallback: "GRA Certified"   },
    { icon: Gem,         key: "home.trust.color",    fallback: "VVS1 D Color"    },
    { icon: Truck,       key: "home.trust.shipping", fallback: "Free US Shipping" },
  ];
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-5 mt-7 animate-fade-in"
      style={{ animationDelay: "0.85s" }}
    >
      {items.map(({ icon: Icon, key, fallback }, i) => (
        <span key={key} className="flex items-center gap-5">
          {i > 0 && <span className="hidden sm:block h-3 w-px bg-black/15" />}
          <span className="flex items-center gap-1.5">
            <Icon className="h-3 w-3 text-black/45" />
            <EditableText
              contentKey={key}
              label={`Hero — Trust: ${fallback}`}
              defaultValue={fallback}
              tag="span"
              className="text-[0.44rem] uppercase tracking-[0.16em] text-black/65 font-medium"
            />
          </span>
        </span>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function Index() {
  const loaderData = Route.useLoaderData();
  const fetchProducts = useServerFn(listProducts);
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts(),
    initialData: loaderData,
  });

  useReveal();

  const sig = (data?.products ?? []).filter((p: any) => p.is_active);

  // Mouse-parallax for the ambient glow behind the "Ethically Created" section —
  // mutates transform directly via refs (no React state) to avoid re-render churn on every mousemove.
  const glow1Ref = useRef<HTMLDivElement>(null);
  const glow2Ref = useRef<HTMLDivElement>(null);
  const glowFrame = useRef<number | undefined>(undefined);
  const handleGlowMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (glowFrame.current) return;
    const target = e.currentTarget;
    const clientX = e.clientX;
    const clientY = e.clientY;
    glowFrame.current = requestAnimationFrame(() => {
      const rect = target.getBoundingClientRect();
      const px = (clientX - rect.left) / rect.width - 0.5;
      const py = (clientY - rect.top) / rect.height - 0.5;
      if (glow1Ref.current) glow1Ref.current.style.transform = `translate(calc(-50% + ${px * 50}px), calc(-33% + ${py * 36}px))`;
      if (glow2Ref.current) glow2Ref.current.style.transform = `translate(calc(33% + ${px * -36}px), calc(33% + ${py * -28}px))`;
      glowFrame.current = undefined;
    });
  };

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
        className="flex flex-col overflow-hidden h-[90svh] sm:h-[75svh] lg:h-[85svh]"
        style={{ minHeight: "580px" }}
      >

        {/* ── Photo zone: fills all remaining height ─────────── */}
        <div className="relative flex-1 min-h-0 overflow-hidden">
          {images.heroVideo ? (
            <video
              src={images.heroVideo}
              poster={images.hero}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          ) : (
            <img
              src={images.hero}
              alt="VVS moissanite tennis jewelry — Qureshi Jewelers"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          )}

          {/* Frosted base — lifts the image slightly so white text layers read cleanly */}
          <div className="absolute inset-0 bg-white/20" />
          {/* Mobile overlay — covers ~80% of width solidly so stacked elements never bleed
              into the transparent image zone on narrow viewports */}
          <div
            className="absolute inset-0 sm:hidden"
            style={{ background: "linear-gradient(to right, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.96) 58%, rgba(255,255,255,0.84) 76%, rgba(255,255,255,0.46) 90%, rgba(255,255,255,0.18) 100%)" }}
          />
          {/* Desktop overlay — left-heavy: solid through ~40%, fades out by 86% */}
          <div
            className="absolute inset-0 hidden sm:block"
            style={{ background: "linear-gradient(to right, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.94) 40%, rgba(255,255,255,0.65) 55%, rgba(255,255,255,0.22) 70%, transparent 86%)" }}
          />
          {/* Bottom gradient for dock transition */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, transparent 60%, rgba(255,255,255,0.60) 100%)" }}
          />

          {/* Editorial content */}
          <div className="absolute inset-0 flex items-start sm:items-center px-6 sm:px-8 lg:px-14 xl:px-20 pt-[10svh] pb-[10svh] sm:py-0">
            <div className="w-[78vw] sm:w-auto max-w-[78vw] sm:max-w-lg">

              {/* Eyebrow / certification micro-banner */}
              <div className="flex items-center gap-3 mb-3 sm:mb-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <div className="h-px w-6 shrink-0" style={{ background: "linear-gradient(to right, oklch(0.60 0.092 68), transparent)" }} />
                <EditableText
                  contentKey="home.hero.badge"
                  label="Hero — Certification Badge"
                  defaultValue="VVS1 · D Color · GRA Certified"
                  tag="span"
                  className="text-[0.44rem] uppercase tracking-[0.40em] text-black/70 font-semibold"
                />
              </div>

              {/* Headline — 2 lines guaranteed (whitespace-nowrap + safe clamp for Cormorant Garamond).
                  Deliberately not a ch-based max-width: with a fixed 2-line marketing headline,
                  hard-splitting + clamp() guarantees the exact break point at every viewport —
                  a ch-width wrap point can't promise that and risks an orphaned word. */}
              <h1 className="font-display leading-[0.90] mb-4 sm:mb-5">
                <EditableText
                  contentKey="home.hero.headline_line1"
                  label="Hero — Headline Line 1"
                  defaultValue="The World's Most"
                  tag="span"
                  className="block text-black animate-fade-up sm:whitespace-nowrap"
                  style={{ fontSize: "clamp(2.1rem, 8vw, 5rem)", animationDelay: "0.26s" }}
                />
                <EditableText
                  contentKey="home.hero.headline_line2"
                  label="Hero — Headline Line 2"
                  defaultValue="Brilliant Gemstone."
                  tag="span"
                  className="block text-black animate-fade-up sm:whitespace-nowrap"
                  style={{ fontSize: "clamp(2.1rem, 8vw, 5rem)", animationDelay: "0.40s" }}
                />
              </h1>

              {/* Description — 2 lines on mobile to keep hero compact. max-w caps line length to ~45ch. */}
              <p
                className="text-black/72 text-[0.79rem] leading-[1.70] max-w-[32ch] sm:max-w-[380px] mb-6 sm:mb-7 animate-fade-up line-clamp-3 sm:line-clamp-none"
                style={{ animationDelay: "0.50s" }}
              >
                <EditableText
                  contentKey="home.hero.subheadline"
                  label="Hero — Subheadline"
                  defaultValue="D Colorless moissanite with more fire than diamond — hand-set in 18K gold-plated sterling silver. Every piece independently GRA certified."
                  tag="span"
                />
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 animate-fade-up" style={{ animationDelay: "0.62s" }}>
                <Link
                  to="/shop"
                  className="group relative overflow-hidden bg-black text-white px-8 sm:px-9 py-3.5 sm:py-3.5 text-[0.57rem] uppercase tracking-[0.26em] font-semibold transition-all duration-300 shadow-[0_4px_18px_rgba(0,0,0,0.14)] hover:shadow-[inset_0_0_0_1px_oklch(0.60_0.092_68),0_4px_18px_rgba(0,0,0,0.14)]"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Shop Collection
                    <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </Link>
                {/* Editorial text link, not a ghost button — a light border on this background
                    reads as invisible/disabled, an underline + arrow reads as intentional. */}
                <Link
                  to="/moissanite-guide"
                  className="group flex items-center gap-1.5 text-black/70 text-[0.57rem] uppercase tracking-[0.26em] font-medium transition-colors duration-300 hover:text-black"
                >
                  <span className="border-b border-black/30 pb-0.5 transition-colors duration-300 group-hover:border-black/70">
                    Our Stone
                  </span>
                  <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Trust row — hidden on mobile to keep hero height compact */}
              <HeroTrustRow />
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
                  <div key={i} className="shrink-0 w-[108px] animate-pulse">
                    <div className="w-[108px] h-[130px] bg-[oklch(0.96_0.004_78)] mb-2" />
                    <div className="h-1.5 bg-[oklch(0.95_0.004_78)] w-4/5 mb-1.5" />
                    <div className="h-1.5 bg-[oklch(0.95_0.004_78)] w-1/2" />
                  </div>
                ))
              : heroProducts.map((p: any) => (
                  <Link
                    key={p.id}
                    to="/product/$slug"
                    params={{ slug: p.slug }}
                    className="shrink-0 group w-[108px]"
                  >
                    <div className="w-[108px] h-[130px] overflow-hidden bg-[oklch(0.97_0.004_75)] mb-2 relative">
                      <img
                        src={getProductThumb(p.slug, p.image_url)}
                        alt={p.name}
                        loading="eager"
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
        <div className="mx-auto max-w-[1360px] px-5 lg:px-10 py-14 lg:py-20">
          <div className="text-center mb-9 reveal">
            <Eyebrow>Collections</Eyebrow>
            <h2 className="font-display" style={{ fontSize: "clamp(2.2rem, 4.5vw, 4rem)" }}>
              Shop by Category
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 reveal" style={{ transitionDelay: "0.1s" }}>
            <CategoryTile
              image="/tennischain.png"
              label="Moissanite Chains"
              shopType="necklace"
            />
            <CategoryTile
              image="/TennisBracelet/yellowgoldmain.jpg"
              label="Moissanite Bracelets"
              shopType="bracelet"
            />
            <CategoryTile
              image="/3%20Prong%20Moissanite%20Earrings/silverandwhitegoldsecondimage.jpg"
              label="Moissanite Earrings"
              shopType="earring"
            />
            <CategoryTile
              image="/ring.jpg"
              label="Moissanite Rings"
              shopType="ring"
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FEATURED ITEMS — 4 product cards, white bg
      ════════════════════════════════════════════════════════ */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1360px] px-5 lg:px-10 py-14 lg:py-20">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-9 reveal">
            <div>
              <Eyebrow center={false}>Curated For You</Eyebrow>
              <h2 className="font-display" style={{ fontSize: "clamp(2.2rem, 4.5vw, 4rem)" }}>
                Featured Items
              </h2>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.28em] lux-link text-muted-foreground hover:text-foreground transition-colors duration-300 shrink-0 mb-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 reveal" style={{ transitionDelay: "0.15s" }}>
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
        <div className="mx-auto max-w-[1360px] px-5 lg:px-10 py-16 lg:py-24">
          <div className="text-center mb-11 reveal">
            <Eyebrow>The Science of Brilliance</Eyebrow>
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
                className="qj-premium-card bg-white border border-border p-8 rounded-xl group"
              >
                <div className="qj-icon-ring w-12 h-12 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center mb-6">
                  <Icon className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="font-display text-[1.5rem] mb-3">{title}</h3>
                <p className="text-[0.82rem] text-muted-foreground leading-[1.75] mb-6">{desc}</p>
                <div className="pt-4 border-t border-border">
                  <div className="font-display text-[2rem] leading-none mb-1 gold-text">
                    {stat}
                  </div>
                  <div className="text-[0.46rem] uppercase tracking-[0.20em] text-muted-foreground">{statLabel}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8 reveal" style={{ transitionDelay: "0.2s" }}>
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
          CERTIFICATION — GRA badge + trust signals
      ════════════════════════════════════════════════════════ */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1360px] px-5 lg:px-10 py-16 lg:py-22">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="reveal">
              <Eyebrow center={false}>Certified Authenticity</Eyebrow>
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
          CRUELTY-FREE — enterprise comparison redesign
      ════════════════════════════════════════════════════════ */}
      <section
        className="relative border-b border-border bg-[oklch(0.978_0.005_80)] overflow-hidden"
        onMouseMove={handleGlowMouseMove}
      >
        {/* Ambient gold glow */}
        <div
          ref={glow1Ref}
          className="absolute top-0 left-1/2 w-[900px] h-[900px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, oklch(0.85 0.09 80 / 0.14) 0%, transparent 65%)",
            transform: "translate(-50%, -33%)",
            transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1)",
            willChange: "transform",
          }}
        />
        <div
          ref={glow2Ref}
          className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, oklch(0.85 0.09 80 / 0.10) 0%, transparent 70%)",
            transform: "translate(33%, 33%)",
            transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1)",
            willChange: "transform",
          }}
        />

        <div className="relative mx-auto max-w-[1360px] px-5 lg:px-10 py-16 lg:py-28">
          {/* Centered heading */}
          <div className="text-center mb-14 lg:mb-20 reveal">
            <Eyebrow>Lab-Created · Conflict-Free · GRA Certified</Eyebrow>
            <h2 className="font-display leading-[0.95]" style={{ fontSize: "clamp(2.4rem, 5.5vw, 4.75rem)" }}>
              Brilliance that never costs
              <br className="hidden sm:block" />{" "}
              <em className="italic gold-shimmer">the earth.</em>
            </h2>
          </div>

          {/* 2-column layout: story + table */}
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">

            {/* Left: story + impact numbers + stone specs + CTA */}
            <div className="reveal">
              <p className="text-muted-foreground text-[0.88rem] leading-[1.85] mb-8">
                Every Qureshi moissanite is grown in a controlled lab environment — never blasted from the
                earth, never linked to conflict financing, never produced through exploitative labor.
                You receive the same optical fire and VVS1&nbsp;D&#8209;color clarity as diamond, without
                the ethical and environmental cost embedded in every mined carat.
              </p>

              {/* 3 impact numbers */}
              <div className="grid grid-cols-3 border border-border mb-8">
                {[
                  { num: "0", sub: "Acres of land\ndisturbed" },
                  { num: "100%", sub: "Conflict-free\n& traceable" },
                  { num: "~97%", sub: "Lower cost vs.\nequivalent diamond" },
                ].map((s) => (
                  <div key={s.sub} className="px-3 py-5 text-center border-r border-border last:border-r-0">
                    <p
                      className="font-display leading-none mb-2"
                      style={{
                        fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                        background: "var(--gradient-gold)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {s.num}
                    </p>
                    <p className="text-[0.48rem] uppercase tracking-[0.13em] text-muted-foreground leading-tight whitespace-pre-line">{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Stone specification rows */}
              <div className="border border-border overflow-hidden mb-9">
                {[
                  { label: "Stone type",    value: "Lab-created silicon carbide" },
                  { label: "Clarity",       value: "VVS1 — virtually flawless, on every piece" },
                  { label: "Color",         value: "D Colorless — top of the GIA scale" },
                  { label: "Hardness",      value: "9.25 Mohs — second only to diamond" },
                  { label: "Brilliance",    value: "RI 2.65–2.69 — exceeds diamond's 2.42" },
                  { label: "Certification", value: "GRA certificate shipped with every order" },
                ].map(({ label, value }, i) => (
                  <div
                    key={label}
                    className={`flex gap-4 px-5 py-3 border-b border-border/60 last:border-0 ${
                      i % 2 === 1 ? "bg-[oklch(0.97_0.004_80)]" : "bg-background/50"
                    }`}
                  >
                    <span className="text-[0.54rem] uppercase tracking-[0.12em] text-muted-foreground w-24 shrink-0 mt-0.5">{label}</span>
                    <span className="text-[0.72rem] font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/moissanite-guide"
                className="group/cta relative inline-flex items-center gap-2.5 overflow-hidden rounded-full px-7 py-3 text-[0.58rem] uppercase tracking-[0.26em] font-semibold transition-colors duration-500"
                style={{ border: "1.5px solid oklch(0.60 0.092 68 / 0.55)", color: "oklch(0.45 0.085 60)" }}
              >
                <span
                  className="absolute inset-0 z-0 translate-x-[-101%] group-hover/cta:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ background: "var(--gradient-gold)" }}
                />
                <span className="relative z-10 group-hover/cta:text-white transition-colors duration-500">See the full comparison</span>
                <ArrowRight className="relative z-10 h-3 w-3 transition-all duration-500 group-hover/cta:translate-x-1 group-hover/cta:text-white" />
              </Link>
            </div>

            {/* Right: full moissanite vs diamond table */}
            <div className="reveal" style={{ transitionDelay: "0.12s" }}>
              <div className="border border-border overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[1.1fr_1fr_1fr] bg-foreground">
                  <div className="px-4 py-3.5">
                    <p className="text-[0.48rem] uppercase tracking-[0.16em] text-background/35">Property</p>
                  </div>
                  <div className="px-4 py-3.5 border-l border-background/10">
                    <p
                      className="text-[0.48rem] uppercase tracking-[0.16em] font-semibold"
                      style={{
                        background: "var(--gradient-gold)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      Our Moissanite
                    </p>
                  </div>
                  <div className="px-4 py-3.5 border-l border-background/10">
                    <p className="text-[0.48rem] uppercase tracking-[0.16em] text-background/30">Mined Diamond</p>
                  </div>
                </div>

                {/* Comparison rows */}
                {[
                  { attr: "Origin",             mois: "Lab-grown, zero mining",   dia: "Earth-blasted" },
                  { attr: "Land disturbed",      mois: "Zero acres",               dia: "250 tons per carat" },
                  { attr: "Conflict risk",       mois: "None — fully traceable",   dia: "Varies by source" },
                  { attr: "Carbon output",       mois: "Low (controlled lab)",     dia: "High (mining + transit)" },
                  { attr: "Brilliance (RI)",     mois: "2.65–2.69 ✦",             dia: "2.42" },
                  { attr: "Fire (dispersion)",   mois: "0.104 ✦",                  dia: "0.044" },
                  { attr: "Hardness",            mois: "9.25 Mohs",                dia: "10 Mohs" },
                  { attr: "Clarity",             mois: "VVS1 — always",            dia: "VVS1 costs $15k+" },
                  { attr: "Color",               mois: "D Colorless — always",     dia: "D: extremely rare" },
                  { attr: "Price (1ct equiv.)",  mois: "From ~$300",               dia: "$6,000–$15,000" },
                  { attr: "Certification",       mois: "GRA cert included",        dia: "GIA (extra cost)" },
                ].map(({ attr, mois, dia }, i) => (
                  <div
                    key={attr}
                    className={`grid grid-cols-[1.1fr_1fr_1fr] border-b border-border/60 last:border-0 ${
                      i % 2 === 0 ? "bg-background/70" : "bg-[oklch(0.985_0.003_80)]"
                    }`}
                  >
                    <div className="px-4 py-2.5">
                      <span className="text-[0.58rem] text-muted-foreground">{attr}</span>
                    </div>
                    <div className="px-4 py-2.5 border-l border-border/40">
                      <span className="text-[0.60rem] font-semibold text-emerald-700 flex items-center gap-1">
                        <Check className="h-2.5 w-2.5 shrink-0" />{mois}
                      </span>
                    </div>
                    <div className="px-4 py-2.5 border-l border-border/40">
                      <span className="text-[0.60rem] text-muted-foreground/65 flex items-center gap-1">
                        <X className="h-2.5 w-2.5 shrink-0 text-red-400/50" />{dia}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[0.56rem] text-muted-foreground/55 text-center italic">
                All Qureshi stones graded VVS1 D Color — no upgrades, no guesswork.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CUSTOMER REVIEWS — social proof
      ════════════════════════════════════════════════════════ */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1360px] px-5 lg:px-10 py-16 lg:py-22">
          <div className="text-center mb-11 reveal">
            <Eyebrow>What Our Customers Say</Eyebrow>
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

          <div className="text-center mt-8 reveal" style={{ transitionDelay: "0.2s" }}>
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
        <div className="mx-auto max-w-[1360px] px-5 lg:px-10 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
            {[
              { icon: ShieldCheck, label: "GRA Certified",      sub: "Every stone, every piece" },
              { icon: Gem,         label: "VVS · D Color",      sub: "Highest clarity & colorless" },
              { icon: Award,       label: "RI 2.65",            sub: "Highest of any gemstone" },
              { icon: Truck,       label: "Free Shipping $250+", sub: "Continental US" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="group flex flex-col items-center text-center px-6 py-7 gap-3">
                <div className="qj-icon-ring w-10 h-10 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                  <Icon className="h-4 w-4 text-amber-600" />
                </div>
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