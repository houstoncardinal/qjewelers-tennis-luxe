import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, useId } from "react";
import {
  TrendingUp, ShoppingBag, DollarSign, AlertCircle,
  RefreshCw, ArrowRight, ChevronRight, RotateCcw,
  AlertTriangle, Package, Crown, ArrowUp, ArrowDown, Receipt,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { getDashboardStats, listAdminOrders } from "@/lib/admin.functions";
import { getDashboardExtended, getInventoryAlerts } from "@/lib/admin-extended.functions";
import { useAdminToken, useAdminTheme } from "@/lib/admin-context";
import { formatUSD } from "@/lib/pricing";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

// ─── Shared constants ─────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-amber-50 text-amber-700 border border-amber-200",
  processing: "bg-blue-50 text-blue-700 border border-blue-200",
  shipped:    "bg-violet-50 text-violet-700 border border-violet-200",
  delivered:  "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelled:  "bg-red-50 text-red-700 border border-red-200",
  refunded:   "bg-gray-50 text-gray-600 border border-gray-200",
};

const STATUS_DOT: Record<string, string> = {
  pending:    "bg-amber-400",
  processing: "bg-blue-400",
  shipped:    "bg-violet-400",
  delivered:  "bg-emerald-400",
  cancelled:  "bg-red-400",
  refunded:   "bg-gray-400",
};

const STATUS_HEX: Record<string, string> = {
  pending: "#f59e0b", processing: "#3b82f6", shipped: "#8b5cf6", delivered: "#10b981",
};

function alpha(hex: string, suffix: string) {
  return hex.length === 7 ? `${hex}${suffix}` : hex;
}

// ─── Components ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[0.60rem] uppercase tracking-[0.10em] font-medium rounded-sm ${STATUS_COLORS[status] ?? STATUS_COLORS.pending}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] ?? "bg-gray-400"}`} />
      {status}
    </span>
  );
}

function CustomerAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
      style={{ background: "var(--at-avatar-bg)", border: "1px solid var(--at-avatar-border)" }}
    >
      <span className="text-[0.60rem] font-semibold" style={{ color: "var(--at-avatar-text)" }}>{initials || "?"}</span>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-lg text-[0.62rem]"
      style={{ background: "var(--at-chart-tip-bg)", color: "var(--at-chart-tip-text)", boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}
    >
      <p className="font-semibold mb-0.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="opacity-90">{formatUSD(p.value)}</p>
      ))}
    </div>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const points = data.map((v, i) => ({ i, v }));
  const flat = data.every(v => v === data[0]);
  return (
    <div style={{ width: 72, height: 32 }} className="shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 3, right: 1, left: 1, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${rawId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.40} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#spark-${rawId})`}
            isAnimationActive={false}
            strokeOpacity={flat ? 0.35 : 1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function KpiCard({
  label, value, sub, icon: Icon, highlight, to, search, delta, deltaSuffix, sparkData, sparkColor,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; highlight?: boolean;
  to: string; search?: Record<string, string>;
  delta?: number | null; deltaSuffix?: string;
  sparkData?: number[]; sparkColor?: string;
}) {
  return (
    <Link
      to={to as any}
      search={search as any}
      className="admin-kpi-card admin-surface group relative overflow-hidden flex flex-col p-5 rounded-xl transition-transform hover:-translate-y-0.5"
      style={{
        background: "var(--at-kpi-bg)",
        border: highlight ? "1px solid rgba(239,68,68,0.30)" : "var(--at-kpi-border)",
        boxShadow: "var(--at-kpi-shadow)",
        cursor: "pointer",
      }}
    >
      <div className="flex items-start justify-between mb-3.5">
        <div
          className="p-2 flex items-center justify-center rounded-lg"
          style={{
            background: "var(--at-kpi-icon-bg)",
            boxShadow: "0 2px 8px color-mix(in srgb, var(--at-kpi-icon), transparent 80%)",
          }}
        >
          <Icon style={{ color: "var(--at-kpi-icon)", width: 16, height: 16 }} />
        </div>
        {delta !== undefined && delta !== null && (
          <span
            className={`text-[0.60rem] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
              delta >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            }`}
          >
            {delta >= 0 ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <p className="text-[0.55rem] uppercase tracking-[0.22em] font-semibold mb-1.5" style={{ color: "var(--at-kpi-label)" }}>{label}</p>
      <div className="flex items-end justify-between gap-2 mt-auto">
        <div className="min-w-0">
          <p className="text-[1.65rem] font-bold leading-none tracking-tight truncate" style={{ color: "var(--at-kpi-value)" }}>
            {value}
          </p>
          {sub && <p className="text-[0.62rem] mt-1.5 truncate" style={{ color: "var(--at-text-muted)" }}>{sub}{deltaSuffix}</p>}
        </div>
        {sparkData && sparkData.length > 1 && <Sparkline data={sparkData} color={sparkColor ?? "#fbbf24"} />}
      </div>
    </Link>
  );
}

// ─── 7-day Revenue Chart ──────────────────────────────────────────────────────

function RevenueChart({ orders }: { orders: any[] }) {
  const { theme } = useAdminTheme();
  const accent = theme.accentColor;
  const [range, setRange] = useState<7 | 30>(7);

  const days = useMemo(() => {
    const result: { label: string; revenue: number; date: string }[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const label = range === 7
        ? d.toLocaleDateString("en-US", { weekday: "short" })
        : d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
      const dateStr = d.toISOString().slice(0, 10);
      result.push({ label, revenue: 0, date: dateStr });
    }
    for (const o of orders) {
      const day = new Date(o.created_at).toISOString().slice(0, 10);
      const slot = result.find(r => r.date === day);
      if (slot) slot.revenue += Number(o.total ?? 0);
    }
    return result;
  }, [orders, range]);

  const maxRev = Math.max(...days.map(d => d.revenue), 1);
  const totalRev = days.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="admin-surface p-5 rounded-xl">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[0.55rem] uppercase tracking-[0.22em] font-semibold" style={{ color: "var(--at-text-muted)" }}>
          Revenue — Last {range} Days
        </p>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid var(--at-card-border)" }}>
            {([7, 30] as const).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className="px-2.5 py-1 text-[0.56rem] font-semibold uppercase tracking-[0.08em] transition-colors"
                style={{
                  background: range === r ? accent : "transparent",
                  color: range === r ? "#0a0a0a" : "var(--at-text-muted)",
                }}
              >
                {r}D
              </button>
            ))}
          </div>
          <span
            className="text-[0.58rem] px-2.5 py-1 font-semibold rounded-lg whitespace-nowrap"
            style={{ background: "var(--at-chart-peak-bg)", color: "var(--at-chart-peak-text)", border: "1px solid var(--at-chart-peak-border)" }}
          >
            {formatUSD(maxRev)} peak
          </span>
        </div>
      </div>
      <p className="text-[0.66rem] mb-3" style={{ color: "var(--at-text-muted)" }}>
        {formatUSD(totalRev)} total this period
      </p>
      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={days} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accent} stopOpacity={0.40} />
                <stop offset="95%" stopColor={accent} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--at-card-divider)" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              interval={range === 30 ? 3 : 0}
              tick={{ fontSize: 10, fill: "var(--at-text-muted)" }}
            />
            <YAxis hide />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={accent}
              strokeWidth={2.5}
              fill="url(#revFill)"
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Order Pipeline (list + donut) ────────────────────────────────────────────

function OrderPipeline({ stats }: { stats: any }) {
  const navigate = useNavigate();

  const pipeline = [
    { key: "pending",    label: "Pending",    count: stats.pendingOrders ?? 0,    dot: "bg-amber-400" },
    { key: "processing", label: "Processing", count: stats.processingOrders ?? 0, dot: "bg-blue-400" },
    { key: "shipped",    label: "Shipped",    count: stats.shippedOrders ?? 0,    dot: "bg-violet-400" },
    { key: "delivered",  label: "Delivered",  count: stats.deliveredOrders ?? 0,  dot: "bg-emerald-400" },
  ];

  const total = pipeline.reduce((s, p) => s + p.count, 0);
  const donutData = pipeline.filter(p => p.count > 0).map(p => ({ name: p.label, value: p.count, key: p.key }));

  return (
    <div className="admin-surface p-5 rounded-xl h-full flex flex-col">
      <p className="text-[0.55rem] uppercase tracking-[0.22em] font-bold mb-4" style={{ color: "var(--at-text-muted)" }}>Order Pipeline</p>

      {total > 0 && (
        <div className="relative w-full h-[120px] mb-3 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                dataKey="value"
                nameKey="name"
                innerRadius={38}
                outerRadius={56}
                paddingAngle={3}
                stroke="none"
                animationDuration={600}
              >
                {donutData.map((d, i) => (
                  <Cell key={i} fill={STATUS_HEX[d.key]} className="cursor-pointer" onClick={() => navigate({ to: "/admin/orders", search: { status: d.key } as any })} />
                ))}
              </Pie>
              <Tooltip content={({ active, payload }: any) => active && payload?.length ? (
                <div className="px-2.5 py-1.5 rounded-lg text-[0.62rem]" style={{ background: "var(--at-chart-tip-bg)", color: "var(--at-chart-tip-text)" }}>
                  {payload[0].name}: {payload[0].value}
                </div>
              ) : null} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold" style={{ color: "var(--at-text-heading)" }}>{total}</span>
            <span className="text-[0.48rem] uppercase tracking-[0.16em]" style={{ color: "var(--at-text-muted)" }}>Active</span>
          </div>
        </div>
      )}

      <div className="space-y-1.5 flex-1">
        {pipeline.map((stage) => (
          <button
            key={stage.key}
            onClick={() => navigate({ to: "/admin/orders", search: { status: stage.key } as any })}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left hover:opacity-90 ${STATUS_COLORS[stage.key]}`}
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stage.dot}`} />
            <span className="text-[0.63rem] uppercase tracking-[0.10em] font-semibold flex-1">{stage.label}</span>
            <span className="text-sm font-bold tabular-nums">{stage.count}</span>
          </button>
        ))}
      </div>
      {(stats.cancelledOrders ?? 0) > 0 && (
        <button
          onClick={() => navigate({ to: "/admin/orders", search: { status: "cancelled" } as any })}
          className="mt-2 w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg hover:opacity-80 transition-opacity"
          style={{ background: "#fef2f2", border: "1px solid rgba(220,38,38,0.15)", color: "#dc2626" }}
        >
          <span className="text-[0.62rem] uppercase tracking-[0.10em] font-semibold">Cancelled</span>
          <span className="text-sm font-bold">{stats.cancelledOrders}</span>
        </button>
      )}
    </div>
  );
}

// ─── Top Products mini-panel ──────────────────────────────────────────────────

function TopProductsPanel({ orders }: { orders: any[] }) {
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; slug?: string; revenue: number; units: number }>();
    for (const o of orders) {
      const items = Array.isArray(o.items) ? o.items : [];
      for (const item of items) {
        const baseName = (item.name ?? "Unknown").split("—")[0].trim().split("·")[0].trim();
        if (!map.has(baseName)) map.set(baseName, { name: baseName, slug: item.slug, revenue: 0, units: 0 });
        const entry = map.get(baseName)!;
        entry.revenue += Number(item.unitPrice ?? 0) * (item.quantity ?? 1);
        entry.units += item.quantity ?? 1;
      }
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);

  const maxRev = Math.max(...topProducts.map(p => p.revenue), 1);

  return (
    <div className="admin-surface p-5 rounded-xl h-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[0.55rem] uppercase tracking-[0.22em] font-bold" style={{ color: "var(--at-text-muted)" }}>Top Products</p>
        <Link to="/admin/analytics" className="text-[0.55rem] uppercase tracking-[0.12em] flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ color: "var(--at-text-muted)" }}>
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {topProducts.length === 0 ? (
        <p className="text-xs py-4" style={{ color: "var(--at-text-muted)" }}>No order data yet.</p>
      ) : (
        <div className="space-y-3">
          {topProducts.map((p, i) => (
            <Link
              key={i}
              to={p.slug ? "/admin/products/$slug" : "/admin/products"}
              params={p.slug ? { slug: p.slug } : undefined}
              className="block space-y-1 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium truncate max-w-[65%]" style={{ color: "var(--at-text-body)" }}>{p.name}</span>
                <span className="text-xs font-semibold shrink-0 ml-2" style={{ color: "var(--at-text-heading)" }}>{formatUSD(p.revenue)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--at-chart-empty)" }}>
                  <div className="h-full rounded-full" style={{ width: `${(p.revenue / maxRev) * 100}%`, background: "var(--at-chart-bar)" }} />
                </div>
                <span className="text-[0.58rem] whitespace-nowrap" style={{ color: "var(--at-text-muted)" }}>{p.units} sold</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Top Customers mini-panel ─────────────────────────────────────────────────

function TopCustomersPanel({ orders }: { orders: any[] }) {
  const topCustomers = useMemo(() => {
    const map = new Map<string, { name: string; email: string; revenue: number; orders: number }>();
    for (const o of orders) {
      const email = (o.customer_email ?? "").toLowerCase();
      if (!email) continue;
      if (!map.has(email)) map.set(email, { name: o.customer_name ?? email, email, revenue: 0, orders: 0 });
      const c = map.get(email)!;
      c.revenue += Number(o.total ?? 0);
      c.orders++;
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);

  return (
    <div className="admin-surface p-5 rounded-xl h-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[0.55rem] uppercase tracking-[0.22em] font-bold" style={{ color: "var(--at-text-muted)" }}>Top Customers</p>
        <Link to="/admin/customers" className="text-[0.55rem] uppercase tracking-[0.12em] flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ color: "var(--at-text-muted)" }}>
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {topCustomers.length === 0 ? (
        <p className="text-xs py-4" style={{ color: "var(--at-text-muted)" }}>No customer data yet.</p>
      ) : (
        <div className="space-y-3">
          {topCustomers.map((c, i) => {
            const initials = c.name.split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join("");
            return (
              <Link
                key={i}
                to="/admin/customers/$customerId"
                params={{ customerId: btoa(c.email) }}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="relative shrink-0">
                  <CustomerAvatar name={c.name} />
                  {i === 0 && <Crown className="h-3 w-3 absolute -top-1.5 -right-1.5" style={{ color: "var(--at-kpi-icon)" }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "var(--at-text-body)" }}>{c.name}</p>
                  <p className="text-[0.60rem]" style={{ color: "var(--at-text-muted)" }}>{c.orders} order{c.orders !== 1 ? "s" : ""}</p>
                </div>
                <span className="text-xs font-semibold shrink-0" style={{ color: "var(--at-text-heading)" }}>{formatUSD(c.revenue)}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function AdminDashboard() {
  const token = useAdminToken();
  const navigate = useNavigate();
  const fetchStats = useServerFn(getDashboardStats);
  const fetchOrders = useServerFn(listAdminOrders);

  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["admin-stats", token],
    queryFn: () => fetchStats({ data: { token } }),
    refetchInterval: 60_000,
  });

  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ["admin-orders-recent", token],
    queryFn: () => fetchOrders({ data: { token } }),
    refetchInterval: 30_000,
  });

  const fetchExtended = useServerFn(getDashboardExtended);
  const { data: extData } = useQuery({
    queryKey: ["admin-dashboard-extended", token],
    queryFn: () => fetchExtended({ data: { token } }),
    refetchInterval: 60_000,
  });

  const fetchInventory = useServerFn(getInventoryAlerts);
  const { data: invData } = useQuery({
    queryKey: ["admin-inventory-alerts", token],
    queryFn: () => fetchInventory({ data: { token, threshold: 5 } }),
    staleTime: 5 * 60 * 1000,
  });

  const stats = statsData ?? {
    totalRevenue: 0, totalOrders: 0,
    todayOrderCount: 0, todayRevenue: 0,
    pendingOrders: 0, processingOrders: 0,
    shippedOrders: 0, deliveredOrders: 0, cancelledOrders: 0,
  };

  const allOrders: any[] = ordersData?.orders ?? [];
  const recentOrders = allOrders.slice(0, 8);
  const needsAction = (stats.pendingOrders ?? 0) + (stats.processingOrders ?? 0);

  // Week-over-week comparison + last-7-day daily series (drives KPI sparklines)
  const { thisWeekRev, lastWeekRev, thisWeekOrders, lastWeekOrders, last7 } = useMemo(() => {
    const now = new Date();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfThisWeek);

    let thisWeekRev = 0, lastWeekRev = 0, thisWeekOrders = 0, lastWeekOrders = 0;
    for (const o of allOrders) {
      const d = new Date(o.created_at);
      if (d >= startOfThisWeek) { thisWeekRev += Number(o.total ?? 0); thisWeekOrders++; }
      else if (d >= startOfLastWeek && d < endOfLastWeek) { lastWeekRev += Number(o.total ?? 0); lastWeekOrders++; }
    }

    const days: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push({ date: d.toISOString().slice(0, 10), revenue: 0, orders: 0 });
    }
    for (const o of allOrders) {
      const day = new Date(o.created_at).toISOString().slice(0, 10);
      const slot = days.find(d => d.date === day);
      if (slot) { slot.revenue += Number(o.total ?? 0); slot.orders += 1; }
    }

    return { thisWeekRev, lastWeekRev, thisWeekOrders, lastWeekOrders, last7: days };
  }, [allOrders]);

  const weekRevDelta = lastWeekRev > 0 ? Math.round(((thisWeekRev - lastWeekRev) / lastWeekRev) * 100) : null;
  const weekOrdersDelta = lastWeekOrders > 0 ? Math.round(((thisWeekOrders - lastWeekOrders) / lastWeekOrders) * 100) : null;
  const thisWeekAOV = thisWeekOrders > 0 ? thisWeekRev / thisWeekOrders : 0;
  const lastWeekAOV = lastWeekOrders > 0 ? lastWeekRev / lastWeekOrders : 0;
  const aovDelta = lastWeekAOV > 0 ? Math.round(((thisWeekAOV - lastWeekAOV) / lastWeekAOV) * 100) : null;
  const overallAOV = stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;

  const revenueSpark = last7.map(d => d.revenue);
  const ordersSpark = last7.map(d => d.orders);
  const aovSpark = last7.map(d => (d.orders > 0 ? d.revenue / d.orders : 0));

  const lowStock = invData?.lowStock ?? [];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-lg font-semibold tracking-tight" style={{ color: "var(--at-text-heading)" }}>{greeting}</h1>
            <span
              className="text-[0.44rem] uppercase tracking-[0.22em] px-2 py-0.5 font-semibold flex items-center gap-1 rounded-sm"
              style={{ background: "var(--at-live-bg)", color: "var(--at-live-text)", border: "1px solid var(--at-live-border)" }}
            >
              <span className="admin-status-dot w-1.5 h-1.5 rounded-full inline-block" style={{ background: "var(--at-live-text)" }} />
              Live
            </span>
          </div>
          <p className="text-[0.68rem]" style={{ color: "var(--at-text-muted)" }}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
            {" · "}Here's how the store is performing
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/analytics"
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: "var(--at-card-bg)", border: "1px solid var(--at-card-border)" }}
          >
            <TrendingUp className="h-3.5 w-3.5" style={{ color: "#10b981" }} />
            <span className="text-[0.62rem]" style={{ color: "var(--at-text-muted)" }}>
              Today: <strong style={{ color: "var(--at-text-heading)" }}>{formatUSD(stats.todayRevenue)}</strong>
              {" · "}{stats.todayOrderCount} order{stats.todayOrderCount !== 1 ? "s" : ""}
            </span>
          </Link>
          <button
            onClick={() => { refetchStats(); refetchOrders(); }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-[0.60rem] uppercase tracking-[0.14em] transition-all rounded-lg"
            style={{ background: "var(--at-btn-bg)", border: "1px solid var(--at-btn-border)", color: "var(--at-btn-text)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards — consolidated metrics with trend deltas + sparklines */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statsLoading || ordersLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl" style={{ background: "var(--at-card-bg)", border: "1px solid var(--at-card-border)" }} />
          ))
        ) : (
          <>
            <KpiCard
              icon={DollarSign}
              label="Total Revenue"
              value={formatUSD(stats.totalRevenue)}
              sub={`${formatUSD(thisWeekRev)} this week`}
              to="/admin/analytics"
              delta={weekRevDelta}
              sparkData={revenueSpark}
              sparkColor="#10b981"
            />
            <KpiCard
              icon={ShoppingBag}
              label="Total Orders"
              value={String(stats.totalOrders)}
              sub={`${thisWeekOrders} this week`}
              to="/admin/orders"
              delta={weekOrdersDelta}
              sparkData={ordersSpark}
              sparkColor="#3b82f6"
            />
            <KpiCard
              icon={Receipt}
              label="Avg Order Value"
              value={formatUSD(overallAOV)}
              sub={`${formatUSD(thisWeekAOV)} this week`}
              to="/admin/analytics"
              delta={aovDelta}
              sparkData={aovSpark}
              sparkColor="#8b5cf6"
            />
            <KpiCard
              icon={AlertCircle}
              label="Needs Action"
              value={String(needsAction)}
              sub={`${stats.pendingOrders ?? 0} pending · ${stats.processingOrders ?? 0} processing`}
              to="/admin/orders"
              search={{ status: "pending" }}
              highlight={needsAction > 0}
            />
          </>
        )}
      </div>

      {/* Attention Needed — only renders when there's something to act on */}
      {(lowStock.length > 0 || (extData?.pendingReturns ?? 0) > 0) && (
        <div className="p-4 mb-5 rounded-xl space-y-4" style={{ background: "var(--at-alert-bg)", border: "1px solid var(--at-alert-border)", boxShadow: "0 1px 4px rgba(251,191,36,0.08)" }}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "var(--at-alert-icon)" }} />
            <p className="text-[0.65rem] uppercase tracking-[0.12em] font-medium" style={{ color: "var(--at-alert-text)" }}>
              Attention Needed
            </p>
          </div>

          {lowStock.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[0.58rem] uppercase tracking-[0.10em]" style={{ color: "var(--at-text-muted)" }}>
                  Low Stock — {lowStock.length} product{lowStock.length !== 1 ? "s" : ""}
                </p>
                <Link
                  to="/admin/products"
                  className="text-[0.58rem] uppercase tracking-[0.12em] hover:opacity-70 transition-opacity flex items-center gap-1"
                  style={{ color: "var(--at-alert-icon)" }}
                >
                  Manage <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {lowStock.map((p: any) => (
                  <Link
                    key={p.slug}
                    to="/admin/products/$slug"
                    params={{ slug: p.slug }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 transition-colors rounded-lg"
                    style={{ background: "var(--at-card-bg)", border: "1px solid var(--at-alert-border)" }}
                  >
                    <Package className="h-3 w-3 shrink-0" style={{ color: "var(--at-alert-icon)" }} />
                    <span className="text-[0.62rem] truncate max-w-[120px]" style={{ color: "var(--at-text-body)" }}>{p.name}</span>
                    <span className={`text-[0.58rem] font-semibold ${Number(p.stock_quantity) === 0 ? "text-red-500" : ""}`} style={Number(p.stock_quantity) === 0 ? undefined : { color: "var(--at-alert-icon)" }}>
                      {Number(p.stock_quantity) === 0 ? "OUT" : `${p.stock_quantity} left`}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(extData?.pendingReturns ?? 0) > 0 && (
            <Link
              to="/admin/returns"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors hover:opacity-90"
              style={{ background: "var(--at-card-bg)", border: "1px solid var(--at-alert-border)" }}
            >
              <span className="flex items-center gap-2 text-[0.62rem]" style={{ color: "var(--at-text-body)" }}>
                <RotateCcw className="h-3.5 w-3.5" style={{ color: "var(--at-alert-icon)" }} />
                {extData!.pendingReturns} return{extData!.pendingReturns !== 1 ? "s" : ""} awaiting review
              </span>
              <ArrowRight className="h-3 w-3" style={{ color: "var(--at-alert-icon)" }} />
            </Link>
          )}
        </div>
      )}

      {/* Chart + Pipeline row */}
      {!statsLoading && (
        <div className="grid lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2">
            <RevenueChart orders={allOrders} />
          </div>
          <div>
            <OrderPipeline stats={stats} />
          </div>
        </div>
      )}

      {/* Top Products + Top Customers */}
      {!ordersLoading && (
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          <TopProductsPanel orders={allOrders} />
          <TopCustomersPanel orders={allOrders} />
        </div>
      )}

      {/* Recent Orders */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--at-card-bg)", border: "1px solid var(--at-card-border)", boxShadow: "var(--at-card-shadow)" }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--at-card-divider)" }}>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--at-text-body)" }}>Recent Orders</p>
          <Link
            to="/admin/orders"
            className="flex items-center gap-1 text-[0.58rem] uppercase tracking-[0.14em] hover:opacity-70 transition-opacity"
            style={{ color: "var(--at-text-muted)" }}
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {ordersLoading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-4 animate-pulse flex items-center gap-4">
                <div className="w-7 h-7 rounded-full bg-gray-100" />
                <div className="h-3.5 w-24 bg-gray-100 rounded" />
                <div className="h-3.5 w-36 bg-gray-100 rounded flex-1" />
                <div className="h-3.5 w-16 bg-gray-100 rounded" />
                <div className="h-5 w-20 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm" style={{ color: "var(--at-text-muted)" }}>No orders yet</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm admin-table">
                <thead>
                  <tr>
                    {["", "Order #", "Date", "Customer", "Items", "Total", "Status", ""].map((h, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-left text-[0.55rem] uppercase tracking-[0.14em] font-medium"
                        style={{ color: "var(--at-table-head)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o: any) => {
                    const itemCount = Array.isArray(o.items)
                      ? o.items.reduce((s: number, item: any) => s + (item.quantity ?? 1), 0)
                      : 0;
                    return (
                      <tr
                        key={o.id}
                        onClick={() => navigate({ to: "/admin/orders/$orderId", params: { orderId: String(o.id) } })}
                        className="group"
                      >
                        <td className="pl-4 pr-2 py-3.5">
                          <CustomerAvatar name={o.customer_name ?? ""} />
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs whitespace-nowrap" style={{ color: "var(--at-text-body)" }}>{o.order_number}</td>
                        <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: "var(--at-text-muted)" }}>
                          {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-xs font-medium whitespace-nowrap" style={{ color: "var(--at-text-body)" }}>{o.customer_name}</div>
                          <div className="text-[0.62rem]" style={{ color: "var(--at-text-muted)" }}>{o.customer_email}</div>
                        </td>
                        <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: "var(--at-text-muted)" }}>
                          {itemCount} item{itemCount !== 1 ? "s" : ""}
                        </td>
                        <td className="px-4 py-3.5 text-xs font-semibold whitespace-nowrap" style={{ color: "var(--at-text-heading)" }}>
                          {formatUSD(Number(o.total))}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="px-4 py-3.5 text-right pr-5">
                          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform inline-block" style={{ color: "var(--at-text-muted)" }} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="lg:hidden divide-y" style={{ borderColor: "var(--at-card-divider)" }}>
              {recentOrders.map((o: any) => {
                const itemCount = Array.isArray(o.items)
                  ? o.items.reduce((s: number, item: any) => s + (item.quantity ?? 1), 0)
                  : 0;
                return (
                  <button
                    key={o.id}
                    onClick={() => navigate({ to: "/admin/orders/$orderId", params: { orderId: String(o.id) } })}
                    className="w-full flex items-center gap-3 px-4 py-3.5 active:opacity-70 transition-opacity text-left"
                  >
                    <CustomerAvatar name={o.customer_name ?? ""} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[0.68rem] font-semibold" style={{ color: "var(--at-text-body)" }}>{o.order_number}</span>
                        <StatusBadge status={o.status} />
                      </div>
                      <p className="text-[0.70rem] truncate" style={{ color: "var(--at-text-muted)" }}>{o.customer_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold" style={{ color: "var(--at-text-heading)" }}>{formatUSD(Number(o.total))}</p>
                      <p className="text-[0.60rem]" style={{ color: "var(--at-text-muted)" }}>{itemCount} item{itemCount !== 1 ? "s" : ""}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 ml-1" style={{ color: "var(--at-text-muted)" }} />
                  </button>
                );
              })}
            </div>
          </>
        )}

        {!ordersLoading && recentOrders.length > 0 && (
          <div className="px-6 py-3" style={{ borderTop: "1px solid var(--at-card-divider)" }}>
            <Link
              to="/admin/orders"
              className="text-[0.60rem] uppercase tracking-[0.14em] hover:opacity-70 transition-opacity"
              style={{ color: "var(--at-text-muted)" }}
            >
              View all {allOrders.length} orders →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
