import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useCallback, useEffect } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import {
  Sparkles, Download, Copy, Check, RefreshCw,
  Facebook, Instagram, Twitter, Search, Palette,
  Image as ImageIcon, Loader2, Info, LayoutTemplate, Edit3,
  X, SlidersHorizontal, ChevronDown, ChevronRight,
} from "lucide-react";
import { listAdminProductsAll } from "@/lib/admin-extended.functions";
import { generateSocialContent, type SocialPlatform, type GeneratedContent } from "@/lib/creator.functions";
import { useAdminToken } from "@/lib/admin-context";
import { formatUSD } from "@/lib/pricing";

export const Route = createFileRoute("/admin/creator")({
  component: CreatorHub,
});

// ─── Platform Config ──────────────────────────────────────────────────────────

const PLATFORMS: {
  id: SocialPlatform; label: string; w: number; h: number;
  icon: React.ElementType; color: string; safeZone: string;
}[] = [
  { id: "facebook",   label: "Facebook",    w: 1200, h: 628,  icon: Facebook,  color: "#1877F2", safeZone: "1200 × 628" },
  { id: "instagram",  label: "Instagram",   w: 1080, h: 1080, icon: Instagram, color: "#E1306C", safeZone: "1080 × 1080" },
  { id: "twitter",    label: "X / Twitter", w: 1200, h: 675,  icon: Twitter,   color: "#0F1419", safeZone: "1200 × 675" },
  { id: "google_ads", label: "Google Ads",  w: 1200, h: 628,  icon: ImageIcon, color: "#4285F4", safeZone: "1200 × 628" },
];

function previewDims(w: number, h: number, maxW: number) {
  const scale = maxW / w;
  return { pw: Math.round(w * scale), ph: Math.round(h * scale), scale };
}

// ─── Template Types ───────────────────────────────────────────────────────────

type TemplateId = "editorial" | "dark" | "impact" | "minimal";

interface TemplateProps {
  product: any;
  headline: string;
  cta: string;
  brandName: string;
  tagline: string;
  accentColor: string;
  w: number;
  h: number;
}

const COLOR_LABELS: Record<string, string> = {
  gold: "Yellow Gold", rose_gold: "Rose Gold", white_gold: "White Gold", silver: "Sterling Silver",
};

const ss = (px: number) => `${px}px`;

// ─── Template 1: Editorial ────────────────────────────────────────────────────

function EditorialTemplate({ product, headline, cta, brandName, tagline, accentColor, w, h }: TemplateProps) {
  const isSquare = h / w >= 0.85;
  const imgW     = isSquare ? w : Math.round(w * 0.58);
  const textW    = isSquare ? w : w - imgW;
  const imgH     = isSquare ? Math.round(h * 0.60) : h;

  const colors = (product.color ?? "").split(",")
    .map((c: string) => COLOR_LABELS[c.trim()] ?? c.trim()).filter(Boolean);

  const pad   = Math.round(w * 0.065);
  const fs = {
    brand:    Math.round(w * 0.0135),
    overline: Math.round(w * 0.012),
    headline: Math.round(w * (isSquare ? 0.044 : 0.052)),
    meta:     Math.round(w * 0.016),
    price:    Math.round(w * 0.036),
    cta:      Math.round(w * 0.0135),
    tagline:  Math.round(w * 0.011),
  };

  return (
    <div style={{
      width: w, height: h, overflow: "hidden", position: "relative",
      background: "linear-gradient(160deg,#FDFCFB 0%,#F5F2ED 100%)",
      display: "flex", flexDirection: isSquare ? "column" : "row",
      fontFamily: "Georgia,'Palatino Linotype',Palatino,serif",
    }}>
      <div style={{ width: isSquare ? w : imgW, height: imgH, flexShrink: 0, position: "relative", overflow: "hidden" }}>
        {product.image_url
          ? <img src={product.image_url} alt="" crossOrigin="anonymous"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }} />
          : <div style={{ width: "100%", height: "100%", background: "#EAE6E0" }} />
        }
        {!isSquare && (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(253,252,251,0.55) 0%, transparent 28%)" }} />
        )}
        {isSquare && (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 65%, rgba(245,242,237,0.95) 100%)" }} />
        )}
      </div>

      <div style={{
        width: isSquare ? w : textW, flexShrink: 0,
        height: isSquare ? h - imgH : h,
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: isSquare
          ? `${Math.round(h * 0.04)}px ${pad}px ${Math.round(h * 0.055)}px`
          : `${Math.round(h * 0.10)}px ${pad}px ${Math.round(h * 0.09)}px`,
        position: "relative",
      }}>
        <div style={{ marginBottom: Math.round(h * 0.032), display: "flex", alignItems: "center", gap: ss(Math.round(w * 0.012)) }}>
          <div style={{ width: ss(Math.round(w * 0.025)), height: "1px", background: accentColor }} />
          <span style={{ fontSize: ss(fs.brand), letterSpacing: "0.25em", textTransform: "uppercase", color: accentColor, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif", fontWeight: 700 }}>{brandName}</span>
        </div>
        {product.type && (
          <div style={{ marginBottom: Math.round(h * 0.018) }}>
            <span style={{ fontSize: ss(fs.overline), letterSpacing: "0.2em", textTransform: "uppercase", color: "#9A8F85", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>{product.type}</span>
          </div>
        )}
        <h2 style={{ margin: 0, marginBottom: ss(Math.round(h * 0.026)), fontSize: ss(fs.headline), fontWeight: 400, lineHeight: 1.18, letterSpacing: "-0.025em", color: "#18130F", fontFamily: "Georgia,'Palatino Linotype',Palatino,serif" }}>
          {headline || product.name}
        </h2>
        {colors.length > 0 && (
          <div style={{ display: "flex", gap: ss(Math.round(w * 0.018)), marginBottom: ss(Math.round(h * 0.026)), flexWrap: "wrap" }}>
            {colors.map((c: string) => (
              <span key={c} style={{ fontSize: ss(fs.meta), letterSpacing: "0.06em", color: "#7A6F65", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif", borderBottom: `1px solid #D4CCBC`, paddingBottom: "2px" }}>{c}</span>
            ))}
          </div>
        )}
        <div style={{ width: ss(Math.round(w * 0.055)), height: "1px", background: "#D4CCBC", marginBottom: ss(Math.round(h * 0.028)) }} />
        <div style={{ marginBottom: ss(Math.round(h * 0.038)) }}>
          <span style={{ fontSize: ss(fs.price), fontWeight: 300, color: "#18130F", letterSpacing: "-0.01em", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>
            {formatUSD(Number(product.base_price ?? 0))}
          </span>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: ss(Math.round(w * 0.012)), padding: `${ss(Math.round(h * 0.020))} ${ss(Math.round(w * 0.038))}`, background: "#18130F", color: "#FDFCFB", width: "fit-content", fontSize: ss(fs.cta), letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif", fontWeight: 600 }}>
          {cta || "Explore Now"}<span style={{ opacity: 0.6 }}>→</span>
        </div>
        <div style={{ position: "absolute", bottom: ss(Math.round(h * (isSquare ? 0.03 : 0.04))), left: ss(pad) }}>
          <span style={{ fontSize: ss(fs.tagline), letterSpacing: "0.18em", color: "#C4B9AD", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif", textTransform: "uppercase" }}>{tagline}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Template 2: Dark Luxury ──────────────────────────────────────────────────

function DarkTemplate({ product, headline, cta, brandName, tagline, accentColor, w, h }: TemplateProps) {
  const isSquare = h / w >= 0.85;
  const imgSize  = isSquare ? Math.round(w * 0.68) : Math.round(Math.min(w * 0.52, h * 0.72));
  const imgTop   = isSquare ? Math.round(h * 0.115) : Math.round(h * 0.08);
  const pad = Math.round(w * 0.068);
  const fs = {
    brand:    Math.round(w * 0.013),
    headline: Math.round(w * (isSquare ? 0.042 : 0.046)),
    price:    Math.round(w * 0.026),
    cta:      Math.round(w * 0.013),
    tagline:  Math.round(w * 0.010),
  };
  const textBottom = isSquare ? h - (imgTop + imgSize) - Math.round(h * 0.02) : h * 0.36;

  return (
    <div style={{ width: w, height: h, overflow: "hidden", position: "relative", background: `radial-gradient(ellipse 80% 60% at 50% 38%, #221E1A 0%, #100D0B 55%, #060504 100%)`, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>
      <div style={{ position: "absolute", inset: 0, zIndex: 0, opacity: 0.035, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")", backgroundSize: "180px 180px" }} />
      {[
        { top: h*0.028, left: w*0.035 },
        { top: h*0.028, right: w*0.035 },
        { bottom: h*0.028, left: w*0.035 },
        { bottom: h*0.028, right: w*0.035 },
      ].map((pos, i) => (
        <div key={i} style={{ position: "absolute", ...pos, width: ss(Math.round(w * 0.032)), height: ss(Math.round(h * 0.032)), zIndex: 2, borderTop: (i < 2) ? `1px solid ${accentColor}50` : undefined, borderBottom: (i >= 2) ? `1px solid ${accentColor}50` : undefined, borderLeft: (i % 2 === 0) ? `1px solid ${accentColor}50` : undefined, borderRight: (i % 2 === 1) ? `1px solid ${accentColor}50` : undefined }} />
      ))}
      <div style={{ position: "absolute", top: ss(Math.round(h * 0.052)), left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: ss(Math.round(w * 0.022)), zIndex: 3 }}>
        <div style={{ height: "1px", width: ss(Math.round(w * 0.055)), background: `${accentColor}70` }} />
        <span style={{ fontSize: ss(fs.brand), letterSpacing: "0.3em", textTransform: "uppercase", color: accentColor, fontWeight: 600 }}>{brandName}</span>
        <div style={{ height: "1px", width: ss(Math.round(w * 0.055)), background: `${accentColor}70` }} />
      </div>
      <div style={{ position: "absolute", top: ss(imgTop), left: `${(w - imgSize) / 2}px`, width: ss(imgSize), height: ss(isSquare ? imgSize : Math.round(h * 0.56)), zIndex: 2 }}>
        <div style={{ position: "absolute", bottom: "-8%", left: "10%", right: "10%", height: "35%", zIndex: 1, background: `radial-gradient(ellipse at center bottom, ${accentColor}28 0%, transparent 70%)`, filter: "blur(8px)" }} />
        {product.image_url
          ? <img src={product.image_url} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 2 }} />
          : <div style={{ width: "100%", height: "100%", background: "#1A1614", position: "relative", zIndex: 2 }} />
        }
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 3, height: ss(Math.round(textBottom)), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: `0 ${ss(pad)}`, background: `linear-gradient(to bottom, transparent 0%, rgba(6,5,4,0.65) 40%, rgba(6,5,4,0.92) 100%)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: ss(Math.round(w * 0.015)), marginBottom: ss(Math.round(h * 0.025)) }}>
          <div style={{ width: ss(Math.round(w * 0.04)), height: "1px", background: `${accentColor}60` }} />
          <div style={{ width: ss(Math.round(w * 0.006)), height: ss(Math.round(w * 0.006)), background: accentColor, borderRadius: "50%" }} />
          <div style={{ width: ss(Math.round(w * 0.04)), height: "1px", background: `${accentColor}60` }} />
        </div>
        <h2 style={{ margin: 0, marginBottom: ss(Math.round(h * 0.022)), fontSize: ss(fs.headline), fontWeight: 300, lineHeight: 1.2, letterSpacing: "0.01em", color: "#F0EAE0", textAlign: "center", fontFamily: "Georgia,'Palatino Linotype',Palatino,serif" }}>
          {headline || product.name}
        </h2>
        <div style={{ marginBottom: ss(Math.round(h * 0.028)) }}>
          <span style={{ fontSize: ss(fs.price), color: accentColor, letterSpacing: "0.06em", fontWeight: 300 }}>{formatUSD(Number(product.base_price ?? 0))}</span>
        </div>
        <div style={{ padding: `${ss(Math.round(h * 0.018))} ${ss(Math.round(w * 0.05))}`, border: `1px solid ${accentColor}`, color: accentColor, fontSize: ss(fs.cta), letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 600 }}>
          {cta || "Discover Now"}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: ss(Math.round(h * 0.032)), left: 0, right: 0, textAlign: "center", zIndex: 4 }}>
        <span style={{ fontSize: ss(fs.tagline), letterSpacing: "0.22em", color: "#3A3230", textTransform: "uppercase" }}>{tagline}</span>
      </div>
    </div>
  );
}

// ─── Template 3: Impact ───────────────────────────────────────────────────────

function ImpactTemplate({ product, headline, cta, brandName, accentColor, w, h }: TemplateProps) {
  const isSquare = h / w >= 0.85;
  const pad = Math.round(w * 0.065);
  const fs = {
    brand:    Math.round(w * 0.0128),
    headline: Math.round(w * (isSquare ? 0.065 : 0.058)),
    price:    Math.round(w * 0.018),
    cta:      Math.round(w * 0.013),
  };

  return (
    <div style={{ width: w, height: h, position: "relative", overflow: "hidden", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif", background: "#0C0B0A" }}>
      {product.image_url
        ? <img src={product.image_url} alt="" crossOrigin="anonymous" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 25%" }} />
        : <div style={{ position: "absolute", inset: 0, background: "#1E1A16" }} />
      }
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, transparent 32%)" }} />
      <div style={{ position: "absolute", inset: 0, background: isSquare ? "linear-gradient(to bottom, transparent 38%, rgba(0,0,0,0.55) 58%, rgba(0,0,0,0.86) 100%)" : "linear-gradient(to bottom, transparent 28%, rgba(0,0,0,0.52) 52%, rgba(0,0,0,0.88) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 110% 100% at 50% 50%, transparent 55%, rgba(0,0,0,0.38) 100%)" }} />
      <div style={{ position: "absolute", top: ss(Math.round(h * 0.048)), left: ss(pad), display: "flex", alignItems: "center", gap: ss(Math.round(w * 0.012)), zIndex: 4 }}>
        <div style={{ width: ss(Math.round(w * 0.022)), height: "1.5px", background: accentColor }} />
        <span style={{ fontSize: ss(fs.brand), letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.92)", fontWeight: 700 }}>{brandName}</span>
      </div>
      <div style={{ position: "absolute", top: ss(Math.round(h * 0.042)), right: ss(pad), zIndex: 4, padding: `${ss(Math.round(h * 0.016))} ${ss(Math.round(w * 0.028))}`, background: accentColor, color: "#0C0B0A", fontSize: ss(fs.price), fontWeight: 700, letterSpacing: "0.04em" }}>
        {formatUSD(Number(product.base_price ?? 0))}
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 4, padding: isSquare ? `${ss(Math.round(h * 0.048))} ${ss(pad)} ${ss(Math.round(h * 0.062))}` : `${ss(Math.round(h * 0.038))} ${ss(pad)} ${ss(Math.round(h * 0.055))}` }}>
        <div style={{ width: ss(Math.round(w * 0.045)), height: "1.5px", background: accentColor, marginBottom: ss(Math.round(h * 0.022)) }} />
        <h2 style={{ margin: 0, marginBottom: ss(Math.round(h * 0.032)), fontSize: ss(fs.headline), fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.025em", color: "#FFFFFF", textShadow: "0 4px 32px rgba(0,0,0,0.55)", fontFamily: "'Arial Black','Helvetica Neue',Helvetica,Arial,sans-serif", maxWidth: isSquare ? "90%" : "75%" }}>
          {headline || product.name}
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: ss(Math.round(w * 0.025)) }}>
          <div style={{ padding: `${ss(Math.round(h * 0.020))} ${ss(Math.round(w * 0.040))}`, background: "#FFFFFF", color: "#0C0B0A", fontSize: ss(fs.cta), fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
            {cta || "Shop Now"}
          </div>
          <div style={{ width: ss(Math.round(w * 0.035)), height: "1px", background: "rgba(255,255,255,0.4)" }} />
        </div>
      </div>
    </div>
  );
}

// ─── Template 4: Minimal Luxury ───────────────────────────────────────────────

function MinimalTemplate({ product, headline, cta, brandName, tagline, accentColor, w, h }: TemplateProps) {
  const isSquare = h / w >= 0.85;
  const pad = Math.round(w * 0.072);
  const fs = {
    brand:    Math.round(w * 0.012),
    headline: Math.round(w * (isSquare ? 0.038 : 0.034)),
    price:    Math.round(w * 0.022),
    cta:      Math.round(w * 0.012),
    tagline:  Math.round(w * 0.010),
  };

  return (
    <div style={{ width: w, height: h, overflow: "hidden", position: "relative", background: "#FDFCFB", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ flexShrink: 0, padding: `${ss(Math.round(h * 0.048))} ${ss(pad)} ${ss(Math.round(h * 0.028))}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ss(Math.round(w * 0.012)) }}>
          <span style={{ fontSize: ss(fs.brand), letterSpacing: "0.28em", textTransform: "uppercase", color: "#1A1614", fontWeight: 700 }}>{brandName}</span>
          <span style={{ fontSize: ss(fs.brand), letterSpacing: "0.12em", color: "#C4B9AD", paddingLeft: ss(Math.round(w * 0.012)) }}>·</span>
          <span style={{ fontSize: ss(Math.round(w * 0.011)), letterSpacing: "0.16em", textTransform: "uppercase", color: "#9A8F85" }}>{tagline}</span>
        </div>
        {product.type && <span style={{ fontSize: ss(Math.round(w * 0.011)), letterSpacing: "0.2em", textTransform: "uppercase", color: "#C4B9AD" }}>{product.type}</span>}
      </div>
      <div style={{ height: "1px", background: "#EAE5DF", flexShrink: 0, marginLeft: ss(pad), marginRight: ss(pad) }} />
      <div style={{ flex: 1, overflow: "hidden", position: "relative", margin: `${ss(Math.round(h * 0.02))} ${ss(Math.round(w * 0.04))} 0` }}>
        {product.image_url
          ? <img src={product.image_url} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center bottom" }} />
          : <div style={{ width: "100%", height: "100%", background: "#F0EDE7" }} />
        }
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "25%", background: "linear-gradient(to bottom, transparent, rgba(253,252,251,0.88))" }} />
      </div>
      <div style={{ flexShrink: 0, padding: `${ss(Math.round(h * 0.032))} ${ss(pad)} ${ss(Math.round(h * 0.052))}`, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <p style={{ margin: 0, marginBottom: ss(Math.round(h * 0.012)), fontSize: ss(fs.headline), fontWeight: 300, letterSpacing: "-0.01em", color: "#18130F", lineHeight: 1.2, fontFamily: "Georgia,'Palatino Linotype',Palatino,serif", maxWidth: ss(Math.round(w * 0.55)) }}>
            {headline || product.name}
          </p>
          <p style={{ margin: 0, fontSize: ss(fs.price), color: "#18130F", fontWeight: 300, letterSpacing: "0.01em" }}>{formatUSD(Number(product.base_price ?? 0))}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: ss(Math.round(h * 0.016)) }}>
          <div style={{ padding: `${ss(Math.round(h * 0.018))} ${ss(Math.round(w * 0.034))}`, background: "#18130F", color: "#FDFCFB", fontSize: ss(fs.cta), letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600 }}>
            {cta || "View Collection"}
          </div>
          <div style={{ width: ss(Math.round(w * 0.006)), height: ss(Math.round(w * 0.006)), borderRadius: "50%", background: accentColor }} />
        </div>
      </div>
    </div>
  );
}

// ─── Template Registry ────────────────────────────────────────────────────────

const TEMPLATES: { id: TemplateId; label: string; desc: string }[] = [
  { id: "editorial", label: "Editorial",      desc: "Split layout · magazine quality"   },
  { id: "dark",      label: "Dark Luxury",    desc: "Studio dark · gold accents"        },
  { id: "impact",    label: "Impact",         desc: "Full-bleed · oversized headline"   },
  { id: "minimal",   label: "Minimal Luxury", desc: "Maximum whitespace · quiet luxury" },
];

function renderTemplate(id: TemplateId, props: TemplateProps) {
  if (id === "editorial") return <EditorialTemplate {...props} />;
  if (id === "dark")      return <DarkTemplate {...props} />;
  if (id === "impact")    return <ImpactTemplate {...props} />;
  return <MinimalTemplate {...props} />;
}

// ─── Shared Primitives ────────────────────────────────────────────────────────

const ACCENT_PRESETS = [
  { label: "Gold",      hex: "#C9A84C" },
  { label: "Rose Gold", hex: "#C27B5A" },
  { label: "Platinum",  hex: "#B8BAC2" },
  { label: "Ruby",      hex: "#9B2335" },
  { label: "Sapphire",  hex: "#2E4B8E" },
  { label: "Champagne", hex: "#E8D5A3" },
];

function CopyField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  if (!value) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[0.54rem] uppercase tracking-[0.16em] text-gray-400">{label}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-[0.54rem] uppercase tracking-[0.1em] text-gray-400 active:text-gray-700 transition-colors min-h-[32px] px-1"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className={`text-xs text-gray-700 leading-relaxed bg-gray-50 border border-gray-100 px-3 py-2.5 whitespace-pre-wrap select-all ${mono ? "font-mono text-[0.65rem]" : ""}`}>
        {value}
      </p>
    </div>
  );
}

// ─── Mobile Bottom Sheet ──────────────────────────────────────────────────────

function BottomSheet({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className={`fixed left-0 right-0 bottom-0 z-50 bg-white rounded-t-2xl flex flex-col transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
        style={{
          maxHeight: "86vh",
          boxShadow: "0 -12px 40px rgba(0,0,0,0.18)",
          paddingBottom: "env(safe-area-inset-bottom, 12px)",
        }}
      >
        {/* Handle + header */}
        <div className="flex justify-center pt-3 pb-0.5 shrink-0">
          <div className="w-9 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 active:text-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </>
  );
}

// ─── Product Sheet (mobile) ───────────────────────────────────────────────────

function ProductSheet({
  open, onClose, products, loading, selected, onSelect, search, setSearch,
}: {
  open: boolean; onClose: () => void;
  products: any[]; loading: boolean;
  selected: any | null; onSelect: (p: any) => void;
  search: string; setSearch: (v: string) => void;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Select Product">
      <div className="px-4 pt-3 pb-2 sticky top-0 bg-white z-10 border-b border-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search catalog…"
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
          />
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-gray-300" /></div>
      ) : (
        <div className="px-4 py-2 space-y-0.5 pb-6">
          {products.slice(0, 60).map((p: any) => (
            <button
              key={p.slug}
              onClick={() => { onSelect(p); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left active:scale-98 transition-all ${
                selected?.slug === p.slug ? "bg-gray-900" : "bg-transparent active:bg-gray-50"
              }`}
            >
              {p.image_url
                ? <img src={p.image_url} alt="" className="w-12 h-12 object-cover rounded-lg shrink-0 bg-gray-100" />
                : <div className="w-12 h-12 bg-gray-100 rounded-lg shrink-0" />
              }
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium leading-tight ${selected?.slug === p.slug ? "text-white" : "text-gray-800"}`}>{p.name}</p>
                <p className={`text-xs mt-0.5 ${selected?.slug === p.slug ? "text-gray-400" : "text-gray-400"}`}>{formatUSD(Number(p.base_price ?? 0))}</p>
              </div>
              {selected?.slug === p.slug && <Check className="h-4 w-4 text-gray-300 shrink-0" />}
            </button>
          ))}
          {products.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No products found</p>}
        </div>
      )}
    </BottomSheet>
  );
}

// ─── Settings Sheet (mobile) ──────────────────────────────────────────────────

function SettingsSheet({
  open, onClose,
  template, setTemplate,
  brandName, setBrandName,
  tagline, setTagline,
  accentColor, setAccentColor,
  tone, setTone,
}: {
  open: boolean; onClose: () => void;
  template: TemplateId; setTemplate: (v: TemplateId) => void;
  brandName: string; setBrandName: (v: string) => void;
  tagline: string; setTagline: (v: string) => void;
  accentColor: string; setAccentColor: (v: string) => void;
  tone: "luxe" | "playful" | "bold" | "minimal"; setTone: (v: "luxe" | "playful" | "bold" | "minimal") => void;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Settings">
      <div className="px-5 py-4 space-y-6 pb-8">

        {/* Template */}
        <div>
          <p className="text-[0.52rem] uppercase tracking-[0.20em] text-gray-400 mb-3 flex items-center gap-1.5">
            <LayoutTemplate className="h-3 w-3" /> Template
          </p>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => setTemplate(t.id)}
                className={`text-left px-3.5 py-3 rounded-xl border transition-all active:scale-97 ${
                  template === t.id ? "bg-gray-900 border-gray-900" : "bg-white border-gray-200 active:border-gray-400"
                }`}
              >
                <p className={`text-xs font-bold leading-tight ${template === t.id ? "text-white" : "text-gray-800"}`}>{t.label}</p>
                <p className={`text-[0.55rem] mt-0.5 leading-tight ${template === t.id ? "text-gray-400" : "text-gray-400"}`}>{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Branding */}
        <div>
          <p className="text-[0.52rem] uppercase tracking-[0.20em] text-gray-400 mb-3 flex items-center gap-1.5">
            <Palette className="h-3 w-3" /> Branding
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-[0.56rem] uppercase tracking-[0.14em] text-gray-400 block mb-1.5">Brand Name</label>
              <input value={brandName} onChange={e => setBrandName(e.target.value)}
                className="w-full px-3.5 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400" />
            </div>
            <div>
              <label className="text-[0.56rem] uppercase tracking-[0.14em] text-gray-400 block mb-1.5">Tagline</label>
              <input value={tagline} onChange={e => setTagline(e.target.value)}
                className="w-full px-3.5 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400" />
            </div>

            {/* Accent Color */}
            <div>
              <label className="text-[0.56rem] uppercase tracking-[0.14em] text-gray-400 block mb-2">Accent Color</label>
              <div className="flex gap-2 flex-wrap mb-2.5">
                {ACCENT_PRESETS.map(p => (
                  <button
                    key={p.hex}
                    title={p.label}
                    onClick={() => setAccentColor(p.hex)}
                    style={{ background: p.hex }}
                    className={`w-8 h-8 rounded-full border-[3px] transition-all active:scale-90 ${
                      accentColor === p.hex ? "border-gray-900 scale-110" : "border-transparent"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2.5">
                <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 shrink-0" />
                <input value={accentColor} onChange={e => setAccentColor(e.target.value)}
                  className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 font-mono" />
              </div>
            </div>
          </div>
        </div>

        {/* Copy Tone */}
        <div>
          <p className="text-[0.52rem] uppercase tracking-[0.20em] text-gray-400 mb-3">Copy Tone</p>
          <div className="grid grid-cols-2 gap-2">
            {(["luxe", "playful", "bold", "minimal"] as const).map(t => (
              <button key={t} onClick={() => setTone(t)}
                className={`py-3 text-xs uppercase tracking-[0.10em] font-semibold rounded-xl border transition-all active:scale-97 ${
                  tone === t ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 active:border-gray-400"
                }`}
              >{t}</button>
            ))}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function CreatorHub() {
  const token = useAdminToken();

  const [search,           setSearch]           = useState("");
  const [selectedProduct,  setSelectedProduct]  = useState<any | null>(null);
  const [platform,         setPlatform]         = useState<SocialPlatform>("instagram");
  const [template,         setTemplate]         = useState<TemplateId>("dark");
  const [brandName,        setBrandName]        = useState("QJewelers");
  const [tagline,          setTagline]          = useState("Tennis Luxe");
  const [accentColor,      setAccentColor]      = useState("#C9A84C");
  const [tone,             setTone]             = useState<"luxe" | "playful" | "bold" | "minimal">("luxe");
  const [headlineOverride, setHeadlineOverride] = useState("");
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [generating,       setGenerating]       = useState(false);
  const [downloading,      setDownloading]      = useState(false);
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const [settingsSheetOpen,setSettingsSheetOpen]= useState(false);
  const [copyOpen,         setCopyOpen]         = useState(false);

  // Responsive preview width
  const previewWrapRef   = useRef<HTMLDivElement>(null);
  const [previewMaxW, setPreviewMaxW] = useState(544);
  useEffect(() => {
    const update = () => {
      if (previewWrapRef.current) {
        setPreviewMaxW(previewWrapRef.current.offsetWidth);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (previewWrapRef.current) ro.observe(previewWrapRef.current);
    return () => ro.disconnect();
  }, []);

  const templateRef = useRef<HTMLDivElement>(null);

  const listFn     = useServerFn(listAdminProductsAll);
  const generateFn = useServerFn(generateSocialContent);

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["admin-products-all", token],
    queryFn: () => listFn({ data: { token } }),
    staleTime: 60_000,
  });

  const allProducts: any[] = productsData?.products ?? [];
  const filteredProducts = search.trim()
    ? allProducts.filter((p: any) =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.type?.toLowerCase().includes(search.toLowerCase())
      )
    : allProducts;

  const platformCfg   = PLATFORMS.find(p => p.id === platform)!;
  const { pw, ph, scale } = previewDims(platformCfg.w, platformCfg.h, previewMaxW);
  const currentCopy   = generatedContent?.[platform];
  const displayHeadline = headlineOverride || currentCopy?.headline || selectedProduct?.name || "";

  const handleGenerate = async () => {
    if (!selectedProduct) { toast.error("Select a product first"); return; }
    setGenerating(true);
    setCopyOpen(true);
    try {
      const res = await generateFn({
        data: {
          token,
          productName: selectedProduct.name,
          productDescription: selectedProduct.description ?? selectedProduct.short_description ?? "",
          price: Number(selectedProduct.base_price ?? 0),
          colors: (selectedProduct.color ?? "").split(",").map((c: string) => c.trim()).filter(Boolean),
          type: selectedProduct.type ?? "",
          platforms: ["facebook", "instagram", "twitter", "google_ads"],
          tone, brandName, tagline,
        },
      });
      setGeneratedContent(res.content as GeneratedContent);
      setHeadlineOverride("");
      toast.success("Content generated for all 4 platforms");
    } catch (e: any) {
      toast.error(e?.message ?? "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = useCallback(async () => {
    if (!templateRef.current || !selectedProduct) return;
    setDownloading(true);
    const el = templateRef.current;
    const prevTransform = el.style.transform;
    const prevOrigin    = el.style.transformOrigin;
    try {
      el.style.transform       = "none";
      el.style.transformOrigin = "top left";
      await new Promise(r => setTimeout(r, 80));
      const dataUrl = await toPng(el, {
        width: platformCfg.w, height: platformCfg.h,
        pixelRatio: 1, cacheBust: true, skipAutoScale: true,
      });
      const link     = document.createElement("a");
      link.href      = dataUrl;
      link.download  = `${brandName.replace(/\s+/g, "-").toLowerCase()}-${platform}-${platformCfg.w}x${platformCfg.h}.png`;
      link.click();
      toast.success(`Downloaded ${platformCfg.w}×${platformCfg.h} PNG`);
    } catch {
      toast.error("Export failed — try long-pressing the preview to save the image.");
    } finally {
      el.style.transform       = prevTransform;
      el.style.transformOrigin = prevOrigin;
      setDownloading(false);
    }
  }, [platform, platformCfg, brandName, selectedProduct]);

  const templateProps: TemplateProps = {
    product: selectedProduct ?? {}, headline: displayHeadline,
    cta: currentCopy?.cta ?? "Shop Now",
    brandName, tagline, accentColor,
    w: platformCfg.w, h: platformCfg.h,
  };

  // ─── Desktop Layout ─────────────────────────────────────────────────────────

  const DesktopSidebar = (
    <div className="w-[268px] shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gray-900 flex items-center justify-center shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Creator Hub</p>
            <p className="text-[0.56rem] text-gray-400 uppercase tracking-[0.12em]">Social Media Graphics</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* Product */}
        <div className="px-4 pt-4 pb-3">
          <p className="text-[0.52rem] uppercase tracking-[0.18em] text-gray-400 mb-2.5">① Product</p>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-300" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search catalog…"
              className="w-full pl-8 pr-3 py-2 text-xs text-gray-700 border border-gray-200 focus:outline-none focus:border-gray-400 placeholder:text-gray-300" />
          </div>
          {loadingProducts ? (
            <div className="py-5 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-gray-300" /></div>
          ) : (
            <div className="space-y-0.5 max-h-48 overflow-y-auto">
              {filteredProducts.slice(0, 50).map((p: any) => (
                <button key={p.slug} onClick={() => { setSelectedProduct(p); setGeneratedContent(null); setHeadlineOverride(""); }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-left transition-colors ${selectedProduct?.slug === p.slug ? "bg-gray-900 text-white" : "hover:bg-gray-50 text-gray-700"}`}>
                  {p.image_url ? <img src={p.image_url} alt="" className="w-8 h-8 object-cover shrink-0 bg-gray-100" /> : <div className="w-8 h-8 bg-gray-100 shrink-0" />}
                  <div className="min-w-0">
                    <p className="truncate text-[0.67rem] font-medium leading-tight">{p.name}</p>
                    <p className={`text-[0.57rem] ${selectedProduct?.slug === p.slug ? "text-gray-400" : "text-gray-400"}`}>{formatUSD(Number(p.base_price ?? 0))}</p>
                  </div>
                </button>
              ))}
              {filteredProducts.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No products found</p>}
            </div>
          )}
        </div>
        <div className="mx-4 border-t border-gray-50" />
        {/* Platform */}
        <div className="px-4 pt-3 pb-3">
          <p className="text-[0.52rem] uppercase tracking-[0.18em] text-gray-400 mb-2.5">② Platform</p>
          <div className="space-y-1">
            {PLATFORMS.map(p => {
              const Icon = p.icon;
              return (
                <button key={p.id} onClick={() => setPlatform(p.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left border transition-all ${platform === p.id ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-100 hover:border-gray-300"}`}>
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1 text-[0.64rem] uppercase tracking-[0.1em] font-medium">{p.label}</span>
                  <span className={`text-[0.52rem] tabular-nums font-mono ${platform === p.id ? "text-gray-400" : "text-gray-300"}`}>{p.w}×{p.h}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mx-4 border-t border-gray-50" />
        {/* Template */}
        <div className="px-4 pt-3 pb-3">
          <p className="text-[0.52rem] uppercase tracking-[0.18em] text-gray-400 mb-2.5 flex items-center gap-1.5">
            <LayoutTemplate className="h-2.5 w-2.5" /> ③ Template
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => setTemplate(t.id)}
                className={`text-left px-2.5 py-2.5 border transition-all ${template === t.id ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-100 hover:border-gray-300"}`}>
                <p className={`text-[0.60rem] uppercase tracking-[0.08em] font-bold leading-tight ${template === t.id ? "text-white" : "text-gray-700"}`}>{t.label}</p>
                <p className={`text-[0.52rem] mt-0.5 leading-tight text-gray-400`}>{t.desc}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="mx-4 border-t border-gray-50" />
        {/* Branding */}
        <div className="px-4 pt-3 pb-4">
          <p className="text-[0.52rem] uppercase tracking-[0.18em] text-gray-400 mb-2.5 flex items-center gap-1.5">
            <Palette className="h-2.5 w-2.5" /> ④ Branding
          </p>
          <div className="space-y-2.5">
            <div>
              <label className="text-[0.53rem] uppercase tracking-[0.12em] text-gray-400 block mb-1">Brand Name</label>
              <input value={brandName} onChange={e => setBrandName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 focus:outline-none focus:border-gray-400" />
            </div>
            <div>
              <label className="text-[0.53rem] uppercase tracking-[0.12em] text-gray-400 block mb-1">Tagline</label>
              <input value={tagline} onChange={e => setTagline(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 focus:outline-none focus:border-gray-400" />
            </div>
            <div>
              <label className="text-[0.53rem] uppercase tracking-[0.12em] text-gray-400 block mb-1">Accent Color</label>
              <div className="flex gap-1.5 flex-wrap mb-1.5">
                {ACCENT_PRESETS.map(p => (
                  <button key={p.hex} title={p.label} onClick={() => setAccentColor(p.hex)} style={{ background: p.hex }}
                    className={`w-5 h-5 border-2 transition-all ${accentColor === p.hex ? "border-gray-900 scale-110" : "border-transparent hover:border-gray-400"}`} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-8 h-7 cursor-pointer border border-gray-200" />
                <input value={accentColor} onChange={e => setAccentColor(e.target.value)} className="flex-1 px-2 py-1.5 text-[0.65rem] border border-gray-200 focus:outline-none focus:border-gray-400 font-mono" />
              </div>
            </div>
            <div>
              <label className="text-[0.53rem] uppercase tracking-[0.12em] text-gray-400 block mb-1">Copy Tone</label>
              <div className="grid grid-cols-2 gap-1">
                {(["luxe", "playful", "bold", "minimal"] as const).map(t => (
                  <button key={t} onClick={() => setTone(t)}
                    className={`py-1.5 text-[0.57rem] uppercase tracking-[0.08em] border transition-all ${tone === t ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 py-3.5 border-t border-gray-100 shrink-0">
        <button onClick={handleGenerate} disabled={!selectedProduct || generating}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 text-[0.60rem] uppercase tracking-[0.18em] hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {generating ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Writing copy…</> : <><Sparkles className="h-3.5 w-3.5" /> Generate All Platforms</>}
        </button>
      </div>
    </div>
  );

  const MainCanvas = (isDesktop: boolean) => (
    <div className={`flex-1 overflow-y-auto ${isDesktop ? "" : ""}`}>
      {!selectedProduct ? (
        <div className="h-full flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <div className="w-14 h-14 bg-white border border-gray-200 flex items-center justify-center mx-auto mb-5 shadow-sm rounded-xl">
              <Sparkles className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1.5">No product selected</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              {isDesktop
                ? "Choose a product from the left panel to preview templates and generate platform-optimized copy."
                : "Tap \"Select Product\" above to get started."}
            </p>
          </div>
        </div>
      ) : (
        <div className={`space-y-4 ${isDesktop ? "p-6 max-w-[640px] mx-auto" : "px-4 pt-4 pb-6"}`}>

          {/* Top bar — desktop only */}
          {isDesktop && (
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  {(() => { const Icon = platformCfg.icon; return <Icon className="h-3.5 w-3.5 text-gray-400" />; })()}
                  <p className="text-sm font-semibold text-gray-900">{platformCfg.label}</p>
                  <span className="text-[0.56rem] font-mono text-gray-400 ml-1">{platformCfg.safeZone} px</span>
                </div>
                <p className="text-[0.60rem] text-gray-400 pl-5">{selectedProduct.name}</p>
              </div>
              <div className="flex items-center gap-2">
                {generatedContent && (
                  <button onClick={handleGenerate} disabled={generating}
                    className="flex items-center gap-1.5 px-3 py-2 text-[0.58rem] uppercase tracking-[0.12em] border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40 bg-white">
                    <RefreshCw className={`h-2.5 w-2.5 ${generating ? "animate-spin" : ""}`} />
                    Regenerate
                  </button>
                )}
                <button onClick={handleDownload} disabled={downloading}
                  className="flex items-center gap-1.5 px-4 py-2 text-[0.58rem] uppercase tracking-[0.12em] bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-50">
                  {downloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                  Download PNG
                </button>
              </div>
            </div>
          )}

          {/* Headline override */}
          <div className={`bg-white border border-gray-100 px-4 py-3 flex items-center gap-3 ${isDesktop ? "" : "rounded-xl"}`}>
            <Edit3 className="h-4 w-4 text-gray-300 shrink-0" />
            <input
              value={headlineOverride}
              onChange={e => setHeadlineOverride(e.target.value)}
              placeholder={currentCopy?.headline || selectedProduct?.name || "Override headline on graphic…"}
              className="flex-1 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none bg-transparent"
            />
            {headlineOverride && (
              <button onClick={() => setHeadlineOverride("")} className="text-[0.58rem] uppercase tracking-[0.1em] text-gray-300 active:text-gray-600 shrink-0 min-w-[44px] text-right">
                Reset
              </button>
            )}
          </div>

          {/* Preview */}
          <div ref={isDesktop ? undefined : previewWrapRef} className={`overflow-hidden shadow-lg ${isDesktop ? "shadow-xl" : "rounded-xl"}`}
            style={{ width: pw, height: ph, position: "relative" }}>
            <div
              ref={templateRef}
              style={{ width: platformCfg.w, height: platformCfg.h, transform: `scale(${scale})`, transformOrigin: "top left", display: "block" }}
            >
              {renderTemplate(template, templateProps)}
            </div>
          </div>

          {/* Platform tabs + copy */}
          {(generatedContent || generating) && (
            <div className={`bg-white border border-gray-100 ${isDesktop ? "" : "rounded-xl overflow-hidden"}`}>
              <div className="flex border-b border-gray-100 overflow-x-auto">
                {PLATFORMS.map(p => {
                  const Icon = p.icon;
                  return (
                    <button key={p.id} onClick={() => setPlatform(p.id)}
                      className={`flex items-center gap-1.5 px-4 py-3.5 text-[0.58rem] uppercase tracking-[0.1em] border-b-2 transition-colors whitespace-nowrap -mb-px ${
                        platform === p.id ? "border-gray-900 text-gray-900 font-semibold" : "border-transparent text-gray-400"
                      }`}>
                      <Icon className="h-3 w-3" />
                      {p.label.replace(" / Twitter", "").replace("Google Ads", "Google")}
                    </button>
                  );
                })}
              </div>
              {generating ? (
                <div className="px-5 py-8 flex items-center justify-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
                  <p className="text-xs text-gray-400">Writing elite copy via GPT-4o…</p>
                </div>
              ) : currentCopy && (
                <div className="p-5 space-y-4">
                  <CopyField label="Headline" value={currentCopy.headline} />
                  {currentCopy.caption && <CopyField label="Caption / Body" value={currentCopy.caption} />}
                  {currentCopy.hashtags.length > 0 && (
                    <CopyField
                      label={`Hashtags (${currentCopy.hashtags.length})`}
                      value={currentCopy.hashtags.map(h => h.startsWith("#") ? h : `#${h}`).join(" ")}
                      mono
                    />
                  )}
                  <button
                    onClick={() => {
                      const post = [currentCopy.caption, currentCopy.hashtags.length > 0 ? "\n\n" + currentCopy.hashtags.map(h => h.startsWith("#") ? h : `#${h}`).join(" ") : ""].join("").trim();
                      navigator.clipboard.writeText(post);
                      toast.success("Full post copied");
                    }}
                    className={`w-full py-3.5 border border-gray-200 text-[0.58rem] uppercase tracking-[0.14em] text-gray-500 active:bg-gray-50 active:border-gray-400 transition-colors flex items-center justify-center gap-1.5 ${isDesktop ? "" : "rounded-lg"}`}
                  >
                    <Copy className="h-3 w-3" />
                    Copy Full Post
                  </button>
                </div>
              )}
            </div>
          )}

          {!generatedContent && !generating && (
            <div className={`border border-dashed border-gray-200 px-5 py-8 text-center bg-white ${isDesktop ? "" : "rounded-xl"}`}>
              <Sparkles className="h-5 w-5 text-gray-200 mx-auto mb-2.5" />
              <p className="text-sm text-gray-500 mb-1">No copy generated yet</p>
              <p className="text-xs text-gray-400 leading-relaxed">Tap Generate — GPT-4o will write platform-optimised copy for all four channels simultaneously.</p>
            </div>
          )}

          <div className="flex items-start gap-2 text-[0.57rem] text-gray-400">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            <span>PNG exports at {platformCfg.w}×{platformCfg.h}px, ready for {platformCfg.label}.</span>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Desktop (md+) ───────────────────────────────────────────────────── */}
      <div className="hidden md:flex h-screen overflow-hidden" style={{ background: "#F4F3F1" }}>
        {DesktopSidebar}
        <div ref={previewWrapRef} className="flex-1 overflow-y-auto">
          {MainCanvas(true)}
        </div>
      </div>

      {/* ── Mobile (< md) ───────────────────────────────────────────────────── */}
      <div className="md:hidden flex flex-col min-h-full" style={{ background: "#F4F3F1" }}>

        {/* ── Sticky control strip ──────────────────────────────────────────── */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">

          {/* Row 1: Header + Settings */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-900 flex items-center justify-center rounded-md shrink-0">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Creator Hub</p>
            </div>
            <div className="flex items-center gap-2">
              {generatedContent && (
                <button onClick={handleGenerate} disabled={generating}
                  className="flex items-center gap-1.5 px-3 py-2 text-[0.60rem] uppercase tracking-[0.1em] bg-gray-100 text-gray-600 rounded-lg active:bg-gray-200 disabled:opacity-40 min-h-[36px]">
                  <RefreshCw className={`h-3 w-3 ${generating ? "animate-spin" : ""}`} />
                  Regen
                </button>
              )}
              <button onClick={() => setSettingsSheetOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-[0.60rem] uppercase tracking-[0.1em] bg-gray-100 text-gray-700 rounded-lg active:bg-gray-200 min-h-[36px]">
                <SlidersHorizontal className="h-3 w-3" />
                Settings
              </button>
            </div>
          </div>

          {/* Row 2: Product selector */}
          <div className="px-4 pb-2.5">
            <button
              onClick={() => setProductSheetOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl active:bg-gray-100 transition-colors"
            >
              {selectedProduct?.image_url
                ? <img src={selectedProduct.image_url} alt="" className="w-8 h-8 object-cover rounded-lg shrink-0 bg-gray-100" />
                : <div className="w-8 h-8 bg-gray-200 rounded-lg shrink-0 flex items-center justify-center"><ImageIcon className="h-4 w-4 text-gray-400" /></div>
              }
              <div className="flex-1 min-w-0 text-left">
                {selectedProduct
                  ? <>
                      <p className="text-xs font-semibold text-gray-900 truncate">{selectedProduct.name}</p>
                      <p className="text-[0.60rem] text-gray-400">{formatUSD(Number(selectedProduct.base_price ?? 0))}</p>
                    </>
                  : <p className="text-sm text-gray-400">Select a product…</p>
                }
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
            </button>
          </div>

          {/* Row 3: Platform pills */}
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none" style={{ WebkitOverflowScrolling: "touch" }}>
            {PLATFORMS.map(p => {
              const Icon = p.icon;
              const active = platform === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full shrink-0 transition-all active:scale-95 ${
                    active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  <span className="text-[0.62rem] uppercase tracking-[0.08em] font-semibold whitespace-nowrap">
                    {p.label.replace(" / Twitter", "").replace("Google Ads", "Google")}
                  </span>
                  {active && <span className="text-[0.50rem] font-mono text-gray-400 ml-0.5">{p.safeZone}</span>}
                </button>
              );
            })}
          </div>

          {/* Row 4: Template pills */}
          <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-none" style={{ WebkitOverflowScrolling: "touch" }}>
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={`px-3.5 py-1.5 rounded-full shrink-0 transition-all active:scale-95 text-[0.60rem] uppercase tracking-[0.08em] font-semibold whitespace-nowrap ${
                  template === t.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable content ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {/* Preview wrapper — full width, measure here */}
          <div ref={previewWrapRef} className="px-4 pt-4">
            {selectedProduct ? (
              <div className="overflow-hidden rounded-xl shadow-lg" style={{ width: pw, height: ph, position: "relative" }}>
                <div
                  ref={templateRef}
                  style={{ width: platformCfg.w, height: platformCfg.h, transform: `scale(${scale})`, transformOrigin: "top left", display: "block" }}
                >
                  {renderTemplate(template, templateProps)}
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-white border border-dashed border-gray-200 flex items-center justify-center" style={{ height: 220 }}>
                <div className="text-center">
                  <Sparkles className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Select a product to preview</p>
                </div>
              </div>
            )}
          </div>

          {/* Rest of content */}
          <div className="px-4 pt-4 pb-36 space-y-3">

            {/* Headline override */}
            <div className="bg-white border border-gray-100 px-4 py-3 flex items-center gap-3 rounded-xl">
              <Edit3 className="h-4 w-4 text-gray-300 shrink-0" />
              <input
                value={headlineOverride}
                onChange={e => setHeadlineOverride(e.target.value)}
                placeholder={currentCopy?.headline || selectedProduct?.name || "Override headline on graphic…"}
                className="flex-1 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none bg-transparent"
              />
              {headlineOverride && (
                <button onClick={() => setHeadlineOverride("")}
                  className="text-[0.60rem] uppercase tracking-[0.1em] text-gray-300 active:text-gray-600 shrink-0 min-w-[44px] text-right">
                  Reset
                </button>
              )}
            </div>

            {/* Copy panel — collapsible */}
            {(generatedContent || generating) && (
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                {/* Collapse header */}
                <button
                  onClick={() => setCopyOpen(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3.5 border-b border-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <Copy className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-800">Platform Copy</span>
                    {generatedContent && <span className="text-[0.52rem] uppercase tracking-[0.1em] text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full">Ready</span>}
                    {generating && <span className="text-[0.52rem] uppercase tracking-[0.1em] text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full">Generating…</span>}
                  </div>
                  {copyOpen
                    ? <ChevronDown className="h-4 w-4 text-gray-400" />
                    : <ChevronRight className="h-4 w-4 text-gray-400" />
                  }
                </button>

                {copyOpen && (
                  <>
                    {/* Platform tabs */}
                    <div className="flex border-b border-gray-100 overflow-x-auto">
                      {PLATFORMS.map(p => {
                        const Icon = p.icon;
                        return (
                          <button key={p.id} onClick={() => setPlatform(p.id)}
                            className={`flex items-center gap-1.5 px-4 py-3 text-[0.58rem] uppercase tracking-[0.1em] border-b-2 transition-colors whitespace-nowrap -mb-px ${
                              platform === p.id ? "border-gray-900 text-gray-900 font-semibold" : "border-transparent text-gray-400"
                            }`}>
                            <Icon className="h-3 w-3" />
                            {p.label.replace(" / Twitter", "").replace("Google Ads", "Google")}
                          </button>
                        );
                      })}
                    </div>

                    {generating ? (
                      <div className="px-5 py-8 flex items-center justify-center gap-3">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
                        <p className="text-xs text-gray-400">Writing elite copy via GPT-4o…</p>
                      </div>
                    ) : currentCopy && (
                      <div className="p-4 space-y-4">
                        <CopyField label="Headline" value={currentCopy.headline} />
                        {currentCopy.caption && <CopyField label="Caption / Body" value={currentCopy.caption} />}
                        {currentCopy.hashtags.length > 0 && (
                          <CopyField
                            label={`Hashtags (${currentCopy.hashtags.length})`}
                            value={currentCopy.hashtags.map(h => h.startsWith("#") ? h : `#${h}`).join(" ")}
                            mono
                          />
                        )}
                        <button
                          onClick={() => {
                            const post = [currentCopy.caption, currentCopy.hashtags.length > 0 ? "\n\n" + currentCopy.hashtags.map(h => h.startsWith("#") ? h : `#${h}`).join(" ") : ""].join("").trim();
                            navigator.clipboard.writeText(post);
                            toast.success("Full post copied");
                          }}
                          className="w-full py-3.5 border border-gray-200 rounded-lg text-[0.60rem] uppercase tracking-[0.14em] text-gray-500 active:bg-gray-50 flex items-center justify-center gap-2"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy Full Post
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {!generatedContent && !generating && selectedProduct && (
              <div className="border border-dashed border-gray-200 px-5 py-7 text-center bg-white rounded-xl">
                <Sparkles className="h-5 w-5 text-gray-200 mx-auto mb-2.5" />
                <p className="text-sm text-gray-500 mb-1">Tap Generate below</p>
                <p className="text-xs text-gray-400 leading-relaxed">GPT-4o writes professional, platform-optimised copy for all four channels at once.</p>
              </div>
            )}

            <div className="flex items-start gap-2 text-[0.57rem] text-gray-400">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              <span>Exports at {platformCfg.w}×{platformCfg.h}px — ready for {platformCfg.label}.</span>
            </div>
          </div>
        </div>

        {/* ── Sticky bottom bar ─────────────────────────────────────────────── */}
        <div
          className="fixed left-0 right-0 z-20 bg-white border-t border-gray-100 px-4 pt-3"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 64px)",
            boxShadow: "0 -6px 20px rgba(0,0,0,0.08)",
            paddingBottom: 12,
          }}
        >
          <div className="flex gap-2.5">
            <button
              onClick={handleGenerate}
              disabled={!selectedProduct || generating}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 rounded-xl text-[0.62rem] uppercase tracking-[0.16em] active:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
            >
              {generating
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                : <><Sparkles className="h-4 w-4" /> Generate</>
              }
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading || !selectedProduct}
              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gray-100 text-gray-700 active:bg-gray-200 transition-colors disabled:opacity-40"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* ── Bottom Sheets ──────────────────────────────────────────────────── */}
        <ProductSheet
          open={productSheetOpen}
          onClose={() => setProductSheetOpen(false)}
          products={filteredProducts}
          loading={loadingProducts}
          selected={selectedProduct}
          onSelect={p => { setSelectedProduct(p); setGeneratedContent(null); setHeadlineOverride(""); }}
          search={search}
          setSearch={setSearch}
        />

        <SettingsSheet
          open={settingsSheetOpen}
          onClose={() => setSettingsSheetOpen(false)}
          template={template} setTemplate={setTemplate}
          brandName={brandName} setBrandName={setBrandName}
          tagline={tagline} setTagline={setTagline}
          accentColor={accentColor} setAccentColor={setAccentColor}
          tone={tone} setTone={setTone}
        />
      </div>
    </>
  );
}
