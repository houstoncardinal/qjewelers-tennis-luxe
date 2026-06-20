import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import {
  Save, Truck, Store, Mail, Tag, Info, CheckCircle,
  Instagram, Phone, Globe, Megaphone, Percent, RotateCcw, Palette, Check,
  ShieldCheck, UserPlus, Users,
} from "lucide-react";
import { toast } from "sonner";
import { getStoreSettings, updateStoreSetting } from "@/lib/admin-extended.functions";
import {
  enrollTotp, confirmTotpEnrollment, disableTotp,
  listAdminUsers, createAdminUser,
} from "@/lib/admin.functions";
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
      className="text-left rounded-2xl overflow-hidden relative group"
      style={{
        border: active
          ? `1.5px solid ${theme.accentColor}`
          : hov ? "1.5px solid rgba(0,0,0,0.16)" : "1.5px solid rgba(0,0,0,0.07)",
        boxShadow: active
          ? `0 0 0 3px ${theme.accentColor}1f, 0 10px 28px ${theme.accentColor}28, 0 2px 8px rgba(0,0,0,0.10)`
          : hov ? `0 10px 24px rgba(0,0,0,0.14), 0 0 0 1px ${theme.accentColor}20` : "0 1px 4px rgba(0,0,0,0.05)",
        transform: hov ? "translateY(-3px) scale(1.015)" : "translateY(0) scale(1)",
        transition: "transform 0.25s cubic-bezier(.2,.8,.2,1), box-shadow 0.25s ease, border-color 0.25s ease",
        background: "#fff",
      }}
    >
      {/* Preview */}
      <div
        className="h-24 relative overflow-hidden"
        style={{ background: theme.previewGradient }}
      >
        {/* fine diagonal sheen, sweeps on hover */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(115deg, transparent 30%, ${theme.accentColor}26 48%, transparent 66%)`,
            backgroundSize: "220% 220%",
            backgroundPosition: hov ? "120% 0%" : "-40% 0%",
            transition: "background-position 0.7s ease",
          }}
        />

        {/* Mini sidebar simulation */}
        <div className="absolute inset-y-0 left-0 w-11 flex flex-col gap-1.5 p-2 z-10">
          <div className="w-5.5 h-5.5 rounded-lg flex items-center justify-center mb-1"
            style={{ background: s.brandBg, border: `1px solid ${s.brandBorder}`, boxShadow: s.brandBoxShadow }}>
            <div className="w-2 h-2 rounded-sm" style={{ background: s.brandIconColor }} />
          </div>
          {[1, 0.55, 0.55, 0.4].map((w, i) => (
            <div key={i} className="h-1.5 rounded-full" style={{
              background: i === 0 ? s.navIconActive : s.navIconInactive + "90",
              width: `${w * 100}%`,
              boxShadow: i === 0 ? `0 0 6px ${s.navIconActive}90` : "none",
            }} />
          ))}
        </div>

        {/* Content area preview — mimics an admin-surface card */}
        <div className="absolute inset-y-2 left-12 right-2 flex flex-col gap-1.5 z-10">
          <div className="flex-1 rounded-md p-1.5 flex flex-col gap-1 justify-center"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: `1px solid ${theme.accentColor}45`,
              boxShadow: `0 0 14px ${theme.accentColor}22`,
            }}>
            <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.30)", width: "55%" }} />
            <div className="h-2.5 rounded-full" style={{ background: theme.accentColor, width: "38%", boxShadow: `0 0 8px ${theme.accentColor}99` }} />
          </div>
          <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.10)", width: "65%" }} />
        </div>

        {/* Accent gem swatch */}
        <div
          className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 rounded-full z-10"
          style={{
            background: theme.accentColor,
            boxShadow: `0 0 10px ${theme.accentColor}cc, 0 0 0 2px rgba(255,255,255,0.18)`,
          }}
        />

        {/* Active indicator */}
        {active && (
          <div className="absolute top-1.5 right-1.5 w-5.5 h-5.5 rounded-full flex items-center justify-center z-20"
            style={{ background: theme.accentColor, boxShadow: `0 0 12px ${theme.accentColor}, 0 0 0 2px rgba(255,255,255,0.85)` }}>
            <Check className="h-3 w-3" style={{ color: "#000", opacity: 0.85 }} />
          </div>
        )}
      </div>

      {/* Label */}
      <div className="px-3 pt-2.5 pb-3 relative" style={{ background: active ? `${theme.accentColor}0c` : "#fff" }}>
        <div
          className="absolute top-0 left-3 right-3 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${theme.accentColor}50, transparent)` }}
        />
        <div className="flex items-center gap-1.5 mb-0.5">
          <span
            className="w-4.5 h-4.5 rounded-full flex items-center justify-center text-[0.62rem] leading-none shrink-0"
            style={{ background: `${theme.accentColor}1a` }}
          >
            {theme.emoji}
          </span>
          <p className="text-[0.72rem] font-semibold tracking-tight truncate" style={{ color: active ? theme.accentColor : "#1f2937" }}>
            {theme.name}
          </p>
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

// ─── Two-Factor Authentication ─────────────────────────────────────────────────

function TwoFactorCard({ token }: { token: string }) {
  const enroll = useServerFn(enrollTotp);
  const confirm = useServerFn(confirmTotpEnrollment);
  const disable = useServerFn(disableTotp);

  const [step, setStep] = useState<"idle" | "enrolling" | "confirming">("idle");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const startEnroll = async () => {
    setBusy(true);
    try {
      const result = await enroll({ data: { token } });
      setQrCodeDataUrl(result.qrCodeDataUrl);
      setSecret(result.secret);
      setStep("confirming");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to start enrollment");
    } finally {
      setBusy(false);
    }
  };

  const confirmEnroll = async () => {
    if (!code) return;
    setBusy(true);
    try {
      await confirm({ data: { token, code } });
      toast.success("Two-factor authentication enabled");
      setStep("idle");
      setCode("");
      setQrCodeDataUrl("");
      setSecret("");
    } catch (err: any) {
      toast.error(err?.message ?? "Invalid code");
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    try {
      await disable({ data: { token } });
      toast.success("Two-factor authentication disabled");
      setStep("idle");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to disable 2FA");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsCard icon={ShieldCheck} title="Two-Factor Authentication">
      <div className="py-5">
        {step === "idle" && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-[0.70rem] text-gray-400 max-w-md">
              Add an authenticator-app code as a second step on login for your account. Scan a QR code once with an app like Google Authenticator or 1Password.
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={startEnroll}
                disabled={busy}
                className="px-4 py-2 text-[0.62rem] uppercase tracking-[0.12em] bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40"
              >
                Enable 2FA
              </button>
              <button
                onClick={handleDisable}
                disabled={busy}
                className="px-4 py-2 text-[0.62rem] uppercase tracking-[0.12em] border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              >
                Disable 2FA
              </button>
            </div>
          </div>
        )}
        {step === "confirming" && (
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {qrCodeDataUrl && (
              <img src={qrCodeDataUrl} alt="TOTP QR code" className="w-36 h-36 border border-gray-100 shrink-0" />
            )}
            <div className="flex-1 min-w-0 space-y-3">
              <p className="text-[0.70rem] text-gray-400">
                Scan this QR code with your authenticator app, or enter the secret manually: <code className="bg-gray-100 px-1 break-all">{secret}</code>
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && confirmEnroll()}
                  placeholder="6-digit code"
                  maxLength={6}
                  className="border border-gray-200 px-3 py-2 text-sm tracking-[0.3em] focus:outline-none focus:border-gray-400 bg-white"
                />
                <button
                  onClick={confirmEnroll}
                  disabled={busy || !code}
                  className="px-4 py-2 text-[0.62rem] uppercase tracking-[0.12em] bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40"
                >
                  Confirm
                </button>
                <button
                  onClick={() => { setStep("idle"); setCode(""); setQrCodeDataUrl(""); setSecret(""); }}
                  className="px-4 py-2 text-[0.62rem] uppercase tracking-[0.12em] text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SettingsCard>
  );
}

// ─── Staff Accounts ─────────────────────────────────────────────────────────────

function StaffCard({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listAdminUsers);
  const createFn = useServerFn(createAdminUser);

  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin-users", token],
    queryFn: () => listFn({ data: { token } }),
    staleTime: 30_000,
  });

  const users = data?.users ?? [];

  const handleCreate = async () => {
    if (!username || !password) return;
    setBusy(true);
    try {
      await createFn({ data: { token, username, password, role } });
      toast.success("Staff account created");
      setUsername(""); setPassword(""); setRole("staff"); setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: ["admin-users", token] });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsCard icon={Users} title="Staff Accounts">
      <div className="py-5 space-y-4">
        <div className="space-y-2">
          {users.map((u: any) => (
            <div key={u.id} className="flex items-center justify-between text-sm py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium text-gray-700 truncate">{u.username}</span>
                <span className="text-[0.58rem] uppercase tracking-[0.1em] text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded">{u.role}</span>
              </div>
              <span className="text-[0.62rem] text-gray-400 shrink-0">{u.totp_enabled ? "2FA on" : "2FA off"}</span>
            </div>
          ))}
          {users.length === 0 && <p className="text-[0.70rem] text-gray-400">No staff accounts yet.</p>}
        </div>

        {showForm ? (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-50">
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Username"
              className="border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
            />
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
            />
            <select value={role} onChange={e => setRole(e.target.value as "admin" | "staff")}
              className="border border-gray-200 px-3 py-2 text-sm bg-white">
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={handleCreate} disabled={busy || !username || !password}
              className="px-4 py-2 text-[0.62rem] uppercase tracking-[0.12em] bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40">
              Create
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-[0.62rem] uppercase tracking-[0.12em] text-gray-400 hover:text-gray-600">
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-[0.62rem] uppercase tracking-[0.12em] border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <UserPlus className="h-3 w-3" /> Add Staff Account
          </button>
        )}
      </div>
    </SettingsCard>
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
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
          <div
            className="px-6 py-4 flex items-center gap-3 relative overflow-hidden"
            style={{ background: `linear-gradient(120deg, #fff 0%, ${theme.accentColor}0d 100%)`, borderBottom: "1px solid rgba(0,0,0,0.06)" }}
          >
            <div
              className="absolute inset-x-0 top-0 h-0.5"
              style={{ background: `linear-gradient(90deg, transparent, ${theme.accentColor}, transparent)` }}
            />
            <div
              className="p-2 rounded-xl shrink-0"
              style={{ background: `${theme.accentColor}16`, boxShadow: `0 0 0 1px ${theme.accentColor}25` }}
            >
              <Palette className="h-4 w-4" style={{ color: theme.accentColor }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 tracking-tight">Admin Theme</p>
              <p className="text-[0.62rem] text-gray-400 mt-0.5">Choose a theme for your admin dashboard. Changes apply instantly — {THEMES.length} curated palettes.</p>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[0.60rem] uppercase tracking-[0.12em] font-semibold"
              style={{
                background: `${theme.accentColor}18`,
                color: theme.accentColor,
                border: `1px solid ${theme.accentColor}35`,
                boxShadow: `0 0 12px ${theme.accentColor}25`,
              }}
            >
              <span>{theme.emoji}</span>
              <span>{theme.name}</span>
            </div>
          </div>
          <div className="p-5" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.015) 0%, rgba(0,0,0,0.03) 100%)" }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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

        {/* Two-Factor Authentication */}
        <TwoFactorCard token={token} />

        {/* Staff Accounts */}
        <StaffCard token={token} />

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
