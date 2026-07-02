import { createFileRoute } from "@tanstack/react-router";

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://qureshijewelers.com").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/refund-policy`;

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "Refund & Return Policy — Qureshi Jewelers" },
      { name: "description", content: "Qureshi Jewelers all-sales-final policy. Limited exceptions for damaged-on-arrival items and size exchanges. 1-year warranty available." },
      { property: "og:title", content: "Refund & Return Policy — Qureshi Jewelers" },
      { property: "og:description", content: "All sales are final at Qureshi Jewelers. Limited exceptions apply for damaged-on-arrival items and size/length exchanges." },
      { property: "og:url", content: PAGE_URL },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Refund Policy", item: PAGE_URL },
        ],
      }),
    }],
  }),
  component: RefundPolicy,
});

function RefundPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <p className="eyebrow mb-4">Legal</p>
      <h1 className="font-display text-4xl sm:text-5xl mb-4">Refund &amp; Return Policy</h1>
      <p className="text-sm text-muted-foreground mb-12">Last updated: July 2, 2026</p>

      <div className="space-y-10 text-[0.9rem] leading-relaxed text-foreground/80">

        {/* Banner */}
        <section className="border-2 border-foreground/20 bg-foreground/[0.03] p-6">
          <p className="text-[0.56rem] uppercase tracking-[0.30em] text-foreground/50 mb-2">Important</p>
          <p className="font-display text-xl text-foreground mb-3">All Sales Are Final</p>
          <p className="text-[0.82rem] leading-relaxed">
            We do not accept returns and we do not issue cash refunds. All purchases are
            final at the time of checkout. By completing your purchase, you confirm that you
            have reviewed product details, size information, and images, and accept this policy.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* Damaged on arrival */}
        <section>
          <p className="eyebrow mb-3">Exception 1</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Damaged-on-Arrival Items</h2>
          <p className="mb-3">
            If your item arrives visibly damaged or defective, you must notify us{" "}
            <strong className="text-foreground font-medium">within 48 hours of confirmed delivery</strong> (as
            recorded by the carrier's tracking system).
          </p>
          <p className="mb-3">To file a claim:</p>
          <ol className="list-decimal list-inside space-y-2 pl-2 mb-4">
            <li>
              Email{" "}
              <a href="mailto:support@qureshijewelers.com" className="underline hover:text-foreground transition-colors">
                support@qureshijewelers.com
              </a>{" "}
              with your order number
            </li>
            <li>Attach clear photographs showing the damage or defect</li>
          </ol>
          <p className="mb-3">
            If approved, we will either replace the item at no charge or issue store credit.{" "}
            <strong className="text-foreground font-medium">No cash refunds are issued even for damaged-on-arrival items.</strong>{" "}
            Claims submitted after the 48-hour window will not be accepted.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* Size exchange */}
        <section>
          <p className="eyebrow mb-3">Exception 2</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Size &amp; Length Exchange</h2>
          <p className="mb-3">
            If you need a different size or length, you may request an exchange within{" "}
            <strong className="text-foreground font-medium">7 days of confirmed delivery</strong>, provided:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 mb-4">
            <li>The item is unworn and unaltered</li>
            <li>The item is in its original packaging with all included accessories and documentation</li>
            <li>You have not previously used this exchange for the same order</li>
          </ul>
          <p className="mb-3">
            You are responsible for return shipping costs. Once we receive and inspect the item,
            we will fulfill the exchange for the requested size or length. If that option is
            unavailable, store credit will be issued.{" "}
            <strong className="text-foreground font-medium">This is a size/length swap only — not a product change or refund.</strong>
          </p>
          <p>
            Only one exchange is allowed per order. To begin, email{" "}
            <a href="mailto:support@qureshijewelers.com" className="underline hover:text-foreground transition-colors">
              support@qureshijewelers.com
            </a>{" "}
            with your order number and the size or length you need. Do not ship the item back
            until you receive written authorization.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* Store credit */}
        <section>
          <p className="eyebrow mb-3">Store Credit</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Store Credit</h2>
          <p>
            Where a remedy is applicable, we may issue store credit at our sole discretion.
            Store credit has no cash value, is non-transferable, and expires{" "}
            <strong className="text-foreground font-medium">12 months</strong> from the date of issuance. It
            may be applied to any future purchase on our Site while valid.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* Warranty */}
        <section>
          <p className="eyebrow mb-3">Warranty</p>
          <h2 className="font-display text-2xl text-foreground mb-4">1-Year Limited Warranty</h2>
          <p className="mb-3">
            Every Qureshi Jewelers piece includes a one-year limited warranty against manufacturing
            defects (stone falling out, clasp failure, plating defects). The warranty does not
            cover loss, theft, accidental damage, water damage, chemical exposure, or normal wear
            and tear.
          </p>
          <p className="mb-3">
            To make a warranty claim, email{" "}
            <a href="mailto:support@qureshijewelers.com" className="underline hover:text-foreground transition-colors">
              support@qureshijewelers.com
            </a>{" "}
            with your order number and photographs. If approved, ship the item to our facility
            at your expense. A repair deductible applies:{" "}
            <strong className="text-foreground font-medium">$50 for minor repairs, $100 for major repairs</strong>,
            charged before work begins. Turnaround is 3–6 weeks. The warranty is non-transferable
            and applies only to the original purchaser.
          </p>
          <p>
            For full warranty terms, see our{" "}
            <a href="/terms-of-service#warranty" className="underline hover:text-foreground transition-colors">
              Terms &amp; Conditions, Section 8
            </a>
            .
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* Chargebacks */}
        <section>
          <p className="eyebrow mb-3">Chargebacks</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Chargebacks &amp; Disputes</h2>
          <p>
            Initiating a chargeback for a purchase that does not qualify under the exceptions
            above is a violation of these Terms and will be treated as fraudulent. We will
            contest all such chargebacks and permanently terminate accounts associated with
            unauthorized disputes.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* Contact */}
        <section>
          <p className="eyebrow mb-3">Questions</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Contact Us</h2>
          <p className="mb-4">
            If you have questions about your order or this policy, reach out — we typically
            respond within one business day.
          </p>
          <div className="border border-[#e8e3dc] bg-[#faf9f7] p-5 text-[0.82rem] space-y-1">
            <p className="font-medium text-foreground">Qureshi Jewelers</p>
            <p>
              Email:{" "}
              <a href="mailto:support@qureshijewelers.com" className="underline hover:text-foreground transition-colors">
                support@qureshijewelers.com
              </a>
            </p>
            <p>Website: qureshijewelers.com</p>
          </div>
        </section>

      </div>
    </div>
  );
}
