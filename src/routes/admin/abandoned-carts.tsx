import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import {
  adminListAbandonedCarts, adminUpdateCartStatus,
  adminGetCartSettings, adminSaveCartSettings,
} from "@/lib/customer.functions";
import type { AbandonedCart } from "@/lib/customer.functions";
import { formatUSD } from "@/lib/pricing";
import { toast } from "sonner";
import {
  ShoppingCart, RefreshCw, ChevronDown, ChevronUp,
  MailCheck, RotateCcw, Archive, Settings2, Save, Loader2,
} from "lucide-react";

export const Route = createFileRoute("/admin/abandoned-carts")({
  head: () => ({
    meta: [
      { title: "Abandoned Carts — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AbandonedCartsPage,
});

const STATUS_STYLES: Record<string, string> = {
  pending:    "bg-amber-50 text-amber-700 border-amber-200",
  email_sent: "bg-blue-50 text-blue-700 border-blue-200",
  recovered:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  expired:    "bg-gray-50 text-gray-500 border-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending:    "Pending",
  email_sent: "Email Sent",
  recovered:  "Recovered",
  expired:    "Expired",
};

function CartRow({ cart, onStatusChange }: { cart: AbandonedCart; onStatusChange: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const updateFn = useServerFn(adminUpdateCartStatus);
  const items: any[] = Array.isArray(cart.cart_items) ? cart.cart_items : [];

  const setStatus = async (status: string) => {
    setBusy(true);
    try {
      await updateFn({ data: { cartId: cart.id, status } });
      toast.success(`Marked as ${STATUS_LABELS[status] ?? status}`);
      onStatusChange();
    } catch (err: any) {
      toast.error(err?.message ?? "Update failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border border-[#e5e1d9]">
      <div className="px-5 py-4 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-4 flex-wrap min-w-0">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{cart.user_email}</p>
            <p className="text-[0.60rem] text-muted-foreground mt-0.5">
              {new Date(cart.updated_at).toLocaleDateString("en-US", {
                weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
              })}
            </p>
          </div>
          <span className={`text-[0.58rem] uppercase tracking-[0.10em] font-semibold px-2 py-0.5 border shrink-0 ${STATUS_STYLES[cart.recovery_status] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}>
            {STATUS_LABELS[cart.recovery_status] ?? cart.recovery_status}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-base font-semibold">{cart.cart_total ? formatUSD(Number(cart.cart_total)) : "—"}</p>
          <p className="text-xs text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</p>
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-[#f0ece4]">
          {/* Cart items */}
          <div className="space-y-2 mt-4">
            {items.map((item: any, idx: number) => (
              <div key={idx} className="flex items-start justify-between text-sm gap-4">
                <div className="min-w-0">
                  <span className="font-medium">{item.name ?? item.slug}</span>
                  {(item.size || item.length || item.color) && (
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {[item.color, item.size, item.length].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground">×{item.quantity ?? 1}</span>
                  <span className="text-sm font-medium">{formatUSD(Number(item.unitPrice) * (item.quantity ?? 1))}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Status actions */}
          <div className="mt-4 pt-4 border-t border-[#f0ece4] flex flex-wrap gap-2">
            {cart.recovery_status !== "email_sent" && (
              <button
                onClick={() => setStatus("email_sent")}
                disabled={busy}
                className="flex items-center gap-1.5 px-3 py-2 text-[0.58rem] uppercase tracking-[0.12em] border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                <MailCheck className="w-3 h-3" /> Mark Email Sent
              </button>
            )}
            {cart.recovery_status !== "recovered" && (
              <button
                onClick={() => setStatus("recovered")}
                disabled={busy}
                className="flex items-center gap-1.5 px-3 py-2 text-[0.58rem] uppercase tracking-[0.12em] border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-3 h-3" /> Mark Recovered
              </button>
            )}
            {cart.recovery_status !== "expired" && (
              <button
                onClick={() => setStatus("expired")}
                disabled={busy}
                className="flex items-center gap-1.5 px-3 py-2 text-[0.58rem] uppercase tracking-[0.12em] border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <Archive className="w-3 h-3" /> Mark Expired
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsPanel() {
  const getSettings = useServerFn(adminGetCartSettings);
  const saveSettings = useServerFn(adminSaveCartSettings);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings({}).then(res => { setSettings(res.settings); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSettings({ data: { settings } });
      toast.success("Settings saved");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-24 bg-[#f0ece4] animate-pulse" />;

  const inputCls = "w-full border border-[#ddd8d0] bg-white px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors";

  return (
    <form onSubmit={handleSave} className="bg-white border border-[#e5e1d9] p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Settings2 className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-[0.65rem] uppercase tracking-[0.18em] font-semibold">Recovery Settings</h2>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="enabled"
          checked={settings.enabled === "true"}
          onChange={e => setSettings(p => ({ ...p, enabled: e.target.checked ? "true" : "false" }))}
          className="w-3.5 h-3.5 accent-foreground"
        />
        <label htmlFor="enabled" className="text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground cursor-pointer">
          Enable abandoned cart tracking
        </label>
      </div>

      <div>
        <label className="block text-[0.58rem] uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
          Recovery Delay (minutes after abandonment)
        </label>
        <input
          type="number"
          min="5"
          max="10080"
          value={settings.delay_minutes ?? "60"}
          onChange={e => setSettings(p => ({ ...p, delay_minutes: e.target.value }))}
          className={inputCls}
        />
        <p className="text-[0.55rem] text-muted-foreground mt-1">60 minutes is recommended (1 hour after cart is abandoned)</p>
      </div>

      <div>
        <label className="block text-[0.58rem] uppercase tracking-[0.14em] text-muted-foreground mb-1.5">Email Subject</label>
        <input
          type="text"
          value={settings.email_subject ?? ""}
          onChange={e => setSettings(p => ({ ...p, email_subject: e.target.value }))}
          className={inputCls}
          placeholder="You left something behind ✨"
        />
      </div>

      <div>
        <label className="block text-[0.58rem] uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
          Email Body Template
          <span className="ml-2 text-muted-foreground/60 normal-case tracking-normal">
            — use {"{{item_count}}"}, {"{{items_list}}"}, {"{{cart_url}}"}
          </span>
        </label>
        <textarea
          value={settings.email_body ?? ""}
          onChange={e => setSettings(p => ({ ...p, email_body: e.target.value }))}
          rows={6}
          className={`${inputCls} resize-y font-mono text-xs`}
          placeholder="Hi,&#10;&#10;You left {{item_count}} item(s) in your cart..."
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-[0.60rem] uppercase tracking-[0.18em] disabled:opacity-60 hover:bg-foreground/90 transition-colors"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        {saving ? "Saving…" : "Save Settings"}
      </button>
    </form>
  );
}

function AbandonedCartsPage() {
  const listFn = useServerFn(adminListAbandonedCarts);
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [tab, setTab] = useState<"carts" | "settings">("carts");

  const load = async (status = statusFilter) => {
    setLoading(true);
    try {
      const res = await listFn({ data: { status } });
      setCarts(res.carts);
    } catch (err: any) {
      toast.error(err?.message ?? "Could not load abandoned carts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleFilterChange = (s: string) => {
    setStatusFilter(s);
    load(s);
  };

  const statuses = ["all", "pending", "email_sent", "recovered", "expired"];

  const stats = {
    total: carts.length,
    pending: carts.filter(c => c.recovery_status === "pending").length,
    recovered: carts.filter(c => c.recovery_status === "recovered").length,
    totalValue: carts.filter(c => c.recovery_status === "pending").reduce((s, c) => s + (Number(c.cart_total) || 0), 0),
  };

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Abandoned Carts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Signed-in customers who left with items in their cart</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setTab("carts"); load(); }}
            className={`px-4 py-2 text-[0.60rem] uppercase tracking-[0.14em] border transition-colors ${tab === "carts" ? "bg-foreground text-background border-foreground" : "border-[#e5e1d9] text-muted-foreground hover:border-foreground"}`}
          >
            Carts
          </button>
          <button
            onClick={() => setTab("settings")}
            className={`px-4 py-2 text-[0.60rem] uppercase tracking-[0.14em] border transition-colors ${tab === "settings" ? "bg-foreground text-background border-foreground" : "border-[#e5e1d9] text-muted-foreground hover:border-foreground"}`}
          >
            Settings
          </button>
        </div>
      </div>

      {tab === "settings" ? (
        <SettingsPanel />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total Tracked", value: stats.total },
              { label: "Pending Recovery", value: stats.pending },
              { label: "Recovered", value: stats.recovered },
              { label: "Pending Value", value: formatUSD(stats.totalValue) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-[#e5e1d9] p-4">
                <p className="text-[0.52rem] uppercase tracking-[0.16em] text-muted-foreground mb-1">{label}</p>
                <p className="text-xl font-semibold">{value}</p>
              </div>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => handleFilterChange(s)}
                className={`px-3 py-1.5 text-[0.58rem] uppercase tracking-[0.12em] border transition-colors ${
                  statusFilter === s
                    ? "bg-foreground text-background border-foreground"
                    : "bg-white text-muted-foreground border-[#e5e1d9] hover:border-foreground"
                }`}
              >
                {s === "all" ? "All" : STATUS_LABELS[s] ?? s}
              </button>
            ))}
            <button
              onClick={() => load(statusFilter)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-[0.58rem] uppercase tracking-[0.12em] border border-[#e5e1d9] text-muted-foreground hover:border-foreground transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-white border border-[#e5e1d9] animate-pulse" />
              ))}
            </div>
          ) : carts.length === 0 ? (
            <div className="text-center py-16 border border-[#e5e1d9] bg-white">
              <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">No abandoned carts{statusFilter !== "all" ? ` with status "${STATUS_LABELS[statusFilter]}"` : " yet"}</p>
              <p className="text-xs text-muted-foreground mt-1">Carts are tracked when signed-in customers leave with items.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {carts.map(cart => (
                <CartRow key={cart.id} cart={cart} onStatusChange={() => load(statusFilter)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
