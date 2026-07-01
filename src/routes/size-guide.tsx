import { createFileRoute, Link } from "@tanstack/react-router";
import { Ruler, HelpCircle, ArrowRight } from "lucide-react";

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://qureshijewelers.com").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/size-guide`;

export const Route = createFileRoute("/size-guide")({
  head: () => ({
    meta: [
      { title: "Tennis Chain & Bracelet Size Guide — Widths & Lengths | Qureshi Jewelers" },
      { name: "description", content: "Find your perfect fit. Tennis chain and bracelet size guide for 2mm, 3mm, 4mm, 5mm widths. Necklace lengths: 18, 20, 24 inches. Printable size guide included." },
      { property: "og:title", content: "Tennis Chain & Bracelet Size Guide — Widths & Lengths | Qureshi Jewelers" },
      { property: "og:description", content: "Find your perfect tennis chain or bracelet fit. 2mm to 5mm widths, 16\" to 24\" necklace lengths explained." },
      { property: "og:url", content: PAGE_URL },
      { property: "og:image", content: `${SITE_URL}/QURESHIJEWELERSLOGO.png` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Tennis Chain & Bracelet Size Guide | Qureshi Jewelers" },
      { name: "twitter:description", content: "Find your perfect fit: 2mm–5mm widths, 16\"–24\" necklace lengths, and bracelet sizing tips." },
      { name: "twitter:image", content: `${SITE_URL}/QURESHIJEWELERSLOGO.png` },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Size Guide", item: PAGE_URL },
          ],
        }),
      },
      // HowTo schema: "How to Choose the Right Tennis Chain Size"
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to Choose the Right Tennis Chain Size",
          description: "Step-by-step guide to selecting the perfect width and length for a moissanite tennis chain.",
          totalTime: "PT3M",
          step: [
            {
              "@type": "HowToStep",
              position: 1,
              name: "Decide on chain width",
              text: "2mm is subtle and ideal for layering. 3mm is the most popular, balancing visibility and elegance. 4mm makes a statement. 5mm is maximum ice — bold and highly visible.",
            },
            {
              "@type": "HowToStep",
              position: 2,
              name: "Choose your necklace length",
              text: "16\" sits at the base of the neck (very choker). 18\" sits at the collarbone — elegant and classic. 20\" falls just below the collarbone — the most purchased length. 24\" hangs mid-chest for a layered or pendant look.",
            },
            {
              "@type": "HowToStep",
              position: 3,
              name: "Choose your bracelet length",
              text: "Measure your wrist with a flexible tape. Add ½\" for a snug fit, or 1\" for a relaxed fit. Most adult wrists fit a 7\" or 8\" tennis bracelet. Our bracelets have a double-locking clasp for security.",
            },
            {
              "@type": "HowToStep",
              position: 4,
              name: "Consider metal finish",
              text: "Sterling Silver: cool and minimal. 18K Yellow Gold: warm and classic. Rose Gold: feminine and modern. White Gold: crisp and platinum-adjacent. All finishes use the same VVS moissanite set in solid S925 sterling silver with a 5x e-coating.",
            },
          ],
          about: { "@type": "Product", name: "Moissanite Tennis Chains", url: `${SITE_URL}/shop?type=necklace` },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to Measure Wrist Size for a Tennis Bracelet",
          description: "How to accurately measure your wrist to find the right moissanite tennis bracelet length.",
          totalTime: "PT2M",
          supply: [
            { "@type": "HowToSupply", name: "Flexible measuring tape or string" },
            { "@type": "HowToSupply", name: "Ruler (if using string)" },
          ],
          step: [
            {
              "@type": "HowToStep",
              position: 1,
              name: "Wrap the tape around your wrist",
              text: "Wrap a flexible measuring tape or a strip of paper just below your wrist bone (where you would naturally wear a bracelet). Keep it snug but not tight.",
            },
            {
              "@type": "HowToStep",
              position: 2,
              name: "Note the measurement",
              text: "Read the measurement in inches. This is your wrist circumference.",
            },
            {
              "@type": "HowToStep",
              position: 3,
              name: "Add for fit preference",
              text: "Add ½\" to your wrist measurement for a snug, secure fit. Add ¾\" to 1\" for a more relaxed drape. Most people with a 6.5\"–7.5\" wrist choose a 7\" bracelet. Those with a 7.5\"–8\" wrist usually prefer the 8\" option.",
            },
          ],
        }),
      },
    ],
  }),
  component: SizeGuide,
});

function SizeGuide() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-6 lg:px-10 pt-20 pb-16 text-center">
        <p className="eyebrow">Size Guide</p>
        <h1 className="mt-4 font-display text-5xl sm:text-6xl leading-[1.05]">
          Find your fit.
        </h1>
        <p className="mt-6 text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
          From whisper-thin to maximum ice. Here's how to choose the width, length, and
          bracelet size that's right for you.
        </p>
      </section>

      {/* Width Guide */}
      <section className="mx-auto max-w-6xl px-6 lg:px-10 pb-24">
        <p className="eyebrow">Width Guide</p>
        <h2 className="mt-3 font-display text-4xl">2mm · 3mm · 4mm · 5mm</h2>
        <p className="mt-4 text-muted-foreground max-w-xl">
          The width of your chain determines its visual impact. Here's how each size
          wears in real life.
        </p>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              size: "2mm",
              name: "Subtle",
              desc: "A delicate, refined look. Perfect for layering with other chains or for those who prefer understated elegance. Barely-there presence but undeniable quality.",
              best: "Layering, daily wear, minimalist style",
              visual: "w-8 h-8",
            },
            {
              size: "3mm",
              name: "Versatile",
              desc: "The sweet spot. Visible enough to catch light and attention, but not so bold that it overwhelms. Our most popular width for good reason.",
              best: "Everyday statement, first purchase, gifting",
              visual: "w-12 h-12",
            },
            {
              size: "4mm",
              name: "Statement",
              desc: "Bold presence. Each stone is sizeable enough to show serious ice without crossing into gaudy. Demands attention without shouting.",
              best: "Night out, special occasions, confident look",
              visual: "w-16 h-16",
            },
            {
              size: "5mm",
              name: "Bold",
              desc: "Maximum ice. The widest we make — each stone is a significant size. This is for the person who wants everyone to know they've arrived.",
              best: "Making an entrance, collector, bold style",
              visual: "w-20 h-20",
            },
          ].map((w) => (
            <div key={w.size} className="border border-border p-8">
              <div className="flex items-center gap-3">
                <div className={`${w.visual} rounded-full bg-foreground/10 flex items-center justify-center`}>
                  <Ruler className="h-5 w-5 text-foreground/40" />
                </div>
                <div>
                  <p className="font-display text-3xl">{w.size}</p>
                  <p className="eyebrow text-[0.6rem]">{w.name}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{w.desc}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.15em] text-foreground/60">
                Best for: <span className="text-foreground">{w.best}</span>
              </p>
              <Link
                to="/shop"
                className="inline-flex mt-4 items-center gap-1 text-xs uppercase tracking-[0.22em] border-b border-foreground pb-0.5 hover:text-muted-foreground transition-colors"
              >
                Shop {w.size} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Visual Size Comparison */}
      <section className="bg-cream border-y border-border">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 py-24">
          <p className="eyebrow text-center">Visual Comparison</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl text-center">
            See the difference.
          </h2>
          <p className="mt-4 text-muted-foreground text-center max-w-lg mx-auto">
            Actual size comparison of our four chain widths. The line represents
            the approximate visual width of each chain.
          </p>

          <div className="mt-16 space-y-10 max-w-2xl mx-auto">
            {(["2mm", "3mm", "4mm", "5mm"] as const).map((size) => {
              const widthClasses: Record<string, string> = {
                "2mm": "h-[2px] w-2/3",
                "3mm": "h-[3px] w-3/4",
                "4mm": "h-[4px] w-5/6",
                "5mm": "h-[5px] w-full",
              };
              return (
                <div key={size} className="flex items-center gap-6">
                  <span className="font-display text-2xl w-12">{size}</span>
                  <div className={`${widthClasses[size]} bg-foreground/20 rounded-full mx-auto`} />
                  <span className="text-xs text-muted-foreground w-24 text-right">
                    {size === "2mm" ? "Subtle" : size === "3mm" ? "Versatile" : size === "4mm" ? "Statement" : "Bold"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Length Guide */}
      <section className="mx-auto max-w-6xl px-6 lg:px-10 py-24">
        <p className="eyebrow">Chain Length Guide</p>
        <h2 className="mt-3 font-display text-4xl">18" · 20" · 24"</h2>
        <p className="mt-4 text-muted-foreground max-w-xl">
          The right length changes how your chain sits on your neckline. Here's
          how each length wears.
        </p>

        <div className="mt-10 grid md:grid-cols-3 gap-8">
          {[
            {
              length: '18"',
              name: "Choker",
              desc: "Sits snugly at the base of the neck, right at the collarbone. Creates a clean, intentional line. Ideal for layering with longer chains or wearing solo with open necklines.",
              best: "Open collars, layering, petite frames",
            },
            {
              length: '20"',
              name: "Classic",
              desc: "Falls just below the collarbone — the most versatile and popular length. Works with every neckline and fits most body types. If you're unsure, start here.",
              best: "Everyday wear, all necklines, most popular",
            },
            {
              length: '24"',
              name: "Long",
              desc: "Hangs mid-chest for a dramatic, elongating effect. Makes a bolder statement on its own or pairs beautifully with shorter chains for a layered look.",
              best: "Layering, deeper necklines, bold style",
            },
          ].map((l) => (
            <div key={l.length} className="border border-border p-8">
              <p className="font-display text-4xl">{l.length}</p>
              <p className="eyebrow mt-2">{l.name}</p>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{l.desc}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.15em] text-foreground/60">
                Best for: <span className="text-foreground">{l.best}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bracelet Sizing */}
      <section className="bg-cream border-y border-border">
        <div className="mx-auto max-w-4xl px-6 lg:px-10 py-24">
          <p className="eyebrow">Bracelet Sizing</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl">
            Standard 8" · Custom available
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed max-w-xl">
            Our tennis bracelets come in a standard 8-inch length, which fits most wrists.
            To measure your wrist: wrap a flexible tape measure snugly around your wrist
            bone, add 0.5-1 inch for comfort.
          </p>
          <div className="mt-10 grid sm:grid-cols-2 gap-8">
            <div className="border border-border bg-background p-8">
              <p className="font-display text-lg">How to measure your wrist</p>
              <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>1. Wrap a flexible tape measure around your wrist bone</li>
                <li>2. Make it snug — not tight</li>
                <li>3. Note the measurement in inches</li>
                <li>4. Add 0.5" for a comfortable fit</li>
                <li>5. Your bracelet size = wrist + 0.5"</li>
              </ol>
            </div>
            <div className="border border-border bg-background p-8">
              <p className="font-display text-lg">Quick reference</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>· 6.0-6.5" wrist → 7" bracelet</li>
                <li>· 6.5-7.0" wrist → 7.5" bracelet</li>
                <li>· 7.0-7.5" wrist → 8" bracelet (standard)</li>
                <li>· 7.5"+ wrist → 8.5"+ (custom)</li>
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                Need a custom length?{" "}
                <Link to="/contact" className="underline hover:text-foreground">
                  Contact us
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h2 className="font-display text-3xl">Ready to find your piece?</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Browse the full collection — or start with our most popular 3mm chains.
        </p>
        <Link
          to="/shop"
          className="inline-flex mt-6 items-center gap-2 bg-foreground text-background px-8 py-4 text-xs uppercase tracking-[0.22em]"
        >
          Shop the collection <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </>
  );
}