import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Search, Package, Truck, CheckCircle, Clock, XCircle,
  Check, MapPin, RefreshCw, ChevronLeft,
} from "lucide-react";
import { lookupOrder } from "@/lib/admin.functions";
import { formatUSD } from "@/lib/pricing";

export const Route = createFileRoute("/track-order")({
  component: TrackOrder,
  head: () => ({
    meta: [
      { title: "Track Your Order — Qureshi Jewelers" },
      { name: "description", content: "Look up your Qureshi Jewelers order status using your email and order number." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const STATUS_CONFIG = {
  pending:    { label: "Order Received", color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200",  icon: Clock },
  processing: { label: "Processing",     color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200",   icon: Package },
  shipped:    { label: "Shipped",        color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", icon: Truck },
  delivered:  { label: "Delivered",      color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200",  icon: CheckCircle },
  cancelled:  { label: "Cancelled",      color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200",    icon: XCircle },
  refunded:   { label: "Refunded",       color: "text-gray-600",   bg: "bg-gray-50",   border: "border-gray-200",   icon: RefreshCw },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

const STATUS_STEPS = [
  { key: "pending" as const,    label: "Order Received" },
  { key: "processing" as const, label: "Processing" },
  { key: "shipped" as const,    label: "Shipped" },
  { key: "delivered" as const,  label: "Delivered" },
];

function TrackOrder() {
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const lookup = useServerFn(lookupOrder);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !orderNumber) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await lookup({ data: { email: email.trim(), orderNumber: orderNumber.trim() } });
      setResult(data.order);
    } catch {
      setError("Order not found. Please check your email address and order number.");
    } finally {
      setLoading(false);
    }
  };

  const status = result?.status as StatusKey | undefined;
  const cfg = status ? (STATUS_CONFIG[status] ?? STATUS_CONFIG.pending) : null;
  const StatusIcon = cfg?.icon ?? Clock;
  const activeStep = STATUS_STEPS.findIndex((s) => s.key === (status ?? "pending"));
  const isTerminated = status === "cancelled" || status === "refunded";

  const labelCls = "block text-[0.6rem] uppercase tracking-[0.2em] font-medium text-muted-foreground mb-1.5";
  const inputCls = "w-full border border-[#ddd8d0] bg-white px-4 py-3.5 text-sm focus:outline-none focus:border-foreground transition-colors";

  return (
    <div className="bg-[#faf9f7] min-h-screen">
      <div className="border-b border-[#ece8e0] bg-white">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-4 sm:py-6">
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to Shop
          </Link>
          <div className="mt-3">
            <p className="eyebrow">Order Tracking</p>
            <h1 className="font-display text-3xl sm:text-4xl mt-1.5">Track Your Order</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-10">
        {/* Lookup form */}
        <div className="border border-[#e5e1d9] bg-white">
          <div className="px-6 sm:px-8 py-4 border-b border-[#f0ece4]">
            <p className="text-[0.6rem] uppercase tracking-[0.2em] font-medium text-muted-foreground">
              Look Up Your Order
            </p>
          </div>
          <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-5 sm:py-6 space-y-4">
            <div>
              <label className={labelCls}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Order Number</label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                required
                placeholder="QJ-XXXXXXXX"
                className={`${inputCls} font-mono`}
              />
              <p className="mt-1.5 text-[0.58rem] text-muted-foreground/60 uppercase tracking-[0.14em]">
                Found in your confirmation email
              </p>
            </div>

            {error && (
              <div className="border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !orderNumber}
              className="w-full bg-foreground text-background py-4 text-[0.65rem] uppercase tracking-[0.20em] hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              {loading ? "Looking Up…" : "Track Order"}
            </button>
          </form>
        </div>

        {/* Results */}
        {result && cfg && (
          <div className="mt-5 space-y-4">
            {/* Status banner */}
            <div className={`border ${cfg.border} ${cfg.bg} px-5 sm:px-6 py-4 flex items-center gap-4`}>
              <div
                className={`w-10 h-10 rounded-full border ${cfg.border} flex items-center justify-center shrink-0 bg-white`}
              >
                <StatusIcon className={`h-5 w-5 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Order {result.order_number}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">{formatUSD(Number(result.total))}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(result.created_at).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Progress timeline */}
            {!isTerminated && (
              <div className="border border-[#e5e1d9] bg-white">
                <div className="px-5 sm:px-6 py-4 border-b border-[#f0ece4]">
                  <p className="text-[0.6rem] uppercase tracking-[0.2em] font-medium text-muted-foreground">
                    Order Progress
                  </p>
                </div>
                <div className="px-5 sm:px-6 py-5">
                  {STATUS_STEPS.map((step, i) => {
                    const completed = i <= activeStep;
                    const current = i === activeStep;
                    const last = i === STATUS_STEPS.length - 1;
                    return (
                      <div key={step.key} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                              completed
                                ? "bg-foreground"
                                : "border-2 border-[#d8d3cb] bg-white"
                            } ${current ? "ring-4 ring-foreground/10" : ""}`}
                          >
                            {completed ? (
                              <Check className="w-3 h-3 text-background" strokeWidth={3} />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-[#d0ccc6]" />
                            )}
                          </div>
                          {!last && (
                            <div
                              className={`w-px flex-1 my-1 ${i < activeStep ? "bg-foreground" : "bg-[#e8e4de]"}`}
                              style={{ minHeight: 24 }}
                            />
                          )}
                        </div>
                        <div className={!last ? "pb-5" : ""}>
                          <p className={`text-sm ${completed ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                            {step.label}
                          </p>
                          {current && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Currently at this stage
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tracking number */}
            {result.tracking_number && (
              <div className="border border-[#e5e1d9] bg-white px-5 sm:px-6 py-4 sm:py-5">
                <p className="text-[0.6rem] uppercase tracking-[0.2em] font-medium text-muted-foreground mb-3">
                  Tracking Information
                </p>
                <div className="flex items-start gap-3">
                  <Truck className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    {result.tracking_carrier && (
                      <p className="text-xs text-muted-foreground mb-0.5">{result.tracking_carrier}</p>
                    )}
                    <p className="text-sm font-mono font-medium">{result.tracking_number}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping destination */}
            <div className="border border-[#e5e1d9] bg-white px-5 sm:px-6 py-4 sm:py-5">
              <p className="text-[0.6rem] uppercase tracking-[0.2em] font-medium text-muted-foreground mb-3">
                Shipping To
              </p>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">
                  {[result.shipping_city, result.shipping_state, result.shipping_country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </div>

            {/* Items */}
            {Array.isArray(result.items) && result.items.length > 0 && (
              <div className="border border-[#e5e1d9] bg-white">
                <div className="px-5 sm:px-6 py-4 border-b border-[#f0ece4]">
                  <p className="text-[0.6rem] uppercase tracking-[0.2em] font-medium text-muted-foreground">
                    {result.items.length} Item{result.items.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="divide-y divide-[#f5f2ee]">
                  {result.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between px-5 sm:px-6 py-3.5">
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {[item.size, item.length, item.color].filter(Boolean).join(" · ")}
                          {item.quantity > 1 && ` · Qty ${item.quantity}`}
                        </p>
                      </div>
                      <span className="text-sm font-medium shrink-0">
                        {formatUSD(Number(item.unitPrice) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-center text-xs text-muted-foreground py-2">
              Questions?{" "}
              <a
                href="mailto:support@qureshijewelers.com"
                className="underline hover:text-foreground transition-colors"
              >
                Contact us
              </a>{" "}
              and include your order number.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
