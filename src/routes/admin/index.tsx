import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  TrendingUp, ShoppingBag, DollarSign, AlertCircle,
  RefreshCw, ArrowRight, ChevronRight, BarChart2, Users, RotateCcw, Tag,
  AlertTriangle, Package,
} from "lucide-react";
import { getDashboardStats, listAdminOrders } from "@/lib/admin.functions";
import { getDashboardExtended, getInventoryAlerts } from "@/lib/admin-extended.functions";
import { useAdminToken } from "@/lib/admin-context";
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
    <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
      <span className="text-[0.60rem] font-semibold text-gray-500">{initials || "?"}</span>
    </div>
  );
}

function KpiCard({
  label, value, sub, icon: Icon, accent, highlight,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; accent?: boolean; highlight?: boolean;
}) {
  return (
    <div
      className="admin-kpi-card admin-surface relative overflow-hidden flex items-start justify-between p-5 rounded-xl"
      style={{
        background: "var(--at-kpi-bg)",
        border: "var(--at-kpi-border)",
        boxShadow: "var(--at-kpi-shadow)",
        borderTop: "3px solid transparent",
      }}
    >
      <div className="min-w-0">
        <p className="text-[0.55rem] uppercase tracking-[0.22em] font-semibold mb-2" style={{ color: "var(--at-kpi-label)" }}>{label}</p>
        <p className="text-[1.90rem] font-bold leading-none tracking-tight" style={{ color: "var(--at-kpi-value)" }}>
          {value}
        </p>
        {sub && <p className="text-[0.66rem] mt-2" style={{ color: "var(--at-text-muted)" }}>{sub}</p>}
      </div>
      <div
        className="p-2.5 shrink-0 ml-3 flex items-center justify-center rounded-lg"
        style={{
          background: "var(--at-kpi-icon-bg)",
          boxShadow: "0 2px 8px color-mix(in srgb, var(--at-kpi-icon), transparent 80%)",
        }}
      >
        <Icon
          style={{ color: "var(--at-kpi-icon)", width: 18, height: 18 }}
        />
      </div>
    </div>
  );
}

// ─── 7-day Revenue Chart ──────────────────────────────────────────────────────

function RevenueChart({ orders }: { orders: any[] }) {
  const days = useMemo(() => {
    const result: { label: string; revenue: number; date: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      const dateStr = d.toISOString().slice(0, 10);
      result.push({ label, revenue: 0, date: dateStr });
    }
    for (const o of orders) {
      const day = new Date(o.created_at).toISOString().slice(0, 10);
      const slot = result.find(r => r.date === day);
      if (slot) slot.revenue += Number(o.total ?? 0);
    }
    return result;
  }, [orders]);

  const maxRev = Math.max(...days.map(d => d.revenue), 1);

  return (
    <div
      className="admin-surface p-5 rounded-xl"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[0.55rem] uppercase tracking-[0.22em] font-semibold" style={{ color: "var(--at-text-muted)" }}>Revenue — Last 7 Days</p>
        </div>
        <span
          className="text-[0.58rem] px-2.5 py-1 font-semibold rounded-lg"
          style={{ background: "var(--at-chart-peak-bg)", color: "var(--at-chart-peak-text)", border: "1px solid var(--at-chart-peak-border)" }}
        >
          {formatUSD(maxRev)} peak
        </span>
      </div>
      <div className="flex items-end gap-2 h-28">
        {days.map((d, i) => {
          const pct = d.revenue > 0 ? Math.max((d.revenue / maxRev) * 100, 6) : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex items-end h-20 relative group">
                {d.revenue > 0 && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[0.55rem] px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" style={{ background: "var(--at-chart-tip-bg)", color: "var(--at-chart-tip-text)" }}>
                    {formatUSD(d.revenue)}
                  </div>
                )}
                <div
                  className="admin-chart-bar-filled w-full rounded-t-[2px] transition-all"
                  style={{
                    height: d.revenue > 0 ? `${pct}%` : "6px",
                    background: d.revenue > 0 ? "var(--at-chart-bar)" : "var(--at-chart-empty)",
                  }}
                />
              </div>
              <span className="text-[0.55rem] uppercase tracking-[0.08em]" style={{ color: "var(--at-text-muted)" }}>{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Order Pipeline ───────────────────────────────────────────────────────────

function OrderPipeline({ stats }: { stats: any }) {
  const navigate = useNavigate();

  const pipeline = [
    { key: "pending",    label: "Pending",    count: stats.pendingOrders ?? 0,    dot: "bg-amber-400" },
    { key: "processing", label: "Processing", count: stats.processingOrders ?? 0, dot: "bg-blue-400" },
    { key: "shipped",    label: "Shipped",    count: stats.shippedOrders ?? 0,    dot: "bg-violet-400" },
    { key: "delivered",  label: "Delivered",  count: stats.deliveredOrders ?? 0,  dot: "bg-emerald-400" },
  ];

  return (
    <div
      className="admin-surface p-5 rounded-xl"
    >
      <p className="text-[0.55rem] uppercase tracking-[0.22em] font-bold mb-4" style={{ color: "var(--at-text-muted)" }}>Order Pipeline</p>
      <div className="space-y-1.5">
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

// ─── Dashboard ────────────────────────────────────────────────────────────────

function AdminDashboard() {
  const token = useAdminToken();
  const navigate = useNavigate();
  const fetchStats = useServerFn(getDashboardStats);
  const fetchOrders = useServerFn(listAdminOrders);

  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["admin-stats", token],
    queryFn: () => fetchStats({ data: { token } }),
    enabled: !!token,
    refetchInterval: 60_000,
  });

  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ["admin-orders-recent", token],
    queryFn: () => fetchOrders({ data: { token } }),
    enabled: !!token,
    refetchInterval: 30_000,
  });

  const fetchExtended = useServerFn(getDashboardExtended);
  const { data: extData } = useQuery({
    queryKey: ["admin-dashboard-extended", token],
    queryFn: () => fetchExtended({ data: { token } }),
    enabled: !!token,
    refetchInterval: 60_000,
  });

  const fetchInventory = useServerFn(getInventoryAlerts);
  const { data: invData } = useQuery({
    queryKey: ["admin-inventory-alerts", token],
    queryFn: () => fetchInventory({ data: { token, threshold: 5 } }),
    enabled: !!token,
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

  // Week-over-week comparison
  const { thisWeekRev, lastWeekRev, thisWeekOrders, lastWeekOrders } = useMemo(() => {
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
    return { thisWeekRev, lastWeekRev, thisWeekOrders, lastWeekOrders };
  }, [allOrders]);

  const weekRevDelta = lastWeekRev > 0 ? Math.round(((thisWeekRev - lastWeekRev) / lastWeekRev) * 100) : null;
  const lowStock = invData?.lowStock ?? [];

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Dashboard</h1>
            <span
              className="text-[0.44rem] uppercase tracking-[0.22em] px-2 py-0.5 font-semibold flex items-center gap-1"
              style={{ background: "rgba(16,185,129,0.1)", color: "#059669", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "2px" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              Live
            </span>
          </div>
          <p className="text-[0.68rem] text-gray-400">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={() => { refetchStats(); refetchOrders(); }}
          className="flex items-center gap-1.5 px-3.5 py-2 text-[0.60rem] uppercase tracking-[0.14em] text-gray-500 transition-all rounded-lg"
          style={{ background: "white", border: "1px solid rgba(0,0,0,0.09)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      {/* Quick-link tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            icon: BarChart2, label: "Analytics",  to: "/admin/analytics",
            sub: "Revenue & trends",
            accent: false,
          },
          {
            icon: Users,     label: "Customers",  to: "/admin/customers",
            sub: `${allOrders.length ? new Set(allOrders.map((o: any) => o.customer_email?.toLowerCase()).filter(Boolean)).size : "—"} total`,
            accent: false,
          },
          {
            icon: RotateCcw, label: "Returns",    to: "/admin/returns",
            sub: extData?.pendingReturns ? `${extData.pendingReturns} pending` : "Manage requests",
            accent: !!(extData?.pendingReturns && extData.pendingReturns > 0),
          },
          {
            icon: Tag,       label: "Promotions", to: "/admin/promotions",
            sub: extData?.activePromos ? `${extData.activePromos} active codes` : "Manage codes",
            accent: false,
          },
        ].map(({ icon: Icon, label, to, sub, accent }) => (
          <Link
            key={to}
            to={to as any}
            className="p-4 flex items-start gap-3 transition-all group rounded-xl"
            style={{
              background: "white",
              border: accent ? "1px solid rgba(251,191,36,0.24)" : "1px solid rgba(0,0,0,0.07)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
              borderLeft: accent ? "3px solid #fbbf24" : "3px solid transparent",
            }}
          >
            <div
              className="p-1.5 shrink-0"
              style={{
                background: accent ? "rgba(251,191,36,0.10)" : "rgba(0,0,0,0.04)",
                borderRadius: "5px",
              }}
            >
              <Icon className={`h-4 w-4 ${accent ? "text-amber-500" : "text-gray-400"}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[0.65rem] uppercase tracking-[0.12em] font-medium text-gray-800">{label}</p>
              <p className={`text-[0.58rem] mt-0.5 ${accent ? "text-amber-600" : "text-gray-400"}`}>{sub}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-gray-200 group-hover:text-gray-500 transition-colors ml-auto shrink-0 mt-0.5" />
          </Link>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statsLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }} />
          ))
        ) : (
          <>
            <KpiCard
              icon={DollarSign}
              label="Total Revenue"
              value={formatUSD(stats.totalRevenue)}
              sub="All time"
              accent
            />
            <KpiCard
              icon={ShoppingBag}
              label="Total Orders"
              value={String(stats.totalOrders)}
              sub="All time"
            />
            <KpiCard
              icon={AlertCircle}
              label="Needs Action"
              value={String(needsAction)}
              sub="Pending + processing"
              highlight={needsAction > 0}
            />
            <KpiCard
              icon={TrendingUp}
              label="Today"
              value={formatUSD(stats.todayRevenue)}
              sub={`${stats.todayOrderCount} order${stats.todayOrderCount !== 1 ? "s" : ""}`}
            />
          </>
        )}
      </div>

      {/* Week-over-week strip */}
      {!statsLoading && !ordersLoading && (
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div>
              <p className="text-[0.54rem] uppercase tracking-[0.16em] text-gray-400 mb-0.5 font-semibold">This Week</p>
              <p className="text-sm font-semibold text-gray-900">{formatUSD(thisWeekRev)}</p>
            </div>
            {weekRevDelta !== null && (
              <span className={`text-[0.60rem] font-semibold px-2 py-0.5 rounded-lg ${
                weekRevDelta >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              }`}>
                {weekRevDelta >= 0 ? "+" : ""}{weekRevDelta}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div>
              <p className="text-[0.54rem] uppercase tracking-[0.16em] text-gray-400 mb-0.5 font-semibold">Orders This Week</p>
              <p className="text-sm font-semibold text-gray-900">{thisWeekOrders}</p>
            </div>
            {lastWeekOrders > 0 && (
              <span className={`text-[0.60rem] font-semibold px-2 py-0.5 rounded-lg ${
                thisWeekOrders >= lastWeekOrders ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              }`}>
                {thisWeekOrders >= lastWeekOrders ? "+" : ""}{thisWeekOrders - lastWeekOrders} vs last wk
              </span>
            )}
          </div>
        </div>
      )}

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="p-4 mb-5 rounded-xl" style={{ background: "#fffbeb", border: "1px solid rgba(251,191,36,0.28)", boxShadow: "0 1px 4px rgba(251,191,36,0.08)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-[0.65rem] uppercase tracking-[0.12em] font-medium text-amber-700">
                Low Stock — {lowStock.length} product{lowStock.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Link
              to="/admin/products"
              className="text-[0.60rem] uppercase tracking-[0.12em] text-amber-600 hover:text-amber-800 transition-colors flex items-center gap-1"
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
                className="inline-flex items-center gap-2 bg-white border border-amber-200 px-3 py-1.5 hover:border-amber-400 transition-colors rounded-lg"
              >
                <Package className="h-3 w-3 text-amber-500 shrink-0" />
                <span className="text-[0.62rem] text-gray-700 truncate max-w-[120px]">{p.name}</span>
                <span className={`text-[0.58rem] font-semibold ${Number(p.stock_quantity) === 0 ? "text-red-500" : "text-amber-600"}`}>
                  {Number(p.stock_quantity) === 0 ? "OUT" : `${p.stock_quantity} left`}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Chart + Pipeline row */}
      {!statsLoading && (
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <RevenueChart orders={allOrders} />
          </div>
          <div>
            <OrderPipeline stats={stats} />
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="text-[0.62rem] font-bold text-gray-700 uppercase tracking-[0.18em]">Recent Orders</p>
          <Link
            to="/admin/orders"
            className="flex items-center gap-1 text-[0.58rem] uppercase tracking-[0.14em] text-gray-400 hover:text-gray-700 transition-colors"
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
          <div className="px-6 py-14 text-center text-sm text-gray-400">No orders yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {["", "Order #", "Date", "Customer", "Items", "Total", "Status", ""].map((h, i) => (
                    <th
                      key={i}
                      className="px-4 py-3 text-left text-[0.55rem] uppercase tracking-[0.14em] text-gray-400 font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((o: any) => {
                  const itemCount = Array.isArray(o.items)
                    ? o.items.reduce((s: number, item: any) => s + (item.quantity ?? 1), 0)
                    : 0;
                  return (
                    <tr
                      key={o.id}
                      onClick={() => navigate({ to: "/admin/orders/$orderId", params: { orderId: String(o.id) } })}
                      className="hover:bg-gray-50/60 cursor-pointer transition-colors group"
                    >
                      <td className="pl-4 pr-2 py-3.5">
                        <CustomerAvatar name={o.customer_name ?? ""} />
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-gray-700 whitespace-nowrap">{o.order_number}</td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(o.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-xs font-medium text-gray-800 whitespace-nowrap">{o.customer_name}</div>
                        <div className="text-[0.62rem] text-gray-400">{o.customer_email}</div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                        {itemCount} item{itemCount !== 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-gray-800 whitespace-nowrap">
                        {formatUSD(Number(o.total))}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right pr-5">
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-600 transition-colors inline-block" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!ordersLoading && recentOrders.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-50">
            <Link
              to="/admin/orders"
              className="text-[0.60rem] uppercase tracking-[0.14em] text-gray-400 hover:text-gray-700 transition-colors"
            >
              View all {allOrders.length} orders →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
