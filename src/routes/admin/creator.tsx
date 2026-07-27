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
  X, SlidersHorizontal, ChevronDown, ChevronRight, Wand2,
  ZoomIn, RotateCcw as RetryIcon,
} from "lucide-react";
import { listAdminProductsAll } from "@/lib/admin-extended.functions";
import {
  generateSocialContent, generateProductImage,
  type SocialPlatform, type GeneratedContent, type GeneratedImageResult,
} from "@/lib/creator.functions";
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

// ─── AI Image Style/Angle Presets ─────────────────────────────────────────────

export const IMAGE_STYLES = [
  { id: "studio_white",   label: "Studio White",   icon: "⬜", desc: "Clean commercial" },
  { id: "velvet_black",   label: "Velvet Black",   icon: "◼",  desc: "Dark luxury" },
  { id: "marble_white",   label: "White Marble",   icon: "🏛",  desc: "Architectural" },
  { id: "velvet_navy",    label: "Navy Velvet",    icon: "🔵", desc: "Deep blue" },
  { id: "rose_gold_bg",   label: "Rose Gold",      icon: "🌹", desc: "Warm metallic" },
  { id: "lifestyle_worn", label: "Lifestyle",      icon: "✨",  desc: "Editorial worn" },
  { id: "flatlay_linen",  label: "Flat Lay",       icon: "📐", desc: "Overhead styled" },
  { id: "marble_grey",    label: "Grey Marble",    icon: "🪨",  desc: "Cool tones" },
  { id: "bokeh_warm",     label: "Warm Bokeh",     icon: "🌟", desc: "Dreamy romantic" },
  { id: "outdoor_garden", label: "Garden",         icon: "🌿", desc: "Natural botanical" },
  { id: "dark_wood",      label: "Dark Wood",      icon: "🪵", desc: "Artisan atelier" },
  { id: "champagne_silk", label: "Silk",           icon: "🎀", desc: "Fashion editorial" },
];

export const IMAGE_ANGLES = [
  { id: "front",    label: "Front",    icon: "⬛" },
  { id: "angle_45", label: "45° Angle",icon: "◩" },
  { id: "closeup",  label: "Close-up", icon: "🔍" },
  { id: "overhead", label: "Overhead", icon: "⬇" },
  { id: "draped",   label: "Draped",   icon: "〰" },
];

// ─── Template Types ───────────────────────────────────────────────────────────

type TemplateId = "eclat" | "maison" | "campagne" | "epure";

interface TemplateProps {
  product: any;
  headline: string;
  cta: string;
  brandName: string;
  tagline: string;
  accentColor: string;
  w: number;
  h: number;
  imageOverride?: string;
}

const COLOR_LABELS: Record<string, string> = {
  gold: "Yellow Gold", rose_gold: "Rose Gold", white_gold: "White Gold", silver: "Sterling Silver",
};

const ss = (px: number) => `${px}px`;

// ─── Wrap-safe text style helper ─────────────────────────────────────────────
// Every headline/caption that may contain long product names must use this.
function clampStyle(lines: number): React.CSSProperties {
  return {
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical" as any,
    overflow: "hidden",
    wordBreak: "break-word",
    overflowWrap: "break-word",
  };
}

// ─── Template 1: ÉCLAT — Editorial Magazine ───────────────────────────────────
// Split layout: product image dominant left (landscape) or top (square).
// Warm ivory text panel with structured typographic hierarchy.
// Inspired by Vogue jewelry advertorials.

function EclatTemplate({ product, headline, cta, brandName, tagline, accentColor, w, h, imageOverride }: TemplateProps) {
  const sq    = h / w >= 0.85;
  const imgSrc = imageOverride ?? product.image_url;

  // Proportional sizing
  const imgW  = sq ? w : Math.round(w * 0.55);
  const textW = sq ? w : w - imgW;
  const imgH  = sq ? Math.round(h * 0.58) : h;
  const textH = sq ? h - imgH : h;
  const pad   = Math.round(w * 0.060);
  const vPad  = sq ? Math.round(h * 0.038) : Math.round(h * 0.095);

  const colors = (product.color ?? "").split(",")
    .map((c: string) => COLOR_LABELS[c.trim()] ?? c.trim()).filter(Boolean);

  const fs = {
    brand:    Math.round(w * 0.0105),
    overline: Math.round(w * 0.0092),
    headline: Math.round(w * (sq ? 0.042 : 0.047)),
    meta:     Math.round(w * 0.0138),
    price:    Math.round(w * 0.032),
    cta:      Math.round(w * 0.0112),
    tagline:  Math.round(w * 0.0088),
  };

  const BG = "#FAF8F3";

  return (
    <div style={{
      width: w, height: h, overflow: "hidden", position: "relative",
      display: "flex", flexDirection: sq ? "column" : "row",
      background: BG, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif",
    }}>
      {/* ── Product image ── */}
      <div style={{ width: sq ? w : imgW, height: imgH, flexShrink: 0, position: "relative", overflow: "hidden" }}>
        {imgSrc
          ? <img src={imgSrc} alt="" crossOrigin="anonymous"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 18%" }} />
          : <div style={{ width: "100%", height: "100%", background: "#EDE8E0" }} />
        }
        {/* Right-edge feather (landscape) */}
        {!sq && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 72%, rgba(250,248,243,0.85) 100%)" }} />}
        {/* Bottom feather (square) */}
        {sq && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 60%, rgba(250,248,243,0.95) 100%)" }} />}
      </div>

      {/* ── Text panel ── */}
      <div style={{
        width: sq ? w : textW, height: textH, flexShrink: 0,
        background: BG, position: "relative", overflow: "hidden",
        padding: sq
          ? `${ss(Math.round(h * 0.032))} ${ss(pad)} ${ss(Math.round(h * 0.050))}`
          : `${ss(vPad)} ${ss(pad)}`,
        display: "flex", flexDirection: "column", justifyContent: sq ? "flex-start" : "center",
      }}>

        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: ss(Math.round(w * 0.014)), marginBottom: ss(Math.round(h * 0.026)), flexShrink: 0 }}>
          <div style={{ width: ss(Math.round(w * 0.018)), height: "1px", background: accentColor, flexShrink: 0 }} />
          <span style={{ fontSize: ss(fs.brand), letterSpacing: "0.28em", textTransform: "uppercase", color: accentColor, fontWeight: 700, whiteSpace: "nowrap" }}>
            {brandName}
          </span>
          {product.type && (
            <>
              <div style={{ flex: 1, height: "1px", background: "#DDD7CC", minWidth: 8 }} />
              <span style={{ fontSize: ss(fs.overline), letterSpacing: "0.22em", textTransform: "uppercase", color: "#A89E94", whiteSpace: "nowrap" }}>
                {product.type}
              </span>
            </>
          )}
        </div>

        {/* Headline */}
        <h2 style={{
          margin: 0,
          marginBottom: ss(Math.round(h * (sq ? 0.020 : 0.025))),
          fontSize: ss(fs.headline), fontWeight: 300, lineHeight: 1.22,
          letterSpacing: "-0.020em", color: "#1A1510",
          fontFamily: "Georgia,'Times New Roman',serif",
          flexShrink: 0,
          ...clampStyle(3),
        }}>
          {headline || product.name}
        </h2>

        {/* Color chips */}
        {colors.length > 0 && (
          <div style={{ display: "flex", gap: ss(Math.round(w * 0.016)), marginBottom: ss(Math.round(h * 0.022)), flexWrap: "wrap", flexShrink: 0 }}>
            {colors.slice(0, 4).map((c: string) => (
              <span key={c} style={{
                fontSize: ss(fs.meta), letterSpacing: "0.05em", color: "#7A7268",
                borderBottom: `1px solid #D0C9BC`, paddingBottom: "1px",
                wordBreak: "normal",
              }}>{c}</span>
            ))}
          </div>
        )}

        {/* Double rule */}
        <div style={{ flexShrink: 0, marginBottom: ss(Math.round(h * 0.024)) }}>
          <div style={{ width: "100%", height: "1px", background: "#DDD7CC" }} />
          <div style={{ width: "100%", height: "1px", background: "#DDD7CC", marginTop: "3px" }} />
        </div>

        {/* Price + CTA row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, gap: ss(Math.round(w * 0.012)) }}>
          <span style={{ fontSize: ss(fs.price), fontWeight: 300, color: "#1A1510", letterSpacing: "-0.010em", flexShrink: 0 }}>
            {formatUSD(Number(product.base_price ?? 0))}
          </span>
          <div style={{
            display: "flex", alignItems: "center", gap: ss(Math.round(w * 0.010)),
            padding: `${ss(Math.round(h * 0.018))} ${ss(Math.round(w * 0.030))}`,
            background: "#1A1510", color: "#FAF8F3", flexShrink: 0,
            fontSize: ss(fs.cta), letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 600,
          }}>
            {cta || "Explore"} <span style={{ opacity: 0.5, fontSize: ss(fs.cta * 1.1) }}>→</span>
          </div>
        </div>

        {/* Tagline — pinned to bottom */}
        <div style={{ position: "absolute", bottom: ss(sq ? Math.round(h * 0.028) : Math.round(h * 0.036)), left: ss(pad) }}>
          <span style={{ fontSize: ss(fs.tagline), letterSpacing: "0.20em", color: "#C4B9AD", textTransform: "uppercase" }}>
            {tagline}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Template 2: MAISON NOIR — Dark Luxury ────────────────────────────────────
// Near-black warm canvas with product centred in a spotlight glow.
// Inspired by Van Cleef & Arpels campaign photography.

function MaisonTemplate({ product, headline, cta, brandName, tagline, accentColor, w, h, imageOverride }: TemplateProps) {
  const sq     = h / w >= 0.85;
  const imgSrc = imageOverride ?? product.image_url;

  const imgSize = sq ? Math.round(w * 0.64) : Math.round(Math.min(w * 0.48, h * 0.68));
  const imgTop  = sq ? Math.round(h * 0.110) : Math.round(h * 0.075);
  const pad     = Math.round(w * 0.065);
  const textZoneH = sq
    ? h - (imgTop + imgSize) + Math.round(h * 0.01)
    : Math.round(h * 0.38);

  const fs = {
    brand:    Math.round(w * 0.0115),
    headline: Math.round(w * (sq ? 0.038 : 0.043)),
    price:    Math.round(w * 0.024),
    cta:      Math.round(w * 0.0115),
    tagline:  Math.round(w * 0.0092),
  };

  const FRAME_INSET = Math.round(w * 0.026);

  return (
    <div style={{
      width: w, height: h, overflow: "hidden", position: "relative",
      background: "radial-gradient(ellipse 90% 70% at 50% 40%, #201C18 0%, #0E0B09 52%, #050403 100%)",
      fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif",
    }}>

      {/* Grain texture */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, opacity: 0.03,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        backgroundSize: "220px 220px",
      }} />

      {/* Outer decorative frame */}
      <div style={{ position: "absolute", inset: FRAME_INSET, border: `1px solid ${accentColor}22`, zIndex: 1 }} />
      {/* Inner frame */}
      <div style={{ position: "absolute", inset: FRAME_INSET + 6, border: `1px solid ${accentColor}0E`, zIndex: 1 }} />

      {/* Corner L-brackets */}
      {([
        { top: FRAME_INSET,     left: FRAME_INSET },
        { top: FRAME_INSET,     right: FRAME_INSET },
        { bottom: FRAME_INSET, left: FRAME_INSET },
        { bottom: FRAME_INSET, right: FRAME_INSET },
      ] as any[]).map((pos, i) => (
        <div key={i} style={{
          position: "absolute", ...pos, zIndex: 3,
          width: ss(Math.round(w * 0.028)), height: ss(Math.round(h * 0.040)),
          borderTop:    i < 2  ? `1.5px solid ${accentColor}60` : undefined,
          borderBottom: i >= 2 ? `1.5px solid ${accentColor}60` : undefined,
          borderLeft:   i % 2 === 0 ? `1.5px solid ${accentColor}60` : undefined,
          borderRight:  i % 2 === 1 ? `1.5px solid ${accentColor}60` : undefined,
        }} />
      ))}

      {/* Brand — centered top */}
      <div style={{
        position: "absolute", top: ss(Math.round(h * 0.055)), left: 0, right: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: ss(Math.round(w * 0.022)), zIndex: 4,
      }}>
        <div style={{ height: "1px", width: ss(Math.round(w * 0.065)), background: `${accentColor}55` }} />
        <span style={{
          fontSize: ss(fs.brand), letterSpacing: "0.34em", textTransform: "uppercase",
          color: accentColor, fontWeight: 600, whiteSpace: "nowrap",
        }}>{brandName}</span>
        <div style={{ height: "1px", width: ss(Math.round(w * 0.065)), background: `${accentColor}55` }} />
      </div>

      {/* Product image with glow */}
      <div style={{
        position: "absolute",
        top: ss(imgTop),
        left: `${Math.round((w - imgSize) / 2)}px`,
        width: ss(imgSize),
        height: ss(sq ? imgSize : Math.round(h * 0.55)),
        zIndex: 2,
      }}>
        {/* Under-glow */}
        <div style={{
          position: "absolute", bottom: "-12%", left: "5%", right: "5%", height: "40%", zIndex: 1,
          background: `radial-gradient(ellipse at center bottom, ${accentColor}22 0%, transparent 68%)`,
          filter: "blur(12px)",
        }} />
        {/* Side glow */}
        <div style={{
          position: "absolute", inset: "-10%", zIndex: 1,
          background: `radial-gradient(ellipse at center, ${accentColor}08 0%, transparent 60%)`,
          filter: "blur(20px)",
        }} />
        {imgSrc
          ? <img src={imgSrc} alt="" crossOrigin="anonymous"
              style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 2 }} />
          : <div style={{ width: "100%", height: "100%", background: "#1A1512", position: "relative", zIndex: 2 }} />
        }
      </div>

      {/* Bottom text lock-up */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 4,
        height: ss(textZoneH),
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: `0 ${ss(pad)}`,
        background: `linear-gradient(to bottom, transparent 0%, rgba(5,4,3,0.70) 35%, rgba(5,4,3,0.94) 100%)`,
      }}>
        {/* Diamond separator */}
        <div style={{ display: "flex", alignItems: "center", gap: ss(Math.round(w * 0.018)), marginBottom: ss(Math.round(h * 0.020)), flexShrink: 0 }}>
          <div style={{ flex: 1, height: "1px", background: `${accentColor}50`, maxWidth: ss(Math.round(w * 0.08)) }} />
          <div style={{ width: ss(Math.round(w * 0.007)), height: ss(Math.round(w * 0.007)), background: accentColor, transform: "rotate(45deg)", flexShrink: 0 }} />
          <div style={{ flex: 1, height: "1px", background: `${accentColor}50`, maxWidth: ss(Math.round(w * 0.08)) }} />
        </div>

        {/* Headline */}
        <h2 style={{
          margin: 0, marginBottom: ss(Math.round(h * 0.018)),
          fontSize: ss(fs.headline), fontWeight: 300, lineHeight: 1.28,
          letterSpacing: "0.010em", color: "#EDE8DE", textAlign: "center",
          fontFamily: "Georgia,'Times New Roman',serif", flexShrink: 0,
          maxWidth: ss(Math.round(w * 0.78)),
          ...clampStyle(3),
        }}>
          {headline || product.name}
        </h2>

        {/* Price */}
        <div style={{ marginBottom: ss(Math.round(h * 0.022)), flexShrink: 0 }}>
          <span style={{ fontSize: ss(fs.price), color: accentColor, letterSpacing: "0.08em", fontWeight: 300 }}>
            {formatUSD(Number(product.base_price ?? 0))}
          </span>
        </div>

        {/* CTA — outlined */}
        <div style={{
          padding: `${ss(Math.round(h * 0.017))} ${ss(Math.round(w * 0.055))}`,
          border: `1px solid ${accentColor}80`,
          color: accentColor, fontSize: ss(fs.cta),
          letterSpacing: "0.26em", textTransform: "uppercase", fontWeight: 600,
          flexShrink: 0, whiteSpace: "nowrap",
        }}>
          {cta || "Discover"}
        </div>
      </div>

      {/* Footer tagline */}
      <div style={{
        position: "absolute", bottom: ss(Math.round(h * 0.030)), left: 0, right: 0,
        textAlign: "center", zIndex: 5,
      }}>
        <span style={{ fontSize: ss(fs.tagline), letterSpacing: "0.24em", color: "#2A2420", textTransform: "uppercase" }}>
          {tagline}
        </span>
      </div>
    </div>
  );
}

// ─── Template 3: CAMPAGNE — Full-Bleed Impact ─────────────────────────────────
// Cinematic full-bleed product photo. Multi-layer gradient scrim.
// Oversized display headline. Price badge. Stop-scroll billboard energy.

function CampagneTemplate({ product, headline, cta, brandName, accentColor, w, h, imageOverride }: TemplateProps) {
  const sq     = h / w >= 0.85;
  const imgSrc = imageOverride ?? product.image_url;

  const pad = Math.round(w * 0.060);
  const fs  = {
    brand:    Math.round(w * 0.0115),
    headline: Math.round(w * (sq ? 0.062 : 0.055)),
    price:    Math.round(w * 0.0160),
    cta:      Math.round(w * 0.0122),
  };

  return (
    <div style={{
      width: w, height: h, position: "relative", overflow: "hidden",
      background: "#0C0A08", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif",
    }}>

      {/* Full-bleed product */}
      {imgSrc
        ? <img src={imgSrc} alt="" crossOrigin="anonymous"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 22%" }} />
        : <div style={{ position: "absolute", inset: 0, background: "#1A1612" }} />
      }

      {/* Layer 1 — top vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 35%)",
      }} />

      {/* Layer 2 — cinematic widescreen bar top */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: ss(Math.round(h * 0.055)), background: "rgba(0,0,0,0.62)", zIndex: 1 }} />

      {/* Layer 3 — heavy bottom scrim */}
      <div style={{
        position: "absolute", inset: 0,
        background: sq
          ? "linear-gradient(to bottom, transparent 32%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.90) 100%)"
          : "linear-gradient(to bottom, transparent 22%, rgba(0,0,0,0.48) 52%, rgba(0,0,0,0.92) 100%)",
      }} />

      {/* Layer 4 — lateral vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 120% 100% at 50% 50%, transparent 50%, rgba(0,0,0,0.42) 100%)",
      }} />

      {/* Brand mark — top left, inside widescreen bar */}
      <div style={{
        position: "absolute",
        top: ss(Math.round(h * 0.013)),
        left: ss(pad), zIndex: 4,
        display: "flex", alignItems: "center", gap: ss(Math.round(w * 0.012)),
        height: ss(Math.round(h * 0.030)),
      }}>
        <div style={{ width: ss(Math.round(w * 0.018)), height: "1.5px", background: accentColor, flexShrink: 0 }} />
        <span style={{
          fontSize: ss(fs.brand), letterSpacing: "0.24em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.90)", fontWeight: 700, whiteSpace: "nowrap",
        }}>{brandName}</span>
      </div>

      {/* Price badge — top right inside bar */}
      <div style={{
        position: "absolute",
        top: ss(Math.round(h * 0.010)),
        right: ss(pad), zIndex: 4,
        display: "flex", alignItems: "center",
        height: ss(Math.round(h * 0.036)),
        padding: `0 ${ss(Math.round(w * 0.022))}`,
        background: accentColor,
      }}>
        <span style={{ fontSize: ss(fs.price), fontWeight: 700, letterSpacing: "0.05em", color: "#0C0A08", whiteSpace: "nowrap" }}>
          {formatUSD(Number(product.base_price ?? 0))}
        </span>
      </div>

      {/* Bottom text block */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 4,
        padding: sq
          ? `0 ${ss(pad)} ${ss(Math.round(h * 0.055))}`
          : `0 ${ss(pad)} ${ss(Math.round(h * 0.048))}`,
      }}>
        {/* Accent rule */}
        <div style={{ width: ss(Math.round(w * 0.042)), height: "2px", background: accentColor, marginBottom: ss(Math.round(h * 0.020)) }} />

        {/* Headline */}
        <h2 style={{
          margin: 0, marginBottom: ss(Math.round(h * 0.030)),
          fontSize: ss(fs.headline), fontWeight: 900, lineHeight: 1.08,
          letterSpacing: "-0.025em", color: "#FFFFFF",
          textShadow: "0 2px 24px rgba(0,0,0,0.60)",
          fontFamily: "'Arial Black',Impact,'Helvetica Neue',Helvetica,Arial,sans-serif",
          maxWidth: sq ? "88%" : "68%",
          ...clampStyle(4),
        }}>
          {headline || product.name}
        </h2>

        {/* CTA row */}
        <div style={{ display: "flex", alignItems: "center", gap: ss(Math.round(w * 0.022)) }}>
          <div style={{
            padding: `${ss(Math.round(h * 0.019))} ${ss(Math.round(w * 0.036))}`,
            background: "#FFFFFF", color: "#0C0A08",
            fontSize: ss(fs.cta), fontWeight: 800, letterSpacing: "0.18em",
            textTransform: "uppercase", whiteSpace: "nowrap",
          }}>
            {cta || "Shop Now"}
          </div>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.30)", maxWidth: ss(Math.round(w * 0.12)) }} />
        </div>
      </div>
    </div>
  );
}

// ─── Template 4: ÉPURE — Minimal Luxury ──────────────────────────────────────
// Maximum restraint. White canvas. Product floats. Typography as architecture.
// Inspired by Bottega Veneta and The Row visual identity.

function EpureTemplate({ product, headline, cta, brandName, tagline, accentColor, w, h, imageOverride }: TemplateProps) {
  const sq     = h / w >= 0.85;
  const imgSrc = imageOverride ?? product.image_url;

  const pad     = Math.round(w * 0.068);
  const headH   = Math.round(h * 0.100);
  const footH   = Math.round(h * 0.185);
  const imageH  = h - headH - footH;

  const fs = {
    brand:    Math.round(w * 0.0105),
    type:     Math.round(w * 0.0092),
    headline: Math.round(w * (sq ? 0.034 : 0.030)),
    price:    Math.round(w * 0.020),
    cta:      Math.round(w * 0.0105),
    tagline:  Math.round(w * 0.0088),
  };

  return (
    <div style={{
      width: w, height: h, overflow: "hidden", position: "relative",
      background: "#FDFCFA", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif",
      display: "flex", flexDirection: "column",
    }}>

      {/* Header strip */}
      <div style={{
        flexShrink: 0, height: ss(headH),
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: `0 ${ss(pad)}`,
        borderBottom: "1px solid #E8E3DC",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: ss(Math.round(w * 0.014)) }}>
          <span style={{ fontSize: ss(fs.brand), letterSpacing: "0.32em", textTransform: "uppercase", color: "#1A1510", fontWeight: 700, whiteSpace: "nowrap" }}>
            {brandName}
          </span>
          {tagline && (
            <>
              <span style={{ fontSize: ss(fs.brand), color: "#D0C9BC", marginLeft: ss(Math.round(w * 0.006)) }}>·</span>
              <span style={{ fontSize: ss(fs.tagline), letterSpacing: "0.18em", textTransform: "uppercase", color: "#A89E94", whiteSpace: "nowrap" }}>
                {tagline}
              </span>
            </>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: ss(Math.round(w * 0.010)) }}>
          {product.type && (
            <span style={{ fontSize: ss(fs.type), letterSpacing: "0.20em", textTransform: "uppercase", color: "#C4B9AD", whiteSpace: "nowrap" }}>
              {product.type}
            </span>
          )}
          <div style={{ width: ss(Math.round(w * 0.006)), height: ss(Math.round(w * 0.006)), borderRadius: "50%", background: accentColor, flexShrink: 0 }} />
        </div>
      </div>

      {/* Product image zone */}
      <div style={{ flexShrink: 0, height: ss(imageH), position: "relative", overflow: "hidden" }}>
        {imgSrc
          ? <img src={imgSrc} alt="" crossOrigin="anonymous"
              style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center bottom", padding: `${ss(Math.round(h * 0.018))} ${ss(Math.round(w * 0.05))}` }} />
          : <div style={{ width: "100%", height: "100%", background: "#F2EEE8" }} />
        }
        {/* Subtle bottom fade into footer */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "22%",
          background: "linear-gradient(to bottom, transparent, rgba(253,252,250,0.92))",
        }} />
      </div>

      {/* Footer strip */}
      <div style={{
        flexShrink: 0, height: ss(footH),
        borderTop: "1px solid #E8E3DC",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: `0 ${ss(pad)}`, gap: ss(Math.round(w * 0.020)),
      }}>
        {/* Left — headline + price */}
        <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
          <p style={{
            margin: 0, marginBottom: ss(Math.round(h * 0.010)),
            fontSize: ss(fs.headline), fontWeight: 300, lineHeight: 1.26,
            letterSpacing: "-0.008em", color: "#1A1510",
            fontFamily: "Georgia,'Times New Roman',serif",
            ...clampStyle(2),
          }}>
            {headline || product.name}
          </p>
          <p style={{ margin: 0, fontSize: ss(fs.price), fontWeight: 300, color: "#1A1510", letterSpacing: "0.010em", whiteSpace: "nowrap" }}>
            {formatUSD(Number(product.base_price ?? 0))}
          </p>
        </div>

        {/* Right — CTA + accent line */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: ss(Math.round(h * 0.012)), flexShrink: 0 }}>
          <div style={{
            padding: `${ss(Math.round(h * 0.018))} ${ss(Math.round(w * 0.030))}`,
            background: "#1A1510", color: "#FDFCFA",
            fontSize: ss(fs.cta), letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 600,
            whiteSpace: "nowrap",
          }}>
            {cta || "View"}
          </div>
          <div style={{ width: ss(Math.round(w * 0.035)), height: "1.5px", background: accentColor }} />
        </div>
      </div>
    </div>
  );
}

// ─── Template Registry ────────────────────────────────────────────────────────

const TEMPLATES: { id: TemplateId; label: string; desc: string }[] = [
  { id: "eclat",    label: "Éclat",    desc: "Editorial split · warm ivory" },
  { id: "maison",   label: "Maison",   desc: "Dark luxury · gold accents"   },
  { id: "campagne", label: "Campagne", desc: "Full-bleed · bold impact"     },
  { id: "epure",    label: "Épure",    desc: "Minimal · maximum restraint"  },
];

function renderTemplate(id: TemplateId, props: TemplateProps) {
  if (id === "eclat")    return <EclatTemplate    {...props} />;
  if (id === "maison")   return <MaisonTemplate   {...props} />;
  if (id === "campagne") return <CampagneTemplate {...props} />;
  return                        <EpureTemplate    {...props} />;
}

// ─── Shared UI Primitives ─────────────────────────────────────────────────────

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
  const copy = () => navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  if (!value) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[0.54rem] uppercase tracking-[0.16em] text-gray-400">{label}</span>
        <button onClick={copy} className="flex items-center gap-1 text-[0.54rem] uppercase tracking-[0.1em] text-gray-400 active:text-gray-700 min-h-[32px] px-1">
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

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────

function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <>
      <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <div className={`fixed left-0 right-0 bottom-0 z-50 bg-white rounded-t-2xl flex flex-col transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
        style={{ maxHeight: "88vh", boxShadow: "0 -12px 40px rgba(0,0,0,0.18)", paddingBottom: "env(safe-area-inset-bottom, 12px)" }}>
        <div className="flex justify-center pt-3 pb-0.5 shrink-0">
          <div className="w-9 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </>
  );
}

// ─── Product Sheet ────────────────────────────────────────────────────────────

function ProductSheet({ open, onClose, products, loading, selected, onSelect, search, setSearch }: {
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search catalog…"
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder:text-gray-300" />
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-gray-300" /></div>
      ) : (
        <div className="px-4 py-2 space-y-0.5 pb-6">
          {products.slice(0, 60).map((p: any) => (
            <button key={p.slug} onClick={() => { onSelect(p); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left active:scale-98 transition-all ${selected?.slug === p.slug ? "bg-gray-900" : "active:bg-gray-50"}`}>
              {p.image_url
                ? <img src={p.image_url} alt="" className="w-12 h-12 object-cover rounded-lg shrink-0 bg-gray-100" />
                : <div className="w-12 h-12 bg-gray-100 rounded-lg shrink-0" />
              }
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${selected?.slug === p.slug ? "text-white" : "text-gray-800"}`}>{p.name}</p>
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

// ─── Settings Sheet ───────────────────────────────────────────────────────────

function SettingsSheet({ open, onClose, template, setTemplate, brandName, setBrandName, tagline, setTagline, accentColor, setAccentColor, tone, setTone }: {
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
        <div>
          <p className="text-[0.52rem] uppercase tracking-[0.20em] text-gray-400 mb-3 flex items-center gap-1.5"><LayoutTemplate className="h-3 w-3" /> Template</p>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => setTemplate(t.id)}
                className={`text-left px-3.5 py-3 rounded-xl border transition-all active:scale-97 ${template === t.id ? "bg-gray-900 border-gray-900" : "bg-white border-gray-200"}`}>
                <p className={`text-xs font-bold leading-tight ${template === t.id ? "text-white" : "text-gray-800"}`}>{t.label}</p>
                <p className="text-[0.55rem] mt-0.5 leading-tight text-gray-400">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[0.52rem] uppercase tracking-[0.20em] text-gray-400 mb-3 flex items-center gap-1.5"><Palette className="h-3 w-3" /> Branding</p>
          <div className="space-y-3">
            <div>
              <label className="text-[0.56rem] uppercase tracking-[0.14em] text-gray-400 block mb-1.5">Brand Name</label>
              <input value={brandName} onChange={e => setBrandName(e.target.value)} className="w-full px-3.5 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400" />
            </div>
            <div>
              <label className="text-[0.56rem] uppercase tracking-[0.14em] text-gray-400 block mb-1.5">Tagline</label>
              <input value={tagline} onChange={e => setTagline(e.target.value)} className="w-full px-3.5 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400" />
            </div>
            <div>
              <label className="text-[0.56rem] uppercase tracking-[0.14em] text-gray-400 block mb-2">Accent Color</label>
              <div className="flex gap-2 flex-wrap mb-2.5">
                {ACCENT_PRESETS.map(p => (
                  <button key={p.hex} title={p.label} onClick={() => setAccentColor(p.hex)} style={{ background: p.hex }}
                    className={`w-8 h-8 rounded-full border-[3px] transition-all active:scale-90 ${accentColor === p.hex ? "border-gray-900 scale-110" : "border-transparent"}`} />
                ))}
              </div>
              <div className="flex items-center gap-2.5">
                <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 shrink-0" />
                <input value={accentColor} onChange={e => setAccentColor(e.target.value)} className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none font-mono" />
              </div>
            </div>
          </div>
        </div>
        <div>
          <p className="text-[0.52rem] uppercase tracking-[0.20em] text-gray-400 mb-3">Copy Tone</p>
          <div className="grid grid-cols-2 gap-2">
            {(["luxe", "playful", "bold", "minimal"] as const).map(t => (
              <button key={t} onClick={() => setTone(t)}
                className={`py-3 text-xs uppercase tracking-[0.10em] font-semibold rounded-xl border transition-all active:scale-97 ${tone === t ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}

// ─── AI Image Studio ──────────────────────────────────────────────────────────

interface AiImage { id: string; url: string; style: string; angle: string; prompt: string; }

function AiImageStudio({
  product, token, isMobile, onUseImage,
}: {
  product: any; token: string; isMobile: boolean;
  onUseImage: (url: string) => void;
}) {
  const [style,        setStyle]        = useState("studio_white");
  const [angle,        setAngle]        = useState("front");
  const [customPrompt, setCustomPrompt] = useState("");
  const [showCustom,   setShowCustom]   = useState(false);
  const [count,        setCount]        = useState(1);
  const [generating,   setGenerating]   = useState(false);
  const [images,       setImages]       = useState<AiImage[]>([]);
  const [lightboxImg,  setLightboxImg]  = useState<string | null>(null);
  const generateFn = useServerFn(generateProductImage);

  const handleGenerate = async () => {
    if (!product) { toast.error("Select a product first"); return; }
    setGenerating(true);
    try {
      // Collect every available image for this product so vision can study the
      // actual piece from multiple angles before building the generation prompt.
      const productImageUrls: string[] = [
        product.image_url,
        ...Object.values(product.color_images ?? {}),
      ].filter((u): u is string => typeof u === "string" && u.startsWith("http"));

      const res = await generateFn({
        data: {
          token,
          productName: product.name,
          productType: product.type ?? "",
          productImageUrls,
          style, angle, count,
          customPrompt: customPrompt.trim() || undefined,
        },
      });
      const newImgs: AiImage[] = res.images.map((img, i) => ({
        id: `${Date.now()}-${i}`,
        url: img.imageUrl,
        style, angle,
        prompt: img.prompt,
      }));
      setImages(prev => [...newImgs, ...prev]);
      toast.success(`${newImgs.length} image${newImgs.length > 1 ? "s" : ""} generated`);
    } catch (e: any) {
      toast.error(e?.message ?? "Image generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const activeStyle = IMAGE_STYLES.find(s => s.id === style)!;
  const activeAngle = IMAGE_ANGLES.find(a => a.id === angle)!;

  return (
    <div className="space-y-4">
      {/* Style selector */}
      <div>
        <p className="text-[0.52rem] uppercase tracking-[0.18em] text-gray-400 mb-2.5">Background & Setting</p>
        <div className={`${isMobile ? "flex gap-2 overflow-x-auto pb-1" : "grid grid-cols-3 gap-2"}`} style={{ WebkitOverflowScrolling: "touch" }}>
          {IMAGE_STYLES.map(s => (
            <button key={s.id} onClick={() => setStyle(s.id)}
              className={`flex flex-col items-start shrink-0 transition-all active:scale-95 ${isMobile ? "w-[88px]" : ""} ${
                style === s.id ? "bg-gray-900" : "bg-white hover:bg-gray-50 border border-gray-100"
              }`}
              style={{ padding: isMobile ? "10px 10px 8px" : "10px 12px 8px", borderRadius: 10 }}
            >
              <span className="text-base leading-none mb-1">{s.icon}</span>
              <p className={`text-[0.58rem] font-semibold uppercase tracking-[0.06em] leading-tight ${style === s.id ? "text-white" : "text-gray-700"}`}>{s.label}</p>
              <p className={`text-[0.50rem] mt-0.5 leading-tight ${style === s.id ? "text-gray-400" : "text-gray-400"}`}>{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Angle selector */}
      <div>
        <p className="text-[0.52rem] uppercase tracking-[0.18em] text-gray-400 mb-2">Composition</p>
        <div className="flex gap-1.5 flex-wrap">
          {IMAGE_ANGLES.map(a => (
            <button key={a.id} onClick={() => setAngle(a.id)}
              className={`px-3 py-2 rounded-lg text-[0.60rem] uppercase tracking-[0.08em] font-semibold transition-all active:scale-95 ${
                angle === a.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >{a.label}</button>
          ))}
        </div>
      </div>

      {/* Count + custom prompt */}
      <div className="flex items-center gap-3">
        <div>
          <p className="text-[0.52rem] uppercase tracking-[0.18em] text-gray-400 mb-2">Count</p>
          <div className="flex gap-1.5">
            {[1, 2, 4].map(n => (
              <button key={n} onClick={() => setCount(n)}
                className={`w-10 h-9 text-xs font-semibold rounded-lg transition-all ${count === n ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowCustom(v => !v)}
          className="ml-auto flex items-center gap-1.5 text-[0.58rem] uppercase tracking-[0.10em] text-gray-400 active:text-gray-700 mt-5">
          <Edit3 className="h-3 w-3" />
          {showCustom ? "Hide Prompt" : "Custom Prompt"}
        </button>
      </div>

      {showCustom && (
        <div>
          <textarea
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            placeholder={`Describe the exact shot you want — overrides the style preset. E.g. "Close-up of the chain clasp on black velvet, with a single spotlight creating a diamond-shaped reflection..."`}
            rows={3}
            className="w-full px-3.5 py-3 text-xs text-gray-700 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 placeholder:text-gray-300 resize-none"
          />
          {customPrompt && (
            <button onClick={() => setCustomPrompt("")} className="text-[0.55rem] text-gray-300 active:text-gray-500 mt-1">Clear</button>
          )}
        </div>
      )}

      {/* Generate */}
      <button
        onClick={handleGenerate}
        disabled={generating || !product}
        className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 rounded-xl text-[0.62rem] uppercase tracking-[0.18em] active:bg-gray-800 transition-colors disabled:opacity-40 font-semibold"
      >
        {generating
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating with DALL·E 3…</>
          : <><Wand2 className="h-4 w-4" /> Generate {count > 1 ? `${count} Images` : "Image"}</>
        }
      </button>

      {/* Loading skeletons */}
      {generating && (
        <div className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-2"}`}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-gray-200" />
            </div>
          ))}
        </div>
      )}

      {/* Generated gallery */}
      {images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[0.52rem] uppercase tracking-[0.18em] text-gray-400">Generated Images ({images.length})</p>
            <button onClick={() => setImages([])} className="text-[0.55rem] uppercase tracking-[0.1em] text-gray-300 active:text-gray-600">Clear all</button>
          </div>
          <div className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-2"}`}>
            {images.map(img => (
              <div key={img.id} className="relative group">
                <div className="aspect-square overflow-hidden rounded-xl bg-gray-100">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </div>
                {/* Action overlay */}
                <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button onClick={() => setLightboxImg(img.url)} title="View full size"
                    className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center active:scale-90 transition-all">
                    <ZoomIn className="h-4 w-4 text-gray-700" />
                  </button>
                </div>
                {/* Always-visible action bar */}
                <div className="mt-1.5 flex gap-1.5">
                  <button onClick={() => { onUseImage(img.url); toast.success("Image applied to template"); }}
                    className="flex-1 py-2 bg-gray-900 text-white text-[0.55rem] uppercase tracking-[0.10em] font-semibold rounded-lg active:bg-gray-700 transition-colors">
                    Use in Template
                  </button>
                  <a href={img.url} download target="_blank" rel="noreferrer"
                    className="flex items-center justify-center w-9 bg-gray-100 rounded-lg active:bg-gray-200">
                    <Download className="h-3.5 w-3.5 text-gray-600" />
                  </a>
                </div>
                <p className="text-[0.48rem] text-gray-400 mt-1 uppercase tracking-[0.08em]">
                  {IMAGE_STYLES.find(s => s.id === img.style)?.label} · {IMAGE_ANGLES.find(a => a.id === img.angle)?.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && !generating && (
        <div className="border border-dashed border-gray-200 rounded-xl px-5 py-8 text-center bg-white">
          <Wand2 className="h-6 w-6 text-gray-200 mx-auto mb-2.5" />
          <p className="text-sm text-gray-500 mb-1 font-medium">AI Image Studio</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Generate professional jewelry photography in any style using DALL·E 3. Choose a setting, composition, and hit Generate.
          </p>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white">
            <X className="h-5 w-5" />
          </button>
          <img src={lightboxImg} alt="" className="max-w-full max-h-full rounded-xl" onClick={e => e.stopPropagation()} />
          <div className="absolute bottom-4 flex gap-3">
            <button onClick={() => { onUseImage(lightboxImg); setLightboxImg(null); toast.success("Image applied to template"); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 text-xs font-semibold uppercase tracking-wider rounded-lg">
              <Check className="h-3.5 w-3.5" /> Use in Template
            </button>
            <a href={lightboxImg} download target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 text-white text-xs font-semibold uppercase tracking-wider rounded-lg">
              <Download className="h-3.5 w-3.5" /> Download
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type HubTab = "graphics" | "ai_studio";

function CreatorHub() {
  const token = useAdminToken();

  const [search,           setSearch]           = useState("");
  const [selectedProduct,  setSelectedProduct]  = useState<any | null>(null);
  const [platform,         setPlatform]         = useState<SocialPlatform>("instagram");
  const [template,         setTemplate]         = useState<TemplateId>("maison");
  const [brandName,        setBrandName]        = useState("QJewelers");
  const [tagline,          setTagline]          = useState("Tennis Luxe");
  const [accentColor,      setAccentColor]      = useState("#C9A84C");
  const [tone,             setTone]             = useState<"luxe" | "playful" | "bold" | "minimal">("luxe");
  const [headlineOverride, setHeadlineOverride] = useState("");
  const [imageOverride,    setImageOverride]    = useState<string | undefined>();
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [generating,       setGenerating]       = useState(false);
  const [downloading,      setDownloading]      = useState(false);
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const [settingsSheetOpen,setSettingsSheetOpen]= useState(false);
  const [copyOpen,         setCopyOpen]         = useState(false);
  const [activeTab,        setActiveTab]        = useState<HubTab>("graphics");

  const previewWrapRef   = useRef<HTMLDivElement>(null);
  const desktopPreviewRef = useRef<HTMLDivElement>(null);
  const [previewMaxW, setPreviewMaxW] = useState(544);
  const templateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const el = previewWrapRef.current ?? desktopPreviewRef.current;
      if (el) setPreviewMaxW(el.offsetWidth);
    };
    update();
    const ro = new ResizeObserver(update);
    const el = previewWrapRef.current ?? desktopPreviewRef.current;
    if (el) ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

  const platformCfg     = PLATFORMS.find(p => p.id === platform)!;
  const { pw, ph, scale } = previewDims(platformCfg.w, platformCfg.h, previewMaxW);
  const currentCopy     = generatedContent?.[platform];
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
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = await toPng(el, {
        width: platformCfg.w, height: platformCfg.h,
        pixelRatio: 1, cacheBust: true, skipAutoScale: true,
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${brandName.replace(/\s+/g, "-").toLowerCase()}-${platform}-${template}-${platformCfg.w}x${platformCfg.h}.png`;
      link.click();
      toast.success(`Downloaded ${platformCfg.w}×${platformCfg.h} PNG`);
    } catch {
      toast.error("Export failed — try long-pressing the preview to save.");
    } finally {
      el.style.transform       = prevTransform;
      el.style.transformOrigin = prevOrigin;
      setDownloading(false);
    }
  }, [platform, platformCfg, brandName, selectedProduct, template]);

  const templateProps: TemplateProps = {
    product: selectedProduct ?? {},
    headline: displayHeadline,
    cta: currentCopy?.cta ?? "Shop Now",
    brandName, tagline, accentColor,
    w: platformCfg.w, h: platformCfg.h,
    imageOverride,
  };

  // ─── Graphic Preview (shared between desktop + mobile) ────────────────────

  const GraphicPreview = (
    <div className="overflow-hidden rounded-xl shadow-lg" style={{ width: pw, height: ph, position: "relative", flexShrink: 0 }}>
      <div ref={templateRef}
        style={{ width: platformCfg.w, height: platformCfg.h, transform: `scale(${scale})`, transformOrigin: "top left", display: "block" }}>
        {renderTemplate(template, templateProps)}
      </div>
    </div>
  );

  // ─── Desktop Sidebar ──────────────────────────────────────────────────────

  const DesktopSidebar = (
    <div className="w-[268px] shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gray-900 flex items-center justify-center shrink-0 rounded-md">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Creator Hub</p>
            <p className="text-[0.56rem] text-gray-400 uppercase tracking-[0.12em]">Social + AI Studio</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-100 shrink-0">
        <button onClick={() => setActiveTab("graphics")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[0.58rem] uppercase tracking-[0.10em] border-b-2 transition-colors -mb-px ${activeTab === "graphics" ? "border-gray-900 text-gray-900 font-semibold" : "border-transparent text-gray-400"}`}>
          <LayoutTemplate className="h-3 w-3" /> Graphics
        </button>
        <button onClick={() => setActiveTab("ai_studio")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[0.58rem] uppercase tracking-[0.10em] border-b-2 transition-colors -mb-px ${activeTab === "ai_studio" ? "border-gray-900 text-gray-900 font-semibold" : "border-transparent text-gray-400"}`}>
          <Wand2 className="h-3 w-3" /> AI Images
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "graphics" ? (
          <>
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
                <div className="space-y-0.5 max-h-44 overflow-y-auto">
                  {filteredProducts.slice(0, 50).map((p: any) => (
                    <button key={p.slug} onClick={() => { setSelectedProduct(p); setGeneratedContent(null); setHeadlineOverride(""); setImageOverride(undefined); }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-left transition-colors ${selectedProduct?.slug === p.slug ? "bg-gray-900 text-white" : "hover:bg-gray-50 text-gray-700"}`}>
                      {p.image_url ? <img src={p.image_url} alt="" className="w-8 h-8 object-cover shrink-0 bg-gray-100" /> : <div className="w-8 h-8 bg-gray-100 shrink-0" />}
                      <div className="min-w-0">
                        <p className="truncate text-[0.67rem] font-medium leading-tight">{p.name}</p>
                        <p className="text-[0.57rem] text-gray-400">{formatUSD(Number(p.base_price ?? 0))}</p>
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
              <p className="text-[0.52rem] uppercase tracking-[0.18em] text-gray-400 mb-2.5">③ Template</p>
              <div className="grid grid-cols-2 gap-1.5">
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => setTemplate(t.id)}
                    className={`text-left px-2.5 py-2.5 border transition-all ${template === t.id ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-100 hover:border-gray-300"}`}>
                    <p className={`text-[0.60rem] uppercase tracking-[0.08em] font-bold leading-tight ${template === t.id ? "text-white" : "text-gray-700"}`}>{t.label}</p>
                    <p className="text-[0.52rem] mt-0.5 leading-tight text-gray-400">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="mx-4 border-t border-gray-50" />
            {/* Branding */}
            <div className="px-4 pt-3 pb-4">
              <p className="text-[0.52rem] uppercase tracking-[0.18em] text-gray-400 mb-2.5">④ Branding</p>
              <div className="space-y-2.5">
                <div>
                  <label className="text-[0.53rem] uppercase tracking-[0.12em] text-gray-400 block mb-1">Brand Name</label>
                  <input value={brandName} onChange={e => setBrandName(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-200 focus:outline-none focus:border-gray-400" />
                </div>
                <div>
                  <label className="text-[0.53rem] uppercase tracking-[0.12em] text-gray-400 block mb-1">Tagline</label>
                  <input value={tagline} onChange={e => setTagline(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-200 focus:outline-none focus:border-gray-400" />
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
                    <input value={accentColor} onChange={e => setAccentColor(e.target.value)} className="flex-1 px-2 py-1.5 text-[0.65rem] border border-gray-200 focus:outline-none font-mono" />
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
                {imageOverride && (
                  <div>
                    <label className="text-[0.53rem] uppercase tracking-[0.12em] text-gray-400 block mb-1">Image Override</label>
                    <div className="flex items-center gap-2">
                      <img src={imageOverride} alt="" className="w-10 h-10 object-cover shrink-0 rounded" />
                      <button onClick={() => setImageOverride(undefined)} className="text-[0.56rem] uppercase tracking-[0.1em] text-red-400 hover:text-red-600">Remove</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="px-4 py-4">
            {!selectedProduct ? (
              <div className="text-center py-8">
                <Wand2 className="h-8 w-8 text-gray-200 mx-auto mb-3" />
                <p className="text-xs text-gray-400">Select a product first</p>
              </div>
            ) : (
              <AiImageStudio
                product={selectedProduct}
                token={token}
                isMobile={false}
                onUseImage={url => { setImageOverride(url); setActiveTab("graphics"); }}
              />
            )}
          </div>
        )}
      </div>

      {/* Generate button — only in graphics tab */}
      {activeTab === "graphics" && (
        <div className="px-4 py-3.5 border-t border-gray-100 shrink-0">
          <button onClick={handleGenerate} disabled={!selectedProduct || generating}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 text-[0.60rem] uppercase tracking-[0.18em] hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {generating ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Writing copy…</> : <><Sparkles className="h-3.5 w-3.5" /> Generate All Platforms</>}
          </button>
        </div>
      )}
    </div>
  );

  // ─── Desktop Main Canvas ──────────────────────────────────────────────────

  const DesktopCanvas = (
    <div ref={desktopPreviewRef} className="flex-1 overflow-y-auto">
      {!selectedProduct ? (
        <div className="h-full flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <div className="w-14 h-14 bg-white border border-gray-200 flex items-center justify-center mx-auto mb-5 shadow-sm rounded-xl">
              <Sparkles className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1.5">No product selected</p>
            <p className="text-xs text-gray-400 leading-relaxed">Choose a product from the left panel to begin creating enterprise graphics.</p>
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-5 max-w-[640px] mx-auto">
          {/* Top bar */}
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

          {/* Headline override */}
          <div className="bg-white border border-gray-100 px-4 py-3 flex items-center gap-3">
            <Edit3 className="h-3.5 w-3.5 text-gray-300 shrink-0" />
            <input value={headlineOverride} onChange={e => setHeadlineOverride(e.target.value)}
              placeholder={currentCopy?.headline || selectedProduct?.name || "Override headline on graphic…"}
              className="flex-1 text-xs text-gray-700 placeholder:text-gray-300 focus:outline-none bg-transparent" />
            {headlineOverride && (
              <button onClick={() => setHeadlineOverride("")} className="text-[0.55rem] uppercase tracking-[0.1em] text-gray-300 hover:text-gray-600 shrink-0">Reset</button>
            )}
          </div>

          {/* Preview */}
          {GraphicPreview}

          {/* Copy tabs */}
          {(generatedContent || generating) && (
            <div className="bg-white border border-gray-100">
              <div className="flex border-b border-gray-100 overflow-x-auto">
                {PLATFORMS.map(p => {
                  const Icon = p.icon;
                  return (
                    <button key={p.id} onClick={() => setPlatform(p.id)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-[0.58rem] uppercase tracking-[0.1em] border-b-2 transition-colors whitespace-nowrap -mb-px ${platform === p.id ? "border-gray-900 text-gray-900 font-semibold" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
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
                    <CopyField label={`Hashtags (${currentCopy.hashtags.length})`}
                      value={currentCopy.hashtags.map(h => h.startsWith("#") ? h : `#${h}`).join(" ")} mono />
                  )}
                  <button onClick={() => {
                    const post = [currentCopy.caption, currentCopy.hashtags.length > 0 ? "\n\n" + currentCopy.hashtags.map(h => h.startsWith("#") ? h : `#${h}`).join(" ") : ""].join("").trim();
                    navigator.clipboard.writeText(post);
                    toast.success("Full post copied");
                  }} className="w-full py-2.5 border border-gray-200 text-[0.58rem] uppercase tracking-[0.14em] text-gray-500 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-800 transition-colors flex items-center justify-center gap-1.5">
                    <Copy className="h-3 w-3" /> Copy Full Post
                  </button>
                </div>
              )}
            </div>
          )}

          {!generatedContent && !generating && (
            <div className="border border-dashed border-gray-200 px-5 py-7 text-center bg-white">
              <Sparkles className="h-5 w-5 text-gray-200 mx-auto mb-2.5" />
              <p className="text-sm text-gray-500 mb-1">No copy generated yet</p>
              <p className="text-xs text-gray-400">Click "Generate All Platforms" — GPT-4o will write professional, platform-optimised copy for all four channels.</p>
            </div>
          )}

          <div className="flex items-start gap-2 text-[0.57rem] text-gray-400">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            <span>Exports at {platformCfg.w}×{platformCfg.h}px, publication-ready for {platformCfg.label}.</span>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Desktop (md+) ──────────────────────────────────────────────────── */}
      <div className="hidden md:flex h-screen overflow-hidden" style={{ background: "#F4F3F1" }}>
        {DesktopSidebar}
        {DesktopCanvas}
      </div>

      {/* ── Mobile (< md) ──────────────────────────────────────────────────── */}
      <div className="md:hidden flex flex-col min-h-full" style={{ background: "#F4F3F1" }}>

        {/* ── Sticky control strip ─────────────────────────────────────────── */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">

          {/* Row 1: Header + tabs */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-2.5 border-b border-gray-50">
            <div className="w-6 h-6 bg-gray-900 flex items-center justify-center rounded-md shrink-0">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <div className="flex gap-0.5 flex-1">
              <button onClick={() => setActiveTab("graphics")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.60rem] uppercase tracking-[0.10em] font-semibold transition-all ${activeTab === "graphics" ? "bg-gray-900 text-white" : "text-gray-400"}`}>
                <LayoutTemplate className="h-3 w-3" /> Graphics
              </button>
              <button onClick={() => setActiveTab("ai_studio")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.60rem] uppercase tracking-[0.10em] font-semibold transition-all ${activeTab === "ai_studio" ? "bg-gray-900 text-white" : "text-gray-400"}`}>
                <Wand2 className="h-3 w-3" /> AI Images
              </button>
            </div>
            <div className="flex items-center gap-2">
              {generatedContent && activeTab === "graphics" && (
                <button onClick={handleGenerate} disabled={generating}
                  className="flex items-center gap-1.5 px-3 py-2 text-[0.60rem] uppercase tracking-[0.1em] bg-gray-100 text-gray-600 rounded-lg active:bg-gray-200 disabled:opacity-40 min-h-[36px]">
                  <RetryIcon className={`h-3 w-3 ${generating ? "animate-spin" : ""}`} />
                </button>
              )}
              {activeTab === "graphics" && (
                <button onClick={() => setSettingsSheetOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-[0.60rem] uppercase tracking-[0.1em] bg-gray-100 text-gray-700 rounded-lg active:bg-gray-200 min-h-[36px]">
                  <SlidersHorizontal className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {activeTab === "graphics" && (
            <>
              {/* Product selector */}
              <div className="px-4 py-2.5 border-b border-gray-50">
                <button onClick={() => setProductSheetOpen(true)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl active:bg-gray-100 transition-colors">
                  {selectedProduct?.image_url
                    ? <img src={imageOverride ?? selectedProduct.image_url} alt="" className="w-8 h-8 object-cover rounded-lg shrink-0 bg-gray-100" />
                    : <div className="w-8 h-8 bg-gray-200 rounded-lg shrink-0 flex items-center justify-center"><ImageIcon className="h-4 w-4 text-gray-400" /></div>
                  }
                  <div className="flex-1 min-w-0 text-left">
                    {selectedProduct
                      ? <><p className="text-xs font-semibold text-gray-900 truncate">{selectedProduct.name}</p><p className="text-[0.60rem] text-gray-400">{formatUSD(Number(selectedProduct.base_price ?? 0))}{imageOverride ? " · AI image active" : ""}</p></>
                      : <p className="text-sm text-gray-400">Select a product…</p>
                    }
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                </button>
              </div>

              {/* Platform pills */}
              <div className="flex gap-2 px-4 py-2.5 overflow-x-auto border-b border-gray-50" style={{ WebkitOverflowScrolling: "touch" }}>
                {PLATFORMS.map(p => {
                  const Icon = p.icon;
                  const active = platform === p.id;
                  return (
                    <button key={p.id} onClick={() => setPlatform(p.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full shrink-0 transition-all active:scale-95 ${active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}`}>
                      <Icon className="h-3 w-3 shrink-0" />
                      <span className="text-[0.62rem] uppercase tracking-[0.08em] font-semibold whitespace-nowrap">
                        {p.label.replace(" / Twitter", "").replace("Google Ads", "Google")}
                      </span>
                      {active && <span className="text-[0.50rem] font-mono text-gray-400 ml-0.5">{p.safeZone}</span>}
                    </button>
                  );
                })}
              </div>

              {/* Template pills */}
              <div className="flex gap-1.5 px-4 py-2.5 overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => setTemplate(t.id)}
                    className={`px-3.5 py-1.5 rounded-full shrink-0 transition-all active:scale-95 text-[0.60rem] uppercase tracking-[0.08em] font-semibold whitespace-nowrap ${template === t.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Scrollable content ──────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "graphics" ? (
            <>
              <div ref={previewWrapRef} className="px-4 pt-4">
                {selectedProduct ? (
                  GraphicPreview
                ) : (
                  <div className="rounded-xl bg-white border border-dashed border-gray-200 flex items-center justify-center" style={{ height: 220 }}>
                    <div className="text-center">
                      <Sparkles className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Select a product to preview</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-4 pt-3 pb-36 space-y-3">
                {/* Headline override */}
                <div className="bg-white border border-gray-100 px-4 py-3 flex items-center gap-3 rounded-xl">
                  <Edit3 className="h-4 w-4 text-gray-300 shrink-0" />
                  <input value={headlineOverride} onChange={e => setHeadlineOverride(e.target.value)}
                    placeholder={currentCopy?.headline || selectedProduct?.name || "Override headline on graphic…"}
                    className="flex-1 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none bg-transparent" />
                  {headlineOverride && (
                    <button onClick={() => setHeadlineOverride("")} className="text-[0.60rem] uppercase tracking-[0.1em] text-gray-300 active:text-gray-600 shrink-0">Reset</button>
                  )}
                </div>

                {/* Copy panel */}
                {(generatedContent || generating) && (
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                    <button onClick={() => setCopyOpen(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Copy className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-800">Platform Copy</span>
                        {generatedContent && <span className="text-[0.52rem] uppercase tracking-[0.1em] text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full">Ready</span>}
                        {generating && <span className="text-[0.52rem] uppercase tracking-[0.1em] text-green-500 bg-green-50 px-1.5 py-0.5 rounded-full">Generating…</span>}
                      </div>
                      {copyOpen ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                    </button>
                    {copyOpen && (
                      <>
                        <div className="flex border-b border-gray-100 overflow-x-auto">
                          {PLATFORMS.map(p => {
                            const Icon = p.icon;
                            return (
                              <button key={p.id} onClick={() => setPlatform(p.id)}
                                className={`flex items-center gap-1.5 px-4 py-3 text-[0.58rem] uppercase tracking-[0.1em] border-b-2 whitespace-nowrap -mb-px transition-colors ${platform === p.id ? "border-gray-900 text-gray-900 font-semibold" : "border-transparent text-gray-400"}`}>
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
                              <CopyField label={`Hashtags (${currentCopy.hashtags.length})`}
                                value={currentCopy.hashtags.map(h => h.startsWith("#") ? h : `#${h}`).join(" ")} mono />
                            )}
                            <button onClick={() => {
                              const post = [currentCopy.caption, currentCopy.hashtags.length > 0 ? "\n\n" + currentCopy.hashtags.map(h => h.startsWith("#") ? h : `#${h}`).join(" ") : ""].join("").trim();
                              navigator.clipboard.writeText(post);
                              toast.success("Full post copied");
                            }} className="w-full py-3.5 border border-gray-200 rounded-lg text-[0.60rem] uppercase tracking-[0.14em] text-gray-500 active:bg-gray-50 flex items-center justify-center gap-2">
                              <Copy className="h-3.5 w-3.5" /> Copy Full Post
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
                    <p className="text-xs text-gray-400 leading-relaxed">GPT-4o writes platform-optimised copy for all four channels at once.</p>
                  </div>
                )}

                <div className="flex items-start gap-2 text-[0.57rem] text-gray-400">
                  <Info className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>Exports at {platformCfg.w}×{platformCfg.h}px, ready for {platformCfg.label}.</span>
                </div>
              </div>
            </>
          ) : (
            /* AI Studio tab */
            <div className="px-4 pt-4 pb-36 space-y-4">
              {!selectedProduct ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
                  <Wand2 className="h-8 w-8 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500 mb-1">AI Image Studio</p>
                  <p className="text-xs text-gray-400">Select a product from Graphics tab first</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 bg-white rounded-xl px-4 py-3 border border-gray-100">
                    {selectedProduct.image_url
                      ? <img src={selectedProduct.image_url} alt="" className="w-10 h-10 object-cover rounded-lg shrink-0" />
                      : <div className="w-10 h-10 bg-gray-100 rounded-lg shrink-0" />
                    }
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{selectedProduct.name}</p>
                      <p className="text-[0.58rem] text-gray-400 mt-0.5">Generating new images for this product</p>
                    </div>
                    <Wand2 className="h-4 w-4 text-gray-300 shrink-0" />
                  </div>
                  <AiImageStudio
                    product={selectedProduct}
                    token={token}
                    isMobile={true}
                    onUseImage={url => { setImageOverride(url); setActiveTab("graphics"); toast.success("Switch to Graphics to see the result"); }}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Sticky bottom bar ────────────────────────────────────────────── */}
        {activeTab === "graphics" && (
          <div className="fixed left-0 right-0 z-20 bg-white border-t border-gray-100 px-4 pt-3"
            style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 64px)", boxShadow: "0 -6px 20px rgba(0,0,0,0.08)", paddingBottom: 12 }}>
            <div className="flex gap-2.5">
              <button onClick={handleGenerate} disabled={!selectedProduct || generating}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 rounded-xl text-[0.62rem] uppercase tracking-[0.16em] active:bg-gray-800 transition-colors disabled:opacity-40 font-semibold">
                {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4" /> Generate</>}
              </button>
              <button onClick={handleDownload} disabled={downloading || !selectedProduct}
                className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gray-100 text-gray-700 active:bg-gray-200 transition-colors disabled:opacity-40">
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        {/* ── Bottom Sheets ─────────────────────────────────────────────────── */}
        <ProductSheet
          open={productSheetOpen} onClose={() => setProductSheetOpen(false)}
          products={filteredProducts} loading={loadingProducts}
          selected={selectedProduct}
          onSelect={p => { setSelectedProduct(p); setGeneratedContent(null); setHeadlineOverride(""); setImageOverride(undefined); }}
          search={search} setSearch={setSearch}
        />
        <SettingsSheet
          open={settingsSheetOpen} onClose={() => setSettingsSheetOpen(false)}
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
