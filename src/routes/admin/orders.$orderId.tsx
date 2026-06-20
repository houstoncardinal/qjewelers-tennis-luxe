import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import {
  ArrowLeft, Package, MapPin, Mail, Phone, Save,
  Copy, Check, ExternalLink, ChevronRight, Printer,
} from "lucide-react";
import { toast } from "sonner";
import { getAdminOrder, updateAdminOrder } from "@/lib/admin.functions";
import { useAdminToken } from "@/lib/admin-context";
import { formatUSD } from "@/lib/pricing";
import { getProductThumb } from "@/lib/product-images";

export const Route = createFileRoute("/admin/orders/$orderId")({
  component: AdminOrderDetail,
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

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"] as const;
const CARRIERS = ["", "USPS", "UPS", "FedEx", "DHL", "ShipBob", "Other"];

// Pipeline steps (for the timeline)
const PIPELINE_STEPS = ["pending", "processing", "shipped", "delivered"] as const;
type PipelineStep = typeof PIPELINE_STEPS[number];

// ─── Tracking URL ─────────────────────────────────────────────────────────────

function getTrackingUrl(carrier: string, trackingNumber: string): string | null {
  if (!trackingNumber) return null;
  const t = encodeURIComponent(trackingNumber);
  switch (carrier?.toUpperCase()) {
    case "USPS":
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`;
    case "UPS":
      return `https://www.ups.com/track?tracknum=${t}`;
    case "FEDEX":
      return `https://www.fedex.com/fedextrack/?trknbr=${t}`;
    case "DHL":
      return `https://www.dhl.com/us-en/home/tracking/tracking-parcel.html?submit=1&tracking-id=${t}`;
    default:
      return null;
  }
}

// ─── Next logical status ──────────────────────────────────────────────────────

function getNextStatus(current: string): string | null {
  const flow: Record<string, string> = {
    pending:    "processing",
    processing: "shipped",
    shipped:    "delivered",
  };
  return flow[current] ?? null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[0.62rem] uppercase tracking-[0.10em] font-medium rounded-sm ${STATUS_COLORS[status] ?? STATUS_COLORS.pending}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] ?? "bg-gray-400"}`} />
      {status}
    </span>
  );
}

function InfoBlock({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-[0.55rem] uppercase tracking-[0.18em] text-gray-400 mb-0.5">{label}</dt>
      <dd className="text-sm text-gray-700">{value || "—"}</dd>
    </div>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button
      onClick={copy}
      title={label}
      className="inline-flex items-center gap-1 text-gray-300 hover:text-gray-600 transition-colors"
    >
      {copied
        ? <Check className="h-3.5 w-3.5 text-emerald-500" />
        : <Copy className="h-3.5 w-3.5" />
      }
    </button>
  );
}

// ─── Status Timeline ──────────────────────────────────────────────────────────

function StatusTimeline({ status }: { status: string }) {
  const isCancelled = status === "cancelled" || status === "refunded";
  const currentIdx = PIPELINE_STEPS.indexOf(status as PipelineStep);

  if (isCancelled) {
    return (
      <div className="bg-white border border-gray-100 px-6 py-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center">
            <span className="text-red-500 text-xs font-bold">✕</span>
          </div>
          <div>
            <p className="text-sm font-medium text-red-700 capitalize">{status}</p>
            <p className="text-[0.65rem] text-gray-400 mt-0.5">This order has been {status}.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 px-6 py-5 mb-6 overflow-x-auto">
      <div className="flex items-center min-w-max">
        {PIPELINE_STEPS.map((step, i) => {
          const isPast = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isFuture = i > currentIdx;

          return (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                  isCurrent
                    ? "border-gray-900 bg-gray-900"
                    : isPast
                    ? "border-emerald-400 bg-emerald-400"
                    : "border-gray-200 bg-white"
                }`}>
                  {isPast ? (
                    <Check className="h-3.5 w-3.5 text-white" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-white" />
                  ) : null}
                </div>
                <span className={`text-[0.58rem] uppercase tracking-[0.12em] whitespace-nowrap ${
                  isCurrent ? "text-gray-900 font-semibold"
                  : isPast ? "text-emerald-600"
                  : "text-gray-300"
                }`}>
                  {step}
                </span>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div className={`w-16 lg:w-24 h-px mx-2 mb-5 ${isPast ? "bg-emerald-300" : "bg-gray-100"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Quick Action Buttons ─────────────────────────────────────────────────────

function QuickActions({
  currentStatus,
  onAction,
  saving,
}: {
  currentStatus: string;
  onAction: (newStatus: string) => void;
  saving: boolean;
}) {
  const nextStatus = getNextStatus(currentStatus);
  const isTerminal = currentStatus === "cancelled" || currentStatus === "refunded" || currentStatus === "delivered";

  if (isTerminal) return null;

  return (
    <div className="flex items-center gap-2 mb-6">
      {nextStatus && (
        <button
          onClick={() => onAction(nextStatus)}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-[0.65rem] uppercase tracking-[0.14em] hover:bg-gray-800 transition-colors disabled:opacity-40"
        >
          <ChevronRight className="h-3.5 w-3.5" />
          Mark {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
        </button>
      )}
      <button
        onClick={() => onAction("cancelled")}
        disabled={saving}
        className="flex items-center gap-1.5 px-4 py-2 bg-white text-red-600 border border-red-200 text-[0.65rem] uppercase tracking-[0.14em] hover:bg-red-50 transition-colors disabled:opacity-40"
      >
        Cancel Order
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function AdminOrderDetail() {
  const token = useAdminToken();
  const { orderId } = Route.useParams();
  const queryClient = useQueryClient();

  const fetchOrder = useServerFn(getAdminOrder);
  const updateOrderFn = useServerFn(updateAdminOrder);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-order", token, orderId],
    queryFn: () => fetchOrder({ data: { token, orderId } }),
    enabled: !!orderId,
  });

  const [status, setStatus] = useState<typeof STATUSES[number]>("pending");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingCarrier, setTrackingCarrier] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const order = data?.order as any;

  useEffect(() => {
    if (order) {
      setStatus(order.status ?? "pending");
      setTrackingNumber(order.tracking_number ?? "");
      setTrackingCarrier(order.tracking_carrier ?? "");
      setAdminNotes(order.admin_notes ?? "");
    }
  }, [order]);

  const save = async (overrideStatus?: string) => {
    setSaving(true);
    const newStatus = overrideStatus ?? status;
    try {
      await updateOrderFn({
        data: {
          token,
          orderId,
          status: newStatus,
          tracking_number: trackingNumber,
          tracking_carrier: trackingCarrier,
          admin_notes: adminNotes,
        },
      });
      if (overrideStatus) {
        setStatus(overrideStatus as typeof STATUSES[number]);
      }
      await queryClient.invalidateQueries({ queryKey: ["admin-order", token, orderId] });
      await queryClient.invalidateQueries({ queryKey: ["admin-orders", token] });
      await queryClient.invalidateQueries({ queryKey: ["admin-orders-recent", token] });
      toast.success("Order updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update order");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4 max-w-5xl">
          <div className="h-4 w-24 bg-gray-100 rounded" />
          <div className="h-14 bg-gray-100 rounded" />
          <div className="h-20 bg-gray-100 rounded" />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="h-40 bg-gray-100 rounded" />
            <div className="h-40 bg-gray-100 rounded" />
          </div>
          <div className="h-52 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 text-center max-w-md mx-auto mt-16">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Package className="h-5 w-5 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 mb-4">Order not found or failed to load.</p>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.14em] text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to orders
        </Link>
      </div>
    );
  }

  const items: any[] = Array.isArray(order.items) ? order.items : [];
  const trackingUrl = getTrackingUrl(order.tracking_carrier, order.tracking_number);

  const printInvoice = () => {
    const addr = [
      order.shipping_address_line1,
      order.shipping_address_line2,
      `${order.shipping_city}, ${order.shipping_state} ${order.shipping_zip}`,
      order.shipping_country,
    ].filter(Boolean).join("<br>");

    const itemRows = items.map((item: any) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;">
          <div style="font-weight:600;font-size:14px;">${item.name}</div>
          <div style="color:#666;font-size:12px;margin-top:2px;">${[item.color, item.size, item.length].filter(Boolean).join(" · ")}</div>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;font-size:14px;">${item.quantity ?? 1}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-size:14px;">${formatUSD(Number(item.unitPrice))}</td>
        <td style="padding:10px 0 10px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600;font-size:14px;">${formatUSD(Number(item.unitPrice) * (item.quantity ?? 1))}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html><head>
      <title>Invoice · ${order.order_number}</title>
      <style>
        body{font-family:Georgia,serif;margin:0;padding:40px;color:#111;max-width:700px;margin:0 auto;}
        @media print{body{padding:20px;}}
        h1{margin:0;font-size:26px;letter-spacing:-0.5px;}
        .meta{font-size:12px;color:#666;margin-top:4px;}
        .section{margin-top:32px;}
        .label{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#999;margin-bottom:6px;}
        table{width:100%;border-collapse:collapse;}
        th{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#999;text-align:left;padding:0 0 8px;}
        th:nth-child(2){text-align:center;}th:nth-child(3),th:nth-child(4){text-align:right;}
        .total-row{font-size:18px;font-weight:700;border-top:2px solid #111!important;padding-top:12px!important;}
        .badge{display:inline-block;padding:2px 10px;background:#f0f0f0;font-size:11px;letter-spacing:1px;text-transform:uppercase;}
      </style>
    </head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#999;margin-bottom:8px;">Qureshi Jewelers</div>
          <h1>Invoice</h1>
          <div class="meta">${order.order_number} · <span class="badge">${order.status}</span></div>
          <div class="meta" style="margin-top:4px;">Date: ${new Date(order.created_at).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>
        </div>
        <div style="text-align:right;font-size:13px;color:#555;">
          <div style="font-weight:700;color:#111;margin-bottom:4px;">${order.customer_name}</div>
          <div>${order.customer_email}</div>
          ${order.customer_phone ? `<div>${order.customer_phone}</div>` : ""}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:32px;">
        <div><div class="label">Ship to</div><div style="font-size:13px;line-height:1.6;">${addr}</div></div>
        ${order.tracking_number ? `<div><div class="label">Tracking</div><div style="font-size:13px;">${order.tracking_carrier ? order.tracking_carrier + " · " : ""}${order.tracking_number}</div></div>` : ""}
      </div>
      <div class="section">
        <table>
          <thead><tr>
            <th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Unit Price</th><th style="text-align:right;padding-left:12px;">Total</th>
          </tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div style="margin-top:16px;text-align:right;font-size:13px;">
          <div style="margin-bottom:4px;color:#666;">Subtotal: <strong>${formatUSD(Number(order.subtotal))}</strong></div>
          ${Number(order.discount_amount ?? 0) > 0 ? `<div style="margin-bottom:4px;color:#666;">Discount (${order.promo_code ?? ""}): <strong style="color:#059669;">−${formatUSD(Number(order.discount_amount))}</strong></div>` : ""}
          <div style="margin-bottom:4px;color:#666;">Shipping: <strong>${Number(order.shipping) === 0 ? "Free" : formatUSD(Number(order.shipping))}</strong></div>
          ${Number(order.tax ?? 0) > 0 ? `<div style="margin-bottom:4px;color:#666;">Tax: <strong>${formatUSD(Number(order.tax))}</strong></div>` : ""}
          <div style="margin-top:12px;padding-top:12px;border-top:2px solid #111;font-size:18px;font-weight:700;">Total: ${formatUSD(Number(order.total))}</div>
        </div>
      </div>
      ${order.notes ? `<div class="section"><div class="label">Order Notes</div><div style="font-size:13px;color:#555;">${order.notes}</div></div>` : ""}
      <div style="margin-top:48px;padding-top:20px;border-top:1px solid #eee;font-size:11px;color:#aaa;text-align:center;">
        Thank you for your order · Qureshi Jewelers · support@qureshijewelers.com
      </div>
    </body></html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-5xl">
        {/* Back link */}
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.14em] text-gray-400 hover:text-gray-700 transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Orders
        </Link>

        {/* Title row */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-semibold text-gray-900 font-mono">{order.order_number}</h1>
              <CopyButton text={order.order_number} label="Copy order number" />
              <StatusBadge status={order.status} />
            </div>
            <p className="text-[0.72rem] text-gray-400">
              Placed{" "}
              {new Date(order.created_at).toLocaleString("en-US", {
                month: "long", day: "numeric", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
          <button
            onClick={printInvoice}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-[0.62rem] uppercase tracking-[0.12em] hover:border-gray-400 hover:text-gray-900 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" /> Print Invoice
          </button>
        </div>

        {/* Status timeline */}
        <StatusTimeline status={order.status} />

        {/* Quick action buttons */}
        <QuickActions currentStatus={order.status} onAction={save} saving={saving} />

        {/* 2-column layout */}
        <div className="grid lg:grid-cols-5 gap-5">
          {/* Left column: customer + shipping + items */}
          <div className="lg:col-span-3 space-y-5">
            {/* Customer card */}
            <div className="bg-white border border-gray-100 p-5">
              <p className="text-[0.58rem] uppercase tracking-[0.18em] text-gray-400 mb-4 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" /> Customer
              </p>
              <dl className="space-y-3">
                <InfoBlock label="Name" value={order.customer_name} />
                <div>
                  <dt className="text-[0.55rem] uppercase tracking-[0.18em] text-gray-400 mb-0.5">Email</dt>
                  <dd className="text-sm text-gray-700 flex items-center gap-2">
                    {order.customer_email || "—"}
                    {order.customer_email && <CopyButton text={order.customer_email} label="Copy email" />}
                  </dd>
                </div>
                {order.customer_phone && (
                  <div>
                    <dt className="text-[0.55rem] uppercase tracking-[0.18em] text-gray-400 mb-0.5 flex items-center gap-1.5">
                      <Phone className="h-3 w-3" /> Phone
                    </dt>
                    <dd className="text-sm text-gray-700">{order.customer_phone}</dd>
                  </div>
                )}
                {order.notes && <InfoBlock label="Order Notes" value={order.notes} />}
              </dl>
            </div>

            {/* Shipping card */}
            <div className="bg-white border border-gray-100 p-5">
              <p className="text-[0.58rem] uppercase tracking-[0.18em] text-gray-400 mb-4 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> Shipping Address
              </p>
              <dl className="space-y-3">
                <InfoBlock
                  label="Street"
                  value={[order.shipping_address_line1, order.shipping_address_line2].filter(Boolean).join(", ")}
                />
                <InfoBlock
                  label="City / State / ZIP"
                  value={`${order.shipping_city ?? ""}, ${order.shipping_state ?? ""} ${order.shipping_zip ?? ""}`.trim()}
                />
                <InfoBlock label="Country" value={order.shipping_country} />
                {order.tracking_number && (
                  <div>
                    <dt className="text-[0.55rem] uppercase tracking-[0.18em] text-gray-400 mb-0.5">Tracking</dt>
                    <dd className="text-sm text-gray-700 flex items-center gap-2 flex-wrap">
                      <span className="font-mono">
                        {order.tracking_carrier ? `${order.tracking_carrier} · ` : ""}
                        {order.tracking_number}
                      </span>
                      <CopyButton text={order.tracking_number} label="Copy tracking number" />
                      {trackingUrl && (
                        <a
                          href={trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[0.62rem] uppercase tracking-[0.10em] text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Track Package <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Order items */}
            <div className="bg-white border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-50">
                <p className="text-[0.58rem] uppercase tracking-[0.18em] text-gray-400 flex items-center gap-2">
                  <Package className="h-3.5 w-3.5" /> Order Items
                </p>
              </div>
              <div className="divide-y divide-gray-50">
                {items.map((item: any, i: number) => (
                  <div key={i} className="px-5 py-4 flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-50 border border-gray-100 shrink-0 overflow-hidden">
                      <img
                        src={getProductThumb(item.slug ?? "")}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{item.name}</p>
                      {(item.color || item.size || item.length) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {[item.color, item.size, item.length].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity ?? 1}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {formatUSD(Number(item.unitPrice) * (item.quantity ?? 1))}
                      </p>
                      <p className="text-[0.62rem] text-gray-400 mt-0.5">
                        {formatUSD(Number(item.unitPrice))} ea
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatUSD(Number(order.subtotal))}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Shipping</span>
                  <span>{Number(order.shipping) === 0 ? "Free" : formatUSD(Number(order.shipping))}</span>
                </div>
                {Number(order.tax) > 0 && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Tax</span>
                    <span>{formatUSD(Number(order.tax))}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold text-gray-900 pt-2 border-t border-gray-200 mt-1">
                  <span>Total</span>
                  <span>{formatUSD(Number(order.total))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: update form */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white border border-gray-100 p-5">
              <p className="text-[0.58rem] uppercase tracking-[0.18em] text-gray-400 mb-5">Update Order</p>

              <div className="space-y-4">
                {/* Status */}
                <div>
                  <label className="block text-[0.60rem] uppercase tracking-[0.14em] text-gray-400 mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as typeof STATUSES[number])}
                    className="w-full border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors bg-white"
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Carrier */}
                <div>
                  <label className="block text-[0.60rem] uppercase tracking-[0.14em] text-gray-400 mb-1.5">
                    Carrier
                  </label>
                  <select
                    value={trackingCarrier}
                    onChange={e => setTrackingCarrier(e.target.value)}
                    className="w-full border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors bg-white"
                  >
                    {CARRIERS.map(c => (
                      <option key={c} value={c}>{c || "— Select carrier —"}</option>
                    ))}
                  </select>
                </div>

                {/* Tracking number */}
                <div>
                  <label className="block text-[0.60rem] uppercase tracking-[0.14em] text-gray-400 mb-1.5">
                    Tracking Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={e => setTrackingNumber(e.target.value)}
                      placeholder="e.g. 1Z999AA10123456784"
                      className="w-full border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors font-mono pr-9"
                    />
                    {trackingNumber && (
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        <CopyButton text={trackingNumber} label="Copy tracking" />
                      </div>
                    )}
                  </div>
                  {trackingNumber && trackingCarrier && (() => {
                    const url = getTrackingUrl(trackingCarrier, trackingNumber);
                    return url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1.5 text-[0.60rem] uppercase tracking-[0.10em] text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Track Package <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null;
                  })()}
                </div>

                {/* Admin notes */}
                <div>
                  <label className="block text-[0.60rem] uppercase tracking-[0.14em] text-gray-400 mb-1.5">
                    Admin Notes
                    <span className="ml-1 normal-case text-gray-300">(internal only)</span>
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    placeholder="Internal notes — not visible to customer"
                    rows={4}
                    className="w-full border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100">
                <button
                  onClick={() => save()}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 text-[0.65rem] uppercase tracking-[0.16em] hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
