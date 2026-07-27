import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  ArrowLeft, ChevronRight, Mail, MapPin, Phone, StickyNote, Plus, Trash2,
  Heart, Home, Loader2, ShoppingBag, Calendar, LogIn, User,
  MessageSquare, Send, Edit3, Check, X, RefreshCw, Package,
  Star, DollarSign, AlertCircle, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { listAdminOrders } from "@/lib/admin.functions";
import {
  getCustomerNotes, addCustomerNote, deleteCustomerNote,
  adminGetCustomerDetails, adminUpdateCustomerProfile,
  adminSendCustomerMessage, adminGetCustomerMessages, adminDeleteCustomerMessage,
} from "@/lib/admin-extended.functions";
import { useAdminToken } from "@/lib/admin-context";
import { formatUSD } from "@/lib/pricing";

export const Route = createFileRoute("/admin/customers/$customerId")({
  component: AdminCustomerDetail,
});

// ─── Shared status badge helpers ─────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-green-50 text-green-700 border border-green-200",
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

// ─── Section card wrapper ─────────────────────────────────────────────────────

function Section({
  icon: Icon, title, action, children, noPad,
}: {
  icon: React.ElementType; title: string; action?: React.ReactNode;
  children: React.ReactNode; noPad?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-100">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-gray-400" />
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-gray-600">{title}</p>
        </div>
        {action}
      </div>
      <div className={noPad ? "" : "px-5 py-4"}>{children}</div>
    </div>
  );
}

// ─── Profile Edit Panel ───────────────────────────────────────────────────────

function ProfileEditPanel({
  userId, profile, email, onSaved,
}: {
  userId: string; profile: any; email: string; onSaved: () => void;
}) {
  const token = useAdminToken();
  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [phone,    setPhone]    = useState(profile?.phone ?? "");
  const [saving,   setSaving]   = useState(false);
  const updateFn = useServerFn(adminUpdateCustomerProfile);

  const save = async () => {
    setSaving(true);
    try {
      await updateFn({ data: { token, userId, fullName, phone } });
      toast.success("Profile updated");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[0.55rem] uppercase tracking-[0.16em] text-gray-400 mb-1.5">Full Name</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)}
            className="w-full border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors" />
        </div>
        <div>
          <label className="block text-[0.55rem] uppercase tracking-[0.16em] text-gray-400 mb-1.5">Phone</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} type="tel"
            className="w-full border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors" />
        </div>
      </div>
      <div>
        <label className="block text-[0.55rem] uppercase tracking-[0.16em] text-gray-400 mb-1.5">Email (read-only)</label>
        <input value={email} readOnly
          className="w-full border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-400 cursor-not-allowed" />
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 text-white text-[0.60rem] uppercase tracking-[0.14em] hover:bg-gray-800 disabled:opacity-40 transition-colors">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─── Internal Notes ───────────────────────────────────────────────────────────

function CustomerNotes({ email }: { email: string }) {
  const token = useAdminToken();
  const queryClient = useQueryClient();
  const [note,     setNote]     = useState("");
  const [adding,   setAdding]   = useState(false);
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
      queryClient.invalidateQueries({ queryKey: ["customer-notes", email, token] });
      toast.success("Note added");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add note");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    setDeleting(noteId);
    try {
      await deleteFn({ data: { token, noteId } });
      queryClient.invalidateQueries({ queryKey: ["customer-notes", email, token] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete note");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Section icon={StickyNote} title="Internal Notes">
      <div className="flex gap-2 mb-4">
        <textarea value={note} onChange={e => setNote(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdd(); }}
          placeholder="Private note… (⌘↵ to add)" rows={2}
          className="flex-1 border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400 resize-none transition-colors" />
        <button onClick={handleAdd} disabled={adding || !note.trim()}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white text-[0.58rem] uppercase tracking-[0.12em] hover:bg-gray-800 disabled:opacity-40 self-start transition-colors">
          <Plus className="h-3 w-3" /> {adding ? "…" : "Add"}
        </button>
      </div>
      {isLoading ? (
        <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-10 bg-gray-50 animate-pulse" />)}</div>
      ) : notes.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-3">No notes</p>
      ) : (
        <div className="space-y-2">
          {notes.map((n: any) => (
            <div key={n.id} className="flex items-start gap-3 bg-gray-50 border border-gray-100 px-4 py-3 group">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{n.note}</p>
                <p className="text-[0.56rem] text-gray-400 mt-1">
                  {new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <button onClick={() => handleDelete(n.id)} disabled={deleting === n.id}
                className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40 shrink-0 mt-0.5">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

// ─── Messaging Panel ──────────────────────────────────────────────────────────

const MESSAGE_TYPES = [
  { v: "general",      l: "General" },
  { v: "order_update", l: "Order Update" },
  { v: "promotion",    l: "Promotion" },
  { v: "support",      l: "Support" },
];

function MessagingPanel({ email }: { email: string }) {
  const token = useAdminToken();
  const queryClient = useQueryClient();
  const [subject,     setSubject]     = useState("");
  const [body,        setBody]        = useState("");
  const [msgType,     setMsgType]     = useState("general");
  const [sending,     setSending]     = useState(false);
  const [deleting,    setDeleting]    = useState<string | null>(null);
  const [tab,         setTab]         = useState<"compose" | "history">("compose");

  const sendFn    = useServerFn(adminSendCustomerMessage);
  const fetchFn   = useServerFn(adminGetCustomerMessages);
  const deleteFn  = useServerFn(adminDeleteCustomerMessage);

  const { data, isLoading } = useQuery({
    queryKey: ["customer-messages", email, token],
    queryFn: () => fetchFn({ data: { token, email } }),
    enabled: tab === "history",
  });
  const messages: any[] = data?.messages ?? [];

  const send = async () => {
    if (!subject.trim() || !body.trim()) { toast.error("Subject and message are required"); return; }
    setSending(true);
    try {
      await sendFn({ data: { token, email, subject, body, message_type: msgType } });
      toast.success("Message sent — customer will see it on next login");
      setSubject(""); setBody("");
      queryClient.invalidateQueries({ queryKey: ["customer-messages", email, token] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteFn({ data: { token, messageId: id } });
      queryClient.invalidateQueries({ queryKey: ["customer-messages", email, token] });
      toast.success("Message deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Section icon={MessageSquare} title="Send Message">
      {/* Compose / History tabs */}
      <div className="flex border-b border-gray-100 -mx-5 -mt-4 mb-4 px-5">
        {(["compose", "history"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2.5 pt-1 mr-4 text-[0.60rem] uppercase tracking-[0.14em] border-b-2 transition-colors -mb-px ${tab === t ? "border-gray-900 text-gray-900 font-semibold" : "border-transparent text-gray-400"}`}>
            {t === "compose" ? "Compose" : `History${messages.length > 0 ? ` (${messages.length})` : ""}`}
          </button>
        ))}
      </div>

      {tab === "compose" ? (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {MESSAGE_TYPES.map(t => (
              <button key={t.v} onClick={() => setMsgType(t.v)}
                className={`px-2.5 py-1.5 text-[0.58rem] uppercase tracking-[0.10em] border transition-colors ${msgType === t.v ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}>
                {t.l}
              </button>
            ))}
          </div>
          <input value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="Subject line…"
            className="w-full border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors" />
          <textarea value={body} onChange={e => setBody(e.target.value)}
            placeholder="Write your message… This will appear in the customer's account inbox when they log in."
            rows={4}
            className="w-full border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors resize-none" />
          <div className="flex items-center gap-3">
            <button onClick={send} disabled={sending || !subject.trim() || !body.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 text-white text-[0.60rem] uppercase tracking-[0.14em] hover:bg-gray-800 disabled:opacity-40 transition-colors">
              {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              {sending ? "Sending…" : "Send to Inbox"}
            </button>
            <p className="text-[0.56rem] text-gray-400">Delivered to customer's account inbox on next login</p>
          </div>
        </div>
      ) : (
        <div>
          {isLoading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-50 animate-pulse" />)}</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-6">
              <MessageSquare className="h-6 w-6 text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No messages sent yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((m: any) => (
                <div key={m.id} className="border border-gray-100 px-4 py-3 group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-semibold text-gray-800 truncate">{m.subject}</p>
                        <span className="text-[0.52rem] uppercase tracking-[0.10em] text-gray-400 border border-gray-200 px-1.5 py-0.5 shrink-0">{m.message_type}</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{m.body}</p>
                      <p className="text-[0.55rem] text-gray-400 mt-1">
                        {new Date(m.sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <button onClick={() => handleDelete(m.id)} disabled={deleting === m.id}
                      className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40 shrink-0 mt-0.5">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

// ─── Saved Addresses ──────────────────────────────────────────────────────────

function AddressesPanel({ addresses }: { addresses: any[] }) {
  return (
    <Section icon={Home} title={`Saved Addresses${addresses.length > 0 ? ` · ${addresses.length}` : ""}`}>
      {addresses.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-2">No saved addresses</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {addresses.map((a: any) => (
            <div key={a.id} className="border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-600 relative">
              {a.is_default && (
                <span className="absolute top-2 right-2 text-[0.50rem] uppercase tracking-[0.12em] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5">
                  Default
                </span>
              )}
              <p className="font-semibold text-gray-800 text-sm mb-1 pr-14">{a.name}</p>
              <p className="text-gray-600">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
              <p className="text-gray-600">{a.city}, {a.state} {a.zip}</p>
              <p className="text-gray-500">{a.country}</p>
              {a.phone && <p className="text-gray-400 mt-0.5">{a.phone}</p>}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────

function WishlistPanel({ wishlist }: { wishlist: any[] }) {
  return (
    <Section icon={Heart} title={`Wishlist${wishlist.length > 0 ? ` · ${wishlist.length}` : ""}`} noPad>
      {wishlist.length === 0 ? (
        <div className="px-5 py-4 text-center">
          <p className="text-xs text-gray-400">Nothing saved to wishlist</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {wishlist.map((w: any) => (
            <div key={w.id} className="flex items-center gap-3 px-5 py-3">
              {w.product?.image_url
                ? <img src={w.product.image_url} alt="" className="w-10 h-10 object-cover bg-gray-100 shrink-0" />
                : <div className="w-10 h-10 bg-gray-100 shrink-0 flex items-center justify-center"><ShoppingBag className="h-4 w-4 text-gray-300" /></div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{w.product?.name ?? w.product_slug}</p>
                {w.product?.base_price && <p className="text-xs text-gray-400">{formatUSD(Number(w.product.base_price))}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[0.56rem] text-gray-400">{new Date(w.added_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                <Link to="/admin/products/$slug" params={{ slug: w.product_slug }}
                  className="text-[0.56rem] uppercase tracking-[0.08em] text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-0.5 justify-end mt-0.5">
                  View <ExternalLink className="h-2.5 w-2.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

// ─── Order History ────────────────────────────────────────────────────────────

function OrderHistory({ orders }: { orders: any[] }) {
  const navigate = useNavigate();
  return (
    <Section icon={Package} title={`Order History · ${orders.length} order${orders.length !== 1 ? "s" : ""}`} noPad>
      {orders.length === 0 ? (
        <div className="px-5 py-6 text-center"><p className="text-xs text-gray-400">No orders found</p></div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Order #", "Date", "Items", "Total", "Status", ""].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left text-[0.55rem] uppercase tracking-[0.14em] text-gray-400 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((o: any) => {
                  const itemCount = Array.isArray(o.items) ? o.items.reduce((s: number, i: any) => s + (i.quantity ?? 1), 0) : 0;
                  return (
                    <tr key={o.id} onClick={() => navigate({ to: "/admin/orders/$orderId", params: { orderId: String(o.id) } })}
                      className="hover:bg-gray-50/60 cursor-pointer group transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs text-gray-700">{o.order_number}</td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500">{itemCount} item{itemCount !== 1 ? "s" : ""}</td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-gray-900">{formatUSD(Number(o.total))}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[0.58rem] uppercase tracking-[0.08em] font-medium rounded-sm ${STATUS_COLORS[o.status] ?? STATUS_COLORS.pending}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[o.status] ?? "bg-gray-400"}`} />
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 pr-5 text-right">
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-600 inline-block" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-gray-50">
            {orders.map((o: any) => {
              const itemCount = Array.isArray(o.items) ? o.items.reduce((s: number, i: any) => s + (i.quantity ?? 1), 0) : 0;
              return (
                <button key={o.id}
                  onClick={() => navigate({ to: "/admin/orders/$orderId", params: { orderId: String(o.id) } })}
                  className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 text-left">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-semibold text-gray-800">{o.order_number}</span>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[0.53rem] uppercase tracking-[0.08em] font-medium rounded-sm ${STATUS_COLORS[o.status] ?? STATUS_COLORS.pending}`}>
                        <span className={`w-1 h-1 rounded-full ${STATUS_DOT[o.status] ?? "bg-gray-400"}`} />
                        {o.status}
                      </span>
                    </div>
                    <p className="text-[0.63rem] text-gray-500">
                      {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {itemCount} item{itemCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{formatUSD(Number(o.total))}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </Section>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function AdminCustomerDetail() {
  const token    = useAdminToken();
  const { customerId } = Route.useParams();

  let email = "";
  try { email = atob(customerId); } catch { /* invalid */ }

  const [editingProfile, setEditingProfile] = useState(false);
  const queryClient = useQueryClient();

  const fetchOrders  = useServerFn(listAdminOrders);
  const fetchDetails = useServerFn(adminGetCustomerDetails);

  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ["admin-orders-customers", token],
    queryFn: () => fetchOrders({ data: { token } }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: detailsData, isLoading: loadingDetails } = useQuery({
    queryKey: ["admin-customer-details", email, token],
    queryFn: () => fetchDetails({ data: { token, email } }),
    enabled: !!email,
    staleTime: 2 * 60 * 1000,
  });

  const { customer, orders: customerOrders } = useMemo(() => {
    const allOrders = ordersData?.orders ?? [];
    const orders = allOrders
      .filter((o: any) => (o.customer_email ?? "").toLowerCase() === email.toLowerCase())
      .sort((a: any, b: any) => b.created_at.localeCompare(a.created_at));

    if (!orders.length) return { customer: null, orders: [] };

    const first = orders[orders.length - 1];
    const last  = orders[0];
    const totalSpent = orders.reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);

    return {
      customer: {
        name:       last.customer_name ?? email,
        email,
        phone:      last.customer_phone ?? null,
        location:   [last.shipping_city, last.shipping_state, last.shipping_country].filter(Boolean).join(", "),
        totalSpent,
        avgOrder:   totalSpent / orders.length,
        firstOrder: first.created_at,
        lastOrder:  last.created_at,
        orderCount: orders.length,
      },
      orders,
    };
  }, [ordersData, email]);

  const isLoading  = loadingOrders;
  const profile    = detailsData?.profile ?? null;
  const userId     = detailsData?.userId ?? null;
  const addresses  = detailsData?.addresses ?? [];
  const wishlist   = detailsData?.wishlist ?? [];
  const hasAccount = !!userId;

  // Merge phone: auth profile phone wins over order phone
  const phone = profile?.phone || customer?.phone || null;
  // Displayed name: profile full name wins over order name
  const displayName = profile?.fullName || customer?.name || email;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 animate-pulse space-y-4 max-w-5xl">
        <div className="h-3 w-20 bg-gray-100 rounded" />
        <div className="h-36 bg-gray-100 rounded" />
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    );
  }

  if (!customer && !loadingDetails) {
    return (
      <div className="p-8 text-center max-w-sm mx-auto mt-16">
        <AlertCircle className="h-8 w-8 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-500 mb-1">Customer not found</p>
        <p className="text-xs text-gray-400 mb-5">No orders exist for this email address.</p>
        <Link to="/admin/customers"
          className="text-[0.65rem] uppercase tracking-[0.14em] text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to customers
        </Link>
      </div>
    );
  }

  if (!customer) return null;

  const initials = displayName.split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join("") || "?";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl space-y-5">
      {/* Back link */}
      <Link to="/admin/customers"
        className="inline-flex items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.14em] text-gray-400 hover:text-gray-700 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> All Customers
      </Link>

      {/* ── Customer Header ───────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-4 sm:gap-5">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 relative">
            <span className="text-lg font-semibold text-gray-500">{initials}</span>
            {hasAccount && (
              <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center" style={{ width: 18, height: 18 }}>
                <Check className="h-2.5 w-2.5 text-white" style={{ width: 10, height: 10 }} />
              </span>
            )}
          </div>

          {/* Name + contact */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
              <h1 className="text-xl font-semibold text-gray-900">{displayName}</h1>
              <span className={`text-[0.52rem] uppercase tracking-[0.14em] px-2 py-0.5 border ${hasAccount ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-400 border-gray-200"}`}>
                {hasAccount ? "Has Account" : "Guest"}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              <a href={`mailto:${email}`}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors">
                <Mail className="h-3 w-3 shrink-0" /> {email}
              </a>
              {phone && (
                <a href={`tel:${phone}`}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors">
                  <Phone className="h-3 w-3 shrink-0" /> {phone}
                </a>
              )}
              {customer.location && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin className="h-3 w-3 shrink-0" /> {customer.location}
                </span>
              )}
            </div>
            {profile && (
              <div className="flex flex-wrap gap-x-4 mt-2">
                {profile.createdAt && (
                  <span className="flex items-center gap-1 text-[0.58rem] text-gray-400">
                    <User className="h-2.5 w-2.5" />
                    Joined {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
                {profile.lastSignIn && (
                  <span className="flex items-center gap-1 text-[0.58rem] text-gray-400">
                    <LogIn className="h-2.5 w-2.5" />
                    Last login {new Date(profile.lastSignIn).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-5 sm:gap-8 shrink-0">
            {[
              { label: "Lifetime Value", value: formatUSD(customer.totalSpent), icon: DollarSign, gold: true },
              { label: "Avg Order",      value: formatUSD(customer.avgOrder),   icon: Star },
              { label: "Orders",         value: String(customer.orderCount),    icon: Package },
            ].map(({ label, value, icon: Icon, gold }) => (
              <div key={label} className="text-center">
                <p className="text-[0.52rem] uppercase tracking-[0.16em] text-gray-400 mb-1">{label}</p>
                <p className={`text-xl font-semibold leading-none ${gold ? "text-green-600" : "text-gray-900"}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Date strip */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            First order: <span className="text-gray-600 ml-1">{new Date(customer.firstOrder).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            Last order: <span className="text-gray-600 ml-1">{new Date(customer.lastOrder).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          </span>
          {!hasAccount && (
            <span className="flex items-center gap-1.5 text-green-500">
              <AlertCircle className="h-3 w-3" />
              Guest checkout — no account
            </span>
          )}
        </div>

        {/* Edit profile toggle (only if account exists) */}
        {hasAccount && userId && (
          <div className="mt-4">
            <button onClick={() => setEditingProfile(v => !v)}
              className="flex items-center gap-1.5 text-[0.60rem] uppercase tracking-[0.14em] text-gray-400 hover:text-gray-700 transition-colors border border-gray-200 px-3 py-2 hover:border-gray-400">
              {editingProfile ? <X className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
              {editingProfile ? "Cancel Edit" : "Edit Profile"}
            </button>
            {editingProfile && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <ProfileEditPanel
                  userId={userId}
                  profile={profile}
                  email={email}
                  onSaved={() => {
                    setEditingProfile(false);
                    queryClient.invalidateQueries({ queryKey: ["admin-customer-details", email, token] });
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading indicator for account details */}
      {loadingDetails && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading account details…
        </div>
      )}

      {/* ── Two-column grid: Addresses + Wishlist ─────────────────────────── */}
      {!loadingDetails && (hasAccount || addresses.length > 0 || wishlist.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AddressesPanel addresses={addresses} />
          <WishlistPanel wishlist={wishlist} />
        </div>
      )}

      {/* ── Messaging ─────────────────────────────────────────────────────── */}
      <MessagingPanel email={email} />

      {/* ── Internal Notes ────────────────────────────────────────────────── */}
      <CustomerNotes email={email} />

      {/* ── Order History ─────────────────────────────────────────────────── */}
      <OrderHistory orders={customerOrders} />
    </div>
  );
}
