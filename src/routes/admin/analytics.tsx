import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { TrendingUp, ShoppingBag, Users, Award, Crown } from "lucide-react";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { listAdminOrders } from "@/lib/admin.functions";
import { useAdminToken, useAdminTheme } from "@/lib/admin-context";
import { formatUSD } from "@/lib/pricing";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
});

const STATUS_HEX: Record<string, string> = {
  pending: "#f59e0b", processing: "#3b82f6", shipped: "#8b5cf6",
  delivered: "#10b981", cancelled: "#ef4444", refunded: "#9ca3af",
};

const STATUS_COLORS: Record<string, { text: string; bar: string }> = {
  pending:    { text: "text-amber-700",   bar: "bg-amber-400" },
  processing: { text: "text-blue-700",    bar: "bg-blue-400" },
  shipped:    { text: "text-violet-700",  bar: "bg-violet-400" },
  delivered:  { text: "text-emerald-700", bar: "bg-emerald-400" },
  cancelled:  { text: "text-red-700",     bar: "bg-red-400" },
  refunded:   { text: "text-gray-600",    bar: "bg-gray-400" },
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-lg text-[0.62rem]"
      style={{ background: "var(--at-chart-tip-bg)", color: "var(--at-chart-tip-text)", boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}
    >
      <p className="font-semibold mb-0.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="opacity-90">
          {p.dataKey === "revenue" ? formatUSD(p.value) : `${p.value} orders`}
        </p>
      ))}
    </div>
  );
}

// ─── Revenue chart ────────────────────────────────────────────────────────────

function MonthlyRevenueChart({ orders }: { orders: any[] }) {
  const { theme } = useAdminTheme();
  const accent = theme.accentColor;

  const months = useMemo(() => {
    const result: { label: string; key: string; revenue: number; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7); // YYYY-MM
      result.push({
        key,
        label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        revenue: 0,
        count: 0,
      });
    }
    for (const o of orders) {
      const key = (o.created_at ?? "").slice(0, 7);
      const slot = result.find(r => r.key === key);
      if (slot) { slot.revenue += Number(o.total ?? 0); slot.count++; }
    }
    return result;
  }, [orders]);

  const maxRev = Math.max(...months.map(m => m.revenue), 1);

  return (
    <div className="admin-surface p-6 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[0.58rem] uppercase tracking-[0.22em] font-semibold" style={{ color: "var(--at-text-muted)" }}>Monthly Revenue</p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--at-text-heading)" }}>Last 12 months</p>
        </div>
        <span
          className="text-[0.58rem] px-2.5 py-1 font-semibold rounded-lg"
          style={{ background: "var(--at-chart-peak-bg)", color: "var(--at-chart-peak-text)", border: "1px solid var(--at-chart-peak-border)" }}
        >
          {formatUSD(maxRev)} peak
        </span>
      </div>
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={months} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="monthRevFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accent} stopOpacity={0.38} />
                <stop offset="95%" stopColor={accent} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--at-card-divider)" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "var(--at-text-muted)" }}
            />
            <YAxis yAxisId="rev" hide />
            <YAxis yAxisId="count" orientation="right" hide />
            <Tooltip content={<ChartTooltip />} />
            <Area
              yAxisId="rev"
              type="monotone"
              dataKey="revenue"
              stroke={accent}
              strokeWidth={2.5}
              fill="url(#monthRevFill)"
              animationDuration={600}
            />
            <Line
              yAxisId="count"
              type="monotone"
              dataKey="count"
              stroke="var(--at-text-muted)"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
              animationDuration={600}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Top Products by Revenue ──────────────────────────────────────────────────

function TopProducts({ orders }: { orders: any[] }) {
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; slug?: string; revenue: number; units: number }>();
    for (const o of orders) {
      const items = Array.isArray(o.items) ? o.items : [];
      for (const item of items) {
        const baseName = (item.name ?? "Unknown").split("—")[0].trim().split("·")[0].trim();
        const key = baseName;
        if (!map.has(key)) map.set(key, { name: baseName, slug: item.slug, revenue: 0, units: 0 });
        const entry = map.get(key)!;
        entry.revenue += Number(item.unitPrice ?? 0) * (item.quantity ?? 1);
        entry.units += item.quantity ?? 1;
      }
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [orders]);

  const maxRev = Math.max(...topProducts.map(p => p.revenue), 1);

  return (
    <div className="admin-surface p-6 rounded-xl">
      <p className="text-[0.58rem] uppercase tracking-[0.22em] font-bold mb-5" style={{ color: "var(--at-text-muted)" }}>Top Products by Revenue</p>
      {topProducts.length === 0 ? (
        <p className="text-sm py-4" style={{ color: "var(--at-text-muted)" }}>No order data yet.</p>
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
                <span className="text-xs font-medium truncate max-w-[70%]" style={{ color: "var(--at-text-body)" }}>{p.name}</span>
                <span className="text-xs font-semibold shrink-0 ml-2" style={{ color: "var(--at-text-heading)" }}>{formatUSD(p.revenue)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--at-chart-empty)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(p.revenue / maxRev) * 100}%`, background: "var(--at-chart-bar)" }}
                  />
                </div>
                <span className="text-[0.60rem] whitespace-nowrap" style={{ color: "var(--at-text-muted)" }}>{p.units} sold</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Top Customers ────────────────────────────────────────────────────────────

function TopCustomers({ orders }: { orders: any[] }) {
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
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [orders]);

  return (
    <div className="admin-surface p-6 rounded-xl">
      <p className="text-[0.58rem] uppercase tracking-[0.22em] font-bold mb-5" style={{ color: "var(--at-text-muted)" }}>Top Customers by LTV</p>
      {topCustomers.length === 0 ? (
        <p className="text-sm py-4" style={{ color: "var(--at-text-muted)" }}>No customer data yet.</p>
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
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: "var(--at-avatar-bg)", border: "1px solid var(--at-avatar-border)" }}
                  >
                    <span className="text-[0.58rem] font-semibold" style={{ color: "var(--at-avatar-text)" }}>{initials || "?"}</span>
                  </div>
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

// ─── Order Status Breakdown ───────────────────────────────────────────────────

function StatusBreakdown({ orders }: { orders: any[] }) {
  const breakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of orders) {
      map[o.status] = (map[o.status] ?? 0) + 1;
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({ status, count, pct: orders.length ? (count / orders.length) * 100 : 0 }));
  }, [orders]);

  const donutData = breakdown.map(b => ({ name: b.status, value: b.count }));

  return (
    <div className="admin-surface p-6 rounded-xl">
      <p className="text-[0.58rem] uppercase tracking-[0.22em] font-bold mb-4" style={{ color: "var(--at-text-muted)" }}>Order Status Breakdown</p>

      {orders.length > 0 && (
        <div className="relative w-full h-[110px] mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                dataKey="value"
                nameKey="name"
                innerRadius={34}
                outerRadius={50}
                paddingAngle={3}
                stroke="none"
                animationDuration={600}
              >
                {donutData.map((d, i) => (
                  <Cell key={i} fill={STATUS_HEX[d.name] ?? "#9ca3af"} />
                ))}
              </Pie>
              <Tooltip content={({ active, payload }: any) => active && payload?.length ? (
                <div className="px-2.5 py-1.5 rounded-lg text-[0.62rem] capitalize" style={{ background: "var(--at-chart-tip-bg)", color: "var(--at-chart-tip-text)" }}>
                  {payload[0].name}: {payload[0].value}
                </div>
              ) : null} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-base font-bold" style={{ color: "var(--at-text-heading)" }}>{orders.length}</span>
            <span className="text-[0.46rem] uppercase tracking-[0.16em]" style={{ color: "var(--at-text-muted)" }}>Orders</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {breakdown.map(({ status, count, pct }) => {
          const colors = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
          return (
            <div key={status} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className={`text-[0.62rem] uppercase tracking-[0.08em] font-medium ${colors.text}`}>{status}</span>
                <span className="text-xs" style={{ color: "var(--at-text-muted)" }}>{count} ({pct.toFixed(0)}%)</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--at-chart-empty)" }}>
                <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function AdminAnalytics() {
  const token = useAdminToken();
  const fetchOrders = useServerFn(listAdminOrders);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders-analytics", token],
    queryFn: () => fetchOrders({ data: { token } }),
    staleTime: 5 * 60 * 1000,
  });

  const orders = data?.orders ?? [];

  const kpis = useMemo(() => {
    const totalRevenue = orders.reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
    const aov = orders.length ? totalRevenue / orders.length : 0;

    const customerMap = new Map<string, number>();
    for (const o of orders) {
      const e = (o.customer_email ?? "").toLowerCase();
      customerMap.set(e, (customerMap.get(e) ?? 0) + 1);
    }
    const repeatCount = [...customerMap.values()].filter(n => n > 1).length;
    const repeatRate = customerMap.size ? (repeatCount / customerMap.size) * 100 : 0;

    const thisMonth = new Date().toISOString().slice(0, 7);
    const mtdRevenue = orders
      .filter((o: any) => (o.created_at ?? "").startsWith(thisMonth))
      .reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);

    return { totalRevenue, aov, uniqueCustomers: customerMap.size, repeatRate, mtdRevenue };
  }, [orders]);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-gray-100 rounded" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded" />)}
          </div>
          <div className="h-52 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-lg font-semibold tracking-tight" style={{ color: "var(--at-text-heading)" }}>Analytics</h1>
        <p className="text-[0.72rem] mt-0.5" style={{ color: "var(--at-text-muted)" }}>Revenue, customers & product performance</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { icon: TrendingUp, label: "Revenue MTD",    value: formatUSD(kpis.mtdRevenue),          sub: "This month",             accent: true },
          { icon: Award,      label: "All-time Rev",   value: formatUSD(kpis.totalRevenue),         sub: "Lifetime"                },
          { icon: ShoppingBag,label: "Avg Order Value",value: formatUSD(kpis.aov),                  sub: `${orders.length} orders` },
          { icon: Users,      label: "Unique Customers",value: String(kpis.uniqueCustomers),        sub: "By email"                },
          { icon: Users,      label: "Repeat Rate",    value: `${kpis.repeatRate.toFixed(0)}%`,     sub: "Ordered 2+ times"        },
        ].map(({ icon: Icon, label, value, sub, accent }) => (
          <div
            key={label}
            className="admin-surface p-4 rounded-xl"
            style={accent ? { borderTop: "2px solid var(--at-kpi-top)" } : undefined}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[0.55rem] uppercase tracking-[0.20em] font-semibold mb-1.5" style={{ color: "var(--at-kpi-label)" }}>{label}</p>
                <p className="text-xl font-semibold leading-none" style={{ color: accent ? "var(--at-kpi-icon)" : "var(--at-text-heading)" }}>{value}</p>
                {sub && <p className="text-[0.60rem] mt-1.5" style={{ color: "var(--at-text-muted)" }}>{sub}</p>}
              </div>
              <div className="p-1.5 rounded-md" style={{ background: "var(--at-kpi-icon-bg)" }}>
                <Icon className="h-4 w-4" style={{ color: "var(--at-kpi-icon)" }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly chart (full width) */}
      <div className="mb-5">
        <MonthlyRevenueChart orders={orders} />
      </div>

      {/* Bottom row: products, customers, status */}
      <div className="grid lg:grid-cols-3 gap-5">
        <TopProducts orders={orders} />
        <TopCustomers orders={orders} />
        <StatusBreakdown orders={orders} />
      </div>
    </div>
  );
}
