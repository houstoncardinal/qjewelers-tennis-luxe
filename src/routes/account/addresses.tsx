import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAddresses, saveAddress, deleteAddress } from "@/lib/customer.functions";
import type { CustomerAddress } from "@/lib/customer.functions";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, Check, Loader2, MapPin } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

export const Route = createFileRoute("/account/addresses")({
  head: () => ({
    meta: [
      { title: "Saved Addresses — Qureshi Jewelers" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountAddresses,
});

const inputCls =
  "w-full border border-[#ddd8d0] bg-white px-4 py-3.5 text-sm text-foreground placeholder:text-[#bbb] focus:outline-none focus:border-foreground transition-colors";

type AddressForm = {
  id?: string; name: string; line1: string; line2: string;
  city: string; state: string; zip: string; country: string;
  phone: string; is_default: boolean;
};

const emptyForm = (): AddressForm => ({
  name: "", line1: "", line2: "", city: "", state: "",
  zip: "", country: "United States", phone: "", is_default: false,
});

function AccountAddresses() {
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AddressForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchAddresses = useServerFn(getAddresses);
  const saveFn = useServerFn(saveAddress);
  const deleteFn = useServerFn(deleteAddress);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const s = data.session;
      setSession(s);
      if (s?.user?.id && s.access_token) {
        try {
          const res = await fetchAddresses({ data: { token: s.access_token, userId: s.user.id } });
          setAddresses(res.addresses);
        } catch {}
      }
      setLoading(false);
      setHydrated(true);
    });
  }, []);

  const reload = async (s: Session) => {
    const res = await fetchAddresses({ data: { token: s.access_token, userId: s.user.id } });
    setAddresses(res.addresses);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !editing) return;
    setSaving(true);
    try {
      await saveFn({
        data: {
          token: session.access_token,
          userId: session.user.id,
          address: {
            ...editing,
            line2: editing.line2 || undefined,
            phone: editing.phone || undefined,
          },
        },
      });
      toast.success(editing.id ? "Address updated" : "Address added");
      setEditing(null);
      await reload(session);
    } catch (err: any) {
      toast.error(err?.message ?? "Could not save address");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!session) return;
    setDeleting(id);
    try {
      await deleteFn({ data: { token: session.access_token, userId: session.user.id, addressId: id } });
      toast.success("Address removed");
      await reload(session);
    } catch (err: any) {
      toast.error(err?.message ?? "Could not remove address");
    } finally {
      setDeleting(null);
    }
  };

  if (!hydrated || loading) {
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
          <p className="text-sm text-muted-foreground mb-4">Sign in to manage your addresses</p>
          <Link to="/account" className="bg-foreground text-background px-6 py-3 text-[0.62rem] uppercase tracking-[0.18em] hover:bg-foreground/90 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#faf9f7] min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-20">
        <Link to="/account" className="inline-flex items-center gap-1.5 text-[0.60rem] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-3.5 h-3.5" /> My Account
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="eyebrow mb-1">Saved Addresses</p>
            <h1 className="font-display text-3xl">Your Addresses</h1>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(emptyForm())}
              className="flex items-center gap-1.5 bg-foreground text-background px-4 py-2.5 text-[0.60rem] uppercase tracking-[0.18em] hover:bg-foreground/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add New
            </button>
          )}
        </div>

        {/* Add / Edit form */}
        {editing && (
          <form onSubmit={handleSave} className="bg-white border border-[#e5e1d9] p-6 mb-6 space-y-4">
            <h2 className="text-[0.65rem] uppercase tracking-[0.18em] font-semibold mb-2">
              {editing.id ? "Edit Address" : "New Address"}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[0.58rem] uppercase tracking-[0.14em] text-muted-foreground mb-1.5">Full Name *</label>
                <input value={editing.name} onChange={e => setEditing(p => p && { ...p, name: e.target.value })} className={inputCls} placeholder="Jane Doe" required />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[0.58rem] uppercase tracking-[0.14em] text-muted-foreground mb-1.5">Address Line 1 *</label>
                <input value={editing.line1} onChange={e => setEditing(p => p && { ...p, line1: e.target.value })} className={inputCls} placeholder="123 Main St" required />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[0.58rem] uppercase tracking-[0.14em] text-muted-foreground mb-1.5">Apt / Suite</label>
                <input value={editing.line2} onChange={e => setEditing(p => p && { ...p, line2: e.target.value })} className={inputCls} placeholder="Apt 4B (optional)" />
              </div>
              <div>
                <label className="block text-[0.58rem] uppercase tracking-[0.14em] text-muted-foreground mb-1.5">City *</label>
                <input value={editing.city} onChange={e => setEditing(p => p && { ...p, city: e.target.value })} className={inputCls} placeholder="New York" required />
              </div>
              <div>
                <label className="block text-[0.58rem] uppercase tracking-[0.14em] text-muted-foreground mb-1.5">State *</label>
                <input value={editing.state} onChange={e => setEditing(p => p && { ...p, state: e.target.value })} className={inputCls} placeholder="NY" required />
              </div>
              <div>
                <label className="block text-[0.58rem] uppercase tracking-[0.14em] text-muted-foreground mb-1.5">ZIP Code *</label>
                <input value={editing.zip} onChange={e => setEditing(p => p && { ...p, zip: e.target.value })} className={inputCls} placeholder="10001" required />
              </div>
              <div>
                <label className="block text-[0.58rem] uppercase tracking-[0.14em] text-muted-foreground mb-1.5">Country *</label>
                <input value={editing.country} onChange={e => setEditing(p => p && { ...p, country: e.target.value })} className={inputCls} placeholder="United States" required />
              </div>
              <div>
                <label className="block text-[0.58rem] uppercase tracking-[0.14em] text-muted-foreground mb-1.5">Phone</label>
                <input value={editing.phone} onChange={e => setEditing(p => p && { ...p, phone: e.target.value })} className={inputCls} placeholder="+1 (555) 000-0000 (optional)" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={editing.is_default}
                onChange={e => setEditing(p => p && { ...p, is_default: e.target.checked })}
                className="w-3.5 h-3.5 accent-foreground"
              />
              <span className="text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">Set as default shipping address</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex-1 bg-foreground text-background py-3.5 text-[0.62rem] uppercase tracking-[0.18em] disabled:opacity-60 hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2">
                {saving && <span className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />}
                {saving ? "Saving…" : (editing.id ? "Update Address" : "Save Address")}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="px-6 py-3.5 border border-[#e5e1d9] text-[0.62rem] uppercase tracking-[0.14em] hover:border-foreground transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Address list */}
        {addresses.length === 0 && !editing ? (
          <div className="text-center py-16 border border-[#e5e1d9] bg-white">
            <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
            <button
              onClick={() => setEditing(emptyForm())}
              className="mt-4 inline-flex items-center gap-1.5 bg-foreground text-background px-5 py-2.5 text-[0.60rem] uppercase tracking-[0.18em] hover:bg-foreground/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Your First Address
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map(addr => (
              <div key={addr.id} className="bg-white border border-[#e5e1d9] p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground">{addr.name}</p>
                    {addr.is_default && (
                      <span className="inline-flex items-center gap-0.5 text-[0.52rem] uppercase tracking-[0.10em] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5">
                        <Check className="w-2.5 h-2.5" /> Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}<br />
                    {addr.city}, {addr.state} {addr.zip}<br />
                    {addr.country}
                    {addr.phone && <><br />{addr.phone}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setEditing({ ...addr, line2: addr.line2 ?? "", phone: addr.phone ?? "" })}
                    className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    disabled={deleting === addr.id}
                    className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50"
                    title="Remove"
                  >
                    {deleting === addr.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
