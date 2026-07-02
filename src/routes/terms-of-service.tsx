import { createFileRoute } from "@tanstack/react-router";

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://qureshijewelers.com").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/terms-of-service`;

export const Route = createFileRoute("/terms-of-service")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Qureshi Jewelers" },
      { name: "description", content: "Terms and conditions, return policy, and warranty policy for Qureshi Jewelers. All sales are final. Please read before purchasing." },
      { property: "og:title", content: "Terms & Conditions — Qureshi Jewelers" },
      { property: "og:description", content: "Qureshi Jewelers terms of service including our all-sales-final policy, limited exchange window, and 1-year warranty." },
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
          { "@type": "ListItem", position: 2, name: "Terms & Conditions", item: PAGE_URL },
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
      <h1 className="font-display text-4xl sm:text-5xl mb-4">Terms &amp; Conditions</h1>
      <p className="text-sm text-muted-foreground mb-12">Last updated: July 2, 2026</p>

      <div className="space-y-10 text-[0.9rem] leading-relaxed text-foreground/80">

        {/* Intro */}
        <section className="border border-[#e8e3dc] bg-[#faf9f7] p-6">
          <p className="text-[0.82rem] leading-relaxed">
            These Terms &amp; Conditions ("Terms") govern your use of the Qureshi Jewelers
            website at <strong className="text-foreground font-medium">qureshijewelers.com</strong> (the "Site") and any
            purchase you make through it. By accessing the Site or placing an order, you agree
            to be bound by these Terms in full. If you do not agree, please do not use the Site
            or place an order.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* IMPORTANT: All Sales Final Banner */}
        <section className="border-2 border-foreground/20 bg-foreground/[0.03] p-6">
          <p className="text-[0.56rem] uppercase tracking-[0.30em] text-foreground/50 mb-2">Important Notice</p>
          <p className="font-display text-xl text-foreground mb-3">All Sales Are Final</p>
          <p className="text-[0.82rem] leading-relaxed">
            <strong className="text-foreground font-medium">We do not accept returns or issue refunds.</strong> All purchases made
            on this Site are final at the time of checkout. By completing your purchase, you
            acknowledge and agree to this policy. Please review your order carefully before
            submitting payment. Limited exceptions for damaged-on-arrival items and size/length
            exchanges are described in Section 7 below.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* 1 */}
        <section>
          <p className="eyebrow mb-3">Section 1</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Acceptance of Terms</h2>
          <p>
            By accessing the Site, creating an account, or placing an order, you represent that
            you are at least 18 years of age, have legal capacity to enter a binding contract,
            and agree to these Terms and our{" "}
            <a href="/privacy-policy" className="underline hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            . These Terms apply to all visitors, users, and customers.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* 2 */}
        <section>
          <p className="eyebrow mb-3">Section 2</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Products &amp; Descriptions</h2>
          <p className="mb-3">
            All Qureshi Jewelers products are handcrafted using an S925 sterling silver base
            (92.5% pure silver) with 18K precious metal plating in your choice of yellow gold,
            white gold, or rose gold. Moissanite stones are VVS1 clarity, D color (colorless),
            lab-created, and independently certified by the GRA (Gemological Research
            Association). A GRA certificate of authenticity is included with every order.
          </p>
          <p className="mb-3">
            Product photographs are as accurate as we can make them. Colors, stone sparkle, and
            plating sheen may appear slightly different depending on your monitor calibration,
            ambient lighting, and photography conditions. Minor variations do not constitute a
            defect.
          </p>
          <p>
            We reserve the right to discontinue, modify, or limit availability of any product
            at any time without notice. Listing a product does not guarantee it will be in stock
            at the time of your order.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* 3 */}
        <section>
          <p className="eyebrow mb-3">Section 3</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Pricing &amp; Payment</h2>
          <p className="mb-3">
            All prices are listed in United States Dollars (USD) and are subject to change
            without notice. Sales tax will be calculated and displayed at checkout where
            applicable.
          </p>
          <p className="mb-3">
            We reserve the right to refuse or cancel any order if a product is listed at an
            incorrect price due to a typographical error or technical fault. If your order is
            cancelled for this reason, you will receive a full refund of any amount charged.
          </p>
          <p className="mb-3">
            Payments are processed by <strong className="text-foreground font-medium">Stripe</strong> and{" "}
            <strong className="text-foreground font-medium">PayPal</strong>. By submitting your payment
            information, you authorize us to charge the full order total to your chosen payment
            method. Card data is entered directly into Stripe's secure hosted iframe and is
            never transmitted to or stored on our servers. Our integration is PCI SAQ A
            compliant.
          </p>
          <p>
            Your order is not confirmed until payment is successfully authorized. We may cancel
            orders suspected of fraudulent activity at our sole discretion.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* 4 */}
        <section>
          <p className="eyebrow mb-3">Section 4</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Shipping &amp; Delivery</h2>
          <p className="mb-3">
            We offer standard (5–7 business days), express (2–3 business days), and overnight
            shipping within the United States. Free standard shipping is available on qualifying
            orders. International shipping may be available on a case-by-case basis — contact us
            for details.
          </p>
          <p className="mb-3">
            Delivery estimates are provided by our shipping carriers and are not guaranteed.
            Qureshi Jewelers is not responsible for delays caused by the carrier, weather events,
            customs, or other circumstances beyond our control. Risk of loss and title pass to
            you upon delivery to the carrier.
          </p>
          <p>
            Shipment confirmation and tracking information will be sent to the email address on
            your order. It is your responsibility to ensure the delivery address you provide is
            accurate. We are not responsible for orders lost or delayed due to an incorrect
            address provided at checkout.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* 5 */}
        <section>
          <p className="eyebrow mb-3">Section 5</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Accounts &amp; Authentication</h2>
          <p className="mb-3">
            You may create an account using an email address and password or via Google OAuth.
            If you use Google OAuth, we receive only your name, email address, and profile
            picture — nothing else from your Google account.
          </p>
          <p className="mb-3">
            You are responsible for maintaining the confidentiality of your login credentials
            and for all activity that occurs under your account. Notify us immediately at{" "}
            <a href="mailto:support@qureshijewelers.com" className="underline hover:text-foreground transition-colors">
              support@qureshijewelers.com
            </a>{" "}
            if you suspect unauthorized access.
          </p>
          <p>
            We reserve the right to suspend or terminate accounts that violate these Terms,
            engage in fraudulent activity, or initiate chargebacks that do not qualify under
            Section 7.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* 6 */}
        <section>
          <p className="eyebrow mb-3">Section 6</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Intellectual Property</h2>
          <p>
            All content on this Site — including but not limited to text, photographs, product
            images, logos, brand marks, and design elements — is the proprietary property of
            Qureshi Jewelers and is protected by applicable copyright, trademark, and
            intellectual property laws. You may not reproduce, distribute, modify, create
            derivative works from, publicly display, or exploit any content from this Site
            without our prior written consent.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* 7 — Sales Final / Return Policy — most important section */}
        <section>
          <p className="eyebrow mb-3">Section 7</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Sales &amp; Return Policy</h2>

          <h3 className="text-[0.72rem] uppercase tracking-[0.18em] text-foreground/60 mb-2 mt-0">7.1 All Sales Final</h3>
          <p className="mb-4">
            <strong className="text-foreground font-medium">All purchases are final. We do not accept returns, and we do not issue cash refunds under any circumstances.</strong>{" "}
            By placing an order, you acknowledge that you have reviewed the product description,
            size/measurement information, and images, and accept that the sale is complete upon
            payment authorization. The limited exceptions in Sections 7.2 and 7.3 below are the
            only situations in which any remedy will be provided.
          </p>

          <h3 className="text-[0.72rem] uppercase tracking-[0.18em] text-foreground/60 mb-2 mt-5">7.2 Damaged-on-Arrival Exception</h3>
          <p className="mb-3">
            If your order arrives visibly damaged or with a manufacturing defect that was present
            before or during shipping, you must:
          </p>
          <ol className="list-decimal list-inside space-y-2 pl-2 mb-3">
            <li>
              Email us at{" "}
              <a href="mailto:support@qureshijewelers.com" className="underline hover:text-foreground transition-colors">
                support@qureshijewelers.com
              </a>{" "}
              <strong className="text-foreground font-medium">within 48 hours of confirmed delivery</strong> as recorded by the
              carrier's tracking system
            </li>
            <li>Include your order number and clear photographs showing the damage or defect</li>
          </ol>
          <p className="mb-3">
            If the claim is approved, we will, at our sole discretion, either:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 mb-3">
            <li>Replace the item at no charge to you, or</li>
            <li>Issue store credit in the amount of the item's purchase price</li>
          </ul>
          <p className="mb-4">
            <strong className="text-foreground font-medium">No cash refunds will be issued even for damaged-on-arrival items.</strong>{" "}
            Claims submitted after the 48-hour window will not be accepted.
          </p>

          <h3 className="text-[0.72rem] uppercase tracking-[0.18em] text-foreground/60 mb-2 mt-5">7.3 Size &amp; Length Exchange (7-Day Window)</h3>
          <p className="mb-3">
            If you ordered the wrong size or length, you may request an exchange subject to all
            of the following conditions:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 mb-3">
            <li>The request must be submitted within <strong className="text-foreground font-medium">7 days of confirmed delivery</strong></li>
            <li>The item must be <strong className="text-foreground font-medium">unworn</strong>, unaltered, and in its original packaging with all included accessories and documentation</li>
            <li>You are responsible for all return shipping costs to our facility</li>
            <li>Only one exchange is permitted per order</li>
          </ul>
          <p className="mb-4">
            An approved exchange results in a replacement of the same item in your requested size
            or length, or — if that option is unavailable — store credit. This exchange program
            does not entitle you to a different product, a different style, or a cash refund.
          </p>
          <p className="mb-3">
            To initiate an exchange request, email{" "}
            <a href="mailto:support@qureshijewelers.com" className="underline hover:text-foreground transition-colors">
              support@qureshijewelers.com
            </a>{" "}
            with your order number and the size or length you need. Do not ship the item back
            before receiving written authorization from us.
          </p>

          <h3 className="text-[0.72rem] uppercase tracking-[0.18em] text-foreground/60 mb-2 mt-5">7.4 Store Credit</h3>
          <p className="mb-4">
            At our sole discretion, we may issue store credit in lieu of a replacement. Store
            credit:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 mb-4">
            <li>Has no cash value and cannot be redeemed for cash or transferred to another account</li>
            <li>Expires 12 months from the date of issuance</li>
            <li>May be applied to any future purchase on the Site, subject to availability</li>
          </ul>

          <h3 className="text-[0.72rem] uppercase tracking-[0.18em] text-foreground/60 mb-2 mt-5">7.5 Chargebacks &amp; Payment Disputes</h3>
          <p>
            Initiating a chargeback or payment dispute with your card issuer or PayPal for a
            purchase that does not qualify under Sections 7.2 or 7.3 above is considered a
            material breach of these Terms and is regarded as fraudulent misrepresentation to a
            financial institution. We will contest all such chargebacks with full documentation
            of the transaction, these Terms, and your agreement to them at checkout. Accounts
            associated with unauthorized chargebacks will be permanently terminated and the
            matter may be referred to relevant legal authorities.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* 8 — Warranty */}
        <section>
          <p className="eyebrow mb-3">Section 8</p>
          <h2 className="font-display text-2xl text-foreground mb-4">1-Year Limited Warranty</h2>

          <h3 className="text-[0.72rem] uppercase tracking-[0.18em] text-foreground/60 mb-2 mt-0">8.1 Coverage</h3>
          <p className="mb-3">
            Qureshi Jewelers provides a <strong className="text-foreground font-medium">one (1) year limited warranty</strong> to the
            original purchaser against manufacturing defects from the date of delivery. This
            warranty covers:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 mb-4">
            <li>Moissanite stone falling out of its setting under normal wear</li>
            <li>Clasp failure under normal use</li>
            <li>Prong failure resulting in stone loss</li>
            <li>Significant plating irregularity or defect present at time of manufacture</li>
            <li>Other manufacturing defects confirmed upon inspection</li>
          </ul>

          <h3 className="text-[0.72rem] uppercase tracking-[0.18em] text-foreground/60 mb-2 mt-0">8.2 Exclusions</h3>
          <p className="mb-3">This warranty does <strong className="text-foreground font-medium">not</strong> cover:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 mb-4">
            <li>Loss or theft of the item</li>
            <li>Intentional damage</li>
            <li>Accidental damage (dropping, crushing, bending beyond normal wear)</li>
            <li>Damage caused by water, chemicals, harsh cleaning agents, or improper storage</li>
            <li>Normal wear and tear, including gradual plating wear over time</li>
            <li>Repairs or modifications performed by any party other than Qureshi Jewelers</li>
          </ul>

          <h3 className="text-[0.72rem] uppercase tracking-[0.18em] text-foreground/60 mb-2 mt-0">8.3 How to Make a Warranty Claim</h3>
          <ol className="list-decimal list-inside space-y-2 pl-2 mb-4">
            <li>
              Email{" "}
              <a href="mailto:support@qureshijewelers.com" className="underline hover:text-foreground transition-colors">
                support@qureshijewelers.com
              </a>{" "}
              with your original order number and clear photographs documenting the defect
            </li>
            <li>Our team will evaluate the claim and, if approved, provide a return shipping address</li>
            <li>
              You are responsible for shipping the item to our facility at your expense. We
              recommend insured tracked shipping — we are not responsible for items lost in transit
              to us
            </li>
            <li>
              Upon receipt, we will assess the item. A repair deductible (see Section 8.4) will
              be charged before work begins
            </li>
            <li>Once repair is complete, we will ship the item back to you at no additional charge</li>
          </ol>

          <h3 className="text-[0.72rem] uppercase tracking-[0.18em] text-foreground/60 mb-2 mt-0">8.4 Repair Deductibles</h3>
          <p className="mb-3">
            All warranty repairs require a deductible payable before work begins:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 mb-4">
            <li><strong className="text-foreground font-medium">Minor repairs</strong> (e.g., re-setting a single stone, clasp replacement): <strong className="text-foreground font-medium">$50</strong></li>
            <li><strong className="text-foreground font-medium">Major repairs</strong> (e.g., multiple stone loss, structural damage to setting): <strong className="text-foreground font-medium">$100</strong></li>
          </ul>
          <p className="mb-4">
            The classification of "minor" vs. "major" is determined by Qureshi Jewelers upon
            inspection of the returned item.
          </p>

          <h3 className="text-[0.72rem] uppercase tracking-[0.18em] text-foreground/60 mb-2 mt-0">8.5 Turnaround &amp; Transferability</h3>
          <p className="mb-3">
            Warranty repairs typically take <strong className="text-foreground font-medium">3 to 6 weeks</strong> from the date we
            receive the item. Turnaround times may vary based on workload and parts availability;
            we will communicate any significant delays.
          </p>
          <p>
            This warranty is <strong className="text-foreground font-medium">non-transferable</strong> and applies only to the
            original purchaser. Proof of purchase (original order number) is required to make a
            warranty claim.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* 9 */}
        <section>
          <p className="eyebrow mb-3">Section 9</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Disclaimer of Warranties</h2>
          <p className="mb-3">
            Except for the limited warranty expressly set out in Section 8, the Site and all
            products are provided "as is" and "as available" without any representation or
            warranty of any kind, whether express, implied, or statutory, including but not
            limited to implied warranties of merchantability, fitness for a particular purpose,
            title, and non-infringement.
          </p>
          <p>
            We do not warrant that the Site will be uninterrupted, error-free, or free of
            viruses or other harmful components.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* 10 */}
        <section>
          <p className="eyebrow mb-3">Section 10</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Limitation of Liability</h2>
          <p className="mb-3">
            To the fullest extent permitted by applicable law, Qureshi Jewelers, its owners,
            employees, agents, and suppliers shall not be liable for any indirect, incidental,
            special, consequential, exemplary, or punitive damages arising out of or related
            to your use of the Site or purchase of products, even if we have been advised of
            the possibility of such damages.
          </p>
          <p>
            In all cases, our total cumulative liability to you for any claim arising out of or
            relating to these Terms or your purchase shall not exceed the amount actually paid
            by you for the specific product that is the subject of the claim.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* 11 */}
        <section>
          <p className="eyebrow mb-3">Section 11</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Governing Law &amp; Dispute Resolution</h2>
          <p className="mb-3">
            These Terms shall be governed by and construed in accordance with the laws of the
            United States, without regard to conflict-of-law principles. Any dispute, claim, or
            controversy arising out of or relating to these Terms or your purchase shall be
            resolved exclusively by binding arbitration rather than in court, except that either
            party may bring claims in small claims court if the claim qualifies.
          </p>
          <p>
            You waive any right to participate in a class-action lawsuit or class-wide arbitration
            against Qureshi Jewelers.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* 12 */}
        <section>
          <p className="eyebrow mb-3">Section 12</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Changes to These Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. When we do, we will update
            the "Last updated" date at the top of this page. Your continued use of the Site or
            placement of an order after any update constitutes acceptance of the revised Terms.
            We encourage you to review this page periodically.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* 13 */}
        <section>
          <p className="eyebrow mb-3">Section 13</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Contact</h2>
          <p className="mb-4">
            Questions about these Terms, your order, or our policies? Contact us:
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
