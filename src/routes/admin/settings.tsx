import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import {
  Save, Truck, Store, Mail, Tag, Info, CheckCircle,
  Instagram, Phone, Globe, Megaphone, Percent, RotateCcw, Palette, Check,
} from "lucide-react";
import { toast } from "sonner";
import { getStoreSettings, updateStoreSetting } from "@/lib/admin-extended.functions";
import { useAdminToken, useAdminTheme } from "@/lib/admin-context";
import { THEMES, type AdminTheme } from "@/lib/admin-themes";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

// ─── Toggle Setting Row ───────────────────────────────────────────────────────

function ToggleRow({
  settingKey,
  label,
  description,
  value: initialValue,
  onSave,
}: {
  settingKey: string;
  label: string;
  description: string;
  value: string;
  onSave: (key: string, value: string) => Promise<void>;
}) {
  const [checked, setChecked] = useState(initialValue === "true");
  const [saving,  setSaving]  = useState(false);

  useEffect(() => { setChecked(initialValue === "true"); }, [initialValue]);

  const toggle = async () => {
    const next = !checked;
    setChecked(next);
    setSaving(true);
    try {
      await onSave(settingKey, String(next));
    } catch {
      setChecked(!next); // revert on failure
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-5 border-b border-gray-50 last:border-0 flex items-center justify-between gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-[0.65rem] text-gray-400 mt-0.5">{description}</p>
      </div>
      <button
        onClick={toggle}
        disabled={saving}
        className={`w-10 h-5.5 rounded-full transition-colors relative shrink-0 disabled:opacity-60 ${checked ? "bg-gray-900" : "bg-gray-200"}`}
        style={{ width: 40, height: 22 }}
      >
        <span className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`}
          style={{ width: 18, height: 18 }} />
      </button>
    </div>
  );
}

// ─── Text Setting Row ─────────────────────────────────────────────────────────

function SettingRow({
  settingKey,
  label,
  description,
  value: initialValue,
  type = "text",
  prefix,
  suffix,
  placeholder,
  onSave,
}: {
  settingKey: string;
  label: string;
  description: string;
  value: string;
  type?: "text" | "number" | "email" | "url" | "tel";
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  onSave: (key: string, value: string) => Promise<void>;
}) {
  const [value,  setValue]  = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const dirty = value !== initialValue;

  useEffect(() => { setValue(initialValue); }, [initialValue]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(settingKey, value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* toast handled upstream */ } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-5 border-b border-gray-50 last:border-0">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800">{label}</p>
          <p className="text-[0.65rem] text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {prefix && <span className="text-sm text-gray-500 shrink-0">{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={e => { setValue(e.target.value); setSaved(false); }}
          placeholder={placeholder}
          className="flex-1 border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors bg-white"
        />
        {suffix && <span className="text-sm text-gray-500 shrink-0">{suffix}</span>}
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className={`flex items-center gap-1.5 px-4 py-2 text-[0.62rem] uppercase tracking-[0.12em] transition-colors shrink-0 ${
            saved
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
              : dirty
                ? "bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40"
                : "bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed"
          }`}
        >
          {saved ? <><CheckCircle className="h-3 w-3" /> Saved</> : <><Save className="h-3 w-3" /> {saving ? "Saving…" : "Save"}</>}
        </button>
      </div>
    </div>
  );
}

// ─── Theme Card ───────────────────────────────────────────────────────────────

function ThemeCard({ theme, active, onSelect }: { theme: AdminTheme; active: boolean; onSelect: () => void }) {
  const [hov, setHov] = useState(false);
  const s = theme.sidebar;

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="text-left rounded-xl overflow-hidden transition-all relative"
      style={{
        border: active
          ? `2px solid ${theme.accentColor}`
          : hov ? "2px solid rgba(0,0,0,0.15)" : "2px solid rgba(0,0,0,0.07)",
        boxShadow: active
          ? `0 0 0 1px ${theme.accentColor}30, 0 4px 20px ${theme.accentColor}18, 0 2px 8px rgba(0,0,0,0.08)`
          : hov ? "0 4px 16px rgba(0,0,0,0.10)" : "0 1px 4px rgba(0,0,0,0.05)",
        transform: hov && !active ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.20s ease",
      }}
    >
      {/* Preview */}
      <div
        className="h-[72px] relative overflow-hidden"
        style={{ background: theme.previewGradient }}
      >
        {/* Mini sidebar simulation */}
        <div className="absolute inset-y-0 left-0 w-10 flex flex-col gap-1.5 p-2">
          {/* Brand dot */}
          <div className="w-5 h-5 rounded-md flex items-center justify-center mb-1"
            style={{ background: s.brandBg, border: `1px solid ${s.brandBorder}` }}>
            <div className="w-2 h-2 rounded-sm" style={{ background: s.brandIconColor }} />
          </div>
          {/* Nav lines */}
          {[1, 0.5, 0.5, 0.5].map((w, i) => (
            <div key={i} className="h-1.5 rounded-full" style={{
              background: i === 0 ? s.navIconActive + "cc" : s.navIconInactive + "80",
              width: `${w * 100}%`,
            }} />
          ))}
        </div>
        {/* Content area preview */}
        <div className="absolute inset-y-0 left-10 right-0 p-2 flex flex-col gap-1">
          <div className="h-2 rounded" style={{ background: "rgba(255,255,255,0.12)", width: "70%" }} />
          <div className="h-1.5 rounded" style={{ background: "rgba(255,255,255,0.07)", width: "50%" }} />
        </div>
        {/* Active indicator */}
        {active && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: theme.accentColor, boxShadow: `0 0 8px ${theme.accentColor}80` }}>
            <Check className="h-3 w-3 text-white" style={{ color: "#000", opacity: 0.85 }} />
          </div>
        )}
      </div>

      {/* Label */}
      <div className="px-3 py-2.5 bg-white">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-sm leading-none">{theme.emoji}</span>
          <p className="text-[0.70rem] font-semibold text-gray-900 truncate">{theme.name}</p>
        </div>
        <p className="text-[0.58rem] text-gray-400 leading-tight line-clamp-2">{theme.description}</p>
      </div>
    </button>
  );
}

// ─── Settings Card ────────────────────────────────────────────────────────────

function SettingsCard({ icon: Icon, title, children }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
        <div className="p-1.5 bg-gray-50 rounded-sm shrink-0">
          <Icon className="h-4 w-4 text-gray-500" />
        </div>
        <p className="text-sm font-medium text-gray-800">{title}</p>
      </div>
      <div className="px-6">{children}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function AdminSettings() {
  const token = useAdminToken();
  const { theme, setThemeId } = useAdminTheme();
  const queryClient = useQueryClient();

  const fetchSettings = useServerFn(getStoreSettings);
  const updateFn      = useServerFn(updateStoreSetting);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-store-settings", token],
    queryFn: () => fetchSettings({ data: { token } }),
    enabled: !!token,
    staleTime: 60_000,
  });

  const settings = data?.settings ?? {};

  const handleSave = async (key: string, value: string) => {
    try {
      await updateFn({ data: { token, key, value } });
      await queryClient.invalidateQueries({ queryKey: ["admin-store-settings", token] });
      toast.success("Setting saved");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save setting");
      throw err;
    }
  };

  const get = (key: string) => settings[key]?.value ?? "";

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 p-6 animate-pulse space-y-3">
            <div className="h-4 w-40 bg-gray-100 rounded" />
            <div className="h-10 bg-gray-50 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-3xl">
        <div className="bg-white border border-gray-100 p-8 text-center">
          <div className="flex items-center justify-center gap-2 text-amber-600 mb-3">
            <Info className="h-5 w-5" />
            <p className="text-sm font-medium">Settings table not found</p>
          </div>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Apply the latest database migration to enable store settings. Run <code className="bg-gray-100 px-1">supabase db push</code> or apply migrations via the Supabase dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Store Settings</h1>
        <p className="text-xs text-gray-400 mt-0.5">Configure your store's operational, appearance, and admin theme settings</p>
      </div>

      <div className="space-y-6">

        {/* Admin Theme */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div className="px-6 py-4 flex items-center gap-3" style={{ background: "white", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="p-1.5 rounded-lg" style={{ background: "rgba(0,0,0,0.04)" }}>
              <Palette className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Admin Theme</p>
              <p className="text-[0.62rem] text-gray-400 mt-0.5">Choose a theme for your admin dashboard. Changes apply instantly.</p>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[0.60rem] uppercase tracking-[0.12em] font-semibold"
              style={{
                background: `${theme.accentColor}18`,
                color: theme.accentColor,
                border: `1px solid ${theme.accentColor}30`,
              }}
            >
              <span>{theme.emoji}</span>
              <span>{theme.name}</span>
            </div>
          </div>
          <div className="p-5" style={{ background: "rgba(0,0,0,0.02)" }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {THEMES.map(t => (
                <ThemeCard
                  key={t.id}
                  theme={t}
                  active={theme.id === t.id}
                  onSelect={() => {
                    setThemeId(t.id);
                    toast.success(`Theme changed to ${t.name}`);
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Store Settings — narrower column */}
        <div className="max-w-3xl space-y-6">

        {/* Announcement Bar */}
        <SettingsCard icon={Megaphone} title="Announcement Bar">
          <ToggleRow
            settingKey="announcement_bar_enabled"
            label="Enable Announcement Bar"
            description="Shows a dismissible banner at the top of all storefront pages."
            value={get("announcement_bar_enabled")}
            onSave={handleSave}
          />
          <SettingRow
            settingKey="announcement_bar_text"
            label="Announcement Text"
            description="Text shown in the announcement bar. Keep it short and impactful."
            value={get("announcement_bar_text")}
            placeholder="Free shipping on orders over $250 · GRA Certified"
            onSave={handleSave}
          />
          {get("announcement_bar_enabled") === "true" && get("announcement_bar_text") && (
            <div className="mb-5 p-3 bg-[#0f0f0f] text-white text-[0.60rem] uppercase tracking-[0.18em] text-center">
              {get("announcement_bar_text")}
            </div>
          )}
        </SettingsCard>

        {/* Shipping */}
        <SettingsCard icon={Truck} title="Shipping">
          <SettingRow
            settingKey="free_shipping_threshold"
            label="Free Shipping Threshold"
            description="Orders at or above this amount qualify for free shipping. Set to 0 to always charge."
            value={get("free_shipping_threshold")}
            type="number"
            prefix="$"
            suffix="USD"
            onSave={handleSave}
          />
          <SettingRow
            settingKey="flat_shipping_rate"
            label="Flat Shipping Rate"
            description="Shipping fee charged on orders below the free shipping threshold."
            value={get("flat_shipping_rate")}
            type="number"
            prefix="$"
            suffix="USD"
            onSave={handleSave}
          />
        </SettingsCard>

        {/* Commerce */}
        <SettingsCard icon={Percent} title="Commerce">
          <SettingRow
            settingKey="tax_rate"
            label="Tax Rate"
            description="Applied to all orders at checkout. Set to 0 if you handle tax separately."
            value={get("tax_rate")}
            type="number"
            suffix="%"
            placeholder="0"
            onSave={handleSave}
          />
          <SettingRow
            settingKey="return_window_days"
            label="Return Window"
            description="Number of days customers have to initiate a return after receiving their order."
            value={get("return_window_days")}
            type="number"
            suffix="days"
            placeholder="30"
            onSave={handleSave}
          />
        </SettingsCard>

        {/* Store Info */}
        <SettingsCard icon={Store} title="Store Information">
          <SettingRow
            settingKey="store_name"
            label="Store Display Name"
            description="Your store's display name used in emails and throughout the site."
            value={get("store_name")}
            onSave={handleSave}
          />
          <SettingRow
            settingKey="support_email"
            label="Support Email"
            description="Customer-facing support email shown in order confirmations."
            value={get("support_email")}
            type="email"
            placeholder="support@yourstore.com"
            onSave={handleSave}
          />
          <SettingRow
            settingKey="contact_phone"
            label="Contact Phone"
            description="Optional phone number shown on the contact page and in emails."
            value={get("contact_phone")}
            type="tel"
            placeholder="+1 (555) 000-0000"
            onSave={handleSave}
          />
        </SettingsCard>

        {/* Social Media */}
        <SettingsCard icon={Globe} title="Social Media">
          <SettingRow
            settingKey="instagram_url"
            label="Instagram"
            description="Full URL to your Instagram profile. Leave blank to hide the link."
            value={get("instagram_url")}
            type="url"
            placeholder="https://instagram.com/yourstore"
            onSave={handleSave}
          />
          <SettingRow
            settingKey="tiktok_url"
            label="TikTok"
            description="Full URL to your TikTok profile. Leave blank to hide the link."
            value={get("tiktok_url")}
            type="url"
            placeholder="https://tiktok.com/@yourstore"
            onSave={handleSave}
          />
        </SettingsCard>

        {/* Live Configuration Summary */}
        <SettingsCard icon={Tag} title="Current Configuration">
          <div className="py-4 grid grid-cols-2 sm:grid-cols-3 gap-5">
            {[
              { label: "Free Shipping Above",    value: `$${get("free_shipping_threshold") || "250"}` },
              { label: "Flat Rate Below",        value: `$${get("flat_shipping_rate") || "15"}` },
              { label: "Tax Rate",               value: `${get("tax_rate") || "0"}%` },
              { label: "Return Window",          value: `${get("return_window_days") || "30"} days` },
              { label: "Announcement Bar",       value: get("announcement_bar_enabled") === "true" ? "Enabled" : "Disabled" },
              { label: "Store Name",             value: get("store_name") || "Qureshi Jewelers" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[0.56rem] uppercase tracking-[0.14em] text-gray-400 mb-0.5">{label}</p>
                <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
              </div>
            ))}
          </div>
        </SettingsCard>

        {/* Info tip */}
        <div className="bg-blue-50 border border-blue-100 px-5 py-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-[0.70rem] text-blue-700 leading-relaxed">
            <p className="font-medium mb-1">How shipping and tax are applied</p>
            <p>
              The free shipping threshold and flat rate here update checkout live — no code change needed.
              Tax rate is stored but not yet applied to checkout totals; update the tax line in <code className="bg-blue-100 px-1">createOrder</code> to activate it.
            </p>
          </div>
        </div>

        </div>{/* end max-w-3xl */}
      </div>
    </div>
  );
}
