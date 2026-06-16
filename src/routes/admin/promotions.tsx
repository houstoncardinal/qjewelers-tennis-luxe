import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag, X } from "lucide-react";
import { toast } from "sonner";
import {
  listPromoCodes, createPromoCode, updatePromoCode, deletePromoCode,
} from "@/lib/admin-extended.functions";
import { useAdminToken } from "@/lib/admin-context";
import { formatUSD } from "@/lib/pricing";

export const Route = createFileRoute("/admin/promotions")({
  component: AdminPromotions,
});

const EMPTY_FORM = {
  code: "", name: "", discount_type: "percentage" as "percentage" | "fixed",
  discount_value: 10, min_order_amount: 0, max_uses: "" as string | number,
  expires_at: "", active: true,
};

function CreatePromoModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const token = useAdminToken();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const createFn = useServerFn(createPromoCode);

  const set = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm(f => ({ ...f, [k]: val }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) { toast.error("Code is required"); return; }
    setSaving(true);
    try {
      await createFn({
        data: {
          token,
          code: form.code.toUpperCase().trim(),
          name: form.name.trim() || form.code.toUpperCase().trim(),
          discount_type: form.discount_type,
          discount_value: Number(form.discount_value),
          min_order_amount: Number(form.min_order_amount),
          max_uses: form.max_uses !== "" ? Number(form.max_uses) : null,
          expires_at: form.expires_at || null,
          active: form.active,
        },
      });
      toast.success("Promo code created");
      onCreated();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create code");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors bg-white";
  const labelCls = "block text-[0.58rem] uppercase tracking-[0.16em] text-gray-400 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">New Promo Code</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={save} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Code *</label>
              <input
                value={form.code}
                onChange={set("code")}
                placeholder="SUMMER20"
                className={`${inputCls} uppercase font-mono`}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Display Name</label>
              <input value={form.name} onChange={set("name")} placeholder="Summer Sale" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Discount Type</label>
              <select value={form.discount_type} onChange={set("discount_type")} className={inputCls}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed ($)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Discount Value</label>
              <input
                type="number"
                min={0}
                step={form.discount_type === "percentage" ? 1 : 0.01}
                max={form.discount_type === "percentage" ? 100 : undefined}
                value={form.discount_value}
                onChange={set("discount_value")}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Min Order ($)</label>
              <input
                type="number" min={0} step={0.01}
                value={form.min_order_amount} onChange={set("min_order_amount")}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Max Uses (blank = unlimited)</label>
              <input
                type="number" min={1}
                value={form.max_uses} onChange={set("max_uses")}
                placeholder="Unlimited" className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Expires At (optional)</label>
            <input type="datetime-local" value={form.expires_at} onChange={set("expires_at")} className={inputCls} />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox" id="active" checked={form.active}
              onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
              className="accent-gray-900"
            />
            <label htmlFor="active" className="text-sm text-gray-700">Active immediately</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 py-2.5 text-[0.65rem] uppercase tracking-[0.14em] text-gray-500 hover:border-gray-400 transition-colors">
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 bg-gray-900 text-white py-2.5 text-[0.65rem] uppercase tracking-[0.14em] hover:bg-gray-800 transition-colors disabled:opacity-40"
            >
              {saving ? "Creating…" : "Create Code"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminPromotions() {
  const token = useAdminToken();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const fetchCodes = useServerFn(listPromoCodes);
  const toggleFn   = useServerFn(updatePromoCode);
  const deleteFn   = useServerFn(deletePromoCode);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-promo-codes", token],
    queryFn: () => fetchCodes({ data: { token } }),
    enabled: !!token,
  });

  const codes = data?.codes ?? [];
  const refetch = () => queryClient.invalidateQueries({ queryKey: ["admin-promo-codes", token] });

  const toggle = async (id: string, active: boolean) => {
    try {
      await toggleFn({ data: { token, id, active: !active } });
      await refetch();
      toast.success(active ? "Code deactivated" : "Code activated");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update");
    }
  };

  const remove = async (id: string, code: string) => {
    if (!confirm(`Delete code "${code}"?`)) return;
    try {
      await deleteFn({ data: { token, id } });
      await refetch();
      toast.success("Code deleted");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete");
    }
  };

  const activeCount = codes.filter((c: any) => c.active).length;

  return (
    <div className="p-6 lg:p-8">
      {showCreate && (
        <CreatePromoModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); refetch(); }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">Promotions</h1>
          {!isLoading && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[0.62rem] font-medium rounded-full">
              {activeCount} active
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-[0.65rem] uppercase tracking-[0.14em] hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> New Code
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { label: "Total Codes",  value: codes.length },
          { label: "Active",       value: activeCount },
          { label: "Total Uses",   value: codes.reduce((s: number, c: any) => s + (c.used_count ?? 0), 0) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-100 px-5 py-3">
            <p className="text-[0.55rem] uppercase tracking-[0.16em] text-gray-400 mb-0.5">{label}</p>
            <p className="text-lg font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100">
        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse flex gap-4">
                <div className="h-4 w-28 bg-gray-100 rounded" />
                <div className="h-4 w-20 bg-gray-100 rounded" />
                <div className="h-4 flex-1 bg-gray-100 rounded" />
                <div className="h-4 w-16 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : codes.length === 0 ? (
          <div className="py-20 text-center">
            <Tag className="h-8 w-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 mb-3">No promo codes yet.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="text-[0.65rem] uppercase tracking-[0.14em] text-gray-500 border border-gray-200 px-4 py-2 hover:border-gray-400 hover:text-gray-800 transition-colors"
            >
              Create your first code
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Code", "Type", "Discount", "Min Order", "Uses", "Expires", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[0.55rem] uppercase tracking-[0.14em] text-gray-400 font-medium whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {codes.map((c: any) => {
                  const expired = c.expires_at && new Date(c.expires_at) < new Date();
                  const maxedOut = c.max_uses !== null && c.used_count >= c.max_uses;
                  const effectivelyInactive = !c.active || expired || maxedOut;

                  return (
                    <tr key={c.id} className={`transition-colors ${effectivelyInactive ? "opacity-60" : "hover:bg-gray-50/60"}`}>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs font-semibold text-gray-800 bg-gray-50 border border-gray-200 px-2 py-1">
                          {c.code}
                        </span>
                        {c.name && c.name !== c.code && (
                          <p className="text-[0.60rem] text-gray-400 mt-0.5">{c.name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-600 capitalize">{c.discount_type}</td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-gray-900">
                        {c.discount_type === "percentage"
                          ? `${c.discount_value}% off`
                          : `${formatUSD(c.discount_value)} off`}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-600">
                        {Number(c.min_order_amount) > 0 ? formatUSD(Number(c.min_order_amount)) : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">
                        {c.used_count}{c.max_uses != null ? ` / ${c.max_uses}` : ""}
                        {maxedOut && <span className="ml-1.5 text-red-500 text-[0.58rem]">maxed</span>}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                        {c.expires_at
                          ? <>
                              {new Date(c.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                              {expired && <span className="ml-1.5 text-red-500 text-[0.58rem]">expired</span>}
                            </>
                          : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.08em] font-medium rounded-sm ${
                          c.active && !expired && !maxedOut
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-50 text-gray-500 border border-gray-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${c.active && !expired && !maxedOut ? "bg-emerald-400" : "bg-gray-400"}`} />
                          {c.active && !expired && !maxedOut ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 pr-5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggle(c.id, c.active)}
                            title={c.active ? "Deactivate" : "Activate"}
                            className="text-gray-400 hover:text-gray-700 transition-colors"
                          >
                            {c.active
                              ? <ToggleRight className="h-4.5 w-4.5 text-emerald-500" style={{ width: 18, height: 18 }} />
                              : <ToggleLeft className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />}
                          </button>
                          <button
                            onClick={() => remove(c.id, c.code)}
                            title="Delete"
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
