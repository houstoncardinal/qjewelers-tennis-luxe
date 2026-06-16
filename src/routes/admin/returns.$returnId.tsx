import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { getReturn, updateReturn } from "@/lib/admin-extended.functions";
import { useAdminToken } from "@/lib/admin-context";
import { formatUSD } from "@/lib/pricing";

export const Route = createFileRoute("/admin/returns/$returnId")({
  component: AdminReturnDetail,
});

const STATUS_COLORS: Record<string, string> = {
  pending:      "bg-amber-50 text-amber-700 border border-amber-200",
  approved:     "bg-blue-50 text-blue-700 border border-blue-200",
  shipped_back: "bg-violet-50 text-violet-700 border border-violet-200",
  refunded:     "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rejected:     "bg-red-50 text-red-700 border border-red-200",
};

const STATUSES = ["pending", "approved", "shipped_back", "refunded", "rejected"] as const;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      className="inline-flex items-center gap-1 text-gray-300 hover:text-gray-600 transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

const RETURN_PIPELINE = ["pending", "approved", "shipped_back", "refunded"] as const;

function ReturnTimeline({ status }: { status: string }) {
  const rejected = status === "rejected";
  const currentIdx = RETURN_PIPELINE.indexOf(status as any);

  if (rejected) {
    return (
      <div className="bg-white border border-gray-100 px-6 py-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center">
            <span className="text-red-500 text-xs font-bold">✕</span>
          </div>
          <div>
            <p className="text-sm font-medium text-red-700">Return Rejected</p>
            <p className="text-[0.65rem] text-gray-400 mt-0.5">This return request has been rejected.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 px-6 py-5 mb-6 overflow-x-auto">
      <div className="flex items-center min-w-max">
        {RETURN_PIPELINE.map((step, i) => {
          const isPast    = i < currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${
                  isCurrent ? "border-gray-900 bg-gray-900"
                  : isPast   ? "border-emerald-400 bg-emerald-400"
                  : "border-gray-200 bg-white"
                }`}>
                  {isPast    ? <Check className="h-3.5 w-3.5 text-white" /> :
                   isCurrent ? <span className="w-2 h-2 rounded-full bg-white" /> : null}
                </div>
                <span className={`text-[0.58rem] uppercase tracking-[0.12em] whitespace-nowrap ${
                  isCurrent ? "text-gray-900 font-semibold"
                  : isPast  ? "text-emerald-600"
                  : "text-gray-300"
                }`}>{step.replace("_", " ")}</span>
              </div>
              {i < RETURN_PIPELINE.length - 1 && (
                <div className={`w-16 lg:w-20 h-px mx-2 mb-5 ${isPast ? "bg-emerald-300" : "bg-gray-100"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminReturnDetail() {
  const token = useAdminToken();
  const { returnId } = Route.useParams();
  const queryClient = useQueryClient();
  const fetchReturn  = useServerFn(getReturn);
  const updateFn     = useServerFn(updateReturn);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-return", token, returnId],
    queryFn: () => fetchReturn({ data: { token, returnId } }),
    enabled: !!token && !!returnId,
  });

  const [status,         setStatus]         = useState<string>("pending");
  const [refundAmount,   setRefundAmount]    = useState("");
  const [trackingNumber, setTrackingNumber]  = useState("");
  const [adminNotes,     setAdminNotes]      = useState("");
  const [saving,         setSaving]          = useState(false);

  const ret = (data as any)?.return as any;

  useEffect(() => {
    if (ret) {
      setStatus(ret.status ?? "pending");
      setRefundAmount(ret.refund_amount != null ? String(ret.refund_amount) : "");
      setTrackingNumber(ret.tracking_number ?? "");
      setAdminNotes(ret.admin_notes ?? "");
    }
  }, [ret]);

  const save = async (overrideStatus?: string) => {
    setSaving(true);
    try {
      await updateFn({
        data: {
          token,
          returnId,
          status: overrideStatus ?? status,
          refund_amount: refundAmount !== "" ? Number(refundAmount) : null,
          tracking_number: trackingNumber,
          admin_notes: adminNotes,
        },
      });
      if (overrideStatus) setStatus(overrideStatus);
      await queryClient.invalidateQueries({ queryKey: ["admin-return", token, returnId] });
      await queryClient.invalidateQueries({ queryKey: ["admin-returns", token] });
      toast.success("Return updated");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 animate-pulse space-y-4 max-w-4xl">
        <div className="h-3 w-16 bg-gray-100 rounded" />
        <div className="h-16 bg-gray-100 rounded" />
        <div className="h-20 bg-gray-100 rounded" />
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-64 bg-gray-100 rounded" />
          <div className="h-64 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (error || !ret) {
    return (
      <div className="p-8 text-center max-w-sm mx-auto mt-16">
        <p className="text-sm text-gray-400 mb-4">Return not found.</p>
        <Link to="/admin/returns" className="text-[0.65rem] uppercase tracking-[0.14em] text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to returns
        </Link>
      </div>
    );
  }

  const items: any[] = Array.isArray(ret.items) ? ret.items : [];

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <Link
        to="/admin/returns"
        className="inline-flex items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.14em] text-gray-400 hover:text-gray-700 transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Returns
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold text-gray-900 font-mono">{ret.order_number}</h1>
            <CopyButton text={ret.order_number} />
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[0.62rem] uppercase tracking-[0.10em] font-medium rounded-sm ${STATUS_COLORS[ret.status] ?? STATUS_COLORS.pending}`}>
              {ret.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-[0.72rem] text-gray-400">
            Submitted {new Date(ret.created_at).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <Link
          to="/admin/orders/$orderId"
          params={{ orderId: ret.order_id ?? "" }}
          className="inline-flex items-center gap-1 text-[0.62rem] uppercase tracking-[0.14em] text-gray-500 border border-gray-200 px-3.5 py-2 hover:border-gray-400 hover:text-gray-800 transition-colors"
        >
          <ExternalLink className="h-3 w-3" /> View Order
        </Link>
      </div>

      <ReturnTimeline status={ret.status} />

      {/* Quick actions */}
      {ret.status === "pending" && (
        <div className="flex gap-2 mb-6">
          <button onClick={() => save("approved")} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-[0.65rem] uppercase tracking-[0.14em] hover:bg-gray-800 transition-colors disabled:opacity-40">
            Approve Return
          </button>
          <button onClick={() => save("rejected")} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-white text-red-600 border border-red-200 text-[0.65rem] uppercase tracking-[0.14em] hover:bg-red-50 transition-colors disabled:opacity-40">
            Reject
          </button>
        </div>
      )}
      {ret.status === "approved" && (
        <div className="flex gap-2 mb-6">
          <button onClick={() => save("shipped_back")} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-[0.65rem] uppercase tracking-[0.14em] hover:bg-gray-800 transition-colors disabled:opacity-40">
            Mark Item Received
          </button>
        </div>
      )}
      {ret.status === "shipped_back" && (
        <div className="flex gap-2 mb-6">
          <button onClick={() => save("refunded")} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-[0.65rem] uppercase tracking-[0.14em] hover:bg-emerald-700 transition-colors disabled:opacity-40">
            Mark Refunded
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Left: details */}
        <div className="lg:col-span-3 space-y-5">
          {/* Customer */}
          <div className="bg-white border border-gray-100 p-5">
            <p className="text-[0.58rem] uppercase tracking-[0.18em] text-gray-400 mb-4">Customer</p>
            <dl className="space-y-2.5">
              <div>
                <dt className="text-[0.55rem] uppercase tracking-[0.18em] text-gray-400 mb-0.5">Name</dt>
                <dd className="text-sm text-gray-700">{ret.customer_name || "—"}</dd>
              </div>
              <div>
                <dt className="text-[0.55rem] uppercase tracking-[0.18em] text-gray-400 mb-0.5">Email</dt>
                <dd className="text-sm text-gray-700 flex items-center gap-2">
                  {ret.customer_email || "—"}
                  {ret.customer_email && <CopyButton text={ret.customer_email} />}
                </dd>
              </div>
            </dl>
          </div>

          {/* Reason */}
          <div className="bg-white border border-gray-100 p-5">
            <p className="text-[0.58rem] uppercase tracking-[0.18em] text-gray-400 mb-3">Return Reason</p>
            <p className="text-sm text-gray-700">{ret.reason || "—"}</p>
          </div>

          {/* Items */}
          {items.length > 0 && (
            <div className="bg-white border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-50">
                <p className="text-[0.58rem] uppercase tracking-[0.18em] text-gray-400">Items Requested for Return</p>
              </div>
              <div className="divide-y divide-gray-50">
                {items.map((item: any, i: number) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between">
                    <span className="text-sm text-gray-700">{item.name}</span>
                    <span className="text-xs text-gray-500">Qty: {item.quantity ?? 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: update form */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-100 p-5">
            <p className="text-[0.58rem] uppercase tracking-[0.18em] text-gray-400 mb-5">Update Return</p>
            <div className="space-y-4">
              <div>
                <label className="block text-[0.60rem] uppercase tracking-[0.14em] text-gray-400 mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors bg-white"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s.replace("_", " ").replace(/^\w/, c => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[0.60rem] uppercase tracking-[0.14em] text-gray-400 mb-1.5">Refund Amount ($)</label>
                <input
                  type="number" min={0} step={0.01}
                  value={refundAmount}
                  onChange={e => setRefundAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[0.60rem] uppercase tracking-[0.14em] text-gray-400 mb-1.5">Customer Return Tracking</label>
                <div className="relative">
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    placeholder="Tracking # of customer's return shipment"
                    className="w-full border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors font-mono pr-9"
                  />
                  {trackingNumber && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      <CopyButton text={trackingNumber} />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[0.60rem] uppercase tracking-[0.14em] text-gray-400 mb-1.5">
                  Admin Notes <span className="normal-case text-gray-300 ml-1">(internal)</span>
                </label>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  rows={4}
                  placeholder="Internal notes…"
                  className="w-full border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <button
                onClick={() => save()}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 text-[0.65rem] uppercase tracking-[0.16em] hover:bg-gray-800 transition-colors disabled:opacity-40"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
