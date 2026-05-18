import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ShieldCheck, Award, Eye, Diamond, ArrowRight } from "lucide-react";
import { MOISSANITE_QUALITY, MOISSANITE_VS_DIAMOND } from "@/lib/pricing";

export const Route = createFileRoute("/moissanite-guide")({
  head: () => ({
    meta: [
      { title: "Moissanite Quality Guide — VVS, D Color, GRA | Qureshi Jewelers" },
      { name: "description", content: "Everything you need to know about moissanite quality: VVS clarity, D color, brilliant cut, and why moissanite outshines diamond. GRA certified guide." },
      { property: "og:title", content: "Moissanite Quality Guide — Qureshi Jewelers" },
      { property: "og:description", content: "Why VVS moissanite beats diamond on brilliance. Full quality education guide." },
      { property: "og:url", content: "/moissanite-guide" },
    ],
    links: [{ rel: "canonical", href: "/moissanite-guide" }],
  }),
  component: MoissaniteGuide,
});

function MoissaniteGuide() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 lg:px-10 pt-20 pb-16 text-center">
        <p className="eyebrow">The Moissanite Guide</p>
        <h1 className="mt-4 font-display text-5xl sm:text-6xl leading-[1.05]">
          The stone that <em className="italic">outshines</em> diamond.
        </h1>
        <p className="mt-6 text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
          Discover why moissanite — with its higher refractive index, VVS clarity, and D color grading —
          is redefining what "iced out" means. Every Qureshi piece is independently GRA certified.
        </p>
      </section>

      {/* What is Moissanite */}
      <section className="mx-auto max-w-6xl px-6 lg:px-10 grid lg:grid-cols-2 gap-12 items-center pb-24">
        <div className="aspect-square overflow-hidden bg-cream flex items-center justify-center">
          <div className="p-12 text-center">
            <Diamond className="h-16 w-16 mx-auto text-muted-foreground/30" />
            <p className="mt-4 text-sm text-muted-foreground">Silicon carbide crystal structure</p>
          </div>
        </div>
        <div>
          <p className="eyebrow">The Discovery</p>
          <h2 className="mt-3 font-display text-4xl">Born from a meteor. Cut for brilliance.</h2>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            Moissanite was first discovered in 1893 by Nobel Prize-winning chemist Dr. Henri Moissan
            in fragments of a meteorite. Natural moissanite is extremely rare — almost all moissanite
            today is lab-created through an advanced process that produces stones of exceptional clarity
            and optical purity.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Unlike diamond simulants (like cubic zirconia), moissanite is a true gemstone with its own
            distinct crystal structure — silicon carbide. This gives it optical properties that
            <strong> exceed diamond</strong> in brilliance and fire.
          </p>
        </div>
      </section>

      {/* The 4Cs of Moissanite */}
      <section className="bg-cream border-y border-border">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 py-24">
          <p className="eyebrow text-center">The 4Cs of Moissanite</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl text-center">Quality that's written in stone.</h2>
          <p className="mt-4 text-muted-foreground text-center max-w-lg mx-auto">
            We grade each stone on the same rigorous scale as fine diamonds. Here's what VVS, D color,
            and brilliant cut actually mean.
          </p>
          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Eye,
                ...MOISSANITE_QUALITY.clarity,
              },
              {
                icon: Award,
                ...MOISSANITE_QUALITY.color,
              },
              {
                icon: Diamond,
                ...MOISSANITE_QUALITY.cut,
              },
              {
                icon: ShieldCheck,
                ...MOISSANITE_QUALITY.certificate,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="border border-border bg-background p-8">
                  <Icon className="h-8 w-8 text-foreground/60" />
                  <h3 className="mt-4 font-display text-xl">{item.label}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Moissanite vs Diamond Comparison */}
      <section className="mx-auto max-w-5xl px-6 lg:px-10 py-24">
        <p className="eyebrow text-center">Moissanite vs Diamond</p>
        <h2 className="mt-3 font-display text-4xl sm:text-5xl text-center">
          Compare for yourself.
        </h2>
        <p className="mt-4 text-muted-foreground text-center max-w-lg mx-auto">
          The numbers don't lie. Moissanite outperforms diamond on brilliance, fire, and value —
          all while being conflict-free and eco-friendly.
        </p>

        <div className="mt-12 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 pr-6 font-medium">Attribute</th>
                <th className="text-left py-4 pr-6 font-medium">Moissanite</th>
                <th className="text-left py-4 pr-6 font-medium">Diamond</th>
                <th className="text-left py-4 font-medium">Winner</th>
              </tr>
            </thead>
            <tbody>
              {MOISSANITE_VS_DIAMOND.map((row) => (
                <tr key={row.attribute} className="border-b border-border/50">
                  <td className="py-4 pr-6 font-medium">{row.attribute}</td>
                  <td className={`py-4 pr-6 ${row.winner === "moissanite" ? "text-foreground font-medium" : "text-muted-foreground"}`}>{row.moissanite}</td>
                  <td className={`py-4 pr-6 ${row.winner === "diamond" ? "text-foreground font-medium" : "text-muted-foreground"}`}>{row.diamond}</td>
                  <td className="py-4">
                    {row.winner === "moissanite" ? (
                      <span className="bg-foreground text-background px-3 py-1 text-xs">Moissanite</span>
                    ) : row.winner === "diamond" ? (
                      <span className="bg-muted text-muted-foreground px-3 py-1 text-xs">Diamond</span>
                    ) : (
                      <span className="bg-muted text-muted-foreground px-3 py-1 text-xs">Tie</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* GRA Certificate */}
      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-4xl px-6 lg:px-10 py-24 text-center">
          <ShieldCheck className="h-12 w-12 mx-auto text-background/60" />
          <p className="eyebrow mt-6" style={{ color: "oklch(0.7 0.1 75)" }}>Your Guarantee</p>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl text-background">Every piece, GRA certified.</h2>
          <p className="mt-4 text-background/70 max-w-lg mx-auto leading-relaxed">
            The GRA (Gemological Research Academy) independently verifies each stone's clarity, color,
            and carat weight. Your certificate ships with your piece — no extra steps.
          </p>
          <Link
            to="/shop"
            className="inline-flex mt-10 items-center gap-3 bg-background text-foreground px-8 py-4 text-xs uppercase tracking-[0.22em] hover:bg-background/90 transition-colors"
          >
            Shop GRA certified pieces <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* FAQ about Moissanite */}
      <section className="mx-auto max-w-4xl px-6 lg:px-10 py-24">
        <p className="eyebrow text-center">FAQs</p>
        <h2 className="mt-3 font-display text-4xl text-center">Common questions.</h2>
        <div className="mt-12 space-y-8">
          {[
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
          ].map((faq) => (
            <div key={faq.q} className="border-b border-border pb-6">
              <h3 className="font-display text-xl">{faq.q}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}