import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getOrdersByEmail } from "@/lib/admin-extended.functions";
import { formatUSD } from "@/lib/pricing";
import {
  ShoppingBag, ArrowLeft, Package, Truck, Check, Clock,
  XCircle, ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";

export const Route = createFileRoute("/account/orders")({
  head: () => ({
    meta: [{ title: "Order History — Qureshi Jewelers" }],
  }),
  component: AccountOrders,
});

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  pending:    { label: "Pending",    icon: Clock,    cls: "bg-amber-50 text-amber-700 border-amber-200" },
  processing: { label: "Processing", icon: Clock,    cls: "bg-blue-50 text-blue-700 border-blue-200" },
  shipped:    { label: "Shipped",    icon: Truck,    cls: "bg-violet-50 text-violet-700 border-violet-200" },
  delivered:  { label: "Delivered",  icon: Check,    cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled:  { label: "Cancelled",  icon: XCircle,  cls: "bg-red-50 text-red-700 border-red-200" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, icon: Clock, cls: "bg-gray-50 text-gray-600 border-gray-200" };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[0.58rem] uppercase tracking-[0.10em] font-semibold px-2 py-0.5 border ${cfg.cls}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function OrderCard({ order }: { order: any }) {
  const [expanded, setExpanded] = useState(false);
  const items: any[] = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce((s: number, i: any) => s + (i.quantity ?? 1), 0);

  return (
    <div className="bg-white border border-[#e5e1d9]">
      <div className="px-5 py-4 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <p className="font-mono text-sm font-semibold text-foreground">{order.order_number}</p>
            <p className="text-[0.60rem] text-muted-foreground mt-0.5">
              {new Date(order.created_at).toLocaleDateString("en-US", {
                weekday: "short", month: "long", day: "numeric", year: "numeric",
              })}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-base font-semibold text-foreground">{formatUSD(Number(order.total))}</p>
            <p className="text-[0.60rem] text-muted-foreground">{itemCount} item{itemCount !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={expanded ? "Collapse order" : "Expand order"}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-[#f0ece4]">
          {/* Item list */}
          <div className="space-y-2 mt-4">
            {items.map((item: any, idx: number) => (
              <div key={idx} className="flex items-start justify-between text-sm gap-4">
                <div className="flex items-start gap-2 min-w-0">
                  <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="text-foreground font-medium">{item.name ?? item.slug}</span>
                    {(item.size || item.length || item.color) && (
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {[item.color, item.size, item.length].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground">×{item.quantity ?? 1}</span>
                  <span className="text-sm font-medium">{formatUSD(Number(item.unitPrice) * (item.quantity ?? 1))}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Price breakdown */}
          <div className="mt-4 pt-4 border-t border-[#f0ece4] space-y-1.5 text-sm max-w-xs ml-auto">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>{formatUSD(Number(order.subtotal))}</span>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount</span><span>−{formatUSD(Number(order.discount_amount))}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span>{Number(order.shipping) === 0 ? "Free" : formatUSD(Number(order.shipping))}</span>
            </div>
            {Number(order.tax) > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span><span>{formatUSD(Number(order.tax))}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-foreground pt-1.5 border-t border-[#f0ece4]">
              <span>Total</span><span>{formatUSD(Number(order.total))}</span>
            </div>
          </div>

          {/* Tracking */}
          {order.tracking_number && (
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-[#f7f5f2] border border-[#e8e4de] px-3 py-2">
              <Truck className="w-3.5 h-3.5 shrink-0" />
              Tracking: <span className="font-mono font-semibold text-foreground ml-1">{order.tracking_number}</span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-4 flex-wrap">
            <Link
              to="/returns"
              className="text-[0.60rem] uppercase tracking-[0.14em] underline text-muted-foreground hover:text-foreground transition-colors"
            >
              Start a Return
            </Link>
            <Link
              to="/track-order"
              className="text-[0.60rem] uppercase tracking-[0.14em] underline text-muted-foreground hover:text-foreground transition-colors"
            >
              Track Order
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function AccountOrders() {
  const fetchOrders = useServerFn(getOrdersByEmail);
  const [session, setSession] = useState<Session | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const s = data.session;
      setSession(s);
      if (s?.user?.email) {
        try {
          const res = await fetchOrders({ data: { email: s.user.email } });
          setOrders(res.orders);
        } catch {}
      }
      setLoading(false);
    });
  }, []);

  const statuses = [...new Set(orders.map(o => o.status))];
  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-[#faf9f7] min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">Sign in to view your orders</p>
          <Link
            to="/account"
            className="bg-foreground text-background px-6 py-3 text-[0.62rem] uppercase tracking-[0.18em] hover:bg-foreground/90 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#faf9f7] min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-20">
        <Link
          to="/account"
          className="inline-flex items-center gap-1.5 text-[0.60rem] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> My Account
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="eyebrow mb-1">Order History</p>
            <h1 className="font-display text-3xl">Your Orders</h1>
          </div>
          <span className="text-[0.60rem] text-muted-foreground uppercase tracking-[0.12em]">
            {orders.length} total
          </span>
        </div>

        {/* Status filter — only show if there are multiple statuses */}
        {statuses.length > 1 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {["all", ...statuses].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 text-[0.60rem] uppercase tracking-[0.12em] border transition-colors ${
                  filter === s
                    ? "bg-foreground text-background border-foreground"
                    : "bg-white text-muted-foreground border-[#e5e1d9] hover:border-foreground"
                }`}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-16 border border-[#e5e1d9] bg-white">
            <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-sm text-muted-foreground">
              {orders.length === 0 ? "No orders yet — start shopping!" : "No orders match this filter."}
            </p>
            {orders.length === 0 && (
              <Link to="/shop" className="mt-4 inline-block bg-foreground text-background px-6 py-3 text-[0.62rem] uppercase tracking-[0.18em] hover:bg-foreground/90 transition-colors">
                Shop Now
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => <OrderCard key={order.order_number} order={order} />)}
          </div>
        )}
      </div>
    </div>
  );
}
