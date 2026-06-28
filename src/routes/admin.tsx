import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, ShoppingBag, Package, LogOut, Store, ChevronRight,
  Menu, X, BarChart2, Users, RotateCcw, Tag, Settings, Gem,
  ArrowUpRight, Star, Mail, Lock, ShieldCheck,
  ClipboardList, ArrowLeft, FileText,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AdminTokenCtx, AdminThemeCtx, useAdminTheme } from "@/lib/admin-context";
import { THEMES, themeCSS } from "@/lib/admin-themes";
import { adminAuth, adminLogout, checkAdminSession, verifyTotpLogin } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  component: AdminRoot,
});

// ─── Login ───────────────────────────────────────────────────────────────────

// Luxury vault CSS injected once at the module level
const VAULT_CSS = `
  @keyframes vault-spin-cw  { to { transform: rotate(360deg);  } }
  @keyframes vault-spin-ccw { to { transform: rotate(-360deg); } }
  @keyframes vault-pulse    {
    0%,100% { opacity: 0.35; }
    50%      { opacity: 0.65; }
  }
  @keyframes gold-shimmer {
    0%   { transform: translateX(-120%) skewX(-20deg); opacity: 0; }
    8%   { opacity: 0.6; }
    92%  { opacity: 0.6; }
    100% { transform: translateX(320%) skewX(-20deg); opacity: 0; }
  }
  @keyframes vault-entrance {
    from { opacity: 0; transform: scale(0.96) translateY(14px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);    }
  }
  @keyframes spark-float {
    0%,100% { opacity: 0; transform: scale(0) rotate(0deg);   }
    40%     { opacity: 1; transform: scale(1) rotate(45deg);  }
    80%     { opacity: 0; transform: scale(0) rotate(90deg);  }
  }
  @keyframes needle-pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.6); }
    50%     { box-shadow: 0 0 0 6px rgba(212,175,55,0);  }
  }
  .vault-entrance { animation: vault-entrance 0.7s cubic-bezier(0.16,1,0.3,1) both; }
  .gold-shimmer-card { position: relative; overflow: hidden; }
  .gold-shimmer-card::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 40%, rgba(212,175,55,0.07) 50%, transparent 60%);
    animation: gold-shimmer 6s ease-in-out 1.5s infinite;
    pointer-events: none;
  }
`;

// Vault dial rings ─────────────────────────────────────────────────────────────
function VaultDoor() {
  const rings = [
    { d: 580, border: "1px solid rgba(212,175,55,0.07)", anim: "vault-spin-cw 220s linear infinite" },
    { d: 480, border: "1px solid rgba(212,175,55,0.12)", anim: "vault-spin-ccw 160s linear infinite" },
    { d: 390, border: "2px solid rgba(212,175,55,0.10)", anim: "vault-spin-cw 120s linear infinite" },
    { d: 300, border: "1px solid rgba(212,175,55,0.18)", anim: "vault-spin-ccw 90s linear infinite" },
    { d: 218, border: "1px solid rgba(212,175,55,0.22)", anim: "vault-spin-cw 60s linear infinite" },
    { d: 146, border: "2px solid rgba(212,175,55,0.28)", anim: "vault-spin-ccw 40s linear infinite" },
  ];
  // bolt positions on the 480 ring
  const bolts = Array.from({ length: 12 }, (_, i) => i * 30);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
      {/* Ambient glow behind vault */}
      <div
        className="absolute rounded-full"
        style={{
          width: 500, height: 500,
          background: "radial-gradient(circle, rgba(212,175,55,0.09) 0%, rgba(212,175,55,0.03) 40%, transparent 70%)",
          animation: "vault-pulse 4s ease-in-out infinite",
        }}
      />
      {/* Rings */}
      {rings.map((r, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{ width: r.d, height: r.d, border: r.border, animation: r.anim }}
        >
          {/* Tick marks on each ring */}
          {i === 1 && bolts.map((deg) => (
            <div
              key={deg}
              className="absolute"
              style={{
                width: 6, height: 6,
                borderRadius: "50%",
                background: "rgba(212,175,55,0.35)",
                top: "50%", left: "50%",
                transform: `rotate(${deg}deg) translateX(${r.d / 2 - 10}px) translateY(-50%)`,
                transformOrigin: "0 50%",
              }}
            />
          ))}
          {/* Spokes on the 390 ring */}
          {i === 2 && [0, 45, 90, 135].map((deg) => (
            <div
              key={deg}
              className="absolute top-1/2 left-1/2 origin-left"
              style={{
                width: r.d / 2 - 30,
                height: 1,
                marginTop: -0.5,
                background: "linear-gradient(to right, rgba(212,175,55,0.20), transparent)",
                transform: `rotate(${deg}deg)`,
              }}
            />
          ))}
        </div>
      ))}
      {/* Center medallion */}
      <div
        className="absolute flex items-center justify-center rounded-full"
        style={{
          width: 100, height: 100,
          background: "radial-gradient(circle, rgba(212,175,55,0.14) 0%, rgba(0,0,0,0) 70%)",
          border: "1px solid rgba(212,175,55,0.30)",
          boxShadow: "0 0 30px rgba(212,175,55,0.12), inset 0 0 20px rgba(0,0,0,0.6)",
        }}
      >
        <Gem className="h-9 w-9" style={{ color: "rgba(212,175,55,0.55)" }} />
      </div>
    </div>
  );
}

// Decorative gold divider ──────────────────────────────────────────────────────
function GoldRule({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(212,175,55,0.30))" }} />
      {label ? (
        <span className="text-[0.42rem] uppercase tracking-[0.38em] font-semibold" style={{ color: "rgba(212,175,55,0.45)" }}>
          {label}
        </span>
      ) : (
        <span style={{ color: "rgba(212,175,55,0.40)", fontSize: "0.45rem" }}>◆</span>
      )}
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(212,175,55,0.30))" }} />
    </div>
  );
}

// Corner gold inlay marks ──────────────────────────────────────────────────────
function CornerAccents({ size = 20, opacity = 0.5 }: { size?: number; opacity?: number }) {
  const s = `rgba(212,175,55,${opacity})`;
  const b = `${size}px`;
  const shared: React.CSSProperties = { position: "absolute", width: size, height: size };
  return (
    <>
      <div style={{ ...shared, top: 0, left: 0, borderTop: `1.5px solid ${s}`, borderLeft: `1.5px solid ${s}` }} />
      <div style={{ ...shared, top: 0, right: 0, borderTop: `1.5px solid ${s}`, borderRight: `1.5px solid ${s}` }} />
      <div style={{ ...shared, bottom: 0, left: 0, borderBottom: `1.5px solid ${s}`, borderLeft: `1.5px solid ${s}` }} />
      <div style={{ ...shared, bottom: 0, right: 0, borderBottom: `1.5px solid ${s}`, borderRight: `1.5px solid ${s}` }} />
    </>
  );
}

// Floating diamond sparks ──────────────────────────────────────────────────────
const SPARKS = [
  { top: "12%",  left: "8%",  delay: "0s",   dur: "3.5s" },
  { top: "28%",  left: "91%", delay: "1.2s", dur: "4.1s" },
  { top: "72%",  left: "6%",  delay: "2.0s", dur: "3.2s" },
  { top: "85%",  left: "88%", delay: "0.6s", dur: "4.8s" },
  { top: "48%",  left: "96%", delay: "3.1s", dur: "3.0s" },
];

function DiamondSparks() {
  return (
    <>
      {SPARKS.map((s, i) => (
        <div
          key={i}
          className="absolute pointer-events-none select-none"
          style={{
            top: s.top, left: s.left,
            width: 8, height: 8,
            fontSize: "0.5rem",
            color: "rgba(212,175,55,0.55)",
            animation: `spark-float ${s.dur} ease-in-out ${s.delay} infinite`,
          }}
        >
          ◆
        </div>
      ))}
    </>
  );
}

// Security credential row ──────────────────────────────────────────────────────
function CredentialRow({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-6 h-6 rounded flex items-center justify-center shrink-0"
        style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.18)" }}
      >
        <Icon className="h-3 w-3" style={{ color: "rgba(212,175,55,0.70)" }} />
      </div>
      <span className="text-[0.60rem] tracking-[0.06em]" style={{ color: "rgba(255,255,255,0.38)" }}>{label}</span>
    </div>
  );
}

// ─── Main Login ───────────────────────────────────────────────────────────────

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [pin, setPin] = useState("");
  const [code, setCode] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useServerFn(adminAuth);
  const verifyTotp = useServerFn(verifyTotpLogin);

  const submit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (needsTotp) {
        if (!code) return;
        await verifyTotp({ data: { code } });
        onLogin();
        return;
      }
      if (!pin) return;
      const result = await auth({ data: { pin } });
      if (result.requiresTotp) {
        setNeedsTotp(true);
      } else {
        onLogin();
      }
    } catch (err: any) {
      const msg: string = err?.message ?? "";
      if (msg.includes("Too many") || msg.includes("misconfigured")) {
        setError(msg);
      } else {
        setError(needsTotp ? "Invalid code. Try again." : "Incorrect access code.");
      }
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = () => { setNeedsTotp(false); setCode(""); setError(""); };

  // Gold palette
  const GOLD       = "rgba(212,175,55,1)";
  const GOLD_MID   = "rgba(212,175,55,0.55)";
  const GOLD_DIM   = "rgba(212,175,55,0.22)";
  const GOLD_FAINT = "rgba(212,175,55,0.08)";

  return (
    <>
      <style>{VAULT_CSS}</style>

      <div
        className="min-h-screen flex"
        style={{ background: "linear-gradient(160deg, #07060a 0%, #0d0b08 55%, #0a0908 100%)" }}
      >
        {/* ══════════════════════════════════════════════════
            LEFT PANEL — vault door + brand identity
        ══════════════════════════════════════════════════ */}
        <div
          className="hidden lg:flex lg:w-[46%] relative overflow-hidden flex-col justify-between"
          style={{
            background: "linear-gradient(145deg, #060509 0%, #0e0c07 60%, #090808 100%)",
            borderRight: `1px solid ${GOLD_DIM}`,
          }}
        >
          {/* Vault door graphic */}
          <VaultDoor />

          {/* Diamond sparks */}
          <DiamondSparks />

          {/* Large background radial gold bloom */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(212,175,55,0.07) 0%, transparent 70%)",
            }}
          />

          {/* Top brand mark */}
          <div className="relative z-10 p-12">
            <div className="flex items-center gap-3 mb-3">
              <img
                src="/QURESHIJEWELERSLOGO.png"
                alt="Qureshi Jewelers"
                className="h-10 w-auto"
                style={{ filter: "brightness(0) saturate(100%) invert(78%) sepia(38%) saturate(600%) hue-rotate(5deg) brightness(95%)" }}
              />
            </div>
            <GoldRule label="Private Vault Console" />
          </div>

          {/* Bottom copy */}
          <div className="relative z-10 p-12 pb-14">
            <p
              className="font-display text-[2.1rem] leading-[1.15] mb-5"
              style={{
                color: "rgba(255,255,255,0.88)",
                textShadow: `0 0 60px ${GOLD_FAINT}`,
              }}
            >
              Every flawless piece.<br />
              <span style={{ color: GOLD_MID }}>Every operation.</span><br />
              One secure vault.
            </p>
            <p className="text-[0.62rem] leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.28)" }}>
              Military-grade access control protecting the world's finest moissanite collections.
            </p>

            <div className="space-y-3">
              <CredentialRow icon={ShieldCheck} label="TOTP dual-factor authentication" />
              <CredentialRow icon={Lock}        label="AES-256 encrypted session vault" />
              <CredentialRow icon={ClipboardList} label="Immutable audit chronicle" />
            </div>

            <div className="mt-10 pt-6" style={{ borderTop: `1px solid ${GOLD_DIM}` }}>
              <div className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#4ade80", boxShadow: "0 0 8px rgba(74,222,128,0.8)", animation: "needle-pulse 2.5s ease-in-out infinite" }}
                />
                <span className="text-[0.50rem] uppercase tracking-[0.36em]" style={{ color: "rgba(212,175,55,0.45)" }}>
                  Vault Online · All Systems Secured
                </span>
              </div>
            </div>
          </div>

          {/* Vertical "VAULT" label — right edge */}
          <div
            className="absolute right-[-1px] top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 py-4 z-10"
            style={{ borderLeft: `1px solid ${GOLD_DIM}` }}
          >
            {"VAULT".split("").map((c, i) => (
              <span
                key={i}
                className="text-[0.38rem] font-semibold uppercase tracking-widest"
                style={{ color: GOLD_DIM, writingMode: "vertical-lr" }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            RIGHT PANEL — login form
        ══════════════════════════════════════════════════ */}
        <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">

          {/* Background bloom on the right */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 80% 60% at 60% 40%, rgba(212,175,55,0.05) 0%, transparent 70%)",
            }}
          />

          {/* Mobile vault rings (small, decorative) */}
          <div className="lg:hidden absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            {[300, 220, 150].map((d, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: d, height: d,
                  border: "1px solid rgba(212,175,55,0.4)",
                  animation: `${i % 2 === 0 ? "vault-spin-cw" : "vault-spin-ccw"} ${120 - i * 30}s linear infinite`,
                }}
              />
            ))}
          </div>

          <DiamondSparks />

          <div className="w-full max-w-[380px] relative z-10 vault-entrance">

            {/* Logo emblem (mobile + desktop top) */}
            <div className="flex flex-col items-center mb-9">
              <div
                className="relative flex items-center justify-center mb-5"
                style={{
                  width: 72, height: 72,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, rgba(212,175,55,0.13) 0%, transparent 70%)`,
                  border: `1px solid ${GOLD_DIM}`,
                  boxShadow: `0 0 40px rgba(212,175,55,0.08)`,
                }}
              >
                <img
                  src="/QURESHIJEWELERSLOGO.png"
                  alt="Qureshi Jewelers"
                  className="h-8 w-auto"
                  style={{ filter: "brightness(0) saturate(100%) invert(78%) sepia(38%) saturate(600%) hue-rotate(5deg) brightness(95%)" }}
                />
                {/* Orbital ring */}
                <div
                  className="absolute inset-[-10px] rounded-full"
                  style={{
                    border: `1px dashed rgba(212,175,55,0.18)`,
                    animation: "vault-spin-cw 30s linear infinite",
                  }}
                />
              </div>
              <p
                className="text-[0.46rem] uppercase tracking-[0.50em] font-semibold"
                style={{ color: GOLD_MID }}
              >
                Qureshi Jewelers
              </p>
              <p className="text-[0.40rem] uppercase tracking-[0.38em] mt-1" style={{ color: "rgba(255,255,255,0.22)" }}>
                Private Vault Console
              </p>
            </div>

            {/* Heading */}
            <div className="text-center mb-7">
              <h1
                className="font-display text-[1.7rem] leading-tight mb-2"
                style={{ color: "rgba(255,255,255,0.90)", textShadow: `0 0 40px rgba(212,175,55,0.12)` }}
              >
                {needsTotp ? "Identity Verification" : "Vault Access"}
              </h1>
              <p className="text-[0.60rem] tracking-[0.08em]" style={{ color: "rgba(255,255,255,0.30)" }}>
                {needsTotp
                  ? "Enter the 6-digit code from your authenticator"
                  : "Authorised personnel only · Enter your access code"}
              </p>
            </div>

            {/* Main card */}
            <div
              className="relative px-8 pt-7 pb-8 gold-shimmer-card"
              style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.030) 0%, rgba(255,255,255,0.018) 100%)",
                border: `1px solid rgba(212,175,55,0.22)`,
                boxShadow: [
                  "0 0 0 4px rgba(8,7,10,1)",
                  `0 0 0 5px rgba(212,175,55,0.10)`,
                  "0 40px 80px rgba(0,0,0,0.70)",
                  "0 8px 32px rgba(0,0,0,0.50)",
                  "inset 0 0 60px rgba(0,0,0,0.25)",
                ].join(", "),
                backdropFilter: "blur(24px)",
              }}
            >
              <CornerAccents size={18} opacity={0.55} />

              <GoldRule label={needsTotp ? "Dual Factor" : "Secure Entry"} />

              <div className="mt-6 mb-6">
                {needsTotp ? (
                  <>
                    <div className="flex justify-center mb-5">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center"
                        style={{
                          background: "radial-gradient(circle, rgba(212,175,55,0.14) 0%, transparent 70%)",
                          border: `1px solid rgba(212,175,55,0.30)`,
                          boxShadow: "0 0 24px rgba(212,175,55,0.10)",
                        }}
                      >
                        <ShieldCheck className="h-6 w-6" style={{ color: GOLD_MID }} />
                      </div>
                    </div>
                    <label
                      className="block text-[0.46rem] uppercase tracking-[0.36em] font-semibold mb-3 text-center"
                      style={{ color: GOLD_MID }}
                    >
                      Authenticator Code
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={code}
                        onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        onKeyDown={e => e.key === "Enter" && submit(e)}
                        className="w-full px-4 py-4 text-xl text-center tracking-[0.55em] font-semibold focus:outline-none transition-all text-white"
                        style={{
                          background: "rgba(0,0,0,0.35)",
                          border: `1px solid rgba(212,175,55,0.22)`,
                          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.35)",
                          caretColor: GOLD,
                        }}
                        placeholder="· · · · · ·"
                        autoFocus
                        maxLength={6}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-center mb-5">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center"
                        style={{
                          background: "radial-gradient(circle, rgba(212,175,55,0.14) 0%, transparent 70%)",
                          border: `1px solid rgba(212,175,55,0.30)`,
                          boxShadow: "0 0 24px rgba(212,175,55,0.10)",
                        }}
                      >
                        <Lock className="h-6 w-6" style={{ color: GOLD_MID }} />
                      </div>
                    </div>
                    <label
                      className="block text-[0.46rem] uppercase tracking-[0.36em] font-semibold mb-3 text-center"
                      style={{ color: GOLD_MID }}
                    >
                      Access Code
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={pin}
                        onChange={e => setPin(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && submit(e)}
                        className="w-full pl-4 pr-10 py-4 text-base tracking-[0.22em] focus:outline-none transition-all text-white"
                        style={{
                          background: "rgba(0,0,0,0.35)",
                          border: `1px solid rgba(212,175,55,0.22)`,
                          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.35)",
                          caretColor: GOLD,
                        }}
                        placeholder="••••••••••••"
                        autoFocus
                      />
                      <Lock
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none"
                        style={{ color: GOLD_DIM }}
                      />
                    </div>
                  </>
                )}
              </div>

              {error && (
                <div
                  className="flex items-start gap-2.5 px-3.5 py-3 mb-5 text-[0.62rem]"
                  style={{
                    background: "rgba(239,68,68,0.07)",
                    border: "1px solid rgba(239,68,68,0.20)",
                    color: "rgba(252,165,165,0.90)",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="button"
                onClick={submit}
                disabled={loading || (needsTotp ? code.length !== 6 : pin.length === 0)}
                className="w-full py-4 text-[0.60rem] font-bold uppercase tracking-[0.28em] transition-all disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group"
                style={{
                  background: "linear-gradient(to bottom, #e8cc6a 0%, #c9a84c 45%, #a07830 100%)",
                  color: "#1a1008",
                  boxShadow: loading
                    ? "0 2px 0 #7a5c1e, 0 6px 20px rgba(212,175,55,0.20)"
                    : "0 4px 0 #7a5c1e, 0 12px 32px rgba(212,175,55,0.28)",
                  transform: loading ? "translateY(2px)" : undefined,
                }}
              >
                {/* Hover shimmer */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.12), transparent)" }}
                />
                <span className="relative flex items-center justify-center gap-2.5">
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-[#1a1008]/25 border-t-[#1a1008] rounded-full animate-spin" />
                      Authenticating…
                    </>
                  ) : needsTotp ? (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verify Identity
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      Open Vault
                    </>
                  )}
                </span>
              </button>

              {needsTotp && (
                <button
                  onClick={backToLogin}
                  className="w-full flex items-center justify-center gap-1.5 mt-4 text-[0.52rem] uppercase tracking-[0.20em] transition-colors"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(212,175,55,0.55)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
                >
                  <ArrowLeft className="h-3 w-3" />
                  Return to vault entrance
                </button>
              )}

              <GoldRule />

              {!needsTotp && (
                <div className="flex items-center justify-center gap-5 mt-2">
                  <span className="flex items-center gap-1.5 text-[0.48rem] uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.22)" }}>
                    <Lock className="h-2.5 w-2.5" style={{ color: GOLD_DIM }} />
                    AES-256
                  </span>
                  <span style={{ color: GOLD_DIM, fontSize: "0.4rem" }}>◆</span>
                  <span className="flex items-center gap-1.5 text-[0.48rem] uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.22)" }}>
                    <ShieldCheck className="h-2.5 w-2.5" style={{ color: GOLD_DIM }} />
                    2FA Ready
                  </span>
                  <span style={{ color: GOLD_DIM, fontSize: "0.4rem" }}>◆</span>
                  <span className="flex items-center gap-1.5 text-[0.48rem] uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.22)" }}>
                    <ClipboardList className="h-2.5 w-2.5" style={{ color: GOLD_DIM }} />
                    Audited
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            {!needsTotp && (
              <div className="mt-7 flex items-center justify-between">
                <Link
                  to="/"
                  className="flex items-center gap-1.5 text-[0.52rem] uppercase tracking-[0.18em] transition-colors"
                  style={{ color: "rgba(255,255,255,0.22)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(212,175,55,0.50)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.22)")}
                >
                  <ArrowLeft className="h-3 w-3" />
                  Storefront
                </Link>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "#4ade80", boxShadow: "0 0 6px rgba(74,222,128,0.8)", animation: "needle-pulse 2.5s ease-in-out infinite" }}
                  />
                  <span className="text-[0.44rem] uppercase tracking-[0.26em]" style={{ color: "rgba(255,255,255,0.22)" }}>
                    Vault secured
                  </span>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

// ─── Nav Config ───────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: "Store",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", to: "/admin/", exact: true },
      { icon: BarChart2,       label: "Analytics",  to: "/admin/analytics" },
    ],
  },
  {
    label: "Operations",
    items: [
      { icon: ShoppingBag, label: "Orders",       to: "/admin/orders" },
      { icon: RotateCcw,   label: "Returns",      to: "/admin/returns" },
      { icon: Users,       label: "Customers",    to: "/admin/customers" },
      { icon: Mail,        label: "Inner Circle", to: "/admin/subscribers" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { icon: Package, label: "Products",   to: "/admin/products" },
      { icon: Tag,     label: "Promotions", to: "/admin/promotions" },
      { icon: Star,    label: "Reviews",    to: "/admin/reviews" },
    ],
  },
  {
    label: "Site",
    items: [
      { icon: FileText, label: "Content", to: "/admin/content" },
    ],
  },
  {
    label: "Config",
    items: [
      { icon: Settings, label: "Settings", to: "/admin/settings" },
    ],
  },
];

// ─── Nav Item ─────────────────────────────────────────────────────────────────

function NavItem({
  icon: Icon,
  label,
  to,
  isActive,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  to: string;
  isActive: boolean;
  onClick?: () => void;
}) {
  const { theme } = useAdminTheme();
  const s = theme.sidebar;
  const [hov, setHov] = useState(false);

  return (
    <Link
      to={to as any}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="flex items-center gap-3 px-3 py-2.5 text-[0.66rem] uppercase tracking-[0.12em] relative overflow-hidden rounded-lg select-none"
      style={{
        background: isActive ? s.navActiveBg : hov ? s.navHoverBg : "transparent",
        color: isActive ? s.navActiveColor : hov ? "rgba(255,255,255,0.85)" : s.navInactiveColor,
        transform: hov && !isActive ? "translateX(3px)" : "translateX(0)",
        transition: "background 0.18s ease, color 0.16s ease, transform 0.15s ease",
      }}
    >
      {isActive && (
        <span
          className="admin-active-bar absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[20px]"
          style={{
            background: s.activeBarBg,
            borderRadius: "0 2px 2px 0",
            boxShadow: s.activeBarShadow,
          }}
        />
      )}
      <Icon
        className="h-[15px] w-[15px] shrink-0"
        style={{
          color: isActive ? s.navIconActive : hov ? "rgba(255,255,255,0.70)" : s.navIconInactive,
          transform: hov ? "scale(1.22)" : "scale(1)",
          filter: isActive
            ? `drop-shadow(0 0 5px ${s.navIconActive}90)`
            : hov ? "drop-shadow(0 0 4px rgba(255,255,255,0.28))" : `drop-shadow(0 0 3px ${s.navIconInactive}50)`,
          transition: "transform 0.15s ease, filter 0.15s ease, color 0.15s ease",
        }}
      />
      <span
        style={{
          fontWeight: isActive ? 600 : 500,
          letterSpacing: isActive ? "0.10em" : "0.12em",
          textShadow: isActive
            ? `0 0 12px ${s.navIconActive}80, 0 0 2px ${s.navIconActive}60`
            : hov ? `0 0 10px rgba(255,255,255,0.45)` : `0 0 6px ${s.navIconInactive}40`,
          transition: "all 0.15s",
        }}
      >
        {label}
      </span>
      {isActive && (
        <span
          className="ml-auto shrink-0"
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: s.activeAccentDot,
            boxShadow: `0 0 7px ${s.activeAccentDot}`,
            display: "block",
          }}
        />
      )}
    </Link>
  );
}

// ─── Bottom Link ──────────────────────────────────────────────────────────────

function BottomNavLink({
  icon: Icon,
  label,
  to,
  rightIcon,
}: {
  icon: React.ElementType;
  label: string;
  to: string;
  rightIcon?: React.ElementType;
}) {
  const { theme } = useAdminTheme();
  const s = theme.sidebar;
  const [hov, setHov] = useState(false);
  const RightIcon = rightIcon;

  return (
    <Link
      to={to as any}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="flex items-center gap-3 px-3 py-2.5 text-[0.62rem] uppercase tracking-[0.10em] transition-all rounded-lg group"
      style={{
        color: hov ? s.bottomLinkHoverColor : s.bottomLinkColor,
        background: hov ? s.bottomLinkHoverBg : "transparent",
        transition: "all 0.18s ease",
      }}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" style={{ transition: "transform 0.15s", transform: hov ? "scale(1.18)" : "scale(1)" }} />
      <span className="flex-1" style={{ textShadow: hov ? "0 0 10px rgba(255,255,255,0.40)" : "none", transition: "text-shadow 0.18s" }}>{label}</span>
      {RightIcon && (
        <RightIcon className="h-3 w-3" style={{ opacity: hov ? 0.7 : 0, transition: "opacity 0.18s" }} />
      )}
    </Link>
  );
}

function BottomNavButton({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  const { theme } = useAdminTheme();
  const s = theme.sidebar;
  const [hov, setHov] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="flex items-center gap-3 px-3 py-2.5 text-[0.62rem] uppercase tracking-[0.10em] rounded-lg w-full text-left"
      style={{
        color: hov
          ? danger ? s.logoutHoverColor : s.bottomLinkHoverColor
          : s.bottomLinkColor,
        background: hov
          ? danger ? s.logoutHoverBg : s.bottomLinkHoverBg
          : "transparent",
        transition: "all 0.18s ease",
      }}
    >
      <Icon
        className="h-3.5 w-3.5 shrink-0"
        style={{ transition: "transform 0.15s", transform: hov ? "scale(1.18)" : "scale(1)" }}
      />
      <span style={{ textShadow: hov ? (danger ? "0 0 10px rgba(248,113,113,0.45)" : "0 0 10px rgba(255,255,255,0.40)") : "none", transition: "text-shadow 0.18s" }}>{label}</span>
    </button>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function AdminSidebar({ onLogout, onClose }: { onLogout: () => void; onClose?: () => void }) {
  const { theme } = useAdminTheme();
  const s = theme.sidebar;
  const router = useRouterState();
  const path = router.location.pathname;

  const isActive = (to: string, exact?: boolean) =>
    exact ? (path === "/admin" || path === "/admin/") : path.startsWith(to);

  return (
    <aside
      className="fixed inset-y-0 left-0 w-[220px] flex flex-col z-40"
      style={{
        background: s.bg,
        borderRight: s.borderRight,
        boxShadow: s.boxShadow,
        transition: "background 0.4s ease, border-right 0.4s ease, box-shadow 0.4s ease",
      }}
    >
      {/* Brand */}
      <div
        className="px-5 pt-6 pb-5 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${s.dividerColor}` }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 flex items-center justify-center shrink-0 relative"
            style={{
              background: s.brandBg,
              border: `1px solid ${s.brandBorder}`,
              borderRadius: "9px",
              boxShadow: s.brandBoxShadow,
              transition: "all 0.4s ease",
            }}
          >
            <Gem className="h-[17px] w-[17px]" style={{ color: s.brandIconColor, transition: "color 0.4s ease" }} />
            <span
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-[1.5px]"
              style={{ background: s.statusDotColor, borderColor: "transparent", transition: "background 0.4s ease" }}
            />
          </div>
          <div className="min-w-0">
            <p
              className="text-[0.75rem] font-semibold leading-none tracking-tight truncate"
              style={{ color: s.brandTextColor, transition: "color 0.4s ease" }}
            >
              Qureshi Jewelers
            </p>
            <p
              className="text-[0.44rem] uppercase tracking-[0.30em] mt-1"
              style={{ color: s.brandSubColor, transition: "color 0.4s ease" }}
            >
              Admin Console
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 transition-colors shrink-0"
            style={{ color: s.navInactiveColor }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-5">
        {NAV_SECTIONS.map(({ label: sectionLabel, items }) => (
          <div key={sectionLabel}>
            <p
              className="px-2.5 mb-1.5 text-[0.44rem] uppercase tracking-[0.34em] font-bold"
              style={{ color: s.sectionLabelColor, transition: "color 0.4s ease" }}
            >
              {sectionLabel}
            </p>
            <div className="space-y-0.5">
              {items.map(({ icon, label, to, exact }: any) => (
                <NavItem
                  key={to}
                  icon={icon}
                  label={label}
                  to={to}
                  isActive={isActive(to, exact)}
                  onClick={onClose}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom zone */}
      <div
        className="px-3 py-4 space-y-0.5"
        style={{ borderTop: `1px solid ${s.dividerColor}` }}
      >
        <BottomNavLink icon={Store} label="View Storefront" to="/" rightIcon={ArrowUpRight} />
        <BottomNavButton icon={LogOut} label="Sign Out" onClick={onLogout} danger />
      </div>
    </aside>
  );
}

// ─── Mobile Top Bar ──────────────────────────────────────────────────────────

function MobileTopBar({ onMenu, onLogout }: { onMenu: () => void; onLogout: () => void }) {
  const { theme } = useAdminTheme();
  const router = useRouterState();
  const path = router.location.pathname;

  const allNavItems = NAV_SECTIONS.flatMap(s => s.items);
  const activeNav = allNavItems.find((n: any) =>
    (n as any).exact
      ? (path === "/admin" || path === "/admin/")
      : path.startsWith((n as any).to)
  );

  return (
    <header
      className="lg:hidden fixed top-0 left-0 right-0 h-12 flex items-center justify-between px-4 z-30"
      style={{
        background: theme.mobileBar.bg,
        borderBottom: theme.mobileBar.borderBottom,
        transition: "background 0.4s ease",
      }}
    >
      <div className="flex items-center gap-2.5">
        <button onClick={onMenu} className="transition-colors p-1 -ml-1" style={{ color: theme.sidebar.navInactiveColor }}>
          <Menu className="h-5 w-5" />
        </button>
        <div className="w-px h-4" style={{ background: theme.sidebar.dividerColor }} />
        <div className="flex items-center gap-2">
          <Gem className="h-3.5 w-3.5" style={{ color: theme.sidebar.brandSubColor }} />
          <span className="text-[0.70rem] font-medium" style={{ color: theme.sidebar.navInactiveColor }}>QJ</span>
          {activeNav && (
            <>
              <ChevronRight className="h-3 w-3" style={{ color: theme.sidebar.dividerColor }} />
              <span className="text-[0.62rem] uppercase tracking-[0.10em]" style={{ color: theme.sidebar.sectionLabelColor }}>
                {activeNav.label}
              </span>
            </>
          )}
        </div>
      </div>
      <button
        onClick={onLogout}
        className="text-[0.58rem] uppercase tracking-[0.14em] transition-colors"
        style={{ color: theme.sidebar.bottomLinkColor }}
      >
        Sign Out
      </button>
    </header>
  );
}

// ─── Mobile Overlay ──────────────────────────────────────────────────────────

function MobileOverlay({ open, onClose, onLogout }: { open: boolean; onClose: () => void; onLogout: () => void }) {
  if (!open) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-30 lg:hidden"
        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <div className="fixed inset-y-0 left-0 w-[220px] z-40 lg:hidden">
        <AdminSidebar onLogout={onLogout} onClose={onClose} />
      </div>
    </>
  );
}

// ─── Root Guard ──────────────────────────────────────────────────────────────

function AdminRoot() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [themeId, setThemeIdState] = useState("dark-noir");
  const checkSession = useServerFn(checkAdminSession);
  const doLogout = useServerFn(adminLogout);

  useEffect(() => {
    const storedTheme = localStorage.getItem("qj_admin_theme");
    if (storedTheme) setThemeIdState(storedTheme);
    checkSession()
      .then(({ authenticated: ok }) => setAuthenticated(ok))
      .catch(() => setAuthenticated(false));
  }, []);

  const setThemeId = useCallback((id: string) => {
    setThemeIdState(id);
    localStorage.setItem("qj_admin_theme", id);
  }, []);

  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];

  const logout = () => {
    doLogout().catch(() => {});
    setAuthenticated(false);
    setMobileOpen(false);
    toast.success("Signed out");
  };

  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0c0c0c" }}>
        <div className="flex flex-col items-center gap-4">
          <Gem className="h-7 w-7" style={{ color: "rgba(251,191,36,0.50)" }} />
          <div className="w-5 h-5 border-2 border-white/15 border-t-amber-400/60 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <AdminLogin onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <AdminTokenCtx.Provider value="">
      <AdminThemeCtx.Provider value={{ theme, setThemeId }}>
        <style>{themeCSS(theme)}</style>
        <div
          className={`admin-shell at-${theme.id} min-h-screen`}
          style={{ background: "var(--at-canvas-bg)", transition: "background 0.4s ease" }}
        >
          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <AdminSidebar onLogout={logout} />
          </div>

          {/* Mobile top bar */}
          <MobileTopBar onMenu={() => setMobileOpen(true)} onLogout={logout} />

          {/* Mobile overlay */}
          <MobileOverlay open={mobileOpen} onClose={() => setMobileOpen(false)} onLogout={logout} />

          {/* Main content */}
          <main
            className="lg:ml-[220px] min-h-screen pt-12 lg:pt-0 overflow-auto"
            style={{ background: "transparent", transition: "background 0.4s ease" }}
          >
            <Outlet />
          </main>
        </div>
      </AdminThemeCtx.Provider>
    </AdminTokenCtx.Provider>
  );
}
