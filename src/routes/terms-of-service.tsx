import { createFileRoute } from "@tanstack/react-router";

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://qureshijewelers.com").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/terms-of-service`;

export const Route = createFileRoute("/terms-of-service")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Qureshi Jewelers" },
      { name: "description", content: "Terms of service for Qureshi Jewelers. Please read before making a purchase." },
      { property: "og:url", content: PAGE_URL },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Terms of Service", item: PAGE_URL },
        ],
      }),
    }],
  }),
  component: TermsOfService,
});

function TermsOfService() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <p className="eyebrow mb-4">Legal</p>
      <h1 className="font-display text-4xl sm:text-5xl mb-8">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: June 15, 2026</p>

      <div className="prose prose-sm max-w-none space-y-8 text-[0.9rem] leading-relaxed text-foreground/80">

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">1. Acceptance of Terms</h2>
          <p>By accessing and using the Qureshi Jewelers website and purchasing our products, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our site.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">2. Products</h2>
          <p>All products sold on our website are handcrafted using S925 sterling silver with VVS moissanite stones. GRA (Gemological Research Association) certificates are included with every purchase. We reserve the right to discontinue any product at any time.</p>
          <p className="mt-3">Product images are for illustrative purposes. Colors may vary slightly depending on your screen settings and lighting conditions.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">3. Pricing and Payment</h2>
          <p>All prices are listed in US Dollars (USD) and are subject to change without notice. We reserve the right to refuse or cancel orders if a product is listed at an incorrect price due to a typographical error.</p>
          <p className="mt-3">Payment is processed securely via Stripe. By submitting your payment information, you authorize us to charge the full order amount to your provided payment method.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">4. Shipping</h2>
          <p>We offer standard (5–7 business days), express (2–3 business days), and overnight shipping within the United States. Free standard shipping is available on qualifying orders. International shipping may be available on a case-by-case basis — contact us for details.</p>
          <p className="mt-3">We are not responsible for delays caused by the carrier, customs, or unforeseen circumstances. Risk of loss and title for products pass to you upon delivery.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">5. Returns and Refunds</h2>
          <p>We offer a 14-day return window from the date of delivery. Items must be returned in their original condition and packaging. Custom or engraved items are non-refundable. Please see our <a href="/refund-policy" className="underline hover:text-foreground transition-colors">Refund Policy</a> for full details.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">6. Intellectual Property</h2>
          <p>All content on this website — including text, images, logos, and designs — is the property of Qureshi Jewelers and is protected by applicable intellectual property laws. Unauthorized use, reproduction, or distribution of our content is strictly prohibited.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">7. Limitation of Liability</h2>
          <p>To the fullest extent permitted by law, Qureshi Jewelers shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our products or website. Our total liability shall not exceed the amount paid for the specific product that is the subject of the claim.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">8. Governing Law</h2>
          <p>These terms shall be governed by the laws of the United States, without regard to conflict of law provisions. Any disputes shall be resolved through binding arbitration.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">9. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of our website after changes constitutes your acceptance of the updated terms.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">10. Contact</h2>
          <p>Questions about these terms? Email us at <a href="mailto:support@qureshijewelers.com" className="underline hover:text-foreground transition-colors">support@qureshijewelers.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
