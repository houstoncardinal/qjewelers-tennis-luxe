import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, ShoppingBag, Package, LogOut, Store, ChevronRight,
  Menu, X, BarChart2, Users, RotateCcw, Tag, Settings, Gem,
  ArrowUpRight, Star, Mail, Lock, ShieldCheck,
  ClipboardList, ArrowLeft,
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

const GRID_BG = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
  backgroundSize: "44px 44px",
};

const BRAND_FEATURES = [
  { icon: ShieldCheck, text: "TOTP two-factor authentication" },
  { icon: Lock, text: "Encrypted, HttpOnly session cookies" },
  { icon: ClipboardList, text: "Full audit trail on every action" },
];

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [pin, setPin] = useState("");
  const [code, setCode] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useServerFn(adminAuth);
  const verifyTotp = useServerFn(verifyTotpLogin);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setError(err?.message?.includes("Too many") ? err.message : needsTotp ? "Invalid code. Try again." : "Incorrect PIN.");
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = () => { setNeedsTotp(false); setCode(""); setError(""); };

  return (
    <div className="min-h-screen flex" style={{ background: "#0a0a0a" }}>
      {/* ── Brand panel (desktop only) ───────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[44%] relative overflow-hidden flex-col justify-between p-14"
        style={{ background: "linear-gradient(160deg, #0a0a0a 0%, #161410 55%, #0d0c0a 100%)" }}
      >
        <div className="absolute inset-0 opacity-[0.035]" style={GRID_BG} />
        <div
          className="absolute -top-40 -left-32 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(251,191,36,0.18) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)" }}
        />

        <div className="relative z-10">
          <img
            src="/QURESHIJEWELERSLOGO.png"
            alt="Qureshi Jewelers"
            className="h-11 w-auto mb-3"
            style={{ filter: "brightness(0) invert(1)" }}
          />
          <p className="text-[0.5rem] uppercase tracking-[0.5em] text-white/30">Enterprise Admin Console</p>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl leading-tight mb-4 text-white" style={{ fontFamily: "Georgia, serif" }}>
            Command center for <span style={{ color: "#fbbf24" }}>fine jewelry</span> operations.
          </h2>
          <p className="text-sm text-white/40 leading-relaxed mb-9">
            Manage your entire catalog, orders, and clientele from one secure, GRA-grade console.
          </p>
          <div className="space-y-3.5">
            {BRAND_FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.20)" }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: "#fbbf24" }} />
                </div>
                <span className="text-xs text-white/55">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-[0.58rem] text-white/25">
          <span>© {new Date().getFullYear()} Qureshi Jewelers</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>All rights reserved</span>
        </div>
      </div>

      {/* ── Form panel ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] lg:hidden" style={GRID_BG} />
        <div className="w-full max-w-sm relative z-10">
          {/* Mobile-only logo */}
          <div className="lg:hidden mb-9 flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src="/QURESHIJEWELERSLOGO.png"
                alt="Qureshi Jewelers"
                className="h-9 w-auto"
                style={{ filter: "brightness(0) invert(1)" }}
              />
              <span className="absolute -top-1 -right-2 w-2 h-2 bg-emerald-400 rounded-full border-2 border-[#0a0a0a]" />
            </div>
            <p className="text-[0.46rem] uppercase tracking-[0.4em] text-white/30">Admin Console</p>
          </div>

          <div className="mb-7">
            <h1 className="text-xl font-semibold text-white tracking-tight mb-1.5">
              {needsTotp ? "Verify your identity" : "Welcome back"}
            </h1>
            <p className="text-xs text-white/35">
              {needsTotp ? "Enter the 6-digit code from your authenticator app" : "Enter your PIN to access the admin console"}
            </p>
          </div>

          <div
            className="p-8 rounded-2xl space-y-5"
            style={{
              background: "rgba(255,255,255,0.035)",
              border: "1px solid rgba(255,255,255,0.09)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset",
            }}
          >
            {needsTotp ? (
              <div>
                <div className="flex items-center justify-center mb-6">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.25)" }}
                  >
                    <ShieldCheck className="h-5 w-5" style={{ color: "#fbbf24" }} />
                  </div>
                </div>
                <label className="block text-[0.56rem] uppercase tracking-[0.20em] text-white/40 mb-2 text-center">
                  Authenticator Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={e => e.key === "Enter" && submit(e)}
                  className="w-full border px-4 py-3.5 text-lg text-center tracking-[0.5em] font-semibold rounded-lg focus:outline-none transition-colors text-white"
                  style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.12)" }}
                  placeholder="······"
                  autoFocus
                  maxLength={6}
                />
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-center mb-6">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.25)" }}
                  >
                    <Lock className="h-5 w-5" style={{ color: "#fbbf24" }} />
                  </div>
                </div>
                <label className="block text-[0.56rem] uppercase tracking-[0.20em] text-white/40 mb-2 text-center">
                  Admin PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={e => e.key === "Enter" && submit(e)}
                  className="w-full border px-4 py-3.5 text-lg text-center tracking-[0.5em] font-semibold rounded-lg focus:outline-none transition-colors text-white"
                  style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.12)" }}
                  placeholder="······"
                  autoFocus
                  maxLength={6}
                />
              </div>
            )}

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={loading || (needsTotp ? code.length !== 6 : pin.length !== 6)}
              className="w-full text-[#0a0a0a] py-3.5 text-[0.62rem] font-bold uppercase tracking-[0.22em] rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
              style={{ background: "linear-gradient(135deg, #fde68a 0%, #fbbf24 50%, #d97706 100%)", boxShadow: "0 8px 24px rgba(251,191,36,0.25)" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border border-[#0a0a0a]/30 border-t-[#0a0a0a] rounded-full animate-spin" />
                  Verifying…
                </span>
              ) : needsTotp ? "Verify Code" : "Sign In"}
            </button>

            {needsTotp && (
              <button
                onClick={backToLogin}
                className="w-full flex items-center justify-center gap-1.5 text-[0.60rem] uppercase tracking-[0.14em] text-white/30 hover:text-white/55 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" /> Back to login
              </button>
            )}

            {!needsTotp && (
              <div className="flex items-center justify-center gap-4 pt-1">
                <span className="flex items-center gap-1.5 text-[0.56rem] text-white/25">
                  <Lock className="h-3 w-3" /> 256-bit encrypted
                </span>
                <span className="w-1 h-1 rounded-full bg-white/15" />
                <span className="flex items-center gap-1.5 text-[0.56rem] text-white/25">
                  <ShieldCheck className="h-3 w-3" /> 2FA protected
                </span>
              </div>
            )}
          </div>

          {!needsTotp && (
            <p className="mt-6 text-center text-[0.62rem] text-white/25">
              <Link to="/" className="hover:text-white/50 transition-colors">← Back to storefront</Link>
            </p>
          )}
        </div>
      </div>
    </div>
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
