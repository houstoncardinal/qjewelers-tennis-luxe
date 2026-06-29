import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Mail, MapPin, StickyNote, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { listAdminOrders } from "@/lib/admin.functions";
import { getCustomerNotes, addCustomerNote, deleteCustomerNote } from "@/lib/admin-extended.functions";
import { useAdminToken } from "@/lib/admin-context";
import { formatUSD } from "@/lib/pricing";

export const Route = createFileRoute("/admin/customers/$customerId")({
  component: AdminCustomerDetail,
});

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-amber-50 text-amber-700 border border-amber-200",
  processing: "bg-blue-50 text-blue-700 border border-blue-200",
  shipped:    "bg-violet-50 text-violet-700 border border-violet-200",
  delivered:  "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelled:  "bg-red-50 text-red-700 border border-red-200",
  refunded:   "bg-gray-50 text-gray-600 border border-gray-200",
};

const STATUS_DOT: Record<string, string> = {
  pending: "bg-amber-400", processing: "bg-blue-400", shipped: "bg-violet-400",
  delivered: "bg-emerald-400", cancelled: "bg-red-400", refunded: "bg-gray-400",
};

// ─── Customer Notes ───────────────────────────────────────────────────────────

function CustomerNotes({ email }: { email: string }) {
  const token = useAdminToken();
  const queryClient = useQueryClient();
  const [note,    setNote]    = useState("");
  const [adding,  setAdding]  = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchNotes = useServerFn(getCustomerNotes);
  const addFn      = useServerFn(addCustomerNote);
  const deleteFn   = useServerFn(deleteCustomerNote);

  const { data, isLoading } = useQuery({
    queryKey: ["customer-notes", email, token],
    queryFn: () => fetchNotes({ data: { token, email } }),
    enabled: !!email,
  });

  const notes: any[] = data?.notes ?? [];

  const handleAdd = async () => {
    if (!note.trim()) return;
    setAdding(true);
    try {
      await addFn({ data: { token, email, note } });
      setNote("");
      await queryClient.invalidateQueries({ queryKey: ["customer-notes", email, token] });
      toast.success("Note added");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to add note");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    setDeleting(noteId);
    try {
      await deleteFn({ data: { token, noteId } });
      await queryClient.invalidateQueries({ queryKey: ["customer-notes", email, token] });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete note");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="bg-white border border-gray-100 mt-5 p-6">
      <div className="flex items-center gap-2 mb-5">
        <StickyNote className="h-4 w-4 text-gray-400" />
        <p className="text-[0.72rem] font-medium text-gray-700 uppercase tracking-[0.10em]">
          Internal Notes
        </p>
      </div>

      {/* Add note */}
      <div className="flex gap-2 mb-5">
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdd(); }}
          placeholder="Add a private note about this customer… (⌘↵ to submit)"
          rows={2}
          className="flex-1 border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors resize-none"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !note.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-[0.62rem] uppercase tracking-[0.12em] hover:bg-gray-800 transition-colors disabled:opacity-40 self-start"
        >
          <Plus className="h-3 w-3" /> {adding ? "Adding…" : "Add"}
        </button>
      </div>

      {/* Notes list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => <div key={i} className="h-10 bg-gray-50 animate-pulse rounded" />)}
        </div>
      ) : notes.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">No notes yet</p>
      ) : (
        <div className="space-y-2">
          {notes.map((n: any) => (
            <div key={n.id} className="flex items-start gap-3 bg-gray-50 border border-gray-100 px-4 py-3 group">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{n.note}</p>
                <p className="text-[0.58rem] text-gray-400 mt-1">
                  {new Date(n.created_at).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              <button
                onClick={() => handleDelete(n.id)}
                disabled={deleting === n.id}
                className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40 shrink-0 mt-0.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function AdminCustomerDetail() {
  const token = useAdminToken();
  const navigate = useNavigate();
  const { customerId } = Route.useParams();

  let email = "";
  try { email = atob(customerId); } catch { /* invalid base64 */ }

  const fetchOrders = useServerFn(listAdminOrders);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders-customers", token],
    queryFn: () => fetchOrders({ data: { token } }),
    staleTime: 5 * 60 * 1000,
  });

  const { customer, orders: customerOrders } = useMemo(() => {
    const allOrders = data?.orders ?? [];
    const orders = allOrders
      .filter((o: any) => (o.customer_email ?? "").toLowerCase() === email.toLowerCase())
      .sort((a: any, b: any) => b.created_at.localeCompare(a.created_at));

    if (!orders.length) return { customer: null, orders: [] };

    const first = orders[orders.length - 1];
    const last = orders[0];
    const totalSpent = orders.reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);

    return {
      customer: {
        name: last.customer_name ?? email,
        email,
        phone: last.customer_phone,
        location: [last.shipping_city, last.shipping_state, last.shipping_country].filter(Boolean).join(", "),
        totalSpent,
        avgOrder: totalSpent / orders.length,
        firstOrder: first.created_at,
        lastOrder: last.created_at,
        orderCount: orders.length,
      },
      orders,
    };
  }, [data, email]);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 animate-pulse space-y-4 max-w-4xl">
        <div className="h-3 w-20 bg-gray-100 rounded" />
        <div className="h-32 bg-gray-100 rounded" />
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center max-w-sm mx-auto mt-16">
        <p className="text-sm text-gray-400 mb-4">Customer not found.</p>
        <Link to="/admin/customers" className="text-[0.65rem] uppercase tracking-[0.14em] text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to customers
        </Link>
      </div>
    );
  }

  const initials = customer.name.split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join("");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <Link
        to="/admin/customers"
        className="inline-flex items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.14em] text-gray-400 hover:text-gray-700 transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Customers
      </Link>

      {/* Customer header */}
      <div className="bg-white border border-gray-100 p-6 mb-5">
        <div className="flex flex-wrap items-start gap-5">
          <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
            <span className="text-lg font-semibold text-gray-500">{initials || "?"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900">{customer.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <Mail className="h-3 w-3" /> {customer.email}
              </span>
              {customer.location && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" /> {customer.location}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-6 text-right shrink-0">
            {[
              { label: "Lifetime Value", value: formatUSD(customer.totalSpent), gold: true },
              { label: "Avg Order",      value: formatUSD(customer.avgOrder) },
              { label: "Orders",         value: String(customer.orderCount) },
            ].map(({ label, value, gold }) => (
              <div key={label}>
                <p className="text-[0.55rem] uppercase tracking-[0.18em] text-gray-400 mb-1">{label}</p>
                <p className={`text-xl font-semibold leading-none ${gold ? "text-amber-600" : "text-gray-900"}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 pt-4 border-t border-gray-100 flex gap-6 text-xs text-gray-400">
          <span>First order: <span className="text-gray-600">{new Date(customer.firstOrder).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span></span>
          <span>Last order: <span className="text-gray-600">{new Date(customer.lastOrder).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span></span>
        </div>
      </div>

      {/* Internal Notes */}
      <CustomerNotes email={email} />

      {/* Order history */}
      <div className="bg-white border border-gray-100 mt-5">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-[0.72rem] font-medium text-gray-700 uppercase tracking-[0.10em]">
            Order History · {customerOrders.length} orders
          </p>
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                {["Order #", "Date", "Items", "Total", "Status", ""].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-[0.55rem] uppercase tracking-[0.14em] text-gray-400 font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customerOrders.map((o: any) => {
                const itemCount = Array.isArray(o.items)
                  ? o.items.reduce((s: number, i: any) => s + (i.quantity ?? 1), 0) : 0;
                return (
                  <tr
                    key={o.id}
                    onClick={() => navigate({ to: "/admin/orders/$orderId", params: { orderId: String(o.id) } })}
                    className="hover:bg-gray-50/60 cursor-pointer group transition-colors"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs text-gray-700">{o.order_number}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{itemCount} item{itemCount !== 1 ? "s" : ""}</td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-gray-900">{formatUSD(Number(o.total))}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[0.60rem] uppercase tracking-[0.10em] font-medium rounded-sm ${STATUS_COLORS[o.status] ?? STATUS_COLORS.pending}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[o.status] ?? "bg-gray-400"}`} />
                        {o.status}
                      </span>
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

        {/* Mobile card list */}
        <div className="lg:hidden divide-y divide-gray-50">
          {customerOrders.map((o: any) => {
            const itemCount = Array.isArray(o.items)
              ? o.items.reduce((s: number, i: any) => s + (i.quantity ?? 1), 0) : 0;
            return (
              <button
                key={o.id}
                onClick={() => navigate({ to: "/admin/orders/$orderId", params: { orderId: String(o.id) } })}
                className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-semibold text-gray-800">{o.order_number}</span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[0.55rem] uppercase tracking-[0.08em] font-medium rounded-sm ${STATUS_COLORS[o.status] ?? STATUS_COLORS.pending}`}>
                      <span className={`w-1 h-1 rounded-full ${STATUS_DOT[o.status] ?? "bg-gray-400"}`} />
                      {o.status}
                    </span>
                  </div>
                  <p className="text-[0.65rem] text-gray-500">
                    {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {" · "}{itemCount} item{itemCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right shrink-0 flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{formatUSD(Number(o.total))}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
