import { useEffect, useState } from "react";

const GA4_ID    = import.meta.env.VITE_GA4_ID ?? "";
const META_ID   = import.meta.env.VITE_META_PIXEL_ID ?? "";
const TIKTOK_ID = import.meta.env.VITE_TIKTOK_PIXEL_ID ?? "";

const COOKIE_NAME = "qj_cookie_consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function readConsent(): "all" | "necessary" | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : null;
  return value === "all" || value === "necessary" ? value : null;
}

function writeConsent(value: "all" | "necessary") {
  document.cookie = `${COOKIE_NAME}=${value}; max-age=${COOKIE_MAX_AGE}; path=/; samesite=lax`;
}

function injectScript(attrs: { src?: string; children?: string; async?: boolean }) {
  const el = document.createElement("script");
  if (attrs.src) el.src = attrs.src;
  if (attrs.async) el.async = true;
  if (attrs.children) el.text = attrs.children;
  document.head.appendChild(el);
}

let analyticsInjected = false;

// Mirrors the script markup previously built server-side by
// buildAnalyticsScripts() in __root.tsx, now injected client-side only after
// consent is granted.
function injectAnalytics() {
  if (analyticsInjected) return;
  analyticsInjected = true;

  if (GA4_ID && !GA4_ID.startsWith("G-YOUR")) {
    injectScript({ src: `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`, async: true });
    injectScript({ children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4_ID}');` });
  }

  if (META_ID && !META_ID.startsWith("YOUR")) {
    injectScript({
      children: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_ID}');fbq('track','PageView');`,
    });
  }

  if (TIKTOK_ID && !TIKTOK_ID.startsWith("YOUR")) {
    injectScript({
      children: `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${TIKTOK_ID}');ttq.page();}(window,document,'ttq');`,
    });
  }
}

export function CookieConsent() {
  const [consent, setConsent] = useState<"all" | "necessary" | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    setConsent(existing);
    setHydrated(true);
    if (existing === "all") injectAnalytics();
  }, []);

  const choose = (value: "all" | "necessary") => {
    writeConsent(value);
    setConsent(value);
    if (value === "all") injectAnalytics();
  };

  if (!hydrated || consent !== null) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-[#0f0f0f] text-white px-4 py-4 sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-[0.72rem] leading-relaxed text-white/80 text-center sm:text-left">
          We use cookies to run this site and, with your consent, for analytics and advertising. See our{" "}
          <a href="/privacy-policy" className="underline hover:text-white">privacy policy</a>.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => choose("necessary")}
            className="px-4 py-2 text-[0.62rem] uppercase tracking-[0.14em] border border-white/30 hover:border-white/60 transition-colors"
          >
            Necessary Only
          </button>
          <button
            onClick={() => choose("all")}
            className="px-4 py-2 text-[0.62rem] uppercase tracking-[0.14em] bg-white text-[#0f0f0f] hover:bg-white/90 transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
