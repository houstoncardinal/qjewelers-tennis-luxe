import { createFileRoute, Link } from "@tanstack/react-router";
import { images as img } from "@/lib/product-images";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Craft — S925 Moissanite Tennis Chains | Qureshi Jewelers" },
      { name: "description", content: "Inside the Qureshi workshop: how we hand-set VVS moissanite into solid S925 sterling silver, layered with five coats of e-coating for lifetime brilliance." },
      { property: "og:title", content: "Our Craft — Qureshi Jewelers" },
      { property: "og:description", content: "Hand-set VVS moissanite in S925 sterling silver. GRA certified. Lifetime brilliance." },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

function About() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-6 lg:px-10 pt-20 pb-16 text-center">
        <p className="eyebrow">Our Craft</p>
        <h1 className="mt-4 font-display text-5xl sm:text-6xl leading-[1.05]">
          Built for the people <em className="italic">who notice</em>.
        </h1>
        <p className="mt-6 text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
          Qureshi Jewelers is America's destination for S925 sterling silver, VVS moissanite tennis chains.
          We exist for one reason: to make iced out look — and last — the way it should.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 lg:px-10 grid lg:grid-cols-2 gap-12 items-center">
        <div className="aspect-[4/5] overflow-hidden">
          <img src={img.graphic3} alt="GRA moissanite certificate" className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="eyebrow">The Stones</p>
          <h2 className="mt-3 font-display text-4xl">VVS clarity. D color. GRA certified.</h2>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            Moissanite outperforms diamond on the only metric that matters in light:
            brilliance. Our stones are graded VVS (Very Very Slightly included) — the
            highest practical clarity — and D color, the most colorless on the GIA scale.
            Each piece ships with an independent GRA certificate.
          </p>
        </div>
      </section>

      <section className="bg-cream border-y border-border mt-24">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <p className="eyebrow">The Metal</p>
            <h2 className="mt-3 font-display text-4xl">Solid S925. Five layers of plating.</h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Every chain starts as a solid 925 sterling silver core — not plated brass,
              not stainless steel. From there, we apply five layers of precious metal
              plating bonded by e-coating, the same process used on luxury watches. The
              result resists tarnish, water, and the daily abuse of a real life.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              <li>· 925 sterling silver core</li>
              <li>· 5× rhodium / 18K gold / rose gold plating</li>
              <li>· Proprietary e-coating finish</li>
              <li>· Lead, nickel, cadmium free</li>
              <li>· Hand-set four-prong stones</li>
              <li>· Double-locking custom box clasp</li>
            </ul>
          </div>
          <div className="order-1 lg:order-2 aspect-[4/5] overflow-hidden">
            <img src={img.product4} alt="Detail of S925 tennis chains" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 lg:px-10 py-24 text-center">
        <p className="eyebrow">The Promise</p>
        <h2 className="mt-3 font-display text-4xl sm:text-5xl">Twice-checked. Once-shipped.</h2>
        <p className="mt-6 text-muted-foreground leading-relaxed">
          Every Qureshi piece passes through two independent QC stations before it's
          packed. If anything's off — a single loose prong, a millimeter of color drift —
          it doesn't ship. Period.
        </p>
        <Link to="/shop" className="inline-flex mt-10 bg-foreground text-background px-8 py-4 text-xs uppercase tracking-[0.22em]">
          Shop the collection
        </Link>
      </section>
    </>
  );
}
