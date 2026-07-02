import { createFileRoute } from "@tanstack/react-router";

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://qureshijewelers.com").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/privacy-policy`;

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Qureshi Jewelers" },
      { name: "description", content: "Privacy policy for Qureshi Jewelers — how we collect, use, and protect your personal information." },
      { property: "og:title", content: "Privacy Policy — Qureshi Jewelers" },
      { property: "og:description", content: "How Qureshi Jewelers collects, uses, and protects your personal information." },
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
          { "@type": "ListItem", position: 2, name: "Privacy Policy", item: PAGE_URL },
        ],
      }),
    }],
  }),
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <p className="eyebrow mb-4">Legal</p>
      <h1 className="font-display text-4xl sm:text-5xl mb-4">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-12">Last updated: July 2, 2026</p>

      <div className="space-y-10 text-[0.9rem] leading-relaxed text-foreground/80">

        {/* Intro */}
        <section className="border border-[#e8e3dc] bg-[#faf9f7] p-6">
          <p className="text-[0.82rem] leading-relaxed">
            Qureshi Jewelers ("<strong className="text-foreground font-medium">we</strong>," "
            <strong className="text-foreground font-medium">us</strong>," or "
            <strong className="text-foreground font-medium">our</strong>") operates
            {" "}<strong className="text-foreground font-medium">qureshijewelers.com</strong> (the "Site"). This Privacy Policy explains
            what personal information we collect, how we use it, with whom we share it, and
            the choices you have. By using the Site, you agree to the practices described here.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* 1 */}
        <section>
          <p className="eyebrow mb-3">Section 1</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Information We Collect</h2>

          <h3 className="text-[0.72rem] uppercase tracking-[0.18em] text-foreground/60 mb-2 mt-5">Information You Give Us Directly</h3>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Name, email address, shipping and billing address, and phone number when you create an account or place an order</li>
            <li>Password (stored as a hashed value — never in plain text) when you register with email and password</li>
            <li>Communications you send us (support emails, contact-form submissions)</li>
            <li>Email address when you subscribe to our newsletter</li>
          </ul>

          <h3 className="text-[0.72rem] uppercase tracking-[0.18em] text-foreground/60 mb-2 mt-5">Information We Collect Automatically</h3>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Log data: IP address, browser type, operating system, referring URL, pages viewed, and time spent on pages</li>
            <li>Device identifiers and cookie data (see Section 6)</li>
            <li>Session and interaction data via Google Analytics (IP anonymization is enabled)</li>
          </ul>

          <h3 className="text-[0.72rem] uppercase tracking-[0.18em] text-foreground/60 mb-2 mt-5">Information From Third-Party Sign-In (Google OAuth)</h3>
          <p>
            If you choose to sign in with Google, we receive only your name, email address, and
            profile picture from Google. We do not receive your Google password, phone number,
            contacts, or any other Google account data.
          </p>

          <h3 className="text-[0.72rem] uppercase tracking-[0.18em] text-foreground/60 mb-2 mt-5">Payment Information</h3>
          <p>
            <strong className="text-foreground font-medium">We never see or store your card number, CVV, or full payment account details.</strong>{" "}
            All payment data is entered directly into a Stripe-hosted secure iframe (Stripe PaymentElement)
            and transmitted directly to Stripe's servers. Stripe is PCI DSS Level 1 certified and our
            integration qualifies as PCI SAQ A (the lowest risk tier). We store only the Stripe Customer
            ID that Stripe assigns to you, not your payment credentials. PayPal transactions are similarly
            processed entirely within PayPal's environment.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* 2 */}
        <section>
          <p className="eyebrow mb-3">Section 2</p>
          <h2 className="font-display text-2xl text-foreground mb-4">How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>To process, fulfill, and ship your orders</li>
            <li>To send order confirmations, shipping notifications, tracking updates, and receipts</li>
            <li>To provide customer support and respond to your inquiries</li>
            <li>To send cart-recovery emails for orders you began but did not complete (cart data is retained temporarily for this purpose)</li>
            <li>To send promotional emails and marketing communications — only if you have opted in</li>
            <li>To improve and personalize our website, product offerings, and user experience</li>
            <li>To detect and prevent fraud, abuse, and unauthorized access</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* 3 */}
        <section>
          <p className="eyebrow mb-3">Section 3</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Sharing of Information</h2>
          <p className="mb-4">
            <strong className="text-foreground font-medium">We do not sell, rent, or trade your personal information to any third party.</strong>{" "}
            We share data only in the following limited circumstances:
          </p>
          <ul className="space-y-4">
            <li>
              <strong className="text-foreground font-medium">Stripe</strong> — processes all credit/debit card payments. Stripe receives your
              payment details directly; we receive only a Stripe Customer ID. Stripe's privacy policy
              is available at stripe.com/privacy.
            </li>
            <li>
              <strong className="text-foreground font-medium">PayPal</strong> — processes PayPal payments. PayPal handles all associated
              financial data independently of our systems.
            </li>
            <li>
              <strong className="text-foreground font-medium">Supabase / Amazon Web Services (AWS)</strong> — our database and authentication
              infrastructure. Your account data (name, email, shipping addresses, order history,
              wishlist) is stored in a Supabase database hosted on AWS. Row-Level Security (RLS) is
              enforced so that each user can only access their own records.
            </li>
            <li>
              <strong className="text-foreground font-medium">Shipping carriers</strong> (e.g., USPS, UPS, FedEx) — receive your name and
              delivery address solely to fulfill your shipment.
            </li>
            <li>
              <strong className="text-foreground font-medium">Google Analytics</strong> — receives anonymized browsing data (pages viewed,
              session duration, referral source). IP anonymization is enabled. Google Analytics
              does not receive your name, email, or order details.
            </li>
            <li>
              <strong className="text-foreground font-medium">Meta (Facebook) Pixel</strong> — receives purchase event data (order value,
              currency) for ad attribution purposes only. It does not receive your name, email
              address, or other personal contact information.
            </li>
            <li>
              <strong className="text-foreground font-medium">TikTok Pixel</strong> — same as Meta Pixel: order value and currency only,
              for ad attribution. No personal contact information is transmitted.
            </li>
            <li>
              <strong className="text-foreground font-medium">Legal disclosure</strong> — we may disclose your information if required by
              law, court order, or government authority, or to protect the rights, property, or
              safety of Qureshi Jewelers, our customers, or others.
            </li>
          </ul>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* 4 */}
        <section>
          <p className="eyebrow mb-3">Section 4</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Database & Security</h2>
          <p className="mb-3">
            We store the following personal data in our Supabase database (hosted on AWS):
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 mb-4">
            <li>Name and email address</li>
            <li>Shipping addresses</li>
            <li>Order history (items purchased, amounts, dates)</li>
            <li>Wishlist items</li>
            <li>Abandoned cart data (retained temporarily for cart recovery emails, then purged)</li>
            <li>Stripe Customer ID (a reference token — not payment credentials)</li>
          </ul>
          <p className="mb-3">
            We implement Row-Level Security (RLS) on all user tables so that each authenticated
            user can only read and write their own records. Our server-side administrative
            operations use a Supabase service-role key that is never exposed to browsers or
            included in client-side code.
          </p>
          <p>
            Authentication sessions use short-lived JWT tokens. Refresh tokens are stored in your
            browser's localStorage and are used only to obtain new access tokens — they are never
            transmitted to third parties.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* 5 */}
        <section>
          <p className="eyebrow mb-3">Section 5</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Cookies & Tracking Technologies</h2>
          <p className="mb-3">
            We use cookies and similar tracking technologies for the following purposes:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 mb-4">
            <li><strong className="text-foreground font-medium">Session management</strong> — to keep you logged in across pages</li>
            <li><strong className="text-foreground font-medium">Analytics</strong> — Google Analytics collects anonymized usage data to help us improve the Site</li>
            <li><strong className="text-foreground font-medium">Ad attribution</strong> — Meta Pixel and TikTok Pixel use cookies to attribute purchases to ad campaigns</li>
          </ul>
          <p>
            You can instruct your browser to refuse all cookies or alert you when cookies are sent.
            Note that some features of the Site may not function properly if cookies are disabled.
            We do not engage in cross-site behavioral tracking beyond the ad-attribution pixels
            described above.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* 6 */}
        <section>
          <p className="eyebrow mb-3">Section 6</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Data Retention</h2>
          <p className="mb-3">
            We retain your personal information for as long as your account is active or as
            needed to provide services to you. Specific retention periods:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Account information: retained until you request deletion</li>
            <li>Order records: retained for a minimum of 7 years for tax and legal compliance</li>
            <li>Abandoned cart data: purged automatically after 30 days if no purchase is completed</li>
            <li>Analytics data: retained per Google Analytics' default retention settings (26 months)</li>
            <li>Marketing opt-in records: retained until you unsubscribe or request deletion</li>
          </ul>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* 7 */}
        <section>
          <p className="eyebrow mb-3">Section 7</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Your Rights</h2>
          <p className="mb-3">
            Depending on your jurisdiction, you may have the following rights regarding your
            personal information:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 mb-4">
            <li><strong className="text-foreground font-medium">Access</strong> — request a copy of the personal data we hold about you</li>
            <li><strong className="text-foreground font-medium">Correction</strong> — request that inaccurate data be corrected</li>
            <li><strong className="text-foreground font-medium">Deletion</strong> — request that we delete your personal information, subject to legal retention requirements</li>
            <li><strong className="text-foreground font-medium">Opt-out of marketing</strong> — unsubscribe from marketing emails at any time using the link in any email or by contacting us</li>
            <li><strong className="text-foreground font-medium">Data portability</strong> — request your data in a structured, commonly used format</li>
          </ul>
          <p>
            To exercise any of these rights, email us at{" "}
            <a href="mailto:support@qureshijewelers.com" className="underline hover:text-foreground transition-colors">
              support@qureshijewelers.com
            </a>
            . We will respond within 30 days. We may need to verify your identity before
            processing certain requests.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* 8 */}
        <section>
          <p className="eyebrow mb-3">Section 8</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Children's Privacy</h2>
          <p>
            Our Site is not directed to children under the age of 13, and we do not knowingly
            collect personal information from children under 13. If we learn that we have
            inadvertently collected such information, we will delete it promptly.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* 9 */}
        <section>
          <p className="eyebrow mb-3">Section 9</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we do, we will revise the
            "Last updated" date at the top of this page. Material changes will be communicated
            by email to registered users. Continued use of the Site after any update constitutes
            your acceptance of the revised policy.
          </p>
        </section>

        <div className="h-px bg-[#e5e1d9]" />

        {/* 10 */}
        <section>
          <p className="eyebrow mb-3">Section 10</p>
          <h2 className="font-display text-2xl text-foreground mb-4">Contact Us</h2>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or
            your personal data, please contact us:
          </p>
          <div className="mt-4 border border-[#e8e3dc] bg-[#faf9f7] p-5 text-[0.82rem] space-y-1">
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
