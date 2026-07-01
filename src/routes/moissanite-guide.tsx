import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Award, Eye, Diamond, ArrowRight } from "lucide-react";
import { MOISSANITE_QUALITY, MOISSANITE_VS_DIAMOND } from "@/lib/pricing";

// Hoisted to module scope — shared by both the rendered FAQ section and the
// FAQPage schema below, so the two can never drift out of sync.
const GUIDE_FAQS = [
  {
    q: "Is moissanite a fake diamond?",
    a: "No. Moissanite is a genuine gemstone with its own distinct chemical composition (silicon carbide). It's not a diamond simulant or fake — it's a different stone that happens to have optical properties that exceed diamond in brilliance and fire.",
  },
  {
    q: "Does moissanite lose its shine over time?",
    a: "No. Moissanite is a 9.25 on the Mohs hardness scale (diamond is 10), making it extremely scratch-resistant. It does not fog, cloud, or degrade over time. Your Qureshi piece is backed by a lifetime brilliance guarantee.",
  },
  {
    q: "What does VVS clarity mean?",
    a: "VVS stands for Very Very Slightly Included — the highest practical clarity grade. Inclusions (internal imperfections) are virtually impossible to see even under 10x magnification. All Qureshi stones are VVS clarity.",
  },
  {
    q: "What does D color mean?",
    a: "D is the highest color grade on the GIA color scale, meaning the stone is completely colorless. There is no yellow, brown, or grey tint. D color moissanite produces the purest, whitest brilliance.",
  },
  {
    q: "Is the GRA certificate included?",
    a: "Yes. Every Qureshi piece ships with a GRA certificate of authenticity that independently verifies your stone's clarity, color, and carat weight.",
  },
];

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://qureshijewelers.com").replace(/\/$/, "");
const GUIDE_URL = `${SITE_URL}/moissanite-guide`;

export const Route = createFileRoute("/moissanite-guide")({
  head: () => ({
    meta: [
      { title: "Moissanite vs Diamond — VVS Clarity, D Color & GRA Guide | Qureshi Jewelers" },
      { name: "description", content: "The complete moissanite guide: VVS clarity, D color grading, GRA certification, and why moissanite outshines diamond in brilliance and fire. Expert education from Qureshi Jewelers." },
      { property: "og:title", content: "Moissanite vs Diamond Guide — VVS Clarity & GRA Certification" },
      { property: "og:description", content: "Is moissanite better than diamond? VVS clarity, D color, GRA certification explained by America's premier moissanite jewelry specialists." },
      { property: "og:url", content: GUIDE_URL },
      { property: "og:image", content: `${SITE_URL}/QURESHIJEWELERSLOGO.png` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Moissanite vs Diamond — Complete Quality Guide | Qureshi Jewelers" },
      { name: "twitter:description", content: "Is moissanite better than diamond? VVS clarity, D color, and why moissanite produces more brilliance and fire than a diamond of the same size." },
      { name: "twitter:image", content: `${SITE_URL}/QURESHIJEWELERSLOGO.png` },
    ],
    links: [{ rel: "canonical", href: GUIDE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "@id": `${GUIDE_URL}#article`,
          headline: "Moissanite vs Diamond: The Complete Guide to VVS Clarity, D Color & GRA Certification",
          alternativeHeadline: "Why Moissanite Outshines Diamond — The Expert Guide",
          description: "Everything you need to know about moissanite: VVS clarity, D color grading, GRA certification, hardness, brilliance, and why moissanite produces more fire than diamond.",
          url: GUIDE_URL,
          datePublished: "2024-01-01",
          dateModified: "2025-01-01",
          image: {
            "@type": "ImageObject",
            url: `${SITE_URL}/QURESHIJEWELERSLOGO.png`,
            contentUrl: `${SITE_URL}/QURESHIJEWELERSLOGO.png`,
            name: "Qureshi Jewelers Moissanite Guide",
          },
          author: {
            "@type": "Organization",
            name: "Qureshi Jewelers",
            "@id": `${SITE_URL}/#organization`,
          },
          publisher: { "@id": `${SITE_URL}/#organization` },
          mainEntityOfPage: { "@type": "WebPage", "@id": GUIDE_URL },
          about: [
            { "@type": "Thing", name: "Moissanite", sameAs: "https://en.wikipedia.org/wiki/Moissanite" },
            { "@type": "Thing", name: "VVS Clarity", sameAs: "https://en.wikipedia.org/wiki/Diamond_clarity" },
            { "@type": "Thing", name: "D Color Gemstone", sameAs: "https://en.wikipedia.org/wiki/Diamond_color" },
            { "@type": "Thing", name: "GRA Certification" },
            { "@type": "Thing", name: "Moissanite vs Diamond" },
          ],
          keywords: "moissanite vs diamond, VVS moissanite, D color moissanite, GRA certified moissanite, is moissanite real, moissanite quality guide, moissanite clarity, moissanite hardness, moissanite brilliance",
          speakable: {
            "@type": "SpeakableSpecification",
            cssSelector: ["h1", "h2", ".speakable"],
          },
          wordCount: 1200,
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: GUIDE_FAQS.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Moissanite Guide", item: GUIDE_URL },
          ],
        }),
      },
      // HowTo schema: "How to Clean a Moissanite Tennis Chain"
      // Unlocks a separate HowTo rich-result type in Google SERP and provides
      // step-by-step AI-readable content for voice search and AI Overviews.
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to Clean a Moissanite Tennis Chain",
          description: "Step-by-step guide to cleaning your moissanite tennis chain at home to maintain its VVS brilliance.",
          totalTime: "PT5M",
          supply: [
            { "@type": "HowToSupply", name: "Warm water" },
            { "@type": "HowToSupply", name: "Mild dish soap" },
            { "@type": "HowToSupply", name: "Soft-bristle toothbrush" },
            { "@type": "HowToSupply", name: "Lint-free microfiber cloth" },
          ],
          step: [
            {
              "@type": "HowToStep",
              position: 1,
              name: "Prepare a cleaning solution",
              text: "Fill a small bowl with warm (not hot) water and add 2–3 drops of mild dish soap. Hot water can loosen prong settings over time.",
            },
            {
              "@type": "HowToStep",
              position: 2,
              name: "Soak the chain",
              text: "Submerge the tennis chain in the soapy water for 2–3 minutes. This loosens body oils, lotions, and environmental buildup from the stones and settings.",
            },
            {
              "@type": "HowToStep",
              position: 3,
              name: "Gently brush the stones",
              text: "Using a soft-bristle toothbrush, gently scrub each stone and the surrounding prongs in circular motions. Moissanite's 9.25 Mohs hardness means it won't scratch from bristles.",
            },
            {
              "@type": "HowToStep",
              position: 4,
              name: "Rinse thoroughly",
              text: "Rinse under clean warm running water while holding the chain securely. Make sure all soap residue is removed, as dried soap can cloud moissanite temporarily.",
            },
            {
              "@type": "HowToStep",
              position: 5,
              name: "Dry and polish",
              text: "Pat dry with a lint-free microfiber cloth. Allow to air dry completely before storing. Avoid paper towels, which can micro-scratch the e-coating.",
            },
          ],
        }),
      },
    ],
  }),
  component: MoissaniteGuide,
});

function MoissaniteGuide() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-[oklch(0.978_0.005_80)]">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 pt-24 pb-20 text-center">
          <p className="eyebrow">The Moissanite Guide</p>
          <h1 className="mt-5 font-display leading-[0.98]" style={{ fontSize: "clamp(2.8rem, 6vw, 5.5rem)" }}>
            The stone that{" "}
            <em
              className="italic"
              style={{
                background: "var(--gradient-gold)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              outshines
            </em>{" "}
            diamond.
          </h1>
          <p className="mt-7 text-muted-foreground text-[0.9rem] leading-[1.85] max-w-2xl mx-auto">
            Discover why moissanite — with a higher refractive index, VVS1 clarity, and D color grading —
            is redefining what "iced out" means. Every Qureshi piece is independently GRA certified.
          </p>

          {/* Quick stat strip */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-border max-w-3xl mx-auto">
            {[
              { num: "9.25",      sub: "Mohs Hardness" },
              { num: "2.65–2.69", sub: "Refractive Index" },
              { num: "VVS1",      sub: "Clarity Grade" },
              { num: "D",         sub: "Color Grade" },
            ].map((s) => (
              <div key={s.sub} className="bg-background/80 px-4 py-5 text-center">
                <p
                  className="font-display leading-none mb-1.5"
                  style={{
                    fontSize: "clamp(1.3rem, 3vw, 2rem)",
                    background: "var(--gradient-gold)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {s.num}
                </p>
                <p className="text-[0.48rem] uppercase tracking-[0.16em] text-muted-foreground">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What is Moissanite */}
      <section className="mx-auto max-w-6xl px-6 lg:px-10 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="aspect-[4/5] overflow-hidden bg-[oklch(0.97_0.004_75)] relative">
            <img
              src="/tennischain.png"
              alt="VVS1 D Color Moissanite Tennis Chain — Qureshi Jewelers"
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div
              className="absolute bottom-0 left-0 right-0 h-[2px]"
              style={{ background: "var(--gradient-gold-h)" }}
            />
          </div>
          <div>
            <p className="eyebrow">The Discovery</p>
            <h2 className="mt-3 font-display leading-[0.98]" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
              Born from a meteor.<br />Cut for brilliance.
            </h2>
            <p className="mt-6 text-muted-foreground text-[0.88rem] leading-[1.85]">
              Moissanite was first discovered in 1893 by Nobel Prize-winning chemist Dr. Henri Moissan
              inside fragments of a meteorite crater. Natural moissanite is extraordinarily rare —
              almost all moissanite today is grown in laboratories through a controlled thermal process
              that produces stones of exceptional purity and optical performance.
            </p>
            <p className="mt-4 text-muted-foreground text-[0.88rem] leading-[1.85]">
              Unlike diamond simulants such as cubic zirconia, moissanite is a genuine gemstone with its
              own distinct chemical structure — silicon carbide (SiC). This molecular architecture gives
              it optical properties that{" "}
              <strong className="text-foreground">exceed diamond</strong> in both brilliance and fire.
            </p>
            <div className="mt-8 border border-border px-5 py-4 bg-[oklch(0.978_0.005_80)]">
              <p className="text-[0.68rem] font-semibold text-foreground mb-1">Silicon Carbide (SiC)</p>
              <p className="text-[0.68rem] text-muted-foreground leading-relaxed">
                The same compound used in aerospace components and high-performance ceramics — grown
                into the hardest, most optically brilliant gemstone achievable outside of a diamond mine.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The 4Cs */}
      <section className="border-y border-border bg-[oklch(0.972_0.005_78)]">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 py-20 lg:py-28">
          <div className="text-center mb-14">
            <p className="eyebrow">Quality Standards</p>
            <h2 className="mt-3 font-display leading-[0.98]" style={{ fontSize: "clamp(2rem, 4.5vw, 4rem)" }}>
              The 4Cs of Moissanite.
            </h2>
            <p className="mt-4 text-muted-foreground text-[0.85rem] max-w-lg mx-auto leading-[1.75]">
              We grade every stone on the same four-criteria scale used for fine diamonds. Here's what
              those grades actually mean — and why they matter to what you wear.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Eye,
                label: "VVS1 Clarity",
                headline: "Virtually flawless",
                stat: "VVS1",
                desc: "VVS stands for Very Very Slightly Included — the highest practical clarity grade. Inclusions are invisible even under 10× magnification. All Qureshi stones are VVS1.",
              },
              {
                icon: Award,
                label: "D Color",
                headline: "Perfectly colorless",
                stat: "D",
                desc: "D is the top grade on the GIA color scale — no yellow, no brown, no grey. Pure, white, icy brilliance from every angle, in every light.",
              },
              {
                icon: Diamond,
                label: "Round Brilliant Cut",
                headline: "Maximum fire & scintillation",
                stat: "57",
                desc: "57 precisely angled facets engineered to maximize light return. Moissanite's higher RI means this cut unlocks more fire than the same cut produces on diamond.",
              },
              {
                icon: ShieldCheck,
                label: "GRA Certified",
                headline: "Independently verified",
                stat: "✓",
                desc: "Every Qureshi piece ships with a GRA (Gemological Research Academy) certificate verifying your stone's clarity, color, cut quality, and carat weight.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="border border-border bg-background flex flex-col">
                  <div className="px-5 pt-6 pb-4 border-b border-border flex items-center justify-between">
                    <Icon className="h-4.5 w-4.5 text-foreground/40" />
                    <span
                      className="font-display text-[1.8rem] leading-none"
                      style={{
                        background: "var(--gradient-gold)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {item.stat}
                    </span>
                  </div>
                  <div className="px-5 py-5 flex-1">
                    <p className="text-[0.50rem] uppercase tracking-[0.18em] text-muted-foreground mb-2">{item.label}</p>
                    <h3 className="font-display text-[1.25rem] leading-tight mb-3">{item.headline}</h3>
                    <p className="text-[0.72rem] text-muted-foreground leading-[1.8]">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Setting Types */}
      <section className="mx-auto max-w-6xl px-6 lg:px-10 py-20 lg:py-28">
        <div className="text-center mb-14">
          <p className="eyebrow">Setting Technology</p>
          <h2 className="mt-3 font-display leading-[0.98]" style={{ fontSize: "clamp(2rem, 4.5vw, 4rem)" }}>
            How each stone is set.
          </h2>
          <p className="mt-4 text-muted-foreground text-[0.85rem] max-w-lg mx-auto leading-[1.75]">
            The setting directly determines how much light reaches your stone — and therefore how
            much brilliance you see. Each Qureshi collection uses the optimal setting for its design.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="border border-border overflow-hidden group">
            <div className="aspect-[4/3] overflow-hidden bg-[oklch(0.97_0.004_75)]">
              <img
                src="/tennischain.png"
                alt="Claw prong setting — VVS moissanite tennis chain"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                loading="lazy"
              />
            </div>
            <div className="px-6 py-6">
              <p className="text-[0.48rem] uppercase tracking-[0.18em] text-muted-foreground mb-2">Setting Type</p>
              <h3 className="font-display text-[1.3rem] mb-3">Claw Setting</h3>
              <p className="text-[0.74rem] text-muted-foreground leading-[1.8]">
                Each stone is gripped by four delicate metal claws, exposing the maximum surface area
                to incoming light. Used in all Qureshi tennis chains and tennis bracelets — this is
                the setting that produces the most intense, continuous flash of brilliance along the entire length.
              </p>
              <p className="mt-3 text-[0.60rem] text-muted-foreground/55 italic">Used in: Tennis Chains, Tennis Bracelets</p>
            </div>
          </div>

          <div className="border border-border overflow-hidden group">
            <div className="aspect-[4/3] overflow-hidden bg-[oklch(0.97_0.004_75)]">
              <img
                src="/3%20Prong%20Moissanite%20Earrings/silverandwhitegoldsecondimage.jpg"
                alt="Three-prong setting — VVS moissanite stud earrings"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                loading="lazy"
              />
            </div>
            <div className="px-6 py-6">
              <p className="text-[0.48rem] uppercase tracking-[0.18em] text-muted-foreground mb-2">Setting Type</p>
              <h3 className="font-display text-[1.3rem] mb-3">Three-Prong Setting</h3>
              <p className="text-[0.74rem] text-muted-foreground leading-[1.8]">
                Three evenly spaced prongs hold the stone at perfect angles, allowing light to enter from
                multiple directions simultaneously. This produces a uniquely dynamic sparkle that shifts as
                you move — particularly striking in earrings worn close to the face.
              </p>
              <p className="mt-3 text-[0.60rem] text-muted-foreground/55 italic">Used in: Stud Earrings</p>
            </div>
          </div>

          <div className="border border-border overflow-hidden group">
            <div className="aspect-[4/3] overflow-hidden bg-[oklch(0.97_0.004_75)]">
              <img
                src="/ring.jpg"
                alt="Solitaire setting — VVS moissanite engagement ring"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                loading="lazy"
              />
            </div>
            <div className="px-6 py-6">
              <p className="text-[0.48rem] uppercase tracking-[0.18em] text-muted-foreground mb-2">Setting Type</p>
              <h3 className="font-display text-[1.3rem] mb-3">Solitaire Setting</h3>
              <p className="text-[0.74rem] text-muted-foreground leading-[1.8]">
                A single center stone elevated on a cathedral-style band, drawing all attention directly
                to the stone. The raised position maximizes light from above and from the sides, making
                even a modest carat weight appear significantly larger and more brilliant.
              </p>
              <p className="mt-3 text-[0.60rem] text-muted-foreground/55 italic">Used in: Solitaire Ring, Engagement Rings</p>
            </div>
          </div>
        </div>
      </section>

      {/* Moissanite vs Diamond Comparison */}
      <section className="bg-[oklch(0.972_0.005_78)] border-y border-border">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 py-20 lg:py-28">
          <div className="text-center mb-12">
            <p className="eyebrow">Moissanite vs Diamond</p>
            <h2 className="mt-3 font-display leading-[0.98]" style={{ fontSize: "clamp(2rem, 4.5vw, 4rem)" }}>
              Compare for yourself.
            </h2>
            <p className="mt-4 text-muted-foreground text-[0.85rem] max-w-lg mx-auto leading-[1.75]">
              The data tells a clear story. Moissanite outperforms mined diamond in brilliance, fire,
              and value — while being entirely conflict-free and ethically produced.
            </p>
          </div>

          <div className="overflow-x-auto -mx-6 lg:mx-0 px-6 lg:px-0">
            <table className="w-full border-collapse min-w-[580px]">
              <thead>
                <tr className="bg-foreground">
                  <th className="text-left px-5 py-3.5 text-[0.48rem] uppercase tracking-[0.16em] text-background/35 font-normal w-[28%]">Attribute</th>
                  <th
                    className="text-left px-5 py-3.5 text-[0.48rem] uppercase tracking-[0.16em] font-semibold w-[30%]"
                    style={{
                      background: "var(--gradient-gold)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Qureshi Moissanite
                  </th>
                  <th className="text-left px-5 py-3.5 text-[0.48rem] uppercase tracking-[0.16em] text-background/30 font-normal w-[30%]">Mined Diamond</th>
                  <th className="text-left px-5 py-3.5 text-[0.48rem] uppercase tracking-[0.16em] text-background/30 font-normal">Winner</th>
                </tr>
              </thead>
              <tbody>
                {MOISSANITE_VS_DIAMOND.map((row, i) => (
                  <tr key={row.attribute} className={`border-b border-border/60 ${i % 2 === 0 ? "bg-background" : "bg-[oklch(0.977_0.004_78)]"}`}>
                    <td className="px-5 py-3.5 text-[0.70rem] font-medium text-foreground/80">{row.attribute}</td>
                    <td className={`px-5 py-3.5 text-[0.70rem] ${row.winner === "moissanite" ? "font-semibold text-emerald-700" : "text-muted-foreground"}`}>{row.moissanite}</td>
                    <td className={`px-5 py-3.5 text-[0.70rem] ${row.winner === "diamond" ? "font-semibold text-foreground" : "text-muted-foreground/70"}`}>{row.diamond}</td>
                    <td className="px-5 py-3.5">
                      {row.winner === "moissanite" ? (
                        <span className="inline-flex px-2.5 py-1 text-[0.46rem] uppercase tracking-[0.12em] font-semibold bg-foreground text-background">Moissanite</span>
                      ) : row.winner === "diamond" ? (
                        <span className="inline-flex px-2.5 py-1 text-[0.46rem] uppercase tracking-[0.12em] bg-muted text-muted-foreground">Diamond</span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 text-[0.46rem] uppercase tracking-[0.12em] bg-muted text-muted-foreground">Equal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Care Guide */}
      <section className="mx-auto max-w-6xl px-6 lg:px-10 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <p className="eyebrow">Maintenance</p>
            <h2 className="mt-3 font-display leading-[0.98]" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
              Keep it brilliant for life.
            </h2>
            <p className="mt-5 text-muted-foreground text-[0.88rem] leading-[1.85] mb-8">
              Moissanite at 9.25 Mohs never clouds, fogs, or loses brilliance over time. A simple
              cleaning routine every few weeks is all it needs. All Qureshi pieces feature e-coating
              for corrosion resistance — here's how to keep them performing at their best.
            </p>

            <div className="border border-border">
              {[
                { step: "01", title: "Warm soapy water",  body: "Fill a small bowl with warm (not hot) water and add 2–3 drops of mild dish soap." },
                { step: "02", title: "Soak 3 minutes",    body: "Submerge your piece for 2–3 minutes to loosen body oils, lotions, and environmental residue." },
                { step: "03", title: "Gentle brush",      body: "Use a soft-bristle toothbrush to gently scrub stones and settings in small circular motions." },
                { step: "04", title: "Rinse thoroughly",  body: "Rinse under clean warm running water until all soap is removed. Dried soap can temporarily cloud moissanite." },
                { step: "05", title: "Dry & polish",      body: "Pat dry with a lint-free microfiber cloth. Avoid paper towels — they can micro-scratch the e-coating surface." },
              ].map(({ step, title, body }, i) => (
                <div key={step} className={`flex gap-5 px-5 py-4 border-b border-border last:border-0 ${i % 2 === 1 ? "bg-[oklch(0.978_0.005_80)]" : "bg-background"}`}>
                  <span className="font-display text-[1.1rem] leading-none text-muted-foreground/30 shrink-0 mt-0.5 w-7">{step}</span>
                  <div>
                    <p className="text-[0.70rem] font-semibold text-foreground mb-1">{title}</p>
                    <p className="text-[0.70rem] text-muted-foreground leading-[1.7]">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="aspect-[4/5] overflow-hidden bg-[oklch(0.97_0.004_75)] relative">
            <img
              src="/TennisBracelet/yellowgoldmain.jpg"
              alt="Moissanite tennis bracelet — care and maintenance"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: "var(--gradient-gold-h)" }}
            />
          </div>
        </div>
      </section>

      {/* GRA Certificate */}
      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="eyebrow" style={{ color: "oklch(0.7 0.1 75)" }}>Your Guarantee</p>
              <h2 className="mt-4 font-display text-background leading-[0.98]" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
                Every piece,<br />GRA certified.
              </h2>
              <p className="mt-5 text-background/65 text-[0.88rem] leading-[1.85]">
                The GRA (Gemological Research Academy) independently verifies each stone's clarity,
                color, cut quality, and carat weight. Your certificate ships inside every order —
                no extra steps, no upsells, no exceptions.
              </p>
              <Link
                to="/shop"
                className="inline-flex mt-9 items-center gap-3 bg-background text-foreground px-7 py-3.5 text-[0.58rem] uppercase tracking-[0.22em] hover:bg-background/90 transition-colors"
              >
                Shop certified pieces <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Certificate preview */}
            <div className="border border-background/15 p-7">
              <ShieldCheck className="h-7 w-7 text-background/35 mb-5" />
              <p className="text-[0.48rem] uppercase tracking-[0.20em] text-background/30 mb-5">Gemological Research Academy</p>
              <div className="space-y-0">
                {[
                  { label: "Clarity Grade",  value: "VVS1" },
                  { label: "Color Grade",    value: "D — Colorless" },
                  { label: "Cut Grade",      value: "Excellent" },
                  { label: "Stone Type",     value: "Lab-Created Moissanite" },
                  { label: "Certification",  value: "Authenticated & Sealed" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center border-b border-background/10 py-3 last:border-0">
                    <span className="text-[0.60rem] text-background/35">{label}</span>
                    <span className="text-[0.60rem] font-semibold text-background/75">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-6 lg:px-10 py-20 lg:py-28">
        <div className="text-center mb-12">
          <p className="eyebrow">FAQs</p>
          <h2 className="mt-3 font-display leading-[0.98]" style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}>
            Common questions.
          </h2>
        </div>
        <div className="border border-border">
          {GUIDE_FAQS.map((faq, i) => (
            <div
              key={faq.q}
              className={`px-6 py-7 border-b border-border last:border-0 ${i % 2 === 1 ? "bg-[oklch(0.978_0.005_80)]" : "bg-background"}`}
            >
              <h3 className="font-display text-[1.2rem] mb-3">{faq.q}</h3>
              <p className="text-[0.76rem] text-muted-foreground leading-[1.85]">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}