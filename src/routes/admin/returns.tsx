import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { RefreshCw, ChevronRight, Package } from "lucide-react";
import { listReturns } from "@/lib/admin-extended.functions";
import { useAdminToken } from "@/lib/admin-context";
import { formatUSD } from "@/lib/pricing";
import { z } from "zod";

const searchSchema = z.object({ status: z.string().optional() });
export const Route = createFileRoute("/admin/returns")({
  validateSearch: (s): { status?: string } => searchSchema.parse(s),
  component: AdminReturns,
});

const STATUS_COLORS: Record<string, string> = {
  pending:      "bg-amber-50 text-amber-700 border border-amber-200",
  approved:     "bg-blue-50 text-blue-700 border border-blue-200",
  shipped_back: "bg-violet-50 text-violet-700 border border-violet-200",
  refunded:     "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rejected:     "bg-red-50 text-red-700 border border-red-200",
};

const STATUS_DOT: Record<string, string> = {
  pending: "bg-amber-400", approved: "bg-blue-400", shipped_back: "bg-violet-400",
  refunded: "bg-emerald-400", rejected: "bg-red-400",
};

const STATUS_TABS = ["all", "pending", "approved", "shipped_back", "refunded", "rejected"];

function AdminReturns() {
  const token = useAdminToken();
  const { status: urlStatus } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/returns" });
  const [search, setSearch] = useState("");
  const activeStatus = urlStatus ?? "all";

  const fetchReturns = useServerFn(listReturns);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-returns", token],
    queryFn: () => fetchReturns({ data: { token } }),
    enabled: !!token,
    refetchInterval: 60_000,
  });

  const returns = data?.returns ?? [];

  const filtered = useMemo(() => {
    let list = returns;
    if (activeStatus !== "all") list = list.filter((r: any) => r.status === activeStatus);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r: any) =>
        (r.order_number ?? "").toLowerCase().includes(q) ||
        (r.customer_email ?? "").toLowerCase().includes(q) ||
        (r.customer_name ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [returns, activeStatus, search]);

  const counts = useMemo(() => {
    return STATUS_TABS.reduce<Record<string, number>>((acc, s) => {
      acc[s] = s === "all" ? returns.length : returns.filter((r: any) => r.status === s).length;
      return acc;
    }, {});
  }, [returns]);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">Returns</h1>
          {!isLoading && counts.pending > 0 && (
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[0.62rem] font-medium rounded-full">
              {counts.pending} pending
            </span>
          )}
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3.5 py-2 text-[0.62rem] uppercase tracking-[0.12em] text-gray-500 border border-gray-200 hover:border-gray-400 hover:text-gray-700 transition-colors bg-white"
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      <div className="bg-white border border-gray-100">
        {/* Status tabs */}
        <div className="border-b border-gray-100 overflow-x-auto">
          <div className="flex px-2 min-w-max">
            {STATUS_TABS.map(s => (
              <button
                key={s}
                onClick={() => navigate({ search: s === "all" ? {} : { status: s } })}
                className={`relative px-4 py-3.5 text-[0.62rem] uppercase tracking-[0.12em] font-medium transition-colors whitespace-nowrap ${
                  activeStatus === s ? "text-gray-900" : "text-gray-400 hover:text-gray-700"
                }`}
              >
                {activeStatus === s && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}
                {s.replace("_", " ")}
                {counts[s] > 0 && (
                  <span className={`ml-1.5 tabular-nums ${activeStatus === s ? "text-gray-500" : "text-gray-300"}`}>
                    {counts[s]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-50">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order #, customer name, or email…"
            className="w-full text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none"
          />
        </div>

        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse flex gap-4">
                <div className="h-4 w-28 bg-gray-100 rounded" />
                <div className="h-4 flex-1 bg-gray-100 rounded" />
                <div className="h-5 w-20 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="h-8 w-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No returns found.</p>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    {["Order #", "Date", "Customer", "Reason", "Refund", "Status", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[0.55rem] uppercase tracking-[0.14em] text-gray-400 font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((r: any) => (
                    <tr
                      key={r.id}
                      onClick={() => navigate({ to: "/admin/returns/$returnId", params: { returnId: r.id } })}
                      className="hover:bg-gray-50/60 cursor-pointer group transition-colors"
                    >
                      <td className="px-4 py-3.5 font-mono text-xs text-gray-700">{r.order_number}</td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                      </td>
                      <td className="px-4 py-3.5 max-w-[180px]">
                        <p className="text-xs font-medium text-gray-800 truncate">{r.customer_name}</p>
                        <p className="text-[0.62rem] text-gray-400 truncate">{r.customer_email}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-600 max-w-[220px]">
                        <span className="truncate block">{r.reason}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-medium text-gray-800 whitespace-nowrap">
                        {r.refund_amount != null ? formatUSD(Number(r.refund_amount)) : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[0.60rem] uppercase tracking-[0.08em] font-medium rounded-sm ${STATUS_COLORS[r.status] ?? STATUS_COLORS.pending}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[r.status] ?? "bg-gray-400"}`} />
                          {r.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 pr-5 text-right">
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-600 transition-colors inline-block" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-gray-50">
              {filtered.map((r: any) => (
                <div
                  key={r.id}
                  onClick={() => navigate({ to: "/admin/returns/$returnId", params: { returnId: r.id } })}
                  className="px-4 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-gray-50/60 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-gray-700">{r.order_number}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.08em] font-medium rounded-sm ${STATUS_COLORS[r.status] ?? STATUS_COLORS.pending}`}>
                        {r.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">{r.customer_name}</p>
                    <p className="text-[0.62rem] text-gray-400 truncate">{r.reason}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                </div>
              ))}
            </div>
          </>
        )}

        {!isLoading && (
          <div className="px-5 py-3 border-t border-gray-50 text-[0.58rem] uppercase tracking-[0.14em] text-gray-400">
            {filtered.length} of {returns.length} returns
          </div>
        )}
      </div>
    </div>
  );
}
