import { createFileRoute } from "@tanstack/react-router";

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://qureshijewelers.com").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/privacy-policy`;

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Qureshi Jewelers" },
      { name: "description", content: "Privacy policy for Qureshi Jewelers — how we collect, use, and protect your personal information." },
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
      <h1 className="font-display text-4xl sm:text-5xl mb-8">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: June 15, 2026</p>

      <div className="prose prose-sm max-w-none space-y-8 text-[0.9rem] leading-relaxed text-foreground/80">

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">1. Information We Collect</h2>
          <p>When you place an order or subscribe to our newsletter, we collect information you provide directly, including your name, email address, mailing address, phone number, and payment information. We also collect information automatically when you visit our website, including your IP address, browser type, pages viewed, and referring URLs.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Process and fulfill your orders</li>
            <li>Send order confirmations, shipping notifications, and receipts</li>
            <li>Respond to your questions and support requests</li>
            <li>Send promotional communications (only if you opt in)</li>
            <li>Improve our website and product offerings</li>
            <li>Prevent fraud and ensure the security of our platform</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">3. Sharing of Information</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted service providers who assist us in operating our website and conducting our business — including payment processors, shipping carriers, and email delivery providers — subject to strict confidentiality agreements.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">4. Payment Security</h2>
          <p>All payment transactions are encrypted using SSL technology. We do not store full credit card numbers on our servers. Payment processing is handled by Stripe, which is PCI DSS compliant.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">5. Cookies</h2>
          <p>We use cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, and understand where our visitors are coming from. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">6. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal data at any time. To exercise these rights, contact us at <a href="mailto:support@qureshijewelers.com" className="underline hover:text-foreground transition-colors">support@qureshijewelers.com</a>.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">7. Data Retention</h2>
          <p>We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">8. Children's Privacy</h2>
          <p>Our website is not directed to children under the age of 13. We do not knowingly collect personal information from children.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">9. Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page with an updated "Last updated" date.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">10. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:support@qureshijewelers.com" className="underline hover:text-foreground transition-colors">support@qureshijewelers.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
