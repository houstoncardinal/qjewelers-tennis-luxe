import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { TrendingUp, ShoppingBag, Users, Award } from "lucide-react";
import { listAdminOrders } from "@/lib/admin.functions";
import { useAdminToken } from "@/lib/admin-context";
import { formatUSD } from "@/lib/pricing";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
});

// ─── Revenue chart ────────────────────────────────────────────────────────────

function MonthlyRevenueChart({ orders }: { orders: any[] }) {
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
    <div className="bg-white border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[0.58rem] uppercase tracking-[0.18em] text-gray-400">Monthly Revenue</p>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">Last 12 months</p>
        </div>
        <p className="text-xs text-gray-400">Peak: {formatUSD(maxRev)}</p>
      </div>
      <div className="flex items-end gap-1.5 h-36">
        {months.map((m, i) => {
          const pct = m.revenue > 0 ? Math.max((m.revenue / maxRev) * 100, 4) : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              {m.revenue > 0 && (
                <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-[0.52rem] px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                  {formatUSD(m.revenue)}<br />{m.count} orders
                </div>
              )}
              <div className="w-full flex items-end h-28">
                <div
                  className={`w-full rounded-t-[2px] transition-all ${m.revenue > 0 ? "bg-amber-400 group-hover:bg-amber-500" : "bg-gray-100"}`}
                  style={{ height: m.revenue > 0 ? `${pct}%` : "4px" }}
                />
              </div>
              <span className="text-[0.48rem] uppercase tracking-[0.06em] text-gray-400 whitespace-nowrap">{m.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Top Products by Revenue ──────────────────────────────────────────────────

function TopProducts({ orders }: { orders: any[] }) {
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; units: number }>();
    for (const o of orders) {
      const items = Array.isArray(o.items) ? o.items : [];
      for (const item of items) {
        const baseName = (item.name ?? "Unknown").split("—")[0].trim().split("·")[0].trim();
        const key = baseName;
        if (!map.has(key)) map.set(key, { name: baseName, revenue: 0, units: 0 });
        const entry = map.get(key)!;
        entry.revenue += Number(item.unitPrice ?? 0) * (item.quantity ?? 1);
        entry.units += item.quantity ?? 1;
      }
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [orders]);

  const maxRev = Math.max(...topProducts.map(p => p.revenue), 1);

  return (
    <div className="bg-white border border-gray-100 p-6">
      <p className="text-[0.58rem] uppercase tracking-[0.18em] text-gray-400 mb-5">Top Products by Revenue</p>
      {topProducts.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">No order data yet.</p>
      ) : (
        <div className="space-y-3">
          {topProducts.map((p, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700 font-medium truncate max-w-[70%]">{p.name}</span>
                <span className="text-xs font-semibold text-gray-900 shrink-0 ml-2">{formatUSD(p.revenue)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${(p.revenue / maxRev) * 100}%` }}
                  />
                </div>
                <span className="text-[0.60rem] text-gray-400 whitespace-nowrap">{p.units} sold</span>
              </div>
            </div>
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
    <div className="bg-white border border-gray-100 p-6">
      <p className="text-[0.58rem] uppercase tracking-[0.18em] text-gray-400 mb-5">Top Customers by LTV</p>
      {topCustomers.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">No customer data yet.</p>
      ) : (
        <div className="space-y-3">
          {topCustomers.map((c, i) => {
            const initials = c.name.split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join("");
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                  <span className="text-[0.58rem] font-semibold text-gray-500">{initials || "?"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{c.name}</p>
                  <p className="text-[0.60rem] text-gray-400">{c.orders} order{c.orders !== 1 ? "s" : ""}</p>
                </div>
                <span className="text-xs font-semibold text-gray-900 shrink-0">{formatUSD(c.revenue)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Order Status Breakdown ───────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  pending:    { bg: "bg-amber-50",   text: "text-amber-700",   bar: "bg-amber-400" },
  processing: { bg: "bg-blue-50",    text: "text-blue-700",    bar: "bg-blue-400" },
  shipped:    { bg: "bg-violet-50",  text: "text-violet-700",  bar: "bg-violet-400" },
  delivered:  { bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-400" },
  cancelled:  { bg: "bg-red-50",     text: "text-red-700",     bar: "bg-red-400" },
  refunded:   { bg: "bg-gray-50",    text: "text-gray-600",    bar: "bg-gray-400" },
};

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

  return (
    <div className="bg-white border border-gray-100 p-6">
      <p className="text-[0.58rem] uppercase tracking-[0.18em] text-gray-400 mb-5">Order Status Breakdown</p>
      <div className="space-y-3">
        {breakdown.map(({ status, count, pct }) => {
          const colors = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
          return (
            <div key={status} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className={`text-[0.62rem] uppercase tracking-[0.08em] font-medium ${colors.text}`}>{status}</span>
                <span className="text-xs text-gray-500">{count} ({pct.toFixed(0)}%)</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
    enabled: !!token,
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
        <h1 className="text-lg font-semibold text-gray-900">Analytics</h1>
        <p className="text-[0.72rem] text-gray-400 mt-0.5">Revenue, customers & product performance</p>
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
          <div key={label} className={`bg-white border border-gray-100 p-4 ${accent ? "border-t-2 border-t-amber-400" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[0.55rem] uppercase tracking-[0.18em] text-gray-400 mb-1.5">{label}</p>
                <p className={`text-xl font-semibold leading-none ${accent ? "text-amber-600" : "text-gray-900"}`}>{value}</p>
                {sub && <p className="text-[0.60rem] text-gray-400 mt-1.5">{sub}</p>}
              </div>
              <div className={`p-1.5 rounded-sm ${accent ? "bg-amber-50" : "bg-gray-50"}`}>
                <Icon className={`h-4 w-4 ${accent ? "text-amber-500" : "text-gray-400"}`} />
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
