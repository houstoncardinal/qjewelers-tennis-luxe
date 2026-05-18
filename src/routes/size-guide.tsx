import { createFileRoute, Link } from "@tanstack/react-router";
import { Ruler, HelpCircle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/size-guide")({
  head: () => ({
    meta: [
      { title: "Tennis Chain & Bracelet Size Guide — Widths & Lengths | Qureshi Jewelers" },
      { name: "description", content: "Find your perfect fit. Tennis chain and bracelet size guide for 2mm, 3mm, 4mm, 5mm widths. Necklace lengths: 18, 20, 24 inches. Printable size guide included." },
      { property: "og:title", content: "Size Guide — Qureshi Jewelers" },
      { property: "og:description", content: "Find your perfect tennis chain or bracelet fit. Widths, lengths, and sizing tips." },
      { property: "og:url", content: "/size-guide" },
    ],
    links: [{ rel: "canonical", href: "/size-guide" }],
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