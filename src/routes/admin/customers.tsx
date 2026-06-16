import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { Search, ChevronRight, Download } from "lucide-react";
import { listAdminOrders } from "@/lib/admin.functions";
import { useAdminToken } from "@/lib/admin-context";
import { formatUSD } from "@/lib/pricing";

export const Route = createFileRoute("/admin/customers")({
  component: AdminCustomers,
});

function exportCustomersCSV(customers: any[]) {
  const rows = [
    ["Name", "Email", "Orders", "Total Spent", "Avg Order", "First Order", "Last Order", "City/State"],
    ...customers.map(c => [
      c.name,
      c.email,
      c.orderCount,
      formatUSD(c.totalSpent),
      formatUSD(c.avgOrder),
      new Date(c.firstOrder).toLocaleDateString(),
      new Date(c.lastOrder).toLocaleDateString(),
      c.location,
    ]),
  ];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `qj-customers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type SortKey = "spent" | "orders" | "recent" | "name";

function AdminCustomers() {
  const token = useAdminToken();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("spent");

  const fetchOrders = useServerFn(listAdminOrders);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders-customers", token],
    queryFn: () => fetchOrders({ data: { token } }),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const customers = useMemo(() => {
    const orders = data?.orders ?? [];
    const map = new Map<string, any>();
    for (const o of orders) {
      const email = (o.customer_email ?? "").toLowerCase();
      if (!email) continue;
      if (!map.has(email)) {
        map.set(email, {
          email,
          name: o.customer_name ?? email,
          location: [o.shipping_city, o.shipping_state].filter(Boolean).join(", "),
          orderCount: 0,
          totalSpent: 0,
          firstOrder: o.created_at,
          lastOrder: o.created_at,
          orders: [],
        });
      }
      const c = map.get(email)!;
      c.orderCount++;
      c.totalSpent += Number(o.total ?? 0);
      if (o.created_at < c.firstOrder) c.firstOrder = o.created_at;
      if (o.created_at > c.lastOrder)  c.lastOrder  = o.created_at;
      c.orders.push(o);
    }
    return [...map.values()].map(c => ({ ...c, avgOrder: c.totalSpent / c.orderCount }));
  }, [data]);

  const sorted = useMemo(() => {
    const list = [...customers];
    if (sort === "spent")  list.sort((a, b) => b.totalSpent - a.totalSpent);
    if (sort === "orders") list.sort((a, b) => b.orderCount - a.orderCount);
    if (sort === "recent") list.sort((a, b) => b.lastOrder.localeCompare(a.lastOrder));
    if (sort === "name")   list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [customers, sort]);

  const filtered = useMemo(() => {
    if (!search.trim()) return sorted;
    const q = search.trim().toLowerCase();
    return sorted.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q)
    );
  }, [sorted, search]);

  const goToCustomer = (c: any) =>
    navigate({ to: "/admin/customers/$customerId", params: { customerId: btoa(c.email) } });

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">Customers</h1>
          {!isLoading && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[0.62rem] font-medium rounded-full">
              {customers.length}
            </span>
          )}
        </div>
        <button
          onClick={() => exportCustomersCSV(filtered)}
          disabled={filtered.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 text-[0.62rem] uppercase tracking-[0.12em] text-gray-600 border border-gray-200 hover:border-gray-400 hover:text-gray-800 transition-colors bg-white disabled:opacity-40"
        >
          <Download className="h-3 w-3" /> Export CSV
        </button>
      </div>

      <div className="bg-white border border-gray-100">
        {/* Sort + search bar */}
        <div className="border-b border-gray-100 px-4 py-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Search className="h-3.5 w-3.5 text-gray-300 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or location…"
              className="flex-1 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[0.58rem] uppercase tracking-[0.14em] text-gray-400">Sort:</span>
            {(["spent", "orders", "recent", "name"] as SortKey[]).map(s => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-2.5 py-1 text-[0.58rem] uppercase tracking-[0.10em] border transition-colors ${
                  sort === s
                    ? "bg-gray-900 text-white border-gray-900"
                    : "border-gray-200 text-gray-400 hover:text-gray-700"
                }`}
              >
                {s === "spent" ? "LTV" : s === "orders" ? "Orders" : s === "recent" ? "Recent" : "A-Z"}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-32 bg-gray-100 rounded" />
                  <div className="h-3 w-48 bg-gray-100 rounded" />
                </div>
                <div className="h-3.5 w-16 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-gray-400">No customers found.</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    {["", "Customer", "Location", "Orders", "Total Spent", "Avg Order", "Last Order", ""].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left text-[0.55rem] uppercase tracking-[0.14em] text-gray-400 font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(c => {
                    const initials = c.name.split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join("");
                    return (
                      <tr
                        key={c.email}
                        onClick={() => goToCustomer(c)}
                        className="hover:bg-gray-50/60 cursor-pointer group transition-colors"
                      >
                        <td className="pl-4 pr-2 py-3.5">
                          <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                            <span className="text-[0.58rem] font-semibold text-gray-500">{initials || "?"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-xs font-medium text-gray-800">{c.name}</p>
                          <p className="text-[0.62rem] text-gray-400">{c.email}</p>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{c.location || "—"}</td>
                        <td className="px-4 py-3.5 text-xs font-medium text-gray-800">{c.orderCount}</td>
                        <td className="px-4 py-3.5 text-xs font-semibold text-gray-900">{formatUSD(c.totalSpent)}</td>
                        <td className="px-4 py-3.5 text-xs text-gray-600">{formatUSD(c.avgOrder)}</td>
                        <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(c.lastOrder).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                        </td>
                        <td className="px-4 py-3.5 pr-5 text-right">
                          <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-600 transition-colors inline-block" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-gray-50">
              {filtered.map(c => {
                const initials = c.name.split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join("");
                return (
                  <div
                    key={c.email}
                    onClick={() => goToCustomer(c)}
                    className="px-4 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-gray-50/60 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                      <span className="text-[0.60rem] font-semibold text-gray-500">{initials || "?"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800">{c.name}</p>
                      <p className="text-[0.62rem] text-gray-400">{c.orderCount} order{c.orderCount !== 1 ? "s" : ""} · {c.location || c.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-gray-900">{formatUSD(c.totalSpent)}</p>
                      <ChevronRight className="h-3.5 w-3.5 text-gray-300 ml-auto mt-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-50 text-[0.58rem] uppercase tracking-[0.14em] text-gray-400">
            {filtered.length} of {customers.length} customers
          </div>
        )}
      </div>
    </div>
  );
}
