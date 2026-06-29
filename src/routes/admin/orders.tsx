import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { Search, RefreshCw, Download, ChevronRight } from "lucide-react";
import { listAdminOrders } from "@/lib/admin.functions";
import { useAdminToken } from "@/lib/admin-context";
import { formatUSD } from "@/lib/pricing";
import { z } from "zod";

const searchSchema = z.object({ status: z.string().optional() });

export const Route = createFileRoute("/admin/orders")({
  validateSearch: (s): { status?: string } => searchSchema.parse(s),
  component: AdminOrders,
});

// ─── Constants ────────────────────────────────────────────────────────────────

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

const STATUS_TABS = ["all", "pending", "processing", "shipped", "delivered", "cancelled", "refunded"];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[0.60rem] uppercase tracking-[0.10em] font-medium rounded-sm ${STATUS_COLORS[status] ?? STATUS_COLORS.pending}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] ?? "bg-gray-400"}`} />
      {status}
    </span>
  );
}

function CustomerAvatar({ name }: { name: string }) {
  const initials = (name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
      <span className="text-[0.58rem] font-semibold text-gray-500">{initials || "?"}</span>
    </div>
  );
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportCSV(orders: any[]) {
  const rows = [
    ["Order #", "Date", "Customer", "Email", "Total", "Status", "City", "State"],
    ...orders.map((o: any) => [
      o.order_number,
      new Date(o.created_at).toLocaleDateString(),
      o.customer_name,
      o.customer_email,
      formatUSD(Number(o.total)),
      o.status,
      o.shipping_city ?? "",
      o.shipping_state ?? "",
    ]),
  ];
  const csv = rows
    .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `qj-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Mobile Card (single order) ───────────────────────────────────────────────

function OrderCard({ o, onClick }: { o: any; onClick: () => void }) {
  const itemCount = Array.isArray(o.items)
    ? o.items.reduce((s: number, i: any) => s + (i.quantity ?? 1), 0)
    : 0;
  return (
    <div
      onClick={onClick}
      className="px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50/60 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
    >
      <CustomerAvatar name={o.customer_name ?? ""} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-mono text-xs text-gray-700">{o.order_number}</span>
          <StatusBadge status={o.status} />
        </div>
        <p className="text-xs text-gray-600 truncate">{o.customer_name}</p>
        <p className="text-[0.62rem] text-gray-400">
          {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
          {" · "}
          {itemCount} item{itemCount !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-semibold text-gray-800">{formatUSD(Number(o.total))}</p>
        <ChevronRight className="h-3.5 w-3.5 text-gray-300 ml-auto mt-1" />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function AdminOrders() {
  const token = useAdminToken();
  const { status: urlStatus } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/orders" });
  const [search, setSearch] = useState("");
  const activeStatus = urlStatus ?? "all";

  const fetchOrders = useServerFn(listAdminOrders);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-orders", token],
    queryFn: () => fetchOrders({ data: { token } }),
    refetchInterval: 30_000,
  });

  const filtered = useMemo(() => {
    let list = data?.orders ?? [];
    if (activeStatus !== "all") list = list.filter((o: any) => o.status === activeStatus);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((o: any) =>
        o.order_number?.toLowerCase().includes(q) ||
        o.customer_email?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, activeStatus, search]);

  const counts = useMemo(() => {
    const all = data?.orders ?? [];
    return STATUS_TABS.reduce<Record<string, number>>((acc, s) => {
      acc[s] = s === "all" ? all.length : all.filter((o: any) => o.status === s).length;
      return acc;
    }, {});
  }, [data]);

  const goToOrder = (o: any) =>
    navigate({ to: "/admin/orders/$orderId", params: { orderId: String(o.id) } });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">Orders</h1>
          {!isLoading && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[0.62rem] font-medium rounded-full tabular-nums">
              {(data?.orders ?? []).length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV(filtered)}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-[0.62rem] uppercase tracking-[0.12em] text-gray-600 border border-gray-200 hover:border-gray-400 hover:text-gray-800 transition-colors bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="h-3 w-3" />
            Export CSV
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-[0.62rem] uppercase tracking-[0.12em] text-gray-500 border border-gray-200 hover:border-gray-400 hover:text-gray-700 transition-colors bg-white"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* Table panel */}
      <div className="bg-white border border-gray-100">
        {/* Status tabs */}
        <div className="border-b border-gray-100 overflow-x-auto">
          <div className="flex px-2 min-w-max">
            {STATUS_TABS.map(s => (
              <button
                key={s}
                onClick={() => navigate({ search: s === "all" ? {} : { status: s } })}
                className={`relative px-4 py-3.5 text-[0.62rem] uppercase tracking-[0.12em] font-medium transition-colors whitespace-nowrap ${
                  activeStatus === s
                    ? "text-gray-900"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                {activeStatus === s && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
                )}
                {s}
                {counts[s] > 0 && (
                  <span className={`ml-1.5 tabular-nums ${
                    activeStatus === s ? "text-gray-500" : "text-gray-300"
                  }`}>
                    {counts[s]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 flex items-center gap-2.5 border-b border-gray-50">
          <Search className="h-3.5 w-3.5 text-gray-300 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order number, name, or email…"
            className="flex-1 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-[0.62rem] uppercase tracking-[0.10em] text-gray-300 hover:text-gray-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="divide-y divide-gray-50">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse flex items-center gap-4">
                <div className="w-7 h-7 rounded-full bg-gray-100" />
                <div className="h-3.5 w-24 bg-gray-100 rounded" />
                <div className="h-3.5 w-32 bg-gray-100 rounded" />
                <div className="h-3.5 flex-1 bg-gray-100 rounded" />
                <div className="h-3.5 w-16 bg-gray-100 rounded" />
                <div className="h-5 w-20 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-gray-400 mb-1">No orders match your filter.</p>
            {search && (
              <button onClick={() => setSearch("")} className="text-xs text-gray-400 underline hover:text-gray-700">
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Desktop table */}
        {!isLoading && filtered.length > 0 && (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    {["", "#", "Date", "Customer", "Location", "Items", "Total", "Status", ""].map((h, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-left text-[0.55rem] uppercase tracking-[0.14em] text-gray-400 font-medium whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((o: any) => {
                    const itemCount = Array.isArray(o.items)
                      ? o.items.reduce((s: number, i: any) => s + (i.quantity ?? 1), 0)
                      : 0;
                    return (
                      <tr
                        key={o.id}
                        onClick={() => goToOrder(o)}
                        className="hover:bg-gray-50/60 cursor-pointer transition-colors group"
                      >
                        <td className="pl-4 pr-2 py-3.5">
                          <CustomerAvatar name={o.customer_name ?? ""} />
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-gray-700 whitespace-nowrap">
                          {o.order_number}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(o.created_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3.5 max-w-[180px]">
                          <div className="text-xs font-medium text-gray-800 truncate">{o.customer_name}</div>
                          <div className="text-[0.62rem] text-gray-400 truncate">{o.customer_email}</div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                          {[o.shipping_city, o.shipping_state].filter(Boolean).join(", ")}
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

            {/* Mobile card list */}
            <div className="lg:hidden divide-y divide-gray-50">
              {filtered.map((o: any) => (
                <OrderCard key={o.id} o={o} onClick={() => goToOrder(o)} />
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
            <p className="text-[0.58rem] uppercase tracking-[0.14em] text-gray-400">
              Showing {filtered.length} of {(data?.orders ?? []).length} orders
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
