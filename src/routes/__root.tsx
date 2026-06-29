import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { useState } from "react";
import { X } from "lucide-react";

import appCss from "../styles.css?url";
import { CartProvider } from "@/lib/cart";
import { Header, Footer } from "@/components/site-chrome";
import { CookieConsent } from "@/components/cookie-consent";
import { getAnnouncementBar } from "@/lib/products.functions";
import { getSiteContent } from "@/lib/content.functions";
import { checkAdminSession } from "@/lib/admin.functions";
import { CmsProvider } from "@/lib/cms-context";
import { CmsToolbar } from "@/components/cms/CmsToolbar";

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://qureshijewelers.com").replace(/\/$/, "");

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow mb-4">404</p>
        <h1 className="font-display text-5xl text-foreground">Page not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The page you're looking for has moved or no longer exists.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-foreground text-background px-6 py-3 text-sm tracking-wider uppercase hover:bg-foreground/90 transition-colors"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please try again or return home.</p>
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="bg-foreground text-background px-5 py-2.5 text-xs uppercase tracking-wider"
          >
            Try again
          </button>
          <a href="/" className="border border-border px-5 py-2.5 text-xs uppercase tracking-wider">Home</a>
        </div>
      </div>
    </div>
  );
}

// ─── Announcement Bar ─────────────────────────────────────────────────────────

function AnnouncementBar({ text }: { text: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || !text.trim()) return null;
  return (
    <div className="relative bg-[#0f0f0f] text-white text-[0.60rem] uppercase tracking-[0.20em] text-center py-2.5 px-10 select-none">
      {text}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// GA4 Measurement ID — public, safe to embed in HTML.
// Consent Mode v2 loads the script unconditionally but blocks data collection
// until the user grants consent via the CookieConsent banner.
const GA4_ID = "G-F9J4XMHWPE";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async () => {
    try {
      const [bar, content, session] = await Promise.all([
        getAnnouncementBar().catch(() => ({ enabled: false, text: "" })),
        getSiteContent().catch(() => ({} as Record<string, string>)),
        checkAdminSession().catch(() => ({ authenticated: false })),
      ]);
      return {
        announcementBar: bar,
        siteContent: content,
        isAdminSession: session.authenticated,
      };
    } catch {
      return {
        announcementBar: { enabled: false, text: "" },
        siteContent: {} as Record<string, string>,
        isAdminSession: false,
      };
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Qureshi Jewelers — S925 VVS Moissanite Tennis Chains" },
      { name: "description", content: "America's premier source for iced out S925 sterling silver, VVS moissanite tennis chains and bracelets. GRA certified. Free US shipping over $250." },
      { name: "author", content: "Qureshi Jewelers" },
      { name: "theme-color", content: "#FAF8F3" },
      { property: "og:site_name", content: "Qureshi Jewelers" },
      { property: "og:title", content: "Qureshi Jewelers — S925 VVS Moissanite Tennis Chains" },
      { property: "og:description", content: "Hand-set VVS moissanite tennis chains in solid S925 sterling silver. GRA certified." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: `${SITE_URL}/QURESHIJEWELERSLOGO.png` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `${SITE_URL}/QURESHIJEWELERSLOGO.png` },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
    scripts: [
      // JewelryStore (extends Organization) — the entity identity Google
      // attaches to every page on the site via the Knowledge Graph. Only
      // real, verifiable facts go here: no fabricated street address or
      // phone number, since this is an online-only store with neither.
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "JewelryStore",
          "@id": `${SITE_URL}/#organization`,
          name: "Qureshi Jewelers",
          alternateName: "QJ Moissanite",
          description: "America's premier source for S925 sterling silver VVS moissanite jewelry — tennis chains, tennis bracelets, stud earrings, and engagement rings. Every stone GRA certified.",
          url: SITE_URL,
          logo: `${SITE_URL}/QURESHIJEWELERSLOGO.png`,
          image: `${SITE_URL}/QURESHIJEWELERSLOGO.png`,
          areaServed: "US",
          priceRange: "$59-$1200",
          currenciesAccepted: "USD",
          paymentAccepted: "Credit Card, Apple Pay, Google Pay, PayPal",
          contactPoint: {
            "@type": "ContactPoint",
            email: "concierge@qureshijewelers.com",
            contactType: "customer service",
            areaServed: "US",
            availableLanguage: "English",
          },
          makesOffer: [
            { "@type": "Offer", itemOffered: { "@type": "Product", name: "Moissanite Tennis Chains" } },
            { "@type": "Offer", itemOffered: { "@type": "Product", name: "Moissanite Tennis Bracelets" } },
            { "@type": "Offer", itemOffered: { "@type": "Product", name: "Moissanite Stud Earrings" } },
            { "@type": "Offer", itemOffered: { "@type": "Product", name: "Moissanite Engagement Rings" } },
          ],
        }),
      },
      // WebSite entity — lets Google associate the site name with the
      // domain independent of any single page's title.
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          name: "Qureshi Jewelers",
          url: SITE_URL,
          publisher: { "@id": `${SITE_URL}/#organization` },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* GA4 — Consent Mode v2: script always present so tag checkers detect it,
            but analytics_storage defaults to 'denied' until user accepts cookies. */}
        <script dangerouslySetInnerHTML={{ __html:
          `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}` +
          `gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',wait_for_update:500});`
        }} />
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} />
        <script dangerouslySetInnerHTML={{ __html: `gtag('js',new Date());gtag('config','${GA4_ID}');` }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const loaderData = Route.useLoaderData();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  const bar            = loaderData?.announcementBar;
  const siteContent    = loaderData?.siteContent ?? {};
  const isAdminSession = loaderData?.isAdminSession ?? false;

  if (isAdmin) {
    return (
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <Toaster position="top-center" richColors />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <CmsProvider initialContent={siteContent} isAdminSession={isAdminSession}>
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            {bar?.enabled && <AnnouncementBar text={bar.text} />}
            <Header />
            <main className="flex-1"><Outlet /></main>
            <Footer />
          </div>
          <Toaster position="top-center" richColors />
          <CookieConsent />
          <CmsToolbar />
        </CartProvider>
      </CmsProvider>
    </QueryClientProvider>
  );
}
