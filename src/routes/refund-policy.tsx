import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "Refund Policy — Qureshi Jewelers" },
      { name: "description", content: "14-day return and refund policy for Qureshi Jewelers moissanite jewelry." },
    ],
  }),
  component: RefundPolicy,
});

function RefundPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <p className="eyebrow mb-4">Legal</p>
      <h1 className="font-display text-4xl sm:text-5xl mb-8">Refund Policy</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: June 15, 2026</p>

      <div className="prose prose-sm max-w-none space-y-8 text-[0.9rem] leading-relaxed text-foreground/80">

        <section className="border border-[#e8e3dc] p-6">
          <p className="text-base font-medium text-foreground">Our return window: <span className="text-[oklch(0.60_0.092_68)]">14 days</span> from delivery date</p>
          <p className="mt-2">We stand behind the quality of every piece we make. If you're not completely satisfied, we'll make it right.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">Eligibility</h2>
          <p>To be eligible for a return, your item must be:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 mt-2">
            <li>Returned within 14 days of the delivery date</li>
            <li>In the same condition that you received it</li>
            <li>In the original packaging with all included accessories and documentation</li>
            <li>Accompanied by proof of purchase (order number)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">Non-Returnable Items</h2>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Custom or personalized / engraved pieces</li>
            <li>Items that have been worn, damaged, or altered after delivery</li>
            <li>Final sale items (clearly marked at time of purchase)</li>
            <li>Items returned after the 14-day window without prior approval</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">How to Start a Return</h2>
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>Visit our <Link to="/returns" className="underline hover:text-foreground transition-colors">returns page</Link> and submit a return request with your order number and email</li>
            <li>Our team will review your request within 1–2 business days</li>
            <li>Upon approval, we'll email you a prepaid return shipping label</li>
            <li>Pack the item securely and drop it off at any authorized shipping location</li>
            <li>Refund processed within 3–5 business days of receiving the return</li>
          </ol>
          <p className="mt-4 text-sm">Do not ship your item back before receiving approval — unauthorized returns cannot be tracked or processed.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">Refunds</h2>
          <p>Once your return is received and inspected, we'll notify you of the approval or rejection of your refund. Approved refunds are credited to your original payment method within 3–5 business days. Please allow additional time for your bank or card issuer to process the credit.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">Exchanges</h2>
          <p>We only replace items that are defective or damaged upon arrival. If you'd like a different size or style, please return the original item (if eligible) and place a new order.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">Damaged or Defective Items</h2>
          <p>If you receive a damaged or defective item, contact us within 48 hours of delivery at <a href="mailto:support@qureshijewelers.com" className="underline hover:text-foreground transition-colors">support@qureshijewelers.com</a> with photos. We will arrange a replacement or full refund at no cost to you.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">Contact</h2>
          <p>Have questions? Contact our support team at <a href="mailto:support@qureshijewelers.com" className="underline hover:text-foreground transition-colors">support@qureshijewelers.com</a> — we typically respond within one business day.</p>
        </section>
      </div>
    </div>
  );
}
