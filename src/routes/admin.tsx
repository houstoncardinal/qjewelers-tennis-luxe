import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, ShoppingBag, Package, LogOut, Store, ChevronRight,
  Menu, X, BarChart2, Users, RotateCcw, Tag, Settings, Gem,
  ArrowUpRight, Star, Mail,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AdminTokenCtx, AdminThemeCtx, useAdminTheme } from "@/lib/admin-context";
import { THEMES, themeCSS } from "@/lib/admin-themes";
import { adminAuth } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  component: AdminRoot,
});

// ─── Login ───────────────────────────────────────────────────────────────────

function AdminLogin({ onLogin }: { onLogin: (t: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useServerFn(adminAuth);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError("");
    try {
      const { token } = await auth({ data: { password } });
      localStorage.setItem("qj_admin_token", token);
      onLogin(token);
    } catch {
      setError("Incorrect password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #141414 50%, #0c0c0c 100%)" }}
    >
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)", backgroundSize: "48px 48px" }}
      />
      <div className="w-full max-w-sm relative z-10">
        <div className="mb-10 flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-14 h-14 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.06) 100%)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "2px" }}
            >
              <Gem className="h-6 w-6" style={{ color: "#fbbf24" }} />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0a0a0a]" />
          </div>
          <div className="text-center">
            <p className="text-[0.46rem] uppercase tracking-[0.44em] text-white/30 mb-1.5">Admin Console</p>
            <h1 className="text-xl font-semibold text-white tracking-tight">Qureshi Jewelers</h1>
          </div>
        </div>

        <div className="p-8 space-y-5"
          style={{ background: "rgba(255,255,255,0.96)", border: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08) inset" }}
        >
          <div>
            <label className="block text-[0.56rem] uppercase tracking-[0.20em] text-gray-400 mb-2">Admin Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit(e)}
              className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-500 transition-colors bg-white"
              placeholder="Enter password"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={loading || !password}
            className="w-full text-white py-3.5 text-[0.62rem] uppercase tracking-[0.22em] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                Verifying…
              </span>
            ) : "Sign In"}
          </button>
        </div>

        <p className="mt-6 text-center text-[0.62rem] text-white/25">
          <Link to="/" className="hover:text-white/50 transition-colors">← Back to storefront</Link>
        </p>
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
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[20px]"
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
            : hov ? "drop-shadow(0 0 4px rgba(255,255,255,0.28))" : "none",
          transition: "transform 0.15s ease, filter 0.15s ease, color 0.15s ease",
        }}
      />
      <span style={{ fontWeight: isActive ? 600 : 500, letterSpacing: isActive ? "0.10em" : "0.12em", transition: "all 0.15s" }}>
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
      <span className="flex-1">{label}</span>
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
      <span>{label}</span>
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
  const [token, setToken]       = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [themeId, setThemeIdState] = useState("dark-noir");

  useEffect(() => {
    const stored = localStorage.getItem("qj_admin_token");
    const storedTheme = localStorage.getItem("qj_admin_theme");
    setToken(stored);
    if (storedTheme) setThemeIdState(storedTheme);
    setHydrated(true);
  }, []);

  const setThemeId = useCallback((id: string) => {
    setThemeIdState(id);
    localStorage.setItem("qj_admin_theme", id);
  }, []);

  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];

  const logout = () => {
    localStorage.removeItem("qj_admin_token");
    setToken(null);
    setMobileOpen(false);
    toast.success("Signed out");
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0c0c0c" }}>
        <div className="flex flex-col items-center gap-4">
          <Gem className="h-7 w-7" style={{ color: "rgba(251,191,36,0.50)" }} />
          <div className="w-5 h-5 border-2 border-white/15 border-t-amber-400/60 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!token) {
    return <AdminLogin onLogin={t => setToken(t)} />;
  }

  return (
    <AdminTokenCtx.Provider value={token}>
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
