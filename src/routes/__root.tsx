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
import { getAnnouncementBar } from "@/lib/products.functions";

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://qureshijewelers.com").replace(/\/$/, "");
const GA4_ID      = import.meta.env.VITE_GA4_ID ?? "";
const META_ID     = import.meta.env.VITE_META_PIXEL_ID ?? "";
const TIKTOK_ID   = import.meta.env.VITE_TIKTOK_PIXEL_ID ?? "";

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

// ─── Analytics head scripts ───────────────────────────────────────────────────

function buildAnalyticsScripts() {
  const scripts: Array<{ src?: string; async?: boolean; children?: string }> = [];

  if (GA4_ID && !GA4_ID.startsWith("G-YOUR")) {
    scripts.push(
      { src: `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`, async: true },
      { children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4_ID}');` },
    );
  }

  if (META_ID && !META_ID.startsWith("YOUR")) {
    scripts.push({
      children: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_ID}');fbq('track','PageView');`,
    });
  }

  if (TIKTOK_ID && !TIKTOK_ID.startsWith("YOUR")) {
    scripts.push({
      children: `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${TIKTOK_ID}');ttq.page();}(window,document,'ttq');`,
    });
  }

  return scripts;
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async () => {
    try {
      const bar = await getAnnouncementBar();
      return { announcementBar: bar };
    } catch {
      return { announcementBar: { enabled: false, text: "" } };
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
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "JewelryStore",
          name: "Qureshi Jewelers",
          description: "S925 sterling silver VVS moissanite tennis chains and bracelets, GRA certified.",
          url: SITE_URL,
          areaServed: "US",
        }),
      },
      ...buildAnalyticsScripts(),
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
      <head><HeadContent /></head>
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

  const bar = loaderData?.announcementBar;

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
      <CartProvider>
        <div className="flex min-h-screen flex-col">
          {bar?.enabled && <AnnouncementBar text={bar.text} />}
          <Header />
          <main className="flex-1"><Outlet /></main>
          <Footer />
        </div>
        <Toaster position="top-center" richColors />
      </CartProvider>
    </QueryClientProvider>
  );
}
