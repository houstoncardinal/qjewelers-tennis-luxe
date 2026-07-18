import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, useMemo, useRef } from "react";
import { ArrowRight, ShieldCheck, Gem, Award, Truck, Star, Check, Sparkles, Eye, Diamond, X, Leaf, Crown, Heart, RotateCcw } from "lucide-react";
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

const CARD_BADGES: Record<string, { label: string; dark?: boolean }> = {
  necklace: { label: "Best Seller" },
  bracelet: { label: "GRA Certified" },
  earring:  { label: "Customer Fav" },
  ring:     { label: "New Arrival" },
};

function ProductCard({ p }: { p: any }) {
  const price =
    p.slug?.includes("tennis-bracelet") || p.slug?.includes("tennis_bracelet")
      ? formatUSD(getTennisBraceletPrice("2mm", '6"'))
      : p.slug?.includes("tennis-chain") || p.slug?.includes("tennis_chain")
        ? formatUSD(getTennisChainPrice("3mm", '16"'))
        : formatUSD(Number(p.base_price));

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

        {/* Gold top edge reveal */}
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
            <Star key={i} className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
          ))}
          <span className="text-[0.47rem] text-gray-400 ml-1.5 leading-none">4.9</span>
        </div>

        {/* Name */}
        <h3 className="font-display text-[1rem] sm:text-[1.15rem] leading-[1.25] group-hover:text-gold transition-colors duration-300 line-clamp-2">
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
      {/* Bottom gradient so text is always readable */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.30) 45%, rgba(0,0,0,0.04) 100%)" }}
      />
      {/* Text overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 md:px-6 md:pb-6">
        <p className="text-[0.47rem] uppercase tracking-[0.32em] mb-1.5" style={{ color: "rgba(251,191,36,0.80)" }}>{tagline}</p>
        <p className="font-display text-white leading-tight" style={{ fontSize: "clamp(1.25rem, 2vw, 1.9rem)" }}>{label}</p>
        <p
          className="mt-2 text-[0.48rem] uppercase tracking-[0.26em] transition-colors duration-300"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          Shop Collection →
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
  const heroProducts = useMemo(() => {
    const pool = heroType === "all" ? sig : sig.filter((p: any) => p.type === heroType);
    const colorOrder: Record<string, number> = { gold: 0, rose_gold: 1, silver: 2, white_gold: 3 };
    return [...pool]
      .sort((a: any, b: any) => (colorOrder[a.color] ?? 9) - (colorOrder[b.color] ?? 9))
      .slice(0, 12);
  }, [sig, heroType]);

  // Belt speed: ~55px/s constant; more products = longer loop = longer duration
  const beltDuration = Math.max(20, heroProducts.length * 2.4);

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
          HERO — dark editorial image hero + product dock
      ════════════════════════════════════════════════════════ */}
      <section
        className="flex flex-col overflow-hidden h-[calc(100svh-4rem)] md:h-[calc(100svh-5rem)] lg:h-[calc(100svh-6rem)]"
        style={{ minHeight: "600px", maxHeight: "1020px" }}
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
            className="absolute inset-0 h-full w-full object-cover object-center"
          >
            <source src={images.heroVideo} type="video/mp4" />
          </video>

          {/* ── Overlay system ───────────────────────────────────
               Mobile : uniform dark scrim — text readable anywhere
               Desktop: directional — solid left, clear right so
                        jewelry stays visible through the photo
          ────────────────────────────────────────────────────── */}
          <div className="absolute inset-0 sm:hidden" style={{ background: "rgba(0,0,0,0.64)" }} />
          <div
            className="absolute inset-0 hidden sm:block"
            style={{ background: "linear-gradient(to right, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.86) 28%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.18) 70%, rgba(0,0,0,0.04) 100%)" }}
          />
          {/* Top + bottom polish vignette */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, transparent 18%, transparent 68%, rgba(0,0,0,0.32) 100%)" }}
          />

          {/* ── Editorial content ─────────────────────────────── */}
          <div className="absolute inset-0 flex items-center">
            <div className="w-full px-6 sm:px-12 lg:px-20 xl:px-28">
              <div className="w-[90vw] sm:w-auto sm:max-w-[560px] lg:max-w-[820px]">

                {/* Eyebrow */}
                <div className="flex items-center gap-3 mb-3 sm:mb-4 animate-fade-in" style={{ animationDelay: "0s" }}>
                  <span className="h-px w-8 shrink-0" style={{ background: "linear-gradient(to right, transparent, oklch(0.82 0.14 82))" }} />
                  <span className="text-[0.52rem] sm:text-[0.55rem] uppercase tracking-[0.36em] font-semibold whitespace-nowrap" style={{ color: "oklch(0.84 0.14 82)" }}>
                    VVS1 · D Color · GRA Certified
                  </span>
                  <span className="h-px w-8 shrink-0" style={{ background: "linear-gradient(to left, transparent, oklch(0.82 0.14 82))" }} />
                </div>

                {/* Headline — 2 lines max, all white, sm:whitespace-nowrap prevents 3rd line */}
                <h1 className="font-display leading-[0.90] mb-4 sm:mb-5" style={{ letterSpacing: "-0.01em" }}>
                  <EditableText
                    contentKey="home.hero.headline_line1"
                    label="Hero — Headline Line 1"
                    defaultValue="Crafted to Outshine"
                    tag="span"
                    className="block text-white animate-fade-up sm:whitespace-nowrap"
                    style={{ fontSize: "clamp(2.8rem, 6.5vw, 5.2rem)", animationDelay: "0.14s", textShadow: "0 2px 24px rgba(0,0,0,0.60)" }}
                  />
                  <EditableText
                    contentKey="home.hero.headline_line2"
                    label="Hero — Headline Line 2"
                    defaultValue="Every Diamond."
                    tag="span"
                    className="block text-white animate-fade-up sm:whitespace-nowrap"
                    style={{ fontSize: "clamp(2.8rem, 6.5vw, 5.2rem)", animationDelay: "0.24s", textShadow: "0 2px 24px rgba(0,0,0,0.60)" }}
                  />
                </h1>

                {/* Subheadline */}
                <p
                  className="text-white text-[0.88rem] sm:text-[0.94rem] leading-[1.82] mb-5 sm:mb-6 animate-fade-up"
                  style={{ animationDelay: "0.36s", maxWidth: "52ch", textShadow: "0 1px 12px rgba(0,0,0,0.55)" }}
                >
                  More brilliance than any diamond — VVS clarity, GRA certified, hand-set in 5× 18K gold-plated sterling silver. Starting from $59.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-5 sm:mb-7 animate-fade-up" style={{ animationDelay: "0.46s" }}>
                  <Link
                    to="/shop"
                    className="group relative overflow-hidden inline-flex items-center justify-center gap-2.5 bg-white text-black px-8 sm:px-10 py-[13px] sm:py-[14px] text-[0.60rem] uppercase tracking-[0.22em] font-black transition-colors duration-300 hover:bg-[oklch(0.96_0.020_82)]"
                    style={{ boxShadow: "0 6px 36px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.10)" }}
                  >
                    <span className="relative z-10 flex items-center gap-2.5">
                      Shop the Collection
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
                    </span>
                    <div className="absolute inset-0 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-700 bg-gradient-to-r from-transparent via-black/5 to-transparent" />
                  </Link>
                  <Link
                    to="/moissanite-guide"
                    className="group inline-flex items-center justify-center gap-2.5 text-white/82 px-8 sm:px-10 py-[13px] sm:py-[14px] text-[0.60rem] uppercase tracking-[0.22em] font-semibold transition-all duration-300 hover:text-white hover:bg-white/10"
                    style={{ border: "1px solid rgba(255,255,255,0.24)", backdropFilter: "blur(4px)" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.50)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.24)")}
                  >
                    Our Story
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
                  </Link>
                </div>

                {/* Trust row */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 animate-fade-in" style={{ animationDelay: "0.58s" }}>
                  {[
                    { icon: ShieldCheck, text: "GRA Certified"   },
                    { icon: Gem,         text: "VVS1 · D Color"  },
                    { icon: Truck,       text: "Free US Shipping" },
                  ].map(({ icon: TrustIcon, text }, i) => (
                    <span key={i} className="flex items-center gap-2">
                      {i > 0 && <span className="hidden sm:block w-px h-3.5 mr-1" style={{ background: "rgba(255,255,255,0.25)" }} />}
                      <TrustIcon className="h-3.5 w-3.5 shrink-0 text-white" />
                      <span className="text-[0.58rem] sm:text-[0.60rem] uppercase tracking-[0.18em] font-semibold text-white whitespace-nowrap">
                        {text}
                      </span>
                    </span>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* ── Product browser dock — light ─────────────────── */}
        <div
          className="flex-shrink-0 bg-background border-t border-border"
          onMouseEnter={() => setIsDockPaused(true)}
          onMouseLeave={() => setIsDockPaused(false)}
        >

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
                  className={`px-4 lg:px-5 py-2.5 text-[0.52rem] uppercase tracking-[0.14em] shrink-0 relative transition-colors duration-200 whitespace-nowrap ${
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

          {/* Product infinite belt */}
          <div
            className="overflow-hidden py-3"
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
                          From {(p.slug?.includes("tennis-bracelet") || p.slug?.includes("tennis_bracelet"))
                            ? formatUSD(getTennisBraceletPrice("2mm", '6"'))
                            : formatUSD(Number(p.base_price))}
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
          SHOP BY CATEGORY — editorial overlay grid
      ════════════════════════════════════════════════════════ */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1360px] px-5 lg:px-10 pt-10 pb-3 lg:pt-14 lg:pb-4 reveal">
          <div className="flex items-end justify-between mb-5">
            <div>
              <Eyebrow center={false}>Collections</Eyebrow>
              <h2 className="font-display" style={{ fontSize: "clamp(1.9rem, 3vw, 3rem)" }}>
                Shop by Category
              </h2>
            </div>
            <Link
              to="/shop"
              className="hidden sm:flex items-center gap-1.5 text-[0.55rem] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition-colors pb-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Desktop: hero-left + 3-stack-right */}
        <div className="hidden md:grid grid-cols-[3fr_2fr] mx-auto max-w-[1360px] px-5 lg:px-10 pb-10 lg:pb-14 gap-2 reveal" style={{ height: "clamp(420px, 52vh, 640px)", transitionDelay: "0.05s" }}>
          <CategoryTile
            image={images.tennischain}
            label="Moissanite Chains"
            tagline="Tennis & Rope"
            shopType="necklace"
            className="h-full"
          />
          <div className="grid grid-rows-3 gap-2 h-full">
            <CategoryTile
              image={images.tennisBraceletYellowGold}
              label="Bracelets"
              tagline="Tennis Bracelets"
              shopType="bracelet"
              className="h-full"
            />
            <CategoryTile
              image={images.earring2}
              label="Earrings"
              tagline="Stud Earrings"
              shopType="earring"
              className="h-full"
            />
            <CategoryTile
              image={images.ring}
              label="Rings"
              tagline="Moissanite Rings"
              shopType="ring"
              className="h-full"
            />
          </div>
        </div>

        {/* Mobile: 2×2 compact squares */}
        <div className="md:hidden grid grid-cols-2 gap-1.5 px-5 pb-8 reveal" style={{ transitionDelay: "0.05s" }}>
          <CategoryTile
            image={images.tennischain}
            label="Chains"
            tagline="Tennis & Rope"
            shopType="necklace"
            className="aspect-square"
          />
          <CategoryTile
            image={images.tennisBraceletYellowGold}
            label="Bracelets"
            tagline="Tennis"
            shopType="bracelet"
            className="aspect-square"
          />
          <CategoryTile
            image={images.earring2}
            label="Earrings"
            tagline="Stud Earrings"
            shopType="earring"
            className="aspect-square"
          />
          <CategoryTile
            image={images.ring}
            label="Rings"
            tagline="Moissanite"
            shopType="ring"
            className="aspect-square"
          />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FEATURED ITEMS
      ════════════════════════════════════════════════════════ */}
      <section className="border-b border-border bg-[oklch(0.985_0.003_75)]">
        <div className="mx-auto max-w-[1360px] px-5 lg:px-10 pt-12 lg:pt-18 pb-10 lg:pb-16">

          {/* ── Header ── */}
          <div className="flex items-end justify-between mb-5 reveal">
            <div>
              <Eyebrow center={false}>Curated For You</Eyebrow>
              <h2 className="font-display" style={{ fontSize: "clamp(1.9rem, 3vw, 3rem)" }}>
                Featured Items
              </h2>
            </div>
            <Link
              to="/shop"
              className="hidden sm:flex items-center gap-1.5 text-[0.55rem] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition-colors pb-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* ── Trust strip ── */}
          <div className="flex items-center gap-5 mb-7 overflow-x-auto pb-1 reveal" style={{ transitionDelay: "0.05s" }}>
            {[
              { icon: ShieldCheck, text: "GRA Certified" },
              { icon: Truck,       text: "Free Shipping $250+" },
              { icon: RotateCcw,   text: "30-Day Returns" },
              { icon: Award,       text: "Lifetime Guarantee" },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5 shrink-0 text-[0.48rem] uppercase tracking-[0.20em] text-muted-foreground">
                <Icon className="h-3 w-3 shrink-0" style={{ color: "#C9A84C" }} />
                {text}
              </span>
            ))}
          </div>

          {/* ── Mobile: snap-scroll row (1.5 cards peek) ── */}
          <div
            className="flex md:hidden gap-3 overflow-x-auto pb-4 -mx-5 px-5 snap-x snap-mandatory reveal"
            style={{ scrollbarWidth: "none", transitionDelay: "0.10s" }}
          >
            {isLoading
              ? [...Array(4)].map((_, i) => (
                  <div key={i} className="w-[70vw] shrink-0 snap-start"><SkeletonCard /></div>
                ))
              : featuredProducts.slice(0, 4).map((p: any) => (
                  <div key={p.id} className="w-[70vw] shrink-0 snap-start">
                    <ProductCard p={p} />
                  </div>
                ))
            }
          </div>

          {/* ── Desktop: 4-column grid ── */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 reveal" style={{ transitionDelay: "0.10s" }}>
            {isLoading
              ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
              : featuredProducts.slice(0, 4).map((p: any) => <ProductCard key={p.id} p={p} />)
            }
          </div>

          {/* ── Bottom CTA ── */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 reveal" style={{ transitionDelay: "0.15s" }}>
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