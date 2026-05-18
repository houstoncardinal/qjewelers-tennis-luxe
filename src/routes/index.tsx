import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ShieldCheck, Sparkles, Award, Truck, ArrowRight,
  Diamond, Gem, Star, ChevronRight, BadgeCheck,
  Medal, Users, ScrollText, Search, CheckCircle2,
  Quote, Shield, StarIcon,
} from "lucide-react";
import { listProducts } from "@/lib/products.functions";
import { images, getProductThumb } from "@/lib/product-images";
import { formatUSD, COLOR_MAP, COLOR_SHORT, MOISSANITE_QUALITY, MOISSANITE_VS_DIAMOND } from "@/lib/pricing";
import { EmailCapture } from "@/components/marketing/email-capture";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Qureshi Jewelers — America's #1 Source for S925 VVS Moissanite Tennis Chains" },
      { name: "description", content: "Shop America's finest iced out S925 sterling silver VVS moissanite tennis chains and bracelets. GRA certified, hand-set in solid 925 silver with 5x e-coating. Free US shipping over $250. Expertly crafted, independently verified." },
      { property: "og:title", content: "Qureshi Jewelers — America's #1 Source for VVS Moissanite Tennis Chains" },
      { property: "og:description", content: "Iced out S925 VVS moissanite tennis chains. GRA certified. Hand-set in America. Free US shipping over $250." },
      { property: "og:image", content: "/hero.jpg" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

// ===== Reusable UI Components =====
function SectionEyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow text-gold tracking-[0.35em] ${className}`}>{children}</p>;
}

function SectionHeading({ children, className = "", ...props }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return <h2 className={`mt-4 font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] ${className}`} {...props}>{children}</h2>;
}

function GoldButton({ to, children, className = "" }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link
      to={to as any}
      className={`group relative inline-flex items-center gap-3 bg-gold text-ink px-8 py-4 text-xs uppercase tracking-[0.25em] font-semibold overflow-hidden transition-all duration-300 hover:bg-gold/90 hover:shadow-[0_4px_20px_rgba(212,175,55,0.3)] ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <ArrowRight className="relative z-10 h-4 w-4 transition-all group-hover:translate-x-1" />
    </Link>
  );
}

function InkButton({ to, children, className = "" }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link
      to={to as any}
      className={`group inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 text-xs uppercase tracking-[0.22em] hover:bg-foreground/90 transition-all card-lift ${className}`}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function TextLink({ to, children, className = "" }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link
      to={to as any}
      className={`inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] border-b border-foreground pb-1 hover:text-muted-foreground transition-all ${className}`}
    >
      {children} <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

// ===== Main Page =====
function Index() {
  const fetchProducts = useServerFn(listProducts);
  const { data } = useQuery({ queryKey: ["products"], queryFn: () => fetchProducts() });
  const products = (data?.products ?? []).filter((p: any) => !p.size);
  const featured = products.slice(0, 4);

  // Intersection Observer for reveal animations
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const observers = useRef<IntersectionObserver[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
    observers.current.push(observer);
    return () => observers.current.forEach((o) => o.disconnect());
  }, []);

  function isVisible(id: string) {
    return visibleSections.has(id) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8";
  }

  return (
    <>
      {/* ===== 1. HERO — Light Theme, Split Layout ===== */}
      <section className="relative bg-background overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 min-h-[80vh] items-center py-16 lg:py-0">
            {/* Left — Content */}
            <div className="relative z-10">
              {/* Eyebrow */}
              <div className="mb-6 inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.22em] font-medium text-gold bg-gold/10 px-4 py-2 rounded-full border border-gold/20">
                <Medal className="h-3 w-3" /> America's #1 Moissanite Tennis Chain Source
              </div>

              {/* Headline */}
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.08] tracking-tight text-foreground">
                The finest{' '}
                <em className="italic text-gold">iced out</em> tennis chains,{' '}
                without the diamond price.
              </h1>

              {/* Subcopy */}
              <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-md leading-relaxed">
                Hand-set VVS moissanite in solid S925 sterling silver with 5× e-coating.
                GRA certified. Diamond-equal brilliance — <strong>95% less cost</strong>.
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  to="/shop"
                  className="group inline-flex items-center gap-3 bg-foreground text-background px-8 py-4 text-xs uppercase tracking-[0.25em] font-semibold hover:bg-foreground/90 transition-all duration-300"
                >
                  Shop the Collection
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/moissanite-guide"
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground border-b border-border hover:border-foreground pb-1 transition-all font-medium"
                >
                  Why Moissanite?
                </Link>
              </div>

              {/* Trust row */}
              <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-2 text-xs"><Shield className="h-3.5 w-3.5 text-gold" /> GRA Certified</span>
                <span className="flex items-center gap-2 text-xs"><Diamond className="h-3.5 w-3.5 text-gold" /> VVS · D Color</span>
                <span className="flex items-center gap-2 text-xs"><Truck className="h-3.5 w-3.5 text-gold" /> Free Shipping $250+</span>
                <span className="flex items-center gap-2 text-xs"><Award className="h-3.5 w-3.5 text-gold" /> S925 + 5× E-Coat</span>
              </div>
            </div>

            {/* Right — Image with floating badge */}
            <div className="relative">
              <div className="aspect-[4/5] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                <img
                  src={images.hero}
                  alt="Premium VVS moissanite tennis chain"
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              </div>
              {/* Floating price badge */}
              <div className="absolute -bottom-5 -left-5 bg-background border border-border px-6 py-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hidden lg:block">
                <p className="text-[0.55rem] uppercase tracking-[0.2em] text-muted-foreground">Starting from</p>
                <p className="font-display text-2xl text-foreground">$189</p>
                <p className="text-[0.5rem] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">2mm · S925 Silver</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 2. E-E-A-T AUTHORITY BAND ===== */}
      <section className="bg-cream border-y border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: ScrollText, label: "GRA Certified", sub: "Independently verified authenticity" },
              { icon: Gem, label: "VVS Clarity", sub: "Highest practical moissanite grade" },
              { icon: Award, label: "5× E-Coating", sub: "Premium Swiss watch finish" },
              { icon: Truck, label: "Free Shipping", sub: "On orders over $250" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-4 group p-3 rounded-sm transition-all hover:bg-background/50">
                  <div className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center shrink-0 group-hover:border-gold/50 transition-colors">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-[0.55rem] uppercase tracking-[0.15em] text-muted-foreground">{item.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== 3. FEATURED PRODUCTS ===== */}
      <section id="collection" data-reveal className={`mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-28 transition-all duration-700 ${isVisible("collection")}`}>
        <div className="text-center max-w-2xl mx-auto mb-14">
          <SectionEyebrow>The Collection</SectionEyebrow>
          <SectionHeading>Signature tennis chains.</SectionHeading>
          <p className="mt-4 text-muted-foreground text-sm max-w-lg mx-auto">
            Four precious metal finishes, five widths (2mm–6.5mm), five lengths (16"–24").
            Each built in S925 sterling silver with VVS moissanite and 5× e-coating.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {featured.map((p: any, i: number) => (
            <Link
              key={p.id}
              to="/product/$slug"
              params={{ slug: p.slug }}
              className="group bg-background border border-border overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]"
              style={{ animationDelay: `${0.1 + i * 0.1}s` }}
            >
              <div className="aspect-square overflow-hidden relative">
                <img
                  src={getProductThumb(p.slug)}
                  alt={p.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  {COLOR_MAP[p.color] && (
                    <span className="w-2.5 h-2.5 rounded-full inline-block transition-transform group-hover:scale-125" style={{ backgroundColor: COLOR_MAP[p.color].hex }} />
                  )}
                  <p className="text-[0.55rem] uppercase tracking-[0.2em] text-muted-foreground">
                    {COLOR_SHORT[p.color] ?? p.color.replace("_", " ")}
                  </p>
                </div>
                <h3 className="font-display text-lg sm:text-xl leading-tight group-hover:text-gold transition-colors">
                  {p.name.split("—")[0].trim()}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.short_description}</p>
                <p className="mt-3 font-medium text-sm">From {formatUSD(Number(p.base_price))}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <GoldButton to="/shop">Explore Full Collection</GoldButton>
        </div>
      </section>

      {/* ===== 4. WHY MOISSANITE — KEY VALUE PROPOSITION ===== */}
      <section className="bg-cream border-y border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="aspect-square overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
              <img src={images.product2} alt="VVS moissanite diamond comparison brilliance" className="h-full w-full object-cover" loading="lazy" />
            </div>
            <div>
              <SectionEyebrow>Why Moissanite?</SectionEyebrow>
              <SectionHeading>
                More brilliance. <em className="italic text-gold">95% less cost.</em>
              </SectionHeading>
              <p className="mt-4 text-muted-foreground text-sm max-w-md leading-relaxed">
                Moissanite's refractive index (2.65) exceeds diamond (2.42) — it actually
                <strong> outshines</strong> diamond. Yet it costs 95% less. Combined with
                our S925 sterling silver base and 5× e-coating, you get a piece that looks,
                feels, and performs like fine jewelry — at a fraction of the price.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  { label: "Brilliance", moissanite: "2.65 RI", diamond: "2.42 RI", win: "moissanite" },
                  { label: "Fire", moissanite: "0.104", diamond: "0.044", win: "moissanite" },
                  { label: "Hardness", moissanite: "9.25 Mohs", diamond: "10 Mohs", win: "diamond" },
                  { label: "Price", moissanite: "~$300/ct", diamond: "~$15,000/ct", win: "moissanite" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between border-b border-border/50 pb-3">
                    <span className="text-sm font-medium w-20">{row.label}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`font-medium ${row.win === "moissanite" ? "text-foreground" : "text-muted-foreground"}`}>{row.moissanite}</span>
                      <span className="text-xs text-muted-foreground/30">vs</span>
                      <span className={`${row.win === "diamond" ? "text-foreground" : "text-muted-foreground"}`}>{row.diamond}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <TextLink to="/moissanite-guide">Full Comparison Guide</TextLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 5. COLOR FINISHES ===== */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <SectionEyebrow>Four Precious Finishes</SectionEyebrow>
          <SectionHeading>Choose your metal.</SectionHeading>
          <p className="mt-4 text-muted-foreground text-sm">Each bonded with 5× e-coating for tarnish resistance and lifetime shine.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {Object.entries(COLOR_MAP).map(([key, val]) => (
            <Link
              key={key}
              to="/shop"
              search={{ color: key as any }}
              className="group border border-border p-8 text-center hover:border-gold/50 transition-all hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
            >
              <div className="w-20 h-20 rounded-full mx-auto border-2 border-border group-hover:border-gold/50 transition-all group-hover:scale-110" style={{ backgroundColor: val.hex }} />
              <p className="mt-4 font-display text-xl text-foreground">{val.label}</p>
              <p className="mt-1 text-xs text-muted-foreground uppercase tracking-[0.15em]">{val.plated}</p>
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-all">
                <span className="text-gold text-xs uppercase tracking-[0.2em] font-medium border-b border-gold/50 pb-1">Shop {COLOR_SHORT[key]}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== 6. THE CRAFT ===== */}
      <section className="bg-cream border-y border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <SectionEyebrow>The Difference</SectionEyebrow>
              <SectionHeading>
                Solid S925. 5× Plating. <em className="italic text-gold">One standard.</em>
              </SectionHeading>
              <p className="mt-6 text-muted-foreground leading-relaxed text-sm">
                Most "iced out" chains are plated brass — they tarnish, turn skin green, and
                lose their shine in months. Qureshi pieces start with{' '}
                <strong>solid 925 sterling silver</strong>, then apply five layers of precious
                metal with e-coating — the same process used by Swiss luxury watchmakers.
              </p>
              <div className="mt-10 grid grid-cols-2 gap-4">
                {[
                  ["Core", "Solid 925 Sterling Silver"],
                  ["Plating", "5× Precious Metal + E-Coat"],
                  ["Stones", "VVS Moissanite · D Color"],
                  ["Clasp", "Double-Locking Box"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-background border border-border p-5 transition-all hover:border-gold/30">
                    <dt className="text-[0.55rem] uppercase tracking-[0.15em] text-muted-foreground">{k}</dt>
                    <dd className="mt-1 font-display text-lg">{v}</dd>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <InkButton to="/about">Learn About Our Craft</InkButton>
              </div>
            </div>
            <div className="order-1 lg:order-2 aspect-[4/5] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
              <img src={images.product5} alt="S925 moissanite tennis chain craftsmanship detail showing 5x e-coating" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== 7. SIZE GUIDE ===== */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <SectionEyebrow>Find Your Fit</SectionEyebrow>
            <SectionHeading>
              From 2mm subtle <em className="italic text-gold">to 6.5mm maximum ice.</em>
            </SectionHeading>
            <p className="mt-6 text-muted-foreground leading-relaxed text-sm max-w-md">
              Five widths. Five lengths. Custom available on request.
            </p>
            <div className="mt-10 grid grid-cols-4 gap-3">
              {[
                { mm: "2mm", vibe: "Subtle" },
                { mm: "3mm", vibe: "Versatile" },
                { mm: "4mm", vibe: "Statement" },
                { mm: "5mm", vibe: "Bold" },
              ].map((s) => (
                <div key={s.mm} className="border border-border py-6 bg-background hover:border-foreground hover:bg-foreground hover:text-background transition-all card-lift text-center">
                  <p className="font-display text-2xl">{s.mm}</p>
                  <p className="eyebrow mt-1 text-[0.55rem]" style={{ color: "inherit" }}>{s.vibe}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">+ 6.5mm Ultra width available</p>
            <div className="mt-6 flex gap-6">
              <TextLink to="/size-guide">Full Size Guide</TextLink>
              <TextLink to="/shop">Shop by Size</TextLink>
            </div>
          </div>
          <div className="order-1 lg:order-2 aspect-square overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
            <img src={images.product3} alt="Tennis chain width size guide comparison 2mm to 6.5mm" className="h-full w-full object-cover" loading="lazy" />
          </div>
        </div>
      </section>

      {/* ===== 8. REVIEWS ===== */}
      <section className="bg-cream border-y border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-24">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <SectionEyebrow>Trusted by Thousands</SectionEyebrow>
            <SectionHeading>What our customers say.</SectionHeading>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { quote: "I've owned diamond chains before. This moissanite piece outshines them all — and I paid 90% less. Unreal quality.", author: "Marcus T.", location: "New York, NY" },
              { quote: "The 5mm 18K gold chain is incredible. Real weight, real shine. You can feel the quality the moment you hold it.", author: "David L.", location: "Los Angeles, CA" },
              { quote: "There is ZERO difference between this and my friend's diamond tennis chain. Except mine was $189.", author: "Jordan K.", location: "Chicago, IL" },
            ].map((review, i) => (
              <div key={review.author} className="bg-background border border-border p-8 transition-all hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <Star key={j} className="h-4 w-4 fill-foreground text-foreground" />
                  ))}
                </div>
                <Quote className="h-5 w-5 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground leading-relaxed italic">"{review.quote}"</p>
                <div className="mt-5 pt-4 border-t border-border flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center text-xs font-medium">
                    {review.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{review.author}</p>
                    <p className="text-[0.55rem] uppercase tracking-[0.15em] text-muted-foreground">Verified Buyer · {review.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 9. GRA CERTIFICATION ===== */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="aspect-square overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
            <img src={images.graphic3} alt="GRA certificate of authenticity for VVS moissanite" className="h-full w-full object-contain p-8" loading="lazy" />
          </div>
          <div>
            <SectionEyebrow>Independently Verified</SectionEyebrow>
            <SectionHeading>
              Every stone, <em className="italic text-gold">GRA certified.</em>
            </SectionHeading>
            <p className="mt-6 text-muted-foreground leading-relaxed text-sm max-w-md">
              The Gemological Research Academy independently verifies each stone's
              clarity, color, and carat weight. Your certificate ships with your piece.
            </p>
            <div className="mt-8 space-y-3 text-sm text-muted-foreground">
              {[
                "VVS Clarity — No inclusions visible under 10× magnification",
                "D Color — Completely colorless, purest possible brilliance",
                "GRA Certificate — Ships with every order, no extra cost",
              ].map((text) => (
                <p key={text} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                  {text}
                </p>
              ))}
            </div>
            <div className="mt-10">
              <GoldButton to="/shop">Shop Certified Pieces</GoldButton>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 10. FINAL CTA ===== */}
      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <SectionEyebrow className="text-gold">Ready to Experience the Difference</SectionEyebrow>
          <SectionHeading className="mt-4 text-background">
            The new standard for <em className="italic text-gold">iced out</em> is here.
          </SectionHeading>
          <p className="mt-4 text-background/60 text-sm max-w-md mx-auto">
            Browse our full collection — or start with our most popular 3mm chains.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <GoldButton to="/shop">Shop the Collection</GoldButton>
            <Link
              to="/moissanite-guide"
              className="inline-flex items-center gap-2 bg-background text-foreground px-8 py-4 text-xs uppercase tracking-[0.22em] font-semibold hover:bg-background/90 transition-all"
            >
              Learn About Moissanite <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 11. EMAIL CAPTURE ===== */}
      <EmailCapture />
    </>
  );
}