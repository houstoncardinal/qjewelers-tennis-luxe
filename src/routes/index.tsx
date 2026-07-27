import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, useMemo, useRef } from "react";
import { ArrowRight, ShieldCheck, Gem, Award, Truck, Star, Check, Sparkles, Eye, Diamond, X, Leaf, Crown, Heart, RotateCcw, TrendingUp, Sun, Shield, Zap } from "lucide-react";
import { listProducts } from "@/lib/products.functions";
import { images, getProductThumb } from "@/lib/product-images";
import { formatUSD } from "@/lib/pricing";
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
      { title: "Qureshi Jewelers — VVS Moissanite Chains, Bracelets & Rings | GRA Certified" },
      { name: "description", content: "D Colorless VVS1 moissanite tennis chains, bracelets, earrings & rings. Solid S925 sterling silver, 5× 18K gold plating, GRA certified. Starting from $89. Free US shipping over $250." },
      { property: "og:title", content: "Qureshi Jewelers — VVS Moissanite Jewelry | GRA Certified" },
      { property: "og:description", content: "D Colorless VVS1 moissanite chains, bracelets, earrings & rings. Solid S925 sterling silver, 5× 18K gold plating, GRA certified. From $89." },
      { property: "og:image", content: "https://bstyuyzlhrkskeqpypka.supabase.co/storage/v1/object/public/product-images/site-assets/herobg.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:url", content: SITE_URL },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Qureshi Jewelers" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@QureshiJewelers" },
      { name: "twitter:title", content: "Qureshi Jewelers — VVS Moissanite Jewelry | GRA Certified" },
      { name: "twitter:description", content: "D Colorless VVS1 moissanite chains, bracelets, earrings & rings. S925 sterling silver, GRA certified. From $89. Free US shipping over $250." },
      { name: "twitter:image", content: "https://bstyuyzlhrkskeqpypka.supabase.co/storage/v1/object/public/product-images/site-assets/herobg.jpg" },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
    scripts: [
      // Organization — establishes Qureshi Jewelers as a named entity in
      // Google's Knowledge Graph, powering brand panels and AI overviews.
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          name: "Qureshi Jewelers",
          url: SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: "https://bstyuyzlhrkskeqpypka.supabase.co/storage/v1/object/public/product-images/site-assets/QURESHIJEWELERSLOGO.png",
            width: 400,
            height: 400,
          },
          image: "https://bstyuyzlhrkskeqpypka.supabase.co/storage/v1/object/public/product-images/site-assets/herobg.jpg",
          description: "Qureshi Jewelers specializes in VVS1 D Colorless moissanite jewelry — GRA certified tennis chains, bracelets, stud earrings, and engagement rings, hand-set in solid S925 sterling silver with 5× 18K precious metal plating.",
          email: "support@qureshijewelers.com",
          brand: { "@type": "Brand", name: "Qureshi Jewelers" },
          foundingDate: "2022",
          knowsAbout: ["Moissanite", "Fine Jewelry", "Tennis Chains", "Tennis Bracelets", "Sterling Silver Jewelry", "GRA Certification"],
          slogan: "Every stone, every setting — built to last.",
          sameAs: [
            "https://www.instagram.com/qureshijewelers",
            "https://www.tiktok.com/@qureshijewelers",
          ],
        }),
      },
      // WebSite — enables Google Sitelinks Search Box in brand SERP results.
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          name: "Qureshi Jewelers",
          url: SITE_URL,
          publisher: { "@id": `${SITE_URL}/#organization` },
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        }),
      },
      // JewelryStore — surfaces the business in vertical/local search results
      // and powers Google's merchant experience for jewelry category searches.
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "JewelryStore",
          "@id": `${SITE_URL}/#store`,
          name: "Qureshi Jewelers",
          url: SITE_URL,
          logo: "https://bstyuyzlhrkskeqpypka.supabase.co/storage/v1/object/public/product-images/site-assets/QURESHIJEWELERSLOGO.png",
          image: "https://bstyuyzlhrkskeqpypka.supabase.co/storage/v1/object/public/product-images/site-assets/herobg.jpg",
          description: "Premium VVS moissanite jewelry: tennis chains, bracelets, earrings, and rings. GRA certified, S925 sterling silver, 5× 18K gold plating. Free US shipping on orders over $250.",
          priceRange: "$$",
          currenciesAccepted: "USD",
          paymentAccepted: "Credit Card, Debit Card, PayPal",
          email: "support@qureshijewelers.com",
          openingHours: "Mo-Su 00:00-23:59",
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "VVS Moissanite Jewelry Collection",
            itemListElement: [
              { "@type": "Offer", "itemOffered": { "@type": "Product", name: "Moissanite Tennis Chains", url: `${SITE_URL}/shop?type=necklace` } },
              { "@type": "Offer", "itemOffered": { "@type": "Product", name: "Moissanite Tennis Bracelets", url: `${SITE_URL}/shop?type=bracelet` } },
              { "@type": "Offer", "itemOffered": { "@type": "Product", name: "Moissanite Stud Earrings", url: `${SITE_URL}/shop?type=earring` } },
              { "@type": "Offer", "itemOffered": { "@type": "Product", name: "Moissanite Rings", url: `${SITE_URL}/shop?type=ring` } },
            ],
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.9",
            reviewCount: "47",
            bestRating: "5",
            worstRating: "1",
          },
        }),
      },
      // ItemList — category navigation; helps Google understand site structure.
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
            { "@type": "ListItem", position: 4, name: "Moissanite Rings", url: `${SITE_URL}/shop?type=ring` },
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
              acceptedAnswer: { "@type": "Answer", text: "Qureshi Jewelers (qureshijewelers.com) is America's premier source for VVS moissanite jewelry. We specialize in tennis chains, tennis bracelets, stud earrings, and engagement rings — all hand-set in solid S925 sterling silver with GRA certification. Free US shipping on orders over $250." },
            },
            {
              "@type": "Question",
              name: "What is the best moissanite tennis chain?",
              acceptedAnswer: { "@type": "Answer", text: "The best moissanite tennis chains are hand-set with VVS clarity, D color (colorless) moissanite in solid S925 sterling silver. Look for GRA certification, a double-locking clasp, and 5x e-coating for durability. Qureshi Jewelers offers tennis chains from 2mm to 5mm widths in 16\"–24\" lengths, starting under $150." },
            },
            {
              "@type": "Question",
              name: "Is S925 sterling silver good for moissanite jewelry?",
              acceptedAnswer: { "@type": "Answer", text: "Yes. S925 sterling silver (92.5% pure silver) is the industry standard for fine jewelry settings. Combined with 5x e-coating in gold, rose gold, or rhodium, it produces a durable, tarnish-resistant finish indistinguishable from solid gold at a fraction of the cost. All Qureshi Jewelers pieces use solid S925 — not hollow or plated base metals." },
            },
            {
              "@type": "Question",
              name: "How much does moissanite jewelry cost?",
              acceptedAnswer: { "@type": "Answer", text: "Moissanite jewelry costs 85–95% less than comparable diamond jewelry. At Qureshi Jewelers, moissanite tennis chains start at around $89, tennis bracelets from $129, stud earrings from $59, and engagement rings from $149. Free US shipping on orders over $250." },
            },
            {
              "@type": "Question",
              name: "What is the difference between moissanite and cubic zirconia?",
              acceptedAnswer: { "@type": "Answer", text: "Moissanite and cubic zirconia are completely different stones. Moissanite (silicon carbide) scores 9.25 on the Mohs hardness scale, maintains its brilliance permanently, and passes diamond testers. Cubic zirconia scores only 8.5, clouds and loses brilliance within months, and is far less optically impressive. Moissanite is a genuine, durable gemstone; cubic zirconia is a low-cost glass simulant." },
            },
            {
              "@type": "Question",
              name: "Does Qureshi Jewelers offer GRA certified moissanite?",
              acceptedAnswer: { "@type": "Answer", text: "Yes. Every piece from Qureshi Jewelers ships with a GRA (Gemological Research Association) certificate of authenticity that independently verifies your stone's VVS clarity grade, D color grade, and carat weight. This certificate is your proof of quality and can be used for insurance purposes." },
            },
            {
              "@type": "Question",
              name: "Does moissanite pass a diamond tester?",
              acceptedAnswer: { "@type": "Answer", text: "Yes — moissanite passes standard diamond testers that measure thermal conductivity because its thermal properties are similar to diamond. To differentiate, a dual diamond/moissanite tester is required. This is further proof that moissanite is a genuine, high-quality gemstone, not a glass simulant like CZ." },
            },
            {
              "@type": "Question",
              name: "What is the return policy at Qureshi Jewelers?",
              acceptedAnswer: { "@type": "Answer", text: "All sales are final at Qureshi Jewelers. If an item arrives damaged or defective, customers must contact us with photos within 48 hours of delivery for a replacement or store credit. Size/length exchanges are available within 7 days on unworn items. Every piece includes a 1-year limited warranty covering manufacturing defects, with a $50–$100 repair deductible." },
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

const GOLD     = "oklch(0.55 0.14 145)";
const GOLD_MID = "oklch(0.45 0.12 145 / 0.75)";

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
                <span className={`text-[0.38rem] ${dark ? "text-white/10" : "text-green-600/35"}`}>◆</span>
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Product Card (white, shadow hover) ──────────────────────────────────────

const CARD_BADGES: Record<string, { label: string; dark?: boolean }> = {
  necklace: { label: "Best Seller" },
  bracelet: { label: "GRA Certified" },
  earring:  { label: "Customer Fav" },
  ring:     { label: "New Arrival" },
};

function ProductCard({ p }: { p: any }) {
  const price = formatUSD(Number(p.display_price ?? p.sale_price ?? p.base_price));

  const badge = CARD_BADGES[p.type];

  return (
    <Link
      to="/product/$slug"
      params={{ slug: p.slug }}
      className="group flex flex-col bg-white active:scale-[0.99] transition-transform duration-150"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      {/* ── Image ── */}
      <div className="aspect-[3/4] overflow-hidden relative bg-[oklch(0.97_0.004_75)] shrink-0">
        <img
          src={getProductThumb(p.slug, p.image_url)}
          alt={p.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
        />

        {/* Green top edge reveal */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
          style={{ background: "var(--gradient-gold-h)" }}
        />

        {/* Badge */}
        {badge && (
          <div className="absolute top-3 left-3 z-10">
            <span className="text-[0.42rem] uppercase tracking-[0.18em] bg-foreground text-background px-2 py-1 font-semibold leading-none">
              {badge.label}
            </span>
          </div>
        )}

        {/* Wishlist — desktop hover */}
        <button
          onClick={e => e.preventDefault()}
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex shadow-sm hover:bg-white"
          aria-label="Save to wishlist"
        >
          <Heart className="h-3 w-3 text-gray-500" />
        </button>

        {/* Desktop hover CTA */}
        <div className="absolute inset-x-0 bottom-0 pb-4 pt-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-end justify-center">
          <span className="text-white text-[0.50rem] uppercase tracking-[0.28em] border border-white/60 px-5 py-2 hover:bg-white/10 transition-colors">
            Select Options
          </span>
        </div>
      </div>

      {/* ── Info ── */}
      <div className="flex flex-col gap-1.5 px-3.5 sm:px-4 pt-3.5 sm:pt-4 pb-3.5 sm:pb-4 border border-t-0 border-border flex-1">
        {/* Stars */}
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
          ))}
          <span className="text-[0.47rem] text-gray-400 ml-1.5 leading-none">4.9</span>
        </div>

        {/* Name */}
        <h3 className="font-display text-[1rem] sm:text-[1.15rem] leading-[1.25] group-hover:text-green-600 transition-colors duration-300 line-clamp-2">
          {p.name}
        </h3>

        {/* Material chips */}
        <div className="flex items-center gap-1.5">
          <span className="text-[0.40rem] uppercase tracking-[0.10em] text-gray-400 font-mono border border-gray-200 px-1.5 py-0.5 leading-none">S925</span>
          <span className="text-[0.40rem] uppercase tracking-[0.10em] text-gray-400 font-mono border border-gray-200 px-1.5 py-0.5 leading-none">VVS D</span>
          <div className="flex items-center gap-0.5 ml-0.5">
            <span className="w-2 h-2 rounded-full ring-1 ring-black/10" style={{ backgroundColor: "#D4AF37" }} title="18K Yellow Gold" />
            <span className="w-2 h-2 rounded-full ring-1 ring-black/10 -ml-0.5" style={{ backgroundColor: "#E8E8F4" }} title="18K White Gold" />
          </div>
        </div>

        {/* Price */}
        <p className="text-[0.70rem] text-muted-foreground mt-auto pt-0.5">
          From{" "}
          <span className="text-foreground font-bold text-[0.90rem]">{price}</span>
        </p>

        {/* Mobile CTA — always visible, desktop hidden */}
        <div className="md:hidden mt-1">
          <div className="w-full text-center py-2.5 bg-foreground text-background text-[0.48rem] uppercase tracking-[0.22em] font-semibold group-hover:opacity-90 transition-opacity">
            View Item →
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col bg-white border border-border shrink-0">
      <div className="aspect-[3/4] bg-[oklch(0.96_0.004_75)] animate-pulse" />
      <div className="px-3.5 pt-3.5 pb-4 space-y-2.5 border-t-0">
        <div className="h-2 w-12 bg-[oklch(0.94_0.004_75)] rounded animate-pulse" />
        <div className="h-4 w-4/5 bg-[oklch(0.94_0.004_75)] rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-[oklch(0.94_0.004_75)] rounded animate-pulse" />
        <div className="h-3 w-16 bg-[oklch(0.94_0.004_75)] rounded animate-pulse" />
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
  tagline: string;
  shopType: string;
  className?: string;
}

function CategoryTile({ image, label, tagline, shopType, className = "" }: CategoryTileProps) {
  const isStacked = className.includes("grid-rows");
  return (
    <Link
      to="/shop"
      search={{ type: shopType as any }}
      className={`group relative block overflow-hidden bg-neutral-900 ${className}`}
    >
      <img
        src={image}
        alt={label}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
      {/* Ultra-light gradient - lets product images shine through */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.08) 100%)" }}
      />
      {/* Subtle dark overlay at bottom for text readability */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.35), transparent)" }} />
      {/* Premium typography with elegant shadows */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-7 md:px-8 md:pb-9">
        <div className={isStacked ? "space-y-2" : "space-y-3"}>
          <p 
            className="font-display text-white leading-tight" 
            style={{ 
              fontSize: isStacked ? "clamp(1.2rem, 1.8vw, 1.55rem)" : "clamp(1.55rem, 2.5vw, 2.2rem)",
              textShadow: "0 2px 8px rgba(0,0,0,0.5), 0 0 30px rgba(0,0,0,0.3)",
              letterSpacing: "-0.01em"
            }}
          >
            {label}
          </p>
          <div className="flex items-center gap-2.5 mt-3">
            <span 
              className="text-[0.52rem] uppercase tracking-[0.22em] font-medium relative inline-block"
              style={{ 
                color: "rgba(255,255,255,0.98)",
                textShadow: "0 1px 4px rgba(0,0,0,0.5)"
              }}
            >
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white/60 transition-all duration-300 group-hover:bg-white group-hover:h-[2px]" />
              Shop Collection
            </span>
            <ArrowRight 
              className="h-3 w-3 text-white/95 transition-transform duration-300 group-hover:translate-x-1" 
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }} 
            />
          </div>
        </div>
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
        style={{ color: "oklch(0.45 0.12 145 / 0.10)" }}
      >
        "
      </span>
      <div className="flex items-center gap-1 mb-3 relative z-10">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
        ))}
      </div>
      <p className="text-[0.82rem] text-foreground leading-[1.75] mb-5 relative z-10">{text}</p>
      <div className="flex items-center gap-2.5 relative z-10">
        <div
          className="qj-icon-ring w-9 h-9 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-[0.68rem] font-semibold text-green-800 shrink-0"
          style={{ boxShadow: "0 0 0 1px oklch(0.45 0.12 145 / 0.15)" }}
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
      <Icon className="qj-stat-icon h-4 w-4 mx-auto mb-3 text-green-600/70" />
      <p className="font-display text-[1.9rem] leading-none mb-1.5 gold-text tabular-nums">
        {value}{suffix}
      </p>
      <p className="text-[0.46rem] uppercase tracking-[0.20em] text-muted-foreground">{label}</p>
    </div>
  );
}

// ─── Hero trust row (uses CMS content) ───────────────────────────────────────

function HeroTrustRow({ dark = false }: { dark?: boolean }) {
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
          {i > 0 && <span className={`hidden sm:block h-3 w-px ${dark ? "bg-white/15" : "bg-black/15"}`} />}
          <span className="flex items-center gap-1.5">
            <Icon className={`h-3 w-3 ${dark ? "text-white/40" : "text-black/45"}`} />
            <EditableText
              contentKey={key}
              label={`Hero — Trust: ${fallback}`}
              defaultValue={fallback}
              tag="span"
              className={`text-[0.44rem] uppercase tracking-[0.16em] font-medium ${dark ? "text-white/55" : "text-black/65"}`}
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
  const [isDockPaused, setIsDockPaused] = useState(false);
  const [metalPrices, setMetalPrices] = useState<{ gold: number; silver: number; platinum: number } | null>(null);
  
  // Fetch real-time precious metals prices
  useEffect(() => {
    const fetchMetalPrices = async () => {
      try {
        // Using a free metals API - in production, you'd want to use a paid API with better reliability
        const response = await fetch('https://api.metals.live/v1/spot/all');
        const data = await response.json();
        
        if (data && data.length > 0) {
          const gold = data.find((m: any) => m.symbol === 'XAU')?.price || 0;
          const silver = data.find((m: any) => m.symbol === 'XAG')?.price || 0;
          const platinum = data.find((m: any) => m.symbol === 'XPT')?.price || 0;
          
          setMetalPrices({ gold, silver, platinum });
        }
      } catch (error) {
        console.error('Failed to fetch metal prices:', error);
        // Fallback to static prices if API fails
        setMetalPrices({ gold: 2340, silver: 28.5, platinum: 1020 });
      }
    };

    fetchMetalPrices();
    
    // Update every 60 seconds
    const interval = setInterval(fetchMetalPrices, 60000);
    
    return () => clearInterval(interval);
  }, []);
  const heroProducts = useMemo(() => {
    const pool = heroType === "all" ? sig : sig.filter((p: any) => p.type === heroType);
    const colorOrder: Record<string, number> = { gold: 0, rose_gold: 1, silver: 2, white_gold: 3 };
    return [...pool]
      .sort((a: any, b: any) => (colorOrder[a.color] ?? 9) - (colorOrder[b.color] ?? 9))
      .slice(0, 12);
  }, [sig, heroType]);

  // Belt speed: ~55px/s constant; more products = longer loop = longer duration
  const beltDuration = Math.max(20, heroProducts.length * 2.4);

  // Select 6 random items with variety across categories
  const getRandomItems = (count: number) => {
    const categories = ["necklace", "bracelet", "earring", "ring"];
    const selected: any[] = [];
    
    // Ensure at least one from each category
    for (const cat of categories) {
      const catItems = sig.filter((p: any) => p.type === cat);
      if (catItems.length > 0) {
        const randomIndex = Math.floor(Math.random() * catItems.length);
        selected.push(catItems[randomIndex]);
      }
    }
    
    // Fill remaining slots with random items from any category
    const remainingCount = count - selected.length;
    const remainingItems = sig.filter((p: any) => !selected.includes(p));
    for (let i = 0; i < remainingCount && remainingItems.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * remainingItems.length);
      selected.push(remainingItems[randomIndex]);
      remainingItems.splice(randomIndex, 1);
    }
    
    // Shuffle the final selection
    return selected.sort(() => Math.random() - 0.5);
  };

  const featuredProducts = getRandomItems(6);

  return (
    <>
      {/* ════════════════════════════════════════════════════════
          HERO — premium editorial hero + product dock
      ════════════════════════════════════════════════════════ */}
      <section
        className="flex flex-col overflow-hidden h-[calc(100svh-3rem)] md:h-[calc(100svh-4rem)] lg:h-[calc(100svh-5rem)]"
        style={{ minHeight: "800px", maxHeight: "1400px" }}
      >

        {/* ── Full-bleed image zone ───────────────────────────── */}
        <div className="relative flex-1 min-h-0 overflow-hidden bg-neutral-950">

          {/* Background video — poster shows instantly while the video loads/decodes */}
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={images.hero}
            aria-label="VVS moissanite tennis jewelry — Qureshi Jewelers"
            className="absolute inset-0 h-full w-full object-cover object-center scale-105"
          >
            <source src={images.heroVideo} type="video/mp4" />
          </video>

          {/* ── Premium overlay system ─────────────────────────────
               Mobile : elegant dark scrim with subtle gradient
               Desktop: sophisticated directional overlay
          ────────────────────────────────────────────────────── */}
          <div className="absolute inset-0 sm:hidden" style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.65) 50%, rgba(0,0,0,0.70) 100%)" }} />
          <div
            className="absolute inset-0 hidden sm:block"
            style={{ background: "linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.82) 30%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.25) 75%, rgba(0,0,0,0.08) 100%)" }}
          />
          {/* Premium vignette */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 20%, transparent 75%, rgba(0,0,0,0.38) 100%)" }}
          />
          {/* Subtle noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')" }} />

          {/* ── Premium editorial content ─────────────────────── */}
          <div className="absolute inset-0 flex items-center">
            <div className="w-full px-5 sm:px-8 lg:px-16 xl:px-20 pt-60 sm:pt-64 lg:pt-68 pb-32 sm:pb-36 lg:pb-40">
              <div className="w-[95vw] sm:w-auto sm:max-w-[680px] lg:max-w-[950px]">

                {/* Headline */}
                <h1 className="font-display leading-[0.92] mb-6 sm:mb-7" style={{ letterSpacing: "-0.02em" }}>
                  <span className="block text-white animate-fade-up" style={{ fontSize: "clamp(2.4rem, 6vw, 5.2rem)", animationDelay: "0.12s", textShadow: "0 4px 32px rgba(0,0,0,0.65)" }}>
                    VVS1 Moissanite<br />
                    Hand-Set in 18K Gold
                  </span>
                </h1>

                {/* Subheadline */}
                <p
                  className="text-white/90 text-[0.95rem] sm:text-[1rem] leading-[1.85] mb-8 sm:mb-10 animate-fade-up"
                  style={{ animationDelay: "0.34s", maxWidth: "58ch", textShadow: "0 2px 16px rgba(0,0,0,0.50)" }}
                >
                  Expertly crafted VVS1 moissanite set in precious 18K gold. Curated for those who demand quality that lasts — backed by GRA certification and a lifetime shine guarantee.
                </p>

                {/* Premium CTAs */}
                <div className="flex flex-row flex-wrap gap-3 sm:gap-4 mb-2 sm:mb-3 animate-fade-up" style={{ animationDelay: "0.44s" }}>
                  <Link
                    to="/shop"
                    className="group relative overflow-hidden inline-flex items-center justify-center gap-3 bg-white text-black px-7 sm:px-12 py-[13px] sm:py-[16px] text-[0.55rem] sm:text-[0.58rem] uppercase tracking-[0.24em] font-bold transition-all duration-300 hover:bg-gray-50 hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-0.5"
                    style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.15)" }}
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      Shop Best Sellers
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                    <div className="absolute inset-0 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-700 bg-gradient-to-r from-transparent via-black/8 to-transparent" />
                  </Link>
                  <Link
                    to="/moissanite-guide"
                    className="group inline-flex items-center justify-center gap-3 text-white/90 px-7 sm:px-12 py-[13px] sm:py-[16px] text-[0.55rem] sm:text-[0.58rem] uppercase tracking-[0.24em] font-semibold transition-all duration-300 hover:text-white hover:bg-white/12 hover:-translate-y-0.5"
                    style={{ border: "1.5px solid rgba(255,255,255,0.30)", backdropFilter: "blur(8px)" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.55)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.30)")}
                  >
                    Our Story
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>

                {/* Premium trust row */}
                <div className="flex flex-row items-center gap-x-4 sm:gap-x-6 gap-y-0 mb-20 animate-fade-in" style={{ animationDelay: "0.56s" }}>
                  {[
                    { icon: ShieldCheck, text: "GRA Certified"   },
                    { icon: Gem,         text: "VVS1 · D Color"  },
                    { icon: Truck,       text: "Free US Shipping" },
                  ].map(({ icon: TrustIcon, text }, i) => (
                    <span key={i} className="flex items-center gap-2.5">
                      {i > 0 && <span className="hidden sm:block w-px h-4 mr-1" style={{ background: "rgba(255,255,255,0.30)" }} />}
                      <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                        <TrustIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-[0.54rem] sm:text-[0.58rem] uppercase tracking-[0.16em] font-semibold text-white/95 whitespace-nowrap">
                        {text}
                      </span>
                    </span>
                  ))}
                </div>

                {/* Real-time precious metals ticker */}
                {metalPrices && (
                  <div className="mt-6 animate-fade-in" style={{ animationDelay: "0.68s" }}>
                    <div className="inline-flex items-center gap-4 px-5 py-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-[0.46rem] uppercase tracking-[0.18em] text-white/70">Gold</span>
                        <span className="text-[0.58rem] font-semibold text-white">${metalPrices.gold.toFixed(2)}/oz</span>
                      </div>
                      <span className="w-px h-3 bg-white/20" />
                      <div className="flex items-center gap-2">
                        <span className="text-[0.46rem] uppercase tracking-[0.18em] text-white/70">Silver</span>
                        <span className="text-[0.58rem] font-semibold text-white">${metalPrices.silver.toFixed(2)}/oz</span>
                      </div>
                      <span className="w-px h-3 bg-white/20" />
                      <div className="flex items-center gap-2">
                        <span className="text-[0.46rem] uppercase tracking-[0.18em] text-white/70">Platinum</span>
                        <span className="text-[0.58rem] font-semibold text-white">${metalPrices.platinum.toFixed(2)}/oz</span>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse ml-1" />
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

        {/* ── Premium product browser dock ─────────────────── */}
        <div
          className="flex-shrink-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-2xl shadow-black/5"
          onMouseEnter={() => setIsDockPaused(true)}
          onMouseLeave={() => setIsDockPaused(false)}
        >

          {/* Enhanced tab bar */}
          <div
            className="relative border-b border-gray-200/80 flex overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <div className="flex items-stretch px-6 lg:px-12 min-w-max">
              <span className="hidden sm:flex items-center text-[0.40rem] uppercase tracking-[0.32em] text-gray-400 pr-6 shrink-0 font-medium">
                Browse
              </span>
              {HERO_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setHeroType(t.key)}
                  className={`px-5 lg:px-6 py-3 text-[0.52rem] uppercase tracking-[0.16em] shrink-0 relative transition-all duration-300 whitespace-nowrap ${
                    heroType === t.key 
                      ? "text-gray-900 font-semibold" 
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {t.label}
                  {heroType === t.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 rounded-full" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex-1 min-w-2" />
            <Link
              to="/shop"
              search={heroType !== "all" ? { type: heroType as any } : {}}
              className="px-6 lg:px-12 flex items-center text-[0.52rem] uppercase tracking-[0.22em] text-gray-600 hover:text-gray-900 transition-all duration-300 whitespace-nowrap font-medium hover:bg-gray-50"
            >
              View All →
            </Link>
          </div>

          {/* Product infinite belt */}
          <div
            className="overflow-hidden py-5"
            style={{
              maskImage: "linear-gradient(to right, transparent, black 4%, black 96%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black 4%, black 96%, transparent)",
            }}
          >
            <div
              key={heroType}
              style={{
                display: "inline-flex",
                gap: "12px",
                animation: `marquee ${beltDuration}s linear infinite`,
                animationPlayState: isDockPaused ? "paused" : "running",
                willChange: "transform",
              }}
            >
              {[0, 1].flatMap(copyIdx =>
                isLoading
                  ? [...Array(10)].map((_, i) => (
                      <div key={`skel-${copyIdx}-${i}`} className="shrink-0 w-[130px] sm:w-[150px] animate-pulse">
                        <div className="w-[130px] sm:w-[150px] h-[152px] sm:h-[168px] bg-[oklch(0.96_0.004_78)] mb-2" />
                        <div className="h-1.5 bg-[oklch(0.95_0.004_78)] w-4/5 mb-1.5" />
                        <div className="h-1.5 bg-[oklch(0.95_0.004_78)] w-1/2" />
                      </div>
                    ))
                  : heroProducts.map((p: any) => (
                      <Link
                        key={`${copyIdx}-${p.id}`}
                        to="/product/$slug"
                        params={{ slug: p.slug }}
                        className="shrink-0 group w-[130px] sm:w-[150px]"
                        tabIndex={copyIdx === 1 ? -1 : undefined}
                        aria-hidden={copyIdx === 1 ? true : undefined}
                      >
                        <div className="w-[130px] sm:w-[150px] h-[152px] sm:h-[168px] overflow-hidden bg-[oklch(0.97_0.004_75)] mb-2 relative">
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
                          <div className="absolute inset-x-0 bottom-0 py-2.5 bg-gradient-to-t from-black/65 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden lg:flex items-center justify-center">
                            <span className="text-white text-[0.44rem] uppercase tracking-[0.22em] font-semibold">Select Options</span>
                          </div>
                        </div>
                        <p className="text-[0.50rem] font-medium text-foreground truncate mb-0.5 leading-tight">{p.name}</p>
                        <p className="text-[0.46rem] text-muted-foreground">
                          From {formatUSD(Number(p.display_price ?? p.sale_price ?? p.base_price))}
                        </p>
                      </Link>
                    ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Ticker ── */}
      <Ticker />

      {/* ════════════════════════════════════════════════════════
          FEATURED ENGAGEMENT RINGS
      ════════════════════════════════════════════════════════ */}
      <section className="border-b border-border bg-[oklch(0.985_0.003_75)]">
        <div className="w-full px-5 sm:px-8 lg:px-16 pt-14 lg:pt-20 pb-12 lg:pb-18">

          {/* ── Header ── */}
          <div className="flex items-end justify-between mb-8 max-w-[1600px] mx-auto reveal">
            <div>
              <Eyebrow center={false}>Forever Starts Here</Eyebrow>
              <h2 className="font-display" style={{ fontSize: "clamp(2rem, 3.5vw, 3.5rem)" }}>
                Engagement Rings
              </h2>
            </div>
            <Link
              to="/shop"
              search={{ type: "ring" as any }}
              className="hidden sm:flex items-center gap-1.5 text-[0.55rem] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition-colors pb-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* ── Mobile: snap-scroll row ── */}
          <div
            className="flex md:hidden gap-3 overflow-x-auto pb-5 -mx-5 px-5 snap-x snap-mandatory reveal"
            style={{ scrollbarWidth: "none", transitionDelay: "0.10s" }}
          >
            {isLoading
              ? [...Array(6)].map((_, i) => (
                  <div key={i} className="w-[70vw] shrink-0 snap-start"><SkeletonCard /></div>
                ))
              : (() => {
                  const rings = sig.filter((p: any) => p.type === "ring");
                  const ovalGold = rings.find((p: any) => p.slug.includes("oval") && p.color === "gold");
                  const roseGold1ct = rings.find((p: any) => p.slug.includes("1ct") && p.color === "rose_gold");
                  const otherRings = rings.filter((p: any) => !p.name.toLowerCase().includes("mens")).reverse();
                  const displayRings = [ovalGold, roseGold1ct, ...otherRings].filter(Boolean);
                  return displayRings.slice(0, 6).map((p: any) => (
                    <div key={p.id} className="w-[70vw] shrink-0 snap-start">
                      <ProductCard p={p} />
                    </div>
                  ));
                })()
            }
          </div>

          {/* ── Desktop: 6-column grid ── */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-6 gap-4 lg:gap-6 max-w-[1600px] mx-auto reveal" style={{ transitionDelay: "0.10s" }}>
            {isLoading
              ? [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
              : (() => {
                  const rings = sig.filter((p: any) => p.type === "ring");
                  const ovalGold = rings.find((p: any) => p.slug.includes("oval") && p.color === "gold");
                  const roseGold1ct = rings.find((p: any) => p.slug.includes("1ct") && p.color === "rose_gold");
                  const otherRings = rings.filter((p: any) => !p.name.toLowerCase().includes("mens")).reverse();
                  const displayRings = [ovalGold, roseGold1ct, ...otherRings].filter(Boolean);
                  return displayRings.slice(0, 6).map((p: any) => <ProductCard key={p.id} p={p} />);
                })()
            }
          </div>

          {/* ── Bottom CTA ── */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 reveal" style={{ transitionDelay: "0.15s" }}>
            <Link
              to="/shop"
              search={{ type: "ring" as any }}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-foreground text-background text-[0.52rem] uppercase tracking-[0.26em] font-semibold hover:opacity-90 transition-opacity w-full sm:w-auto justify-center"
            >
              Shop Engagement Rings <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/moissanite-guide"
              className="inline-flex items-center gap-2 px-8 py-3.5 border border-border text-[0.52rem] uppercase tracking-[0.26em] text-muted-foreground hover:text-foreground hover:border-foreground transition-colors w-full sm:w-auto justify-center"
            >
              The Moissanite Guide
            </Link>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FEATURED NECKLACES & CHAINS
      ════════════════════════════════════════════════════════ */}
      <section className="border-b border-border bg-background">
        <div className="w-full px-5 sm:px-8 lg:px-16 pt-14 lg:pt-20 pb-12 lg:pb-18">

          {/* ── Header ── */}
          <div className="flex items-end justify-between mb-8 max-w-[1600px] mx-auto reveal">
            <div>
              <Eyebrow center={false}>Signature Collection</Eyebrow>
              <h2 className="font-display" style={{ fontSize: "clamp(2rem, 3.5vw, 3.5rem)" }}>
                Necklaces & Chains
              </h2>
            </div>
            <Link
              to="/shop"
              search={{ type: "necklace" as any }}
              className="hidden sm:flex items-center gap-1.5 text-[0.55rem] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition-colors pb-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* ── Mobile: snap-scroll row ── */}
          <div
            className="flex md:hidden gap-3 overflow-x-auto pb-5 -mx-5 px-5 snap-x snap-mandatory reveal"
            style={{ scrollbarWidth: "none", transitionDelay: "0.10s" }}
          >
            {isLoading
              ? [...Array(4)].map((_, i) => (
                  <div key={i} className="w-[70vw] shrink-0 snap-start"><SkeletonCard /></div>
                ))
              : sig.filter((p: any) => p.type === "necklace").reverse().slice(0, 4).map((p: any) => (
                  <div key={p.id} className="w-[70vw] shrink-0 snap-start">
                    <ProductCard p={p} />
                  </div>
                ))
            }
          </div>

          {/* ── Desktop: 5-column grid ── */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 max-w-[1600px] mx-auto reveal" style={{ transitionDelay: "0.10s" }}>
            {isLoading
              ? [...Array(5)].map((_, i) => <SkeletonCard key={i} />)
              : sig.filter((p: any) => p.type === "necklace").reverse().slice(0, 5).map((p: any) => <ProductCard key={p.id} p={p} />)
            }
          </div>

          {/* ── Bottom CTA ── */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-[1600px] mx-auto reveal" style={{ transitionDelay: "0.15s" }}>
            <Link
              to="/shop"
              search={{ type: "necklace" as any }}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-foreground text-background text-[0.52rem] uppercase tracking-[0.26em] font-semibold hover:opacity-90 transition-opacity w-full sm:w-auto justify-center"
            >
              Shop Chains <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/shop"
              search={{ type: "bracelet" as any }}
              className="inline-flex items-center gap-2 px-8 py-3.5 border border-border text-[0.52rem] uppercase tracking-[0.26em] text-muted-foreground hover:text-foreground hover:border-foreground transition-colors w-full sm:w-auto justify-center"
            >
              Shop Bracelets
            </Link>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          TRENDING / LATEST ITEMS
      ════════════════════════════════════════════════════════ */}
      <section className="border-b border-border bg-[oklch(0.985_0.003_75)]">
        <div className="w-full px-5 sm:px-8 lg:px-16 pt-14 lg:pt-20 pb-12 lg:pb-18">

          {/* ── Header ── */}
          <div className="flex items-end justify-between mb-8 max-w-[1600px] mx-auto reveal">
            <div>
              <Eyebrow center={false}>Trending Now</Eyebrow>
              <h2 className="font-display" style={{ fontSize: "clamp(2rem, 3.5vw, 3.5rem)" }}>
                Latest & Trending
              </h2>
              <p className="text-[0.75rem] text-muted-foreground mt-2">
                Our most-loved pieces, hand-picked for you.
              </p>
            </div>
            <Link
              to="/shop"
              className="hidden sm:flex items-center gap-1.5 text-[0.55rem] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition-colors pb-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* ── Trust strip ── */}
          <div className="flex items-center gap-6 mb-8 overflow-x-auto pb-1 max-w-[1600px] mx-auto reveal" style={{ transitionDelay: "0.05s" }}>
            {[
              { icon: ShieldCheck, text: "GRA Certified" },
              { icon: Truck,       text: "Free Shipping $250+" },
              { icon: RotateCcw,   text: "14-Day Returns" },
              { icon: Award,       text: "Lifetime Guarantee" },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5 shrink-0 text-[0.50rem] uppercase tracking-[0.20em] text-muted-foreground">
                <Icon className="h-3 w-3 shrink-0" style={{ color: "#C9A84C" }} />
                {text}
              </span>
            ))}
          </div>

          {/* ── Mobile: snap-scroll row ── */}
          <div
            className="flex md:hidden gap-3 overflow-x-auto pb-5 -mx-5 px-5 snap-x snap-mandatory reveal"
            style={{ scrollbarWidth: "none", transitionDelay: "0.10s" }}
          >
            {isLoading
              ? [...Array(6)].map((_, i) => (
                  <div key={i} className="w-[70vw] shrink-0 snap-start"><SkeletonCard /></div>
                ))
              : featuredProducts.slice(0, 6).map((p: any) => (
                  <div key={p.id} className="w-[70vw] shrink-0 snap-start">
                    <ProductCard p={p} />
                  </div>
                ))
            }
          </div>

          {/* ── Desktop: 6-column grid ── */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-6 gap-4 lg:gap-6 max-w-[1600px] mx-auto reveal" style={{ transitionDelay: "0.10s" }}>
            {isLoading
              ? [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
              : featuredProducts.slice(0, 6).map((p: any) => <ProductCard key={p.id} p={p} />)
            }
          </div>

          {/* ── Bottom CTA ── */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-[1600px] mx-auto reveal" style={{ transitionDelay: "0.15s" }}>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-foreground text-background text-[0.52rem] uppercase tracking-[0.26em] font-semibold hover:opacity-90 transition-opacity w-full sm:w-auto justify-center"
            >
              Shop All Jewelry <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/shop"
              search={{ type: "necklace" as any }}
              className="inline-flex items-center gap-2 px-8 py-3.5 border border-border text-[0.52rem] uppercase tracking-[0.26em] text-muted-foreground hover:text-foreground hover:border-foreground transition-colors w-full sm:w-auto justify-center"
            >
              New Arrivals
            </Link>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          WHY CHOOSE QURESHI JEWELERS — company values & service
      ════════════════════════════════════════════════════════ */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1360px] px-5 lg:px-10 py-16 lg:py-24">
          <div className="text-center mb-11 reveal">
            <Eyebrow>Our Commitment to You</Eyebrow>
            <h2 className="font-display leading-[0.95]" style={{ fontSize: "clamp(2.2rem, 4.5vw, 4rem)" }}>
              Why Choose Qureshi Jewelers?
            </h2>
            <p className="mt-4 text-muted-foreground text-[0.85rem] leading-[1.75] max-w-xl mx-auto">
              We don't just sell jewelry — we craft experiences. Every piece is hand-set with precision, every customer is treated like family, and every order reflects our dedication to excellence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 reveal" style={{ transitionDelay: "0.1s" }}>
            {[
              {
                icon: Heart,
                title: "Crafted with Care",
                desc: "Every stone is hand-set by skilled artisans. We inspect each piece multiple times to ensure perfection before it reaches your hands.",
                stat: "100%",
                statLabel: "Quality Inspected",
              },
              {
                icon: ShieldCheck,
                title: "Customer First",
                desc: "Our team is dedicated to your satisfaction. From personalized guidance to after-purchase support, we're here for every step of your journey.",
                stat: "24/7",
                statLabel: "Support Available",
              },
              {
                icon: Award,
                title: "Premium Quality",
                desc: "We use only VVS1 D Colorless moissanite and solid S925 sterling silver with 5× 18K gold plating. No compromises, ever.",
                stat: "5×",
                statLabel: "Gold Plating",
              },
            ].map(({ icon: Icon, title, desc, stat, statLabel }) => (
              <div
                key={title}
                className="qj-premium-card bg-white border border-border p-8 rounded-xl group"
              >
                <div className="qj-icon-ring w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6">
                  <Icon className="h-5 w-5 text-gray-900" />
                </div>
                <h3 className="font-display text-[1.5rem] mb-3">{title}</h3>
                <p className="text-[0.82rem] text-muted-foreground leading-[1.75] mb-6">{desc}</p>
                <div className="pt-4 border-t border-border">
                  <div className="font-display text-[2rem] leading-none mb-1" style={{
                    background: "linear-gradient(135deg, #1a1a1a, #404040)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}>
                    {stat}
                  </div>
                  <div className="text-[0.46rem] uppercase tracking-[0.20em] text-muted-foreground">{statLabel}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8 reveal" style={{ transitionDelay: "0.2s" }}>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.28em] lux-link text-muted-foreground hover:text-foreground transition-colors duration-350"
            >
              Get in touch <ArrowRight className="h-3 w-3" />
            </Link>
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

        <div className="relative mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-16 py-16 lg:py-20">
          {/* Subtle grid background */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

          {/* Centered heading */}
          <div className="relative text-center mb-12 lg:mb-16 reveal">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-gray-50 to-white border border-gray-200/80 shadow-sm mb-6">
              <Sparkles className="h-4 w-4 text-gray-700" />
              <span className="text-[0.42rem] uppercase tracking-[0.18em] font-semibold text-gray-800">Ethical Luxury · Lab-Created · GRA Certified</span>
            </div>
            <h2 className="font-display leading-[0.90] mb-4" style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)" }}>
              Brilliance that never costs <span className="italic bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">the earth.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-muted-foreground text-sm sm:text-base leading-relaxed">
              Experience the exceptional beauty of lab-created moissanite—superior brilliance, ethical sourcing, and extraordinary value without compromise.
            </p>
          </div>

          {/* Certification trust banner */}
          <div className="mb-10 reveal" style={{ transitionDelay: "0.08s" }}>
            <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 border border-gray-200/80 rounded-2xl p-8 shadow-sm">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                    <ShieldCheck className="h-7 w-7 text-gray-900" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-2">Every stone, independently verified.</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
                      Every Qureshi piece comes with a GRA (Gemological Research Academy) certificate. This is not a marketing claim — it's a third-party verification of clarity, color, cut, and carat weight.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  {[
                    { icon: ShieldCheck, label: "GRA Certified" },
                    { icon: Gem, label: "VVS Clarity" },
                    { icon: Award, label: "D Color" },
                    { icon: Check, label: "Verified" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                        <Icon className="h-5 w-5 text-gray-900" />
                      </div>
                      <span className="text-[0.40rem] uppercase tracking-[0.14em] font-semibold text-gray-700">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid sm:grid-cols-3 gap-6 mb-10 reveal" style={{ transitionDelay: "0.12s" }}>
            {[
              { num: "0", label: "Land Disturbed", desc: "Zero environmental footprint", icon: Leaf },
              { num: "100%", label: "Conflict-Free", desc: "Every stone traceable", icon: ShieldCheck },
              { num: "~97%", label: "Cost Savings", desc: "Exceptional value", icon: TrendingUp },
            ].map((stat, i) => (
              <div key={i} className="group relative bg-white border border-gray-200/80 rounded-2xl p-8 hover:border-gray-900/50 hover:shadow-xl hover:shadow-black/5 transition-all duration-500">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                    <stat.icon className="h-7 w-7 text-gray-900" />
                  </div>
                  <div className="flex-1">
                    <p
                      className="font-display leading-none mb-2"
                      style={{
                        fontSize: "clamp(2rem, 4.5vw, 2.8rem)",
                        background: "linear-gradient(135deg, #0a0a0a, #3a3a3a)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {stat.num}
                    </p>
                    <h4 className="text-foreground font-semibold text-base mb-1">{stat.label}</h4>
                    <p className="text-muted-foreground text-sm">{stat.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Technical specifications */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-8 mb-10 reveal" style={{ transitionDelay: "0.16s" }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <Gem className="h-5 w-5 text-gray-900" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">Technical Specifications</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "Stone Type", value: "Lab-created silicon carbide", highlight: false, icon: Gem },
                { label: "Clarity Grade", value: "VVS1 — virtually flawless", highlight: true, icon: Sparkles },
                { label: "Color Grade", value: "D Colorless — top of GIA scale", highlight: true, icon: Sun },
                { label: "Hardness", value: "9.25 Mohs — second only to diamond", highlight: false, icon: Shield },
                { label: "Refractive Index", value: "2.65–2.69 — exceeds diamond's 2.42", highlight: true, icon: Zap },
                { label: "Certification", value: "GRA certificate with every order", highlight: false, icon: Award },
              ].map((spec, i) => (
                <div
                  key={i}
                  className={`group flex items-start gap-3 p-4 rounded-xl border transition-all duration-300 ${
                    spec.highlight 
                      ? "bg-gradient-to-br from-gray-50 to-white border-gray-300/60 hover:border-gray-400" 
                      : "bg-white border-gray-200/60 hover:border-gray-300"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    spec.highlight ? "bg-gray-200" : "bg-gray-100"
                  }`}>
                    <spec.icon className={`h-5 w-5 ${spec.highlight ? "text-gray-900" : "text-gray-600"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[0.42rem] uppercase tracking-[0.14em] text-muted-foreground mb-1">{spec.label}</p>
                    <p className={`text-sm font-medium ${spec.highlight ? "text-foreground" : "text-muted-foreground"}`}>{spec.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enterprise CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center reveal" style={{ transitionDelay: "0.20s" }}>
            <Link
              to="/moissanite-guide"
              className="inline-flex items-center justify-center gap-3 bg-foreground text-background px-10 py-4 rounded-xl text-[0.48rem] uppercase tracking-[0.22em] font-semibold hover:bg-gray-800 hover:shadow-xl hover:shadow-black/15 hover:-translate-y-0.5 transition-all duration-300"
            >
              Learn More <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-foreground px-10 py-4 rounded-xl text-[0.48rem] uppercase tracking-[0.22em] font-semibold hover:border-gray-900 hover:bg-gray-50 hover:-translate-y-0.5 transition-all duration-300"
            >
              Shop Collection <ArrowRight className="h-4 w-4" />
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
                <div className="qj-icon-ring w-10 h-10 rounded-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                  <Icon className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-foreground">{label}</p>
                <p className="text-[0.58rem] uppercase tracking-[0.12em] text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          SHOP BY CATEGORY — compact luxury grid
      ════════════════════════════════════════════════════════ */}
      <section className="border-b border-border bg-gradient-to-b from-background to-[oklch(0.985_0.003_75)]">
        <div className="w-full px-5 sm:px-8 lg:px-16 pt-10 lg:pt-14 pb-8 lg:pb-10 reveal">
          <div className="max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <Eyebrow center={false}>Collections</Eyebrow>
                <h2 className="font-display" style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)" }}>
                  Shop by Category
                </h2>
              </div>
              <Link
                to="/contact"
                className="hidden sm:inline-flex items-center gap-2 text-[0.50rem] uppercase tracking-[0.20em] text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Get Expert Help
              </Link>
            </div>

            {/* Desktop: Equal-height grid */}
            <div className="hidden sm:grid grid-cols-4 gap-4">
              {[
                { image: images.ring, label: "Rings", sub: "Engagement & Fashion", type: "ring" },
                { image: images.tennischain, label: "Chains", sub: "Tennis & Rope", type: "necklace" },
                { image: images.tennisBraceletYellowGold, label: "Bracelets", sub: "Tennis Bracelets", type: "bracelet" },
                { image: images.earring2, label: "Earrings", sub: "Stud Earrings", type: "earring" },
              ].map((cat) => (
                <Link
                  key={cat.label}
                  to="/shop"
                  search={{ type: cat.type as any }}
                  className="group relative overflow-hidden rounded-sm aspect-[3/4]"
                >
                  <img
                    src={cat.image}
                    alt={cat.label}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="font-display text-white text-lg mb-1">{cat.label}</h3>
                    <p className="text-white/70 text-xs mb-3">{cat.sub}</p>
                    <span className="inline-flex items-center gap-1 text-green-300 text-[0.45rem] uppercase tracking-[0.18em] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      Shop <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Mobile: 2x2 grid */}
            <div className="sm:hidden grid grid-cols-2 gap-3">
              {[
                { image: images.ring, label: "Rings", type: "ring" },
                { image: images.tennischain, label: "Chains", type: "necklace" },
                { image: images.tennisBraceletYellowGold, label: "Bracelets", type: "bracelet" },
                { image: images.earring2, label: "Earrings", type: "earring" },
              ].map((cat) => (
                <Link
                  key={cat.label}
                  to="/shop"
                  search={{ type: cat.type as any }}
                  className="group relative overflow-hidden rounded-sm aspect-square"
                >
                  <img
                    src={cat.image}
                    alt={cat.label}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-display text-white text-base mb-1">{cat.label}</h3>
                    <span className="inline-flex items-center gap-1 text-green-300 text-[0.40rem] uppercase tracking-[0.16em] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      Shop <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Mobile support CTA */}
            <div className="sm:hidden mt-6 text-center">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 text-[0.45rem] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Get Expert Help
              </Link>
            </div>
          </div>
        </div>
      </section>

      <EmailCapture />
    </>
  );
}
