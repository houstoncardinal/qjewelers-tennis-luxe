import { createFileRoute, Link } from "@tanstack/react-router";
import { images as img } from "@/lib/product-images";

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://qureshijewelers.com").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/about`;

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Craft — Fine Moissanite Jewelry | Qureshi Jewelers" },
      { name: "description", content: "The Qureshi Jewelers standard: VVS1 D-color moissanite, solid S925 sterling silver, five layers of precious metal plating, and GRA certification on every piece." },
      { property: "og:title", content: "Our Craft — Qureshi Jewelers" },
      { property: "og:description", content: "VVS1 D-color moissanite set in solid S925 sterling silver. Five layers of precious metal plating. GRA certified. Luxury at every price point." },
      { property: "og:url", content: PAGE_URL },
      { property: "og:image", content: `${SITE_URL}/tennischain.png` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Our Craft — Fine Moissanite Jewelry | Qureshi Jewelers" },
      { name: "twitter:description", content: "VVS1 D-color moissanite in solid S925 sterling silver with 5× precious metal plating. GRA certified. The Qureshi standard." },
      { name: "twitter:image", content: `${SITE_URL}/tennischain.png` },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "Our Craft — Qureshi Jewelers",
          url: PAGE_URL,
          about: { "@id": `${SITE_URL}/#organization` },
          isPartOf: { "@id": `${SITE_URL}/#website` },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How a Qureshi Fine Jewelry Piece Is Made",
          description: "The step-by-step process for handcrafting VVS moissanite jewelry in solid S925 sterling silver.",
          step: [
            {
              "@type": "HowToStep",
              position: 1,
              name: "Stone selection",
              text: "Every piece begins with the selection of VVS1 clarity, D color (colorless) lab-created moissanite — matched by cut, optical grade, and dimension for absolute consistency across the entire setting.",
            },
            {
              "@type": "HowToStep",
              position: 2,
              name: "Sterling silver base fabrication",
              text: "The foundation is cast from solid S925 sterling silver (92.5% pure silver). Not plated base metal, not stainless steel — solid sterling throughout, providing the structural integrity and weight that defines fine jewelry.",
            },
            {
              "@type": "HowToStep",
              position: 3,
              name: "Hand-setting",
              text: "Each moissanite stone is hand-positioned and individually secured by a skilled artisan. Every stone must be perfectly aligned and locked before the next is placed. The result is a continuous, flawless line of VVS brilliance.",
            },
            {
              "@type": "HowToStep",
              position: 4,
              name: "Five-layer precious metal plating",
              text: "Each piece undergoes five layers of precious metal electroplating in your chosen finish — 18K yellow gold, white gold, or rose gold. Each layer bonds at a molecular level, producing a finish that resists tarnish and outlasts standard plating by years.",
            },
            {
              "@type": "HowToStep",
              position: 5,
              name: "Dual quality inspection and GRA certification",
              text: "Every finished piece passes two independent quality control checkpoints before it ships. We verify prong alignment, stone security, clasp integrity, and plating uniformity. A GRA certificate of authenticity accompanies every order.",
            },
          ],
          result: {
            "@type": "Product",
            name: "Fine VVS Moissanite Jewelry",
            material: "925 Sterling Silver with 5× precious metal plating",
            description: "Hand-set VVS1 D-color moissanite in solid S925 sterling silver. GRA certified.",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Our Craft", item: PAGE_URL },
          ],
        }),
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-20 pb-20 lg:pb-0 grid lg:grid-cols-2 gap-12 lg:gap-0 items-center">
          <div className="max-w-xl">
            <p className="eyebrow mb-4">Our Craft</p>
            <h1 className="font-display leading-[1.06]" style={{ fontSize: "clamp(2.8rem, 5.5vw, 5rem)" }}>
              Precision and<br />
              <em className="italic">permanence.</em><br />
              Nothing less.
            </h1>
            <p className="mt-8 text-muted-foreground text-lg leading-relaxed">
              Qureshi Jewelers was founded on a single conviction: fine jewelry should not
              be a luxury reserved for the few. Every piece we make begins with the same
              uncompromising standards used by the world's most storied houses — and ends
              with a price that reflects reality, not mythology.
            </p>
            <div className="mt-10 flex flex-wrap gap-6">
              {[
                { stat: "VVS1", label: "Clarity grade" },
                { stat: "D",    label: "Color (colorless)" },
                { stat: "5×",   label: "Plating layers" },
                { stat: "GRA",  label: "Certified" },
              ].map(({ stat, label }) => (
                <div key={stat} className="border-l-2 border-gold pl-4">
                  <p className="font-display text-3xl leading-none" style={{ color: "var(--gold)" }}>{stat}</p>
                  <p className="text-[0.56rem] uppercase tracking-[0.22em] text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:pl-10 aspect-[4/5] lg:aspect-auto lg:h-[600px] overflow-hidden">
            <img
              src="/tennischain.png"
              alt="VVS1 Moissanite Tennis Chain — Qureshi Jewelers"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── The Stones ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="aspect-[4/5] overflow-hidden order-2 lg:order-1">
          <img
            src={img.graphic3}
            alt="GRA moissanite certificate and stones"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="order-1 lg:order-2">
          <p className="eyebrow mb-4">The Stones</p>
          <h2 className="font-display text-4xl sm:text-5xl leading-[1.1]">
            VVS clarity.<br />D color.<br />GRA certified.
          </h2>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            Moissanite's refractive index of 2.65–2.69 surpasses diamond's 2.42 — meaning
            more light enters each stone, refracts more dramatically, and exits as fire. Our
            stones carry a <strong className="text-foreground font-medium">VVS1 clarity grade</strong> (Very Very Slightly Included) — flawless
            to the naked eye and under 10× magnification — and a{" "}
            <strong className="text-foreground font-medium">D color rating</strong>, the highest on the
            GIA scale. Completely colorless.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Every stone we use is lab-created, traceable, and{" "}
            <strong className="text-foreground font-medium">independently certified by the GRA</strong>{" "}
            (Gemstone Research Association). Your certificate ships with your order.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "VVS1 clarity — eye-clean under 10× magnification",
              "D color — completely colorless",
              "Round brilliant cut — 57-facet precision",
              "Refractive index 2.65–2.69 (exceeds diamond)",
              "GRA certificate with every piece",
            ].map(item => (
              <li key={item} className="flex items-start gap-2.5 text-[0.82rem] text-muted-foreground">
                <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: "var(--gold)" }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── The Metal ─────────────────────────────────────────────────────── */}
      <section className="bg-cream border-y border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <p className="eyebrow mb-4">The Foundation</p>
            <h2 className="font-display text-4xl sm:text-5xl leading-[1.1]">
              Solid S925.<br />Five layers of<br />precious metal.
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Every Qureshi piece is built on a foundation of{" "}
              <strong className="text-foreground font-medium">solid S925 sterling silver</strong> — 92.5%
              pure silver, cast as a single solid body. Not plated brass. Not stainless steel.
              The same base material used in heirloom-quality fine jewelry.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              From there, we apply{" "}
              <strong className="text-foreground font-medium">five layers of precious metal plating</strong>{" "}
              using an electroplating process borrowed from the luxury watch industry. Each
              layer bonds at a molecular level. The result resists tarnish, stands up to
              water, and maintains its brilliance through years of daily wear.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { finish: "18K Yellow Gold", hex: "#D4AF37" },
                { finish: "18K White Gold",  hex: "#E8E8F4" },
                { finish: "18K Rose Gold",   hex: "#B76E79" },
              ].map(({ finish, hex }) => (
                <div key={finish} className="border border-border p-4 flex flex-col items-center gap-2.5 text-center">
                  <span className="w-8 h-8 rounded-full ring-1 ring-border shadow-sm" style={{ backgroundColor: hex }} />
                  <span className="text-[0.56rem] uppercase tracking-[0.16em] text-muted-foreground leading-tight">{finish}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="aspect-[4/5] overflow-hidden">
            <img
              src={img.product4}
              alt="S925 sterling silver moissanite jewelry detail"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── The Setting ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="aspect-[4/5] overflow-hidden order-2 lg:order-1">
          <img
            src="/TennisBracelet/yellowgoldmain.jpg"
            alt="Hand-set moissanite 4-prong claw inlay setting"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="order-1 lg:order-2">
          <p className="eyebrow mb-4">The Setting</p>
          <h2 className="font-display text-4xl sm:text-5xl leading-[1.1]">
            Hand-set.<br />Stone by stone.
          </h2>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            Every stone in a Qureshi piece is positioned and secured by hand. Our{" "}
            <strong className="text-foreground font-medium">4-prong claw inlay setting</strong> holds
            each moissanite at precisely the right angle to maximise light entry and brilliance
            while exposing as much of the stone as possible to the eye.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            This is the most labor-intensive part of production — and it shows. No two
            stones shift, rattle, or catch. Each one sits immovably in its seat, aligned
            with every other across the full span of the piece.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "4-prong claw inlay — maximum stone exposure",
              "Hand-positioned for optical alignment",
              "Every prong individually inspected",
              "Double-locking box clasp on all chains and bracelets",
              "Hypoallergenic — lead, nickel, and cadmium free",
            ].map(item => (
              <li key={item} className="flex items-start gap-2.5 text-[0.82rem] text-muted-foreground">
                <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: "var(--gold)" }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── The Standard ──────────────────────────────────────────────────── */}
      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-28">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <p className="text-[0.52rem] uppercase tracking-[0.38em] text-background/40 mb-4">The Standard</p>
            <h2 className="font-display text-4xl sm:text-5xl leading-[1.1]">
              Twice inspected.<br />Once shipped.
            </h2>
            <p className="mt-6 text-background/65 leading-relaxed">
              Every Qureshi piece passes through two independent quality control checkpoints
              before it leaves our atelier. We verify prong alignment, stone security, clasp
              integrity, and plating uniformity. If anything is off — by any margin — it
              does not ship.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-background/10">
            {[
              {
                step: "01",
                title: "Stone Verification",
                body: "VVS1 clarity and D color confirmed under magnification. Every stone graded before setting.",
              },
              {
                step: "02",
                title: "Setting Inspection",
                body: "Prong alignment, stone security, and seating depth verified by hand on every individual stone.",
              },
              {
                step: "03",
                title: "Finish Review",
                body: "Plating uniformity, surface quality, and clasp function checked across the full piece.",
              },
              {
                step: "04",
                title: "GRA Certification",
                body: "An independent GRA certificate of authenticity issued for each order — verifying grade, cut, and carat.",
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="bg-foreground p-8 lg:p-10">
                <p className="font-display text-4xl text-background/15 mb-5">{step}</p>
                <p className="text-[0.56rem] uppercase tracking-[0.24em] text-background/40 mb-2">{title}</p>
                <p className="text-[0.82rem] text-background/65 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 lg:px-10 py-20 lg:py-28 text-center">
        <p className="eyebrow mb-4">The Collection</p>
        <h2 className="font-display text-4xl sm:text-5xl leading-[1.1]">
          Every piece, built to this standard.
        </h2>
        <p className="mt-6 text-muted-foreground leading-relaxed max-w-xl mx-auto">
          Tennis chains, bracelets, earrings, and rings — all hand-set in solid S925
          sterling silver with VVS1 D-color moissanite and five layers of precious metal
          plating. Each one GRA certified.
        </p>
        <Link
          to="/shop"
          className="inline-flex mt-10 bg-foreground text-background px-10 py-4 text-[0.60rem] uppercase tracking-[0.28em] hover:bg-foreground/85 transition-colors duration-300"
        >
          Shop the Collection
        </Link>
      </section>
    </>
  );
}
