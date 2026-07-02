import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, ShoppingBag, Package, LogOut, Store, ChevronRight,
  Menu, X, BarChart2, Users, RotateCcw, Tag, Settings, Gem,
  ArrowUpRight, Star, Mail, Lock, ShieldCheck,
  ClipboardList, ArrowLeft, FileText, MoreHorizontal, ShoppingCart,
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

const VAULT_CSS = `
  @keyframes vault-spin-cw  { to { transform: rotate(360deg);  } }
  @keyframes vault-spin-ccw { to { transform: rotate(-360deg); } }
  @keyframes vault-pulse    { 0%,100% { opacity: 0.28; } 50% { opacity: 0.65; } }
  @keyframes glow-breathe   {
    0%,100% { transform: scale(1);    opacity: 0.40; }
    50%     { transform: scale(1.14); opacity: 0.75; }
  }
  @keyframes gold-shimmer {
    0%   { transform: translateX(-160%) skewX(-15deg); opacity: 0;  }
    6%   { opacity: 1;  }
    94%  { opacity: 1;  }
    100% { transform: translateX(360%) skewX(-15deg);  opacity: 0;  }
  }
  @keyframes vault-entrance {
    from { opacity: 0; transform: scale(0.93) translateY(22px); filter: blur(5px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);    filter: blur(0);   }
  }
  @keyframes spark-float {
    0%,100% { opacity: 0; transform: scale(0)   rotate(0deg);  }
    40%     { opacity: 1; transform: scale(1)   rotate(45deg); }
    80%     { opacity: 0; transform: scale(0.2) rotate(90deg); }
  }
  @keyframes needle-pulse {
    0%,100% { box-shadow: 0 0 0 0   rgba(74,222,128,0.7); }
    50%     { box-shadow: 0 0 0 5px rgba(74,222,128,0);   }
  }
  @keyframes gold-pulse {
    0%,100% { box-shadow: 0 0 0 0   rgba(212,175,55,0.5); }
    50%     { box-shadow: 0 0 0 7px rgba(212,175,55,0);   }
  }
  @keyframes scan-line {
    0%   { top: -2px;              opacity: 0; }
    5%   { opacity: 1; }
    95%  { opacity: 1; }
    100% { top: calc(100% + 2px); opacity: 0; }
  }
  @keyframes bolt-breathe {
    0%,100% { box-shadow: 0 2px  6px rgba(0,0,0,0.70), 0 0 0   rgba(212,175,55,0);    }
    50%     { box-shadow: 0 2px 12px rgba(0,0,0,0.50), 0 0 8px rgba(212,175,55,0.10); }
  }
  @keyframes door-breathe {
    0%,100% { transform: perspective(1400px) rotateY(-6.0deg) rotateX(2.5deg) scale(1);     }
    50%     { transform: perspective(1400px) rotateY(-3.5deg) rotateX(1.2deg) scale(1.015); }
  }
  @keyframes spotlight-sweep {
    0%,100% { opacity: 0.06; transform: skewX(-8deg) translateX(-8%); }
    50%     { opacity: 0.11; transform: skewX(-8deg) translateX( 8%); }
  }
  @keyframes terminal-scroll {
    from { transform: translateY(0);    }
    to   { transform: translateY(-50%); }
  }
  @keyframes particle-rise {
    0%   { transform: translateY(0)       scale(1);   opacity: 0;    }
    8%   { opacity: 0.75; }
    85%  { opacity: 0.15; }
    100% { transform: translateY(-100px)  scale(0.1); opacity: 0;    }
  }
  .vault-entrance { animation: vault-entrance 0.95s cubic-bezier(0.16,1,0.3,1) both; }
  .gold-shimmer-card { position: relative; overflow: hidden; }
  .gold-shimmer-card::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(108deg, transparent 36%, rgba(212,175,55,0.055) 50%, transparent 64%);
    animation: gold-shimmer 8s ease-in-out 2.5s infinite;
    pointer-events: none;
  }
  .vault-door-3d {
    animation: door-breathe 12s ease-in-out infinite;
    transform-style: preserve-3d;
    will-change: transform;
  }
`;

// ── 3D Vault Door ─────────────────────────────────────────────────────────────
function VaultDoor() {
  const DOOR = 318;
  const dialNumbers = Array.from({ length: 10 }, (_, i) => ({ deg: i * 36, num: i * 10 }));
  const dialTicks   = Array.from({ length: 60 },  (_, i) => i * 6);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
      {/* Deep ambient glow */}
      <div
        className="absolute rounded-full"
        style={{
          width: 560, height: 560,
          background: "radial-gradient(circle, rgba(212,175,55,0.09) 0%, rgba(212,175,55,0.03) 40%, transparent 68%)",
          animation: "glow-breathe 6s ease-in-out infinite",
        }}
      />
      {/* Spotlight cone from above */}
      <div
        className="absolute"
        style={{
          top: 0, left: "20%", right: "20%", height: "70%",
          background: "linear-gradient(to bottom, rgba(212,175,55,0.08) 0%, transparent 100%)",
          clipPath: "polygon(28% 0, 72% 0, 100% 100%, 0% 100%)",
          animation: "spotlight-sweep 9s ease-in-out infinite",
        }}
      />

      {/* 3D door wrapper */}
      <div className="vault-door-3d relative" style={{ width: DOOR, height: DOOR }}>

        {/* Wall cavity / surround frame */}
        <div
          className="absolute"
          style={{
            inset: -28,
            background: "linear-gradient(145deg, #080608 0%, #0e0b0a 55%, #080708 100%)",
            border: "1px solid rgba(212,175,55,0.06)",
            boxShadow: "inset 0 0 60px rgba(0,0,0,0.95), inset 0 0 120px rgba(0,0,0,0.8)",
          }}
        />
        {/* Hinge depth shadow — door hinges on left */}
        <div
          className="absolute"
          style={{
            left: -28, top: -28, bottom: -28, width: 28,
            background: "linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.72))",
          }}
        />

        {/* Door slab */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(152deg, #211f1c 0%, #181512 35%, #101009 65%, #1c1a17 100%)",
            border: "2px solid rgba(212,175,55,0.13)",
            boxShadow: [
              "inset 0 2px 6px rgba(255,255,255,0.045)",
              "inset 0 -3px 8px rgba(0,0,0,0.65)",
              "inset 2px 0 5px rgba(255,255,255,0.022)",
              "inset -3px 0 8px rgba(0,0,0,0.55)",
              "0 12px 50px rgba(0,0,0,0.85)",
            ].join(", "),
          }}
        >
          {/* Brushed steel texture */}
          <div
            className="absolute inset-0 opacity-20"
            style={{ background: "repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(255,255,255,0.006) 3px, rgba(255,255,255,0.006) 4px)" }}
          />
          {/* Gold inlay border 1 */}
          <div className="absolute" style={{ inset: 13, border: "1px solid rgba(212,175,55,0.20)", boxShadow: "inset 0 0 24px rgba(0,0,0,0.5)" }} />
          {/* Gold inlay border 2 */}
          <div className="absolute" style={{ inset: 19, border: "1px solid rgba(212,175,55,0.07)" }} />
        </div>

        {/* ── BOLT BARS ─────────────────────────────────── */}
        {/* Right — 3 bolts */}
        {[0.27, 0.50, 0.73].map((frac, i) => (
          <div
            key={`r${i}`}
            className="absolute"
            style={{
              right: -44, top: `calc(${frac * 100}% - 8px)`,
              width: 44, height: 16,
              background: "linear-gradient(to right, #2e2b27 0%, #201e1b 60%, #161412 100%)",
              border: "1px solid rgba(212,175,55,0.16)", borderLeft: "none",
              borderRadius: "0 3px 3px 0",
              animation: `bolt-breathe ${3.6 + i * 0.45}s ease-in-out ${i * 0.35}s infinite`,
            }}
          >
            <div className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm" style={{ width: 16, height: 8, background: "rgba(0,0,0,0.45)", border: "1px solid rgba(212,175,55,0.10)" }} />
          </div>
        ))}
        {/* Left — 2 bolts */}
        {[0.35, 0.65].map((frac, i) => (
          <div
            key={`l${i}`}
            className="absolute"
            style={{
              left: -40, top: `calc(${frac * 100}% - 8px)`,
              width: 40, height: 16,
              background: "linear-gradient(to left, #2e2b27 0%, #201e1b 60%, #161412 100%)",
              border: "1px solid rgba(212,175,55,0.13)", borderRight: "none",
              borderRadius: "3px 0 0 3px",
              animation: `bolt-breathe ${4.1 + i * 0.5}s ease-in-out ${i * 0.5 + 0.2}s infinite`,
            }}
          />
        ))}
        {/* Top — 2 bolts */}
        {[0.33, 0.67].map((frac, i) => (
          <div
            key={`t${i}`}
            className="absolute"
            style={{
              top: -36, left: `calc(${frac * 100}% - 8px)`,
              width: 16, height: 36,
              background: "linear-gradient(to top, #2e2b27, #161412)",
              border: "1px solid rgba(212,175,55,0.12)", borderBottom: "none",
              borderRadius: "3px 3px 0 0",
              animation: `bolt-breathe ${3.9 + i * 0.3}s ease-in-out ${i * 0.4 + 0.1}s infinite`,
            }}
          />
        ))}
        {/* Bottom — 2 bolts */}
        {[0.33, 0.67].map((frac, i) => (
          <div
            key={`b${i}`}
            className="absolute"
            style={{
              bottom: -36, left: `calc(${frac * 100}% - 8px)`,
              width: 16, height: 36,
              background: "linear-gradient(to bottom, #2e2b27, #161412)",
              border: "1px solid rgba(212,175,55,0.12)", borderTop: "none",
              borderRadius: "0 0 3px 3px",
              animation: `bolt-breathe ${4.3 + i * 0.4}s ease-in-out ${i * 0.6 + 0.3}s infinite`,
            }}
          />
        ))}

        {/* ── COMBINATION DIAL ─────────────────────────── */}
        <div className="absolute inset-0 flex items-center justify-center">

          {/* Outer number ring — rotates slowly */}
          <div className="absolute rounded-full" style={{ width: 252, height: 252, animation: "vault-spin-cw 200s linear infinite" }}>
            {dialTicks.map((deg) => {
              const major = deg % 36 === 0;
              return (
                <div key={deg} className="absolute" style={{ width: "100%", height: "100%", transform: `rotate(${deg}deg)` }}>
                  <div style={{ position: "absolute", top: major ? 10 : 14, left: "50%", width: major ? 1.5 : 1, height: major ? 10 : 5, background: major ? "rgba(212,175,55,0.55)" : "rgba(212,175,55,0.18)", transform: "translateX(-50%)" }} />
                </div>
              );
            })}
            {dialNumbers.map(({ deg, num }) => (
              <div key={deg} className="absolute" style={{ width: "100%", height: "100%", transform: `rotate(${deg}deg)` }}>
                <span style={{ position: "absolute", top: 23, left: "50%", transform: `translateX(-50%) rotate(-${deg}deg)`, fontSize: "0.39rem", color: "rgba(212,175,55,0.52)", fontFamily: "monospace", fontWeight: 600, letterSpacing: "0.04em" }}>
                  {String(num).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>

          {/* Outer ring border circle */}
          <div className="absolute rounded-full" style={{ width: 252, height: 252, border: "1.5px solid rgba(212,175,55,0.22)", boxShadow: "0 0 0 1px rgba(212,175,55,0.06), inset 0 0 24px rgba(0,0,0,0.6)" }} />

          {/* Middle mechanism ring — 8 spokes + rivets, counter-rotates */}
          <div
            className="absolute rounded-full"
            style={{
              width: 188, height: 188,
              border: "2px solid rgba(212,175,55,0.18)",
              background: "radial-gradient(circle at 42% 38%, rgba(28,24,18,1) 0%, rgba(10,8,6,1) 100%)",
              boxShadow: "inset 0 4px 18px rgba(0,0,0,0.80), 0 0 0 1.5px rgba(0,0,0,0.6)",
              animation: "vault-spin-ccw 130s linear infinite",
            }}
          >
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2"
                style={{ width: 85, height: 1.5, marginTop: -0.75, background: "linear-gradient(to right, rgba(212,175,55,0.40), rgba(212,175,55,0.04))", transform: `rotate(${i * 45}deg)`, transformOrigin: "0 50%" }}
              />
            ))}
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i * 45 * Math.PI) / 180;
              const r = 79;
              return (
                <div key={i} className="absolute rounded-full" style={{ width: 7, height: 7, top: `calc(50% + ${Math.sin(a) * r}px - 3.5px)`, left: `calc(50% + ${Math.cos(a) * r}px - 3.5px)`, background: "radial-gradient(circle, rgba(212,175,55,0.70) 0%, rgba(212,175,55,0.18) 100%)", boxShadow: "0 0 5px rgba(212,175,55,0.32)" }} />
              );
            })}
          </div>

          {/* Inner handle grip ring */}
          <div
            className="absolute rounded-full"
            style={{
              width: 118, height: 118,
              border: "2px solid rgba(212,175,55,0.26)",
              background: "radial-gradient(circle at 38% 33%, rgba(38,32,22,1) 0%, rgba(14,11,7,1) 100%)",
              boxShadow: ["inset 0 2px 10px rgba(255,255,255,0.055)", "inset 0 -4px 14px rgba(0,0,0,0.75)", "0 0 0 3.5px rgba(0,0,0,0.85)", "0 0 0 5px rgba(212,175,55,0.10)", "0 0 20px rgba(212,175,55,0.08)"].join(", "),
              animation: "vault-spin-cw 70s linear infinite",
            }}
          >
            {[0, 90].map((deg) => (
              <div
                key={deg}
                className="absolute top-1/2 left-1/2"
                style={{
                  width: 76, height: 13, marginTop: -6.5, marginLeft: -38,
                  background: "linear-gradient(to bottom, rgba(212,175,55,0.38) 0%, rgba(212,175,55,0.18) 55%, rgba(212,175,55,0.06) 100%)",
                  border: "1px solid rgba(212,175,55,0.24)",
                  borderRadius: 3,
                  transform: `rotate(${deg}deg)`,
                  transformOrigin: "50% 50%",
                  boxShadow: "inset 0 1px 3px rgba(255,255,255,0.07)",
                }}
              />
            ))}
          </div>

          {/* Center gem medallion */}
          <div
            className="absolute flex items-center justify-center rounded-full"
            style={{
              width: 58, height: 58,
              background: "radial-gradient(circle at 38% 32%, rgba(212,175,55,0.22) 0%, rgba(0,0,0,0.85) 72%)",
              border: "2px solid rgba(212,175,55,0.44)",
              boxShadow: ["0 0 0 3px rgba(0,0,0,0.92)", "0 0 0 4.5px rgba(212,175,55,0.14)", "0 0 22px rgba(212,175,55,0.18)", "inset 0 0 14px rgba(0,0,0,0.75)"].join(", "),
              animation: "vault-pulse 3.5s ease-in-out infinite",
            }}
          >
            <Gem className="h-5 w-5" style={{ color: "rgba(212,175,55,0.82)" }} />
          </div>
        </div>

        {/* Corner reinforcement plates */}
        {([
          { top: 0,    left:  0, bt: "top",    bl: "left"  },
          { top: 0,    right: 0, bt: "top",    bl: "right" },
          { bottom: 0, left:  0, bt: "bottom", bl: "left"  },
          { bottom: 0, right: 0, bt: "bottom", bl: "right" },
        ] as const).map(({ bt, bl, ...pos }, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              ...pos,
              width: 30, height: 30,
              [bt === "top" ? "borderTop" : "borderBottom"]: "2px solid rgba(212,175,55,0.30)",
              [bl === "left" ? "borderLeft" : "borderRight"]: "2px solid rgba(212,175,55,0.30)",
            }}
          />
        ))}

        {/* Engraved serial number */}
        <div className="absolute bottom-7 left-0 right-0 text-center">
          <span style={{ fontSize: "0.36rem", letterSpacing: "0.42em", color: "rgba(212,175,55,0.18)", fontFamily: "monospace" }}>
            SN · QJ‑2024‑001
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Gold divider ───────────────────────────────────────────────────────────────
function GoldRule({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(212,175,55,0.32))" }} />
      {label ? (
        <span className="text-[0.42rem] uppercase tracking-[0.38em] font-semibold" style={{ color: "rgba(212,175,55,0.48)" }}>
          {label}
        </span>
      ) : (
        <span style={{ color: "rgba(212,175,55,0.42)", fontSize: "0.44rem" }}>◆</span>
      )}
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(212,175,55,0.32))" }} />
    </div>
  );
}

// ── Corner accent marks ────────────────────────────────────────────────────────
function CornerAccents({ size = 20, opacity = 0.5 }: { size?: number; opacity?: number }) {
  const s = `rgba(212,175,55,${opacity})`;
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

// ── Diamond sparks ─────────────────────────────────────────────────────────────
const SPARKS = [
  { top: "10%", left: "7%",  delay: "0s",   dur: "3.5s" },
  { top: "22%", left: "92%", delay: "1.3s", dur: "4.2s" },
  { top: "68%", left: "5%",  delay: "2.0s", dur: "3.1s" },
  { top: "82%", left: "89%", delay: "0.7s", dur: "4.7s" },
  { top: "45%", left: "97%", delay: "3.2s", dur: "2.9s" },
  { top: "55%", left: "3%",  delay: "1.8s", dur: "3.8s" },
  { top: "35%", left: "95%", delay: "2.6s", dur: "3.4s" },
];

function DiamondSparks() {
  return (
    <>
      {SPARKS.map((s, i) => (
        <div
          key={i}
          className="absolute pointer-events-none select-none"
          style={{ top: s.top, left: s.left, width: 8, height: 8, fontSize: "0.50rem", color: "rgba(212,175,55,0.60)", animation: `spark-float ${s.dur} ease-in-out ${s.delay} infinite` }}
        >
          ◆
        </div>
      ))}
    </>
  );
}

// ── Security credential row ────────────────────────────────────────────────────
function CredentialRow({ icon: Icon, label, sublabel }: { icon: React.ElementType; label: string; sublabel?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.20)" }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color: "rgba(212,175,55,0.72)" }} />
      </div>
      <div>
        <p className="text-[0.60rem] tracking-[0.06em]" style={{ color: "rgba(255,255,255,0.40)" }}>{label}</p>
        {sublabel && (
          <p className="text-[0.44rem] tracking-[0.10em] mt-0.5 font-mono" style={{ color: "rgba(212,175,55,0.30)" }}>{sublabel}</p>
        )}
      </div>
    </div>
  );
}

// ── Terminal security log ──────────────────────────────────────────────────────
const TERMINAL_LINES = [
  "[AUTH]    HSM module initialized · OK",
  "[VAULT]   Locking mechanism engaged · SECURE",
  "[CERT]    TLS 1.3 chain verified · PASS",
  "[SESSION] Ephemeral key generated · AES-256",
  "[AUDIT]   Chronicle node synced · ACTIVE",
  "[TOTP]    HMAC-SHA1 seed loaded · READY",
  "[HSM]     Key derivation online · FIPS 140-2",
  "[VAULT]   Bolt array nominal · 9/9",
  "[BIOM]    Input layer armed · WAITING",
  "[NET]     Tunnel established · TLS 1.3",
  "[AUTH]    Session token rotated · OK",
  "[VAULT]   Combination dial calibrated · 00",
];

function TerminalLog() {
  const doubled = [...TERMINAL_LINES, ...TERMINAL_LINES];
  return (
    <div
      className="relative overflow-hidden"
      style={{ height: 76, maskImage: "linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)" }}
    >
      <div style={{ animation: "terminal-scroll 24s linear infinite" }}>
        {doubled.map((line, i) => (
          <p
            key={i}
            className="font-mono leading-relaxed"
            style={{
              fontSize: "0.39rem",
              color: i % 3 === 0 ? "rgba(212,175,55,0.38)" : i % 3 === 1 ? "rgba(74,222,128,0.30)" : "rgba(255,255,255,0.20)",
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
            }}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

// ── Rising gold particles ──────────────────────────────────────────────────────
const PARTICLES = [
  { left: "15%", delay: "0s",   dur: "4.0s", size: 3 },
  { left: "32%", delay: "1.5s", dur: "3.3s", size: 2 },
  { left: "50%", delay: "0.8s", dur: "4.8s", size: 4 },
  { left: "68%", delay: "2.2s", dur: "3.7s", size: 2 },
  { left: "84%", delay: "0.3s", dur: "5.1s", size: 3 },
  { left: "24%", delay: "3.1s", dur: "4.2s", size: 2 },
  { left: "76%", delay: "1.9s", dur: "3.5s", size: 3 },
];

function RisingParticles() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none select-none overflow-hidden">
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute bottom-0 rounded-full"
          style={{ left: p.left, width: p.size, height: p.size, background: "rgba(212,175,55,0.55)", boxShadow: "0 0 4px rgba(212,175,55,0.4)", animation: `particle-rise ${p.dur} ease-out ${p.delay} infinite` }}
        />
      ))}
    </div>
  );
}

// ─── Main Login ───────────────────────────────────────────────────────────────

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [pin, setPin]             = useState("");
  const [code, setCode]           = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const auth       = useServerFn(adminAuth);
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
      if (result.requiresTotp) { setNeedsTotp(true); } else { onLogin(); }
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

  const GOLD     = "rgba(212,175,55,1)";
  const GOLD_MID = "rgba(212,175,55,0.60)";
  const GOLD_DIM = "rgba(212,175,55,0.22)";

  return (
    <>
      <style>{VAULT_CSS}</style>

      <div className="min-h-screen flex" style={{ background: "linear-gradient(160deg, #060408 0%, #0c0a07 55%, #090807 100%)" }}>

        {/* ══ LEFT PANEL ══════════════════════════════════════════════════════ */}
        <div
          className="hidden lg:flex lg:w-[48%] relative overflow-hidden flex-col justify-between"
          style={{ background: "linear-gradient(152deg, #050308 0%, #0d0b07 55%, #080708 100%)", borderRight: `1px solid ${GOLD_DIM}` }}
        >
          <VaultDoor />
          <DiamondSparks />
          <RisingParticles />

          {/* Radial bloom */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 75% 65% at 50% 50%, rgba(212,175,55,0.065) 0%, transparent 70%)" }} />
          {/* Floor reflection */}
          <div className="absolute bottom-0 left-0 right-0 h-36 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(212,175,55,0.04) 0%, transparent 100%)" }} />

          {/* Top brand */}
          <div className="relative z-10 p-12">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/QURESHIJEWELERSLOGO.png"
                alt="Qureshi Jewelers"
                className="h-10 w-auto"
                style={{ filter: "brightness(0) saturate(100%) invert(78%) sepia(38%) saturate(600%) hue-rotate(5deg) brightness(95%)" }}
              />
            </div>
            <GoldRule label="Private Vault Console" />
          </div>

          {/* Bottom copy + credentials + terminal */}
          <div className="relative z-10 p-12 pb-10">
            <p
              className="font-display text-[2.0rem] leading-[1.16] mb-4"
              style={{ color: "rgba(255,255,255,0.88)", textShadow: "0 0 80px rgba(212,175,55,0.08)" }}
            >
              Every flawless piece.<br />
              <span style={{ background: "linear-gradient(90deg, rgba(212,175,55,0.90) 0%, rgba(212,175,55,0.55) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Every operation.
              </span><br />
              One secure vault.
            </p>
            <p className="text-[0.60rem] leading-relaxed mb-7" style={{ color: "rgba(255,255,255,0.26)" }}>
              Military-grade access control protecting the world's finest moissanite collections.
            </p>

            <div className="space-y-2.5 mb-7">
              <CredentialRow icon={ShieldCheck}  label="TOTP dual-factor authentication"  sublabel="HMAC-SHA1 · RFC 6238"      />
              <CredentialRow icon={Lock}          label="AES-256 encrypted session vault"  sublabel="FIPS 140-2 validated"      />
              <CredentialRow icon={ClipboardList} label="Immutable audit chronicle"         sublabel="Tamper-evident log"        />
            </div>

            <div className="mb-6">
              <p className="text-[0.40rem] uppercase tracking-[0.30em] font-semibold mb-2" style={{ color: "rgba(212,175,55,0.28)" }}>
                Security Log
              </p>
              <TerminalLog />
            </div>

            <div className="pt-5" style={{ borderTop: `1px solid ${GOLD_DIM}` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#4ade80", boxShadow: "0 0 8px rgba(74,222,128,0.9)", animation: "needle-pulse 2.5s ease-in-out infinite" }} />
                  <span className="text-[0.48rem] uppercase tracking-[0.34em]" style={{ color: "rgba(212,175,55,0.42)" }}>Vault Online</span>
                </div>
                <span className="text-[0.37rem] font-mono" style={{ color: "rgba(255,255,255,0.16)" }}>
                  {new Date().toISOString().slice(0, 10)}
                </span>
              </div>
            </div>
          </div>

          {/* Right-edge VAULT label */}
          <div
            className="absolute right-[-1px] top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 py-5 z-10"
            style={{ borderLeft: `1px solid ${GOLD_DIM}` }}
          >
            {"VAULT".split("").map((c, i) => (
              <span key={i} style={{ fontSize: "0.37rem", fontWeight: 600, color: GOLD_DIM, writingMode: "vertical-lr", letterSpacing: "0.3em" }}>{c}</span>
            ))}
          </div>
        </div>

        {/* ══ RIGHT PANEL ═════════════════════════════════════════════════════ */}
        <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">

          {/* Background bloom */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 90% 65% at 55% 42%, rgba(212,175,55,0.045) 0%, transparent 70%)" }} />

          {/* Mobile vault rings */}
          <div className="lg:hidden absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            {[280, 200, 130].map((d, i) => (
              <div key={i} className="absolute rounded-full" style={{ width: d, height: d, border: "1px solid rgba(212,175,55,0.45)", animation: `${i % 2 === 0 ? "vault-spin-cw" : "vault-spin-ccw"} ${130 - i * 35}s linear infinite` }} />
            ))}
          </div>

          <DiamondSparks />

          <div className="w-full max-w-[380px] relative z-10 vault-entrance">

            {/* Logo medallion */}
            <div className="flex flex-col items-center mb-8">
              <div
                className="relative flex items-center justify-center mb-5"
                style={{
                  width: 76, height: 76, borderRadius: "50%",
                  background: "radial-gradient(circle at 38% 34%, rgba(212,175,55,0.16) 0%, rgba(0,0,0,0) 70%)",
                  border: `1.5px solid ${GOLD_DIM}`,
                  boxShadow: "0 0 50px rgba(212,175,55,0.08), inset 0 0 20px rgba(0,0,0,0.6)",
                }}
              >
                <img src="/QURESHIJEWELERSLOGO.png" alt="Qureshi Jewelers" className="h-9 w-auto" style={{ filter: "brightness(0) saturate(100%) invert(78%) sepia(38%) saturate(600%) hue-rotate(5deg) brightness(95%)" }} />
                {/* Dashed orbital ring */}
                <div className="absolute rounded-full" style={{ inset: -12, border: "1px dashed rgba(212,175,55,0.20)", animation: "vault-spin-cw 28s linear infinite" }} />
              </div>
              <p className="text-[0.46rem] uppercase tracking-[0.50em] font-semibold" style={{ color: GOLD_MID }}>Qureshi Jewelers</p>
              <p className="text-[0.40rem] uppercase tracking-[0.38em] mt-1" style={{ color: "rgba(255,255,255,0.20)" }}>Private Vault Console</p>
            </div>

            {/* Heading */}
            <div className="text-center mb-6">
              <h1 className="font-display text-[1.75rem] leading-tight mb-2" style={{ color: "rgba(255,255,255,0.90)", textShadow: "0 0 50px rgba(212,175,55,0.14)" }}>
                {needsTotp ? "Identity Verification" : "Vault Access"}
              </h1>
              <p className="text-[0.58rem] tracking-[0.08em]" style={{ color: "rgba(255,255,255,0.28)" }}>
                {needsTotp ? "Enter the 6-digit code from your authenticator app" : "Authorised personnel only · Enter your secure access code"}
              </p>
            </div>

            {/* Card */}
            <div
              className="relative px-8 pt-7 pb-8 gold-shimmer-card"
              style={{
                background: "linear-gradient(158deg, rgba(255,255,255,0.028) 0%, rgba(255,255,255,0.015) 100%)",
                border: "1px solid rgba(212,175,55,0.24)",
                boxShadow: [
                  "0 0 0 4px rgba(7,6,9,1)",
                  "0 0 0 5px rgba(212,175,55,0.11)",
                  "0 0 0 6px rgba(7,6,9,0.8)",
                  "0 50px 90px rgba(0,0,0,0.75)",
                  "0 8px 36px rgba(0,0,0,0.55)",
                  "inset 0 0 60px rgba(0,0,0,0.22)",
                  "inset 0 1px 0 rgba(255,255,255,0.04)",
                ].join(", "),
                backdropFilter: "blur(28px)",
              }}
            >
              <CornerAccents size={18} opacity={0.52} />
              <GoldRule label={needsTotp ? "Dual Factor" : "Secure Entry"} />

              <div className="mt-6 mb-6">
                {/* Icon medallion */}
                <div className="flex justify-center mb-5">
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 56, height: 56,
                      background: "radial-gradient(circle at 38% 34%, rgba(212,175,55,0.18) 0%, transparent 70%)",
                      border: "1.5px solid rgba(212,175,55,0.32)",
                      boxShadow: "0 0 28px rgba(212,175,55,0.12), inset 0 0 16px rgba(0,0,0,0.5)",
                      animation: "gold-pulse 3s ease-in-out infinite",
                    }}
                  >
                    {needsTotp
                      ? <ShieldCheck className="h-6 w-6" style={{ color: GOLD_MID }} />
                      : <Lock        className="h-6 w-6" style={{ color: GOLD_MID }} />
                    }
                  </div>
                </div>

                <label className="block text-[0.44rem] uppercase tracking-[0.38em] font-semibold mb-3 text-center" style={{ color: GOLD_MID }}>
                  {needsTotp ? "Authenticator Code" : "Access Code"}
                </label>

                {/* Input with animated scan line */}
                <div className="relative" style={{ overflow: "hidden" }}>
                  <div
                    className="absolute left-0 right-0 pointer-events-none z-10"
                    style={{ height: 1, background: "linear-gradient(to right, transparent, rgba(212,175,55,0.45), transparent)", animation: "scan-line 3.5s linear infinite" }}
                  />
                  {needsTotp ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={code}
                      onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      onKeyDown={e => e.key === "Enter" && submit(e)}
                      className="w-full px-4 py-4 text-xl text-center tracking-[0.60em] font-semibold focus:outline-none text-white"
                      style={{ background: "rgba(0,0,0,0.40)", border: "1px solid rgba(212,175,55,0.24)", boxShadow: "inset 0 3px 10px rgba(0,0,0,0.40)", caretColor: GOLD }}
                      onFocus={e => { e.target.style.borderColor = "rgba(212,175,55,0.52)"; e.target.style.boxShadow = "inset 0 3px 10px rgba(0,0,0,0.40), 0 0 0 2px rgba(212,175,55,0.08)"; }}
                      onBlur={e  => { e.target.style.borderColor = "rgba(212,175,55,0.24)"; e.target.style.boxShadow = "inset 0 3px 10px rgba(0,0,0,0.40)"; }}
                      placeholder="· · · · · ·"
                      autoFocus
                      maxLength={6}
                    />
                  ) : (
                    <>
                      <input
                        type="password"
                        value={pin}
                        onChange={e => setPin(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && submit(e)}
                        className="w-full pl-4 pr-11 py-4 text-base tracking-[0.22em] focus:outline-none text-white"
                        style={{ background: "rgba(0,0,0,0.40)", border: "1px solid rgba(212,175,55,0.24)", boxShadow: "inset 0 3px 10px rgba(0,0,0,0.40)", caretColor: GOLD }}
                        onFocus={e => { e.target.style.borderColor = "rgba(212,175,55,0.52)"; e.target.style.boxShadow = "inset 0 3px 10px rgba(0,0,0,0.40), 0 0 0 2px rgba(212,175,55,0.08)"; }}
                        onBlur={e  => { e.target.style.borderColor = "rgba(212,175,55,0.24)"; e.target.style.boxShadow = "inset 0 3px 10px rgba(0,0,0,0.40)"; }}
                        placeholder="••••••••••••"
                        autoFocus
                      />
                      <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: GOLD_DIM }} />
                    </>
                  )}
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 mb-5 text-[0.60rem]" style={{ background: "rgba(239,68,68,0.065)", border: "1px solid rgba(239,68,68,0.22)", color: "rgba(252,165,165,0.90)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit button — gold 3D press */}
              <button
                type="button"
                onClick={submit}
                disabled={loading || (needsTotp ? code.length !== 6 : pin.length === 0)}
                className="w-full py-4 text-[0.58rem] font-bold uppercase tracking-[0.30em] disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group"
                style={{
                  background: "linear-gradient(to bottom, #edd96a 0%, #c9a845 42%, #9f7528 100%)",
                  color: "#180f04",
                  boxShadow: loading
                    ? "0 2px 0 #6b4e18, 0 6px 22px rgba(212,175,55,0.18)"
                    : "0 5px 0 #6b4e18, 0 14px 36px rgba(212,175,55,0.26), inset 0 1px 0 rgba(255,255,255,0.20)",
                  transform: loading ? "translateY(3px)" : undefined,
                  transition: "transform 0.12s, box-shadow 0.12s",
                }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.14), transparent 60%)", transition: "opacity 0.3s" }} />
                <span className="relative flex items-center justify-center gap-2.5">
                  {loading ? (
                    <><span className="w-3.5 h-3.5 border-2 border-[#180f04]/25 border-t-[#180f04] rounded-full animate-spin" />Authenticating…</>
                  ) : needsTotp ? (
                    <><ShieldCheck className="h-3.5 w-3.5" />Verify Identity</>
                  ) : (
                    <><Lock className="h-3.5 w-3.5" />Open Vault</>
                  )}
                </span>
              </button>

              {needsTotp && (
                <button
                  onClick={backToLogin}
                  className="w-full flex items-center justify-center gap-1.5 mt-4 text-[0.50rem] uppercase tracking-[0.22em]"
                  style={{ color: "rgba(255,255,255,0.22)", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(212,175,55,0.55)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.22)")}
                >
                  <ArrowLeft className="h-3 w-3" />
                  Return to vault entrance
                </button>
              )}

              <GoldRule />

              {!needsTotp && (
                <div className="flex items-center justify-center gap-5 mt-2">
                  {([
                    { icon: Lock,          text: "AES-256"  },
                    { icon: ShieldCheck,   text: "2FA Ready" },
                    { icon: ClipboardList, text: "Audited"   },
                  ] as const).map(({ icon: Icon, text }) => (
                    <span key={text} className="flex items-center gap-1.5 text-[0.46rem] uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.20)" }}>
                      <Icon className="h-2.5 w-2.5" style={{ color: GOLD_DIM }} />
                      {text}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {!needsTotp && (
              <div className="mt-7 flex items-center justify-between">
                <Link
                  to="/"
                  className="flex items-center gap-1.5 text-[0.50rem] uppercase tracking-[0.20em]"
                  style={{ color: "rgba(255,255,255,0.20)", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(212,175,55,0.52)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.20)")}
                >
                  <ArrowLeft className="h-3 w-3" />
                  Storefront
                </Link>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#4ade80", boxShadow: "0 0 7px rgba(74,222,128,0.9)", animation: "needle-pulse 2.5s ease-in-out infinite" }} />
                  <span className="text-[0.42rem] uppercase tracking-[0.28em]" style={{ color: "rgba(255,255,255,0.20)" }}>Vault secured</span>
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
      { icon: ShoppingBag,  label: "Orders",           to: "/admin/orders" },
      { icon: RotateCcw,    label: "Returns",          to: "/admin/returns" },
      { icon: Users,        label: "Customers",        to: "/admin/customers" },
      { icon: ShoppingCart, label: "Abandoned Carts",  to: "/admin/abandoned-carts" },
      { icon: Mail,         label: "Inner Circle",     to: "/admin/subscribers" },
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

function MobileTopBar() {
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
      className="lg:hidden fixed top-0 left-0 right-0 h-11 flex items-center px-4 z-30"
      style={{
        background: theme.mobileBar.bg,
        borderBottom: theme.mobileBar.borderBottom,
        transition: "background 0.4s ease",
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 flex items-center justify-center shrink-0"
          style={{
            background: theme.sidebar.brandBg,
            border: `1px solid ${theme.sidebar.brandBorder}`,
            borderRadius: "7px",
          }}
        >
          <Gem className="h-3.5 w-3.5" style={{ color: theme.sidebar.brandIconColor }} />
        </div>
        <div className="w-px h-4 mx-0.5" style={{ background: theme.sidebar.dividerColor }} />
        {activeNav ? (
          <span className="text-[0.72rem] font-semibold tracking-tight" style={{ color: theme.sidebar.navActiveColor }}>
            {activeNav.label}
          </span>
        ) : (
          <span className="text-[0.65rem] font-medium" style={{ color: theme.sidebar.navInactiveColor }}>Qureshi Jewelers</span>
        )}
      </div>
    </header>
  );
}

// ─── Mobile Bottom Nav ───────────────────────────────────────────────────────

const BOTTOM_NAV_PRIMARY = [
  { icon: LayoutDashboard, label: "Home",      to: "/admin/",          exact: true },
  { icon: ShoppingBag,     label: "Orders",    to: "/admin/orders" },
  { icon: Package,         label: "Products",  to: "/admin/products" },
  { icon: BarChart2,       label: "Analytics", to: "/admin/analytics" },
];

const MORE_NAV_ITEMS = [
  { icon: RotateCcw,    label: "Returns",         to: "/admin/returns" },
  { icon: Users,        label: "Customers",       to: "/admin/customers" },
  { icon: ShoppingCart, label: "Abandoned Carts", to: "/admin/abandoned-carts" },
  { icon: Mail,         label: "Inner Circle",    to: "/admin/subscribers" },
  { icon: Tag,          label: "Promotions",      to: "/admin/promotions" },
  { icon: Star,         label: "Reviews",         to: "/admin/reviews" },
  { icon: FileText,     label: "Content",         to: "/admin/content" },
  { icon: Settings,     label: "Settings",        to: "/admin/settings" },
];

function MobileMoreSheet({
  open, onClose, onLogout,
}: { open: boolean; onClose: () => void; onLogout: () => void }) {
  const { theme } = useAdminTheme();
  const s = theme.sidebar;
  const router = useRouterState();
  const path = router.location.pathname;

  const isActive = (to: string) => path.startsWith(to);

  if (!open) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-40 lg:hidden"
        style={{ background: "rgba(0,0,0,0.60)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden rounded-t-2xl overflow-hidden"
        style={{ background: s.bg, border: `1px solid ${s.dividerColor}`, borderBottom: "none" }}
      >
        {/* Sheet handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: s.dividerColor }} />
        </div>

        {/* Section label */}
        <p className="px-5 py-2 text-[0.47rem] uppercase tracking-[0.32em] font-bold" style={{ color: s.sectionLabelColor }}>
          More
        </p>

        {/* Grid of nav items */}
        <div className="grid grid-cols-4 gap-1 px-3 pb-2">
          {MORE_NAV_ITEMS.map(({ icon: Icon, label, to }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to as any}
                onClick={onClose}
                className="flex flex-col items-center gap-1.5 py-3.5 px-1 rounded-xl transition-all active:scale-95"
                style={{
                  background: active ? s.navActiveBg : "transparent",
                }}
              >
                <Icon
                  className="h-5 w-5 shrink-0"
                  style={{
                    color: active ? s.navIconActive : s.navIconInactive,
                    filter: active ? `drop-shadow(0 0 5px ${s.navIconActive}80)` : "none",
                  }}
                />
                <span
                  className="text-[0.52rem] uppercase tracking-[0.10em] text-center leading-tight"
                  style={{ color: active ? s.navActiveColor : s.navInactiveColor, fontWeight: active ? 600 : 400 }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="mx-5 mb-2" style={{ height: 1, background: s.dividerColor }} />

        {/* Bottom actions */}
        <div className="flex px-3 pb-6 gap-2">
          <Link
            to="/"
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[0.62rem] uppercase tracking-[0.10em] transition-all active:scale-95"
            style={{ background: s.navHoverBg, color: s.bottomLinkColor }}
          >
            <Store className="h-4 w-4" />
            View Store
          </Link>
          <button
            onClick={() => { onClose(); onLogout(); }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[0.62rem] uppercase tracking-[0.10em] transition-all active:scale-95"
            style={{ background: "rgba(239,68,68,0.10)", color: s.logoutHoverColor }}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

function MobileBottomNav({ onLogout }: { onLogout: () => void }) {
  const { theme } = useAdminTheme();
  const s = theme.sidebar;
  const router = useRouterState();
  const path = router.location.pathname;
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (to: string, exact?: boolean) =>
    exact ? (path === "/admin" || path === "/admin/") : path.startsWith(to);

  const moreIsActive = MORE_NAV_ITEMS.some(({ to }) => path.startsWith(to));

  return (
    <>
      <MobileMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} onLogout={onLogout} />

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch"
        style={{
          background: s.bg,
          borderTop: `1px solid ${s.dividerColor}`,
          boxShadow: "0 -8px 32px rgba(0,0,0,0.40)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {BOTTOM_NAV_PRIMARY.map(({ icon: Icon, label, to, exact }) => {
          const active = isActive(to, exact);
          return (
            <Link
              key={to}
              to={to as any}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all active:scale-90 relative"
              style={{ minHeight: 56 }}
            >
              {active && (
                <span
                  className="absolute top-0 left-[20%] right-[20%] h-[2px] rounded-full"
                  style={{ background: s.activeBarBg, boxShadow: s.activeBarShadow }}
                />
              )}
              <Icon
                className="h-[20px] w-[20px] shrink-0 transition-all"
                style={{
                  color: active ? s.navIconActive : s.navIconInactive,
                  filter: active ? `drop-shadow(0 0 6px ${s.navIconActive}90)` : "none",
                  transform: active ? "scale(1.12)" : "scale(1)",
                }}
              />
              <span
                className="text-[0.48rem] uppercase tracking-[0.10em] transition-all"
                style={{
                  color: active ? s.navActiveColor : s.navInactiveColor,
                  fontWeight: active ? 700 : 400,
                  textShadow: active ? `0 0 10px ${s.navIconActive}70` : "none",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}

        {/* More tab */}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all active:scale-90 relative"
          style={{ minHeight: 56 }}
        >
          {moreIsActive && (
            <span
              className="absolute top-0 left-[20%] right-[20%] h-[2px] rounded-full"
              style={{ background: s.activeBarBg, boxShadow: s.activeBarShadow }}
            />
          )}
          <MoreHorizontal
            className="h-[20px] w-[20px] shrink-0 transition-all"
            style={{
              color: moreIsActive ? s.navIconActive : s.navIconInactive,
              filter: moreIsActive ? `drop-shadow(0 0 6px ${s.navIconActive}90)` : "none",
            }}
          />
          <span
            className="text-[0.48rem] uppercase tracking-[0.10em]"
            style={{
              color: moreIsActive ? s.navActiveColor : s.navInactiveColor,
              fontWeight: moreIsActive ? 700 : 400,
              textShadow: moreIsActive ? `0 0 10px ${s.navIconActive}70` : "none",
            }}
          >
            More
          </span>
        </button>
      </nav>
    </>
  );
}

// ─── Root Guard ──────────────────────────────────────────────────────────────

function AdminRoot() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
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

          {/* Mobile top bar (title only) */}
          <MobileTopBar />

          {/* Mobile bottom nav */}
          <MobileBottomNav onLogout={logout} />

          {/* Main content */}
          <main
            className="lg:ml-[220px] min-h-screen pt-11 pb-20 lg:pt-0 lg:pb-0 overflow-auto"
            style={{ background: "transparent", transition: "background 0.4s ease" }}
          >
            <Outlet />
          </main>
        </div>
      </AdminThemeCtx.Provider>
    </AdminTokenCtx.Provider>
  );
}
