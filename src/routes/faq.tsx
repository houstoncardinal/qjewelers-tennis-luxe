import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Truck, ShieldCheck, RefreshCw, Clock, CreditCard, Sparkles,
  HelpCircle,
} from "lucide-react";

// Hoisted to module scope so head() can build FAQPage schema from the exact
// same content the page renders — one source of truth, no drift risk between
// what's marked up and what's actually on the page (Google penalizes that).
const FAQ_CATEGORIES = [
  {
    label: "Shipping & Delivery",
    icon: Truck,
    items: [
      {
        q: "How long does shipping take?",
        a: "Orders are processed within 1-2 business days. Standard US shipping takes 3-7 business days. Express shipping (2-3 business days) is available at checkout. International shipping takes 7-14 business days depending on destination.",
      },
      {
        q: "Do you offer free shipping?",
        a: "Yes — free standard US shipping on all orders over $250. For orders under $250, shipping is a flat $15.",
      },
      {
        q: "Do you ship internationally?",
        a: "Yes, we ship worldwide. International shipping is calculated at checkout based on destination. Customs fees and import duties are the responsibility of the buyer.",
      },
      {
        q: "Can I track my order?",
        a: "Yes. Once your order ships, you'll receive a confirmation email with a tracking number. You can also reach out to concierge@qureshijewelers.com for status updates.",
      },
    ],
  },
  {
    label: "Returns & Exchanges",
    icon: RefreshCw,
    items: [
      {
        q: "What is your return policy?",
        a: "You may return your unworn Qureshi piece within 14 days of delivery for a full refund or exchange. Items must be in original condition with all packaging and GRA certificate included. Custom length pieces are final sale.",
      },
      {
        q: "How do I start a return?",
        a: "Email concierge@qureshijewelers.com with your order number and reason for return. We'll send you a prepaid return label. Refunds are processed within 5 business days of receiving the return.",
      },
      {
        q: "Can I exchange for a different size?",
        a: "Yes. If you ordered 4mm and want 5mm — or need a different length — we'll process the exchange. Email us at concierge@qureshijewelers.com to start the process.",
      },
    ],
  },
  {
    label: "Care & Maintenance",
    icon: Sparkles,
    items: [
      {
        q: "How do I clean my tennis chain?",
        a: "Gently wipe with a soft, lint-free cloth. For deeper cleaning, use warm water with mild soap and a soft toothbrush. Avoid ultrasonic cleaners and harsh chemicals. The e-coating is water-resistant but we recommend removing jewelry before swimming or showering.",
      },
      {
        q: "Does the plating wear off?",
        a: "Our 5x e-coating process bonds the plating at a molecular level, making it significantly more durable than standard jewelry plating. With normal wear, the finish will last for years. If the plating ever wears, we offer re-plating at a reduced cost.",
      },
      {
        q: "Is it safe to wear daily?",
        a: "Yes. Solid S925 sterling silver with 5x e-coating is designed for daily wear. The double-locking clasp ensures security. However, we recommend removing during intense physical activity, heavy lifting, or sleep.",
      },
    ],
  },
  {
    label: "Sizing & Fit",
    icon: HelpCircle,
    items: [
      {
        q: "How do I choose the right length?",
        a: "18\" sits at the collarbone (choker length). 20\" falls just below the collarbone — the most popular length. 24\" hangs mid-chest. For bracelets, our standard 8\" fits most wrists. See our size guide for more details.",
      },
      {
        q: "What width should I choose?",
        a: "2mm is subtle and elegant — great for layering. 3mm is the versatile sweet spot — visible but not overpowering. 4mm makes a statement. 5mm is bold and maximum ice. Your choice depends on personal style.",
      },
      {
        q: "Can I order a custom length?",
        a: "Yes. We can produce any chain length. Custom orders take 5-7 additional business days. Email concierge@qureshijewelers.com to discuss your custom length needs.",
      },
    ],
  },
  {
    label: "Payment & Security",
    icon: CreditCard,
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit cards (Visa, Mastercard, Amex, Discover), Apple Pay, Google Pay, and Shop Pay. Buy now, pay later options are coming soon.",
      },
      {
        q: "Is my payment information secure?",
        a: "Yes. All transactions are processed through encrypted, PCI-compliant payment gateways. We never store your full credit card information on our servers.",
      },
    ],
  },
  {
    label: "About Moissanite",
    icon: Sparkles,
    items: [
      {
        q: "What is moissanite jewelry?",
        a: "Moissanite is a naturally occurring gemstone (silicon carbide) first discovered in a meteorite by Dr. Henri Moissan in 1893. Today, nearly all moissanite is lab-created through an advanced thermal process that produces stones of exceptional clarity and optical purity. Moissanite jewelry uses these lab-grown stones set in precious metals like sterling silver or gold.",
      },
      {
        q: "Is moissanite real or fake?",
        a: "Moissanite is 100% real — it's a genuine gemstone with its own distinct chemical composition (silicon carbide, SiC). It is not a diamond simulant, cubic zirconia, or fake stone. It has its own crystal structure, hardness rating (9.25 on the Mohs scale), and optical properties that are measurably superior to diamond in brilliance and fire.",
      },
      {
        q: "Is moissanite better than diamond?",
        a: "In several measurable ways, yes. Moissanite has a higher refractive index (2.65–2.69 vs. diamond's 2.42), meaning it produces more brilliance and fire than a diamond of equal size. It scores 9.25 on the Mohs hardness scale (diamond is 10), making it the second hardest gemstone on earth. It is also dramatically more affordable — typically 90% less expensive than a comparable diamond — and is ethically sourced with zero mining impact.",
      },
      {
        q: "What does VVS moissanite mean?",
        a: "VVS stands for Very Very Slightly Included — the second-highest clarity grade on the gemological scale. VVS stones have inclusions so small they are virtually invisible even under 10x magnification, meaning the stone appears flawless to the naked eye. All Qureshi Jewelers pieces use VVS clarity moissanite for maximum brilliance with no visible imperfections.",
      },
      {
        q: "Does moissanite pass a diamond tester?",
        a: "Yes — moissanite passes standard thermal diamond testers because its thermal conductivity is similar to diamond. It will also pass electrical conductivity testers designed to distinguish moissanite from cubic zirconia. Only specialized dual-mode (thermal + electrical) testers will distinguish moissanite from diamond. This is further evidence that moissanite is a genuine, high-quality gemstone — not a cheap simulant.",
      },
      {
        q: "What is GRA certification for moissanite?",
        a: "GRA (Gemstone Research Association) is an independent gemological laboratory that tests and certifies moissanite stones. A GRA certificate verifies the stone's authenticity, clarity grade, color grade, and carat weight. Every piece from Qureshi Jewelers ships with a GRA certificate of authenticity so you have independent, third-party verification of your stone's quality.",
      },
      {
        q: "Why choose moissanite over diamond for a tennis chain?",
        a: "For iced-out jewelry like tennis chains and bracelets, moissanite is the superior choice for four reasons: (1) Brilliance — moissanite's higher refractive index produces more sparkle and fire than diamond. (2) Cost — get the same visual impact at a fraction of the price. (3) Ethics — lab-created, zero mining impact. (4) Durability — at 9.25 Mohs hardness, moissanite resists scratching and chipping in daily wear.",
      },
      {
        q: "Does moissanite lose its brilliance over time?",
        a: "No. Moissanite's optical properties are permanent and inherent to its crystal structure — not a surface treatment or coating. Unlike cubic zirconia, which clouds and loses brilliance over time, moissanite maintains its fire and sparkle indefinitely. Qureshi Jewelers backs every stone with a lifetime brilliance guarantee.",
      },
    ],
  },
];

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://qureshijewelers.com").replace(/\/$/, "");

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Moissanite Jewelry, Shipping & Returns | Qureshi Jewelers" },
      { name: "description", content: "Everything you need to know about Qureshi Jewelers moissanite tennis chains: what is moissanite, is it real, VVS vs diamond, GRA certification, shipping, returns, and care." },
      { property: "og:title", content: "FAQ — Moissanite Jewelry Explained | Qureshi Jewelers" },
      { property: "og:description", content: "Is moissanite real? Better than diamond? What does VVS mean? Plus shipping, returns, sizing, and care guides." },
      { property: "og:url", content: `${SITE_URL}/faq` },
      { property: "og:image", content: `${SITE_URL}/QURESHIJEWELERSLOGO.png` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "FAQ — Moissanite Jewelry Explained | Qureshi Jewelers" },
      { name: "twitter:description", content: "Is moissanite real? Better than diamond? What does VVS mean? Plus shipping, returns, sizing, and care." },
      { name: "twitter:image", content: `${SITE_URL}/QURESHIJEWELERSLOGO.png` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/faq` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "@id": `${SITE_URL}/faq#faqpage`,
          name: "Qureshi Jewelers FAQ — Moissanite Jewelry, Shipping & Returns",
          url: `${SITE_URL}/faq`,
          isPartOf: { "@id": `${SITE_URL}/#website` },
          about: [
            { "@type": "Thing", name: "Moissanite", sameAs: "https://en.wikipedia.org/wiki/Moissanite" },
            { "@type": "Organization", "@id": `${SITE_URL}/#organization` },
          ],
          speakable: {
            "@type": "SpeakableSpecification",
            cssSelector: ["h1", "h2", "h3", ".faq-answer"],
          },
          mainEntity: FAQ_CATEGORIES.flatMap((cat) =>
            cat.items.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.a,
                author: { "@id": `${SITE_URL}/#organization` },
              },
            }))
          ),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "FAQ", item: `${SITE_URL}/faq` },
          ],
        }),
      },
    ],
  }),
  component: FAQ,
});

function FAQ() {
  const categories = FAQ_CATEGORIES;

  return (
    <>
      <section className="mx-auto max-w-4xl px-6 lg:px-10 pt-20 pb-16 text-center">
        <p className="eyebrow">FAQ</p>
        <h1 className="mt-4 font-display text-5xl sm:text-6xl leading-[1.05]">
          Everything you need to know.
        </h1>
        <p className="mt-6 text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
          Shipping, returns, care, sizing — we've covered it all. Still have questions?
          {" "}<Link to="/contact" className="underline hover:text-foreground transition-colors">Contact us</Link>.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-6 lg:px-10 pb-24">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.label} className="mt-16 first:mt-0">
              <div className="flex items-center gap-3 mb-8">
                <Icon className="h-5 w-5 text-foreground/60" />
                <h2 className="font-display text-3xl">{cat.label}</h2>
              </div>
              <div className="space-y-6">
                {cat.items.map((item) => (
                  <div key={item.q} className="border-b border-border pb-6 last:border-b-0">
                    <h3 className="font-display text-xl">{item.q}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section className="bg-cream border-y border-border">
        <div className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h2 className="font-display text-3xl">Still have questions?</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Our concierge team responds within one business day.
          </p>
          <Link to="/contact" className="inline-flex mt-6 bg-foreground text-background px-8 py-4 text-xs uppercase tracking-[0.22em]">
            Get in touch
          </Link>
        </div>
      </section>
    </>
  );
}