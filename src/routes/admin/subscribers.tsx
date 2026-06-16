import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo, useRef } from "react";
import {
  Mail, Users, TrendingUp, Search, Download, Plus, Tag, Send,
  Trash2, ChevronDown, X, Sparkles, MessageSquare, Zap, Star,
  CheckCircle2, Clock, Filter, Eye, Crown, Gift, ArrowRight,
  MoreHorizontal, Bell, Edit3, Check,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminToken } from "@/lib/admin-context";
import {
  listSubscribers, updateSubscriber, deleteSubscriber,
  listCampaigns, saveCampaign, sendCampaign, deleteCampaign,
  sendSubscriberMessage, listSubscriberMessages,
} from "@/lib/admin-extended.functions";

export const Route = createFileRoute("/admin/subscribers")({
  component: AdminSubscribers,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface Subscriber {
  id: string;
  email: string;
  name?: string;
  source: string;
  status: string;
  tags: string[];
  notes?: string;
  created_at: string;
  unsubscribed_at?: string;
}

interface Campaign {
  id: string;
  title: string;
  subject: string;
  body_text: string;
  campaign_type: string;
  tag_filter: string[];
  status: string;
  recipient_count?: number;
  sent_at?: string;
  created_at: string;
}

interface Message {
  id: string;
  subscriber_email: string;
  subject: string;
  body: string;
  message_type: string;
  is_read: boolean;
  sent_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TAG_COLORS: Record<string, string> = {
  vip:          "bg-amber-100 text-amber-800 border-amber-200",
  "early-access": "bg-purple-100 text-purple-800 border-purple-200",
  "high-value": "bg-emerald-100 text-emerald-800 border-emerald-200",
  wholesale:    "bg-blue-100 text-blue-800 border-blue-200",
  "repeat-buyer": "bg-rose-100 text-rose-800 border-rose-200",
};
const tagStyle = (t: string) => TAG_COLORS[t] ?? "bg-gray-100 text-gray-700 border-gray-200";

const PRESET_TAGS = ["vip", "early-access", "high-value", "wholesale", "repeat-buyer"];

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function exportCSV(rows: Subscriber[]) {
  const headers = ["Email", "Name", "Source", "Status", "Tags", "Joined"];
  const body = rows.map(r => [
    r.email, r.name ?? "", r.source, r.status, (r.tags ?? []).join(";"), fmt(r.created_at),
  ]);
  const csv = [headers, ...body].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `inner-circle-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="admin-surface rounded-xl p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + "1a" }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[0.58rem] uppercase tracking-[0.14em] text-gray-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        {sub && <p className="text-[0.60rem] text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Subscriber Detail Panel ──────────────────────────────────────────────────

function SubscriberPanel({
  sub, token, onClose, onRefresh,
}: {
  sub: Subscriber; token: string; onClose: () => void; onRefresh: () => void;
}) {
  const [editNotes, setEditNotes] = useState(sub.notes ?? "");
  const [editName, setEditName] = useState(sub.name ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(sub.tags ?? []);
  const [msgSubject, setMsgSubject] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [msgType, setMsgType] = useState("message");
  const [saving, setSaving] = useState(false);

  const updateFn = useServerFn(updateSubscriber);
  const msgFn = useServerFn(sendSubscriberMessage);
  const listMsgFn = useServerFn(listSubscriberMessages);
  const deleteFn = useServerFn(deleteSubscriber);

  const { data: msgData, refetch: refetchMsgs } = useQuery({
    queryKey: ["sub-messages", sub.email, token],
    queryFn: () => listMsgFn({ data: { token, email: sub.email } }),
    enabled: !!token,
  });
  const messages: Message[] = msgData?.messages ?? [];

  const toggleTag = (t: string) =>
    setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const save = async () => {
    setSaving(true);
    try {
      await updateFn({ data: { token, id: sub.id, name: editName || undefined, notes: editNotes || undefined, tags: selectedTags } });
      toast.success("Subscriber updated");
      onRefresh();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const sendMsg = async () => {
    if (!msgSubject.trim() || !msgBody.trim()) return toast.error("Subject and message required");
    setSaving(true);
    try {
      await msgFn({ data: { token, subscriber_email: sub.email, subject: msgSubject, body: msgBody, message_type: msgType } });
      toast.success("Message sent to subscriber's account");
      setMsgSubject(""); setMsgBody("");
      refetchMsgs();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const unsubscribe = async () => {
    await updateFn({ data: { token, id: sub.id, status: sub.status === "active" ? "unsubscribed" : "active" } });
    toast.success(sub.status === "active" ? "Unsubscribed" : "Resubscribed");
    onRefresh();
  };

  const remove = async () => {
    if (!confirm(`Permanently delete ${sub.email}?`)) return;
    await deleteFn({ data: { token, id: sub.id } });
    toast.success("Subscriber removed");
    onClose(); onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="w-full max-w-lg h-full overflow-y-auto bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-3" style={{ background: "#fafafa" }}>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[0.52rem] px-2 py-0.5 rounded-full font-semibold border ${sub.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                {sub.status}
              </span>
              {(sub.tags ?? []).map(t => (
                <span key={t} className={`text-[0.48rem] px-2 py-0.5 rounded-full font-medium border ${tagStyle(t)}`}>{t}</span>
              ))}
            </div>
            <p className="text-sm font-semibold text-gray-900 truncate">{sub.email}</p>
            <p className="text-[0.62rem] text-gray-400">Joined {fmt(sub.created_at)} · via {sub.source}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {/* Profile */}
          <div className="px-6 py-5 space-y-4">
            <p className="text-[0.62rem] uppercase tracking-[0.14em] font-semibold text-gray-500">Profile</p>
            <div>
              <label className="text-[0.58rem] uppercase tracking-wider text-gray-400 block mb-1.5">Name</label>
              <input value={editName} onChange={e => setEditName(e.target.value)}
                placeholder="First Last"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white" />
            </div>
            <div>
              <label className="text-[0.58rem] uppercase tracking-wider text-gray-400 block mb-1.5">Tags</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_TAGS.map(t => (
                  <button key={t} onClick={() => toggleTag(t)}
                    className={`flex items-center gap-1 text-[0.58rem] px-2.5 py-1 rounded-full border font-medium transition-all ${selectedTags.includes(t) ? tagStyle(t) + " ring-1 ring-offset-1 ring-current" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                    {selectedTags.includes(t) && <Check className="h-2.5 w-2.5" />}
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[0.58rem] uppercase tracking-wider text-gray-400 block mb-1.5">Admin Notes</label>
              <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3}
                placeholder="Private notes — not visible to subscriber"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-400 bg-white" />
            </div>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[0.62rem] uppercase tracking-wider font-semibold text-white disabled:opacity-50 transition-all"
              style={{ background: "linear-gradient(135deg,#111827,#1f2937)" }}>
              {saving ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="h-3 w-3" />}
              Save Profile
            </button>
          </div>

          {/* Message composer */}
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-500" />
              <p className="text-[0.62rem] uppercase tracking-[0.14em] font-semibold text-gray-500">Send Internal Message</p>
            </div>
            <p className="text-[0.62rem] text-gray-400 -mt-2">Appears in the subscriber's QJ account inbox when they log in.</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {[
                { v: "message", l: "General Message", i: MessageSquare },
                { v: "early_access", l: "Early Access", i: Zap },
                { v: "vip_offer", l: "VIP Offer", i: Crown },
                { v: "gift", l: "Gift / Reward", i: Gift },
              ].map(({ v, l, i: Icon }) => (
                <button key={v} onClick={() => setMsgType(v)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[0.60rem] font-medium transition-all ${msgType === v ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                  <Icon className="h-3 w-3 shrink-0" />
                  {l}
                </button>
              ))}
            </div>
            <input value={msgSubject} onChange={e => setMsgSubject(e.target.value)}
              placeholder="Message subject…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white" />
            <textarea value={msgBody} onChange={e => setMsgBody(e.target.value)} rows={4}
              placeholder="Your message to this subscriber…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-400 bg-white" />
            <button onClick={sendMsg} disabled={saving || !msgSubject.trim() || !msgBody.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[0.62rem] uppercase tracking-wider font-semibold disabled:opacity-50 transition-all"
              style={{ background: "rgba(245,158,11,0.10)", color: "#92400e", border: "1px solid rgba(245,158,11,0.25)" }}>
              <Send className="h-3 w-3" /> Send Message
            </button>
          </div>

          {/* Message history */}
          {messages.length > 0 && (
            <div className="px-6 py-5">
              <p className="text-[0.62rem] uppercase tracking-[0.14em] font-semibold text-gray-500 mb-3">Message History</p>
              <div className="space-y-3">
                {messages.map(m => (
                  <div key={m.id} className="rounded-lg p-3.5 text-sm" style={{ background: "#f9fafb", border: "1px solid rgba(0,0,0,0.07)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-800 text-[0.72rem]">{m.subject}</span>
                      <span className="text-[0.52rem] text-gray-400">{fmt(m.sent_at)}</span>
                    </div>
                    <p className="text-[0.68rem] text-gray-500 line-clamp-2">{m.body}</p>
                    <span className={`mt-2 inline-block text-[0.50rem] px-2 py-0.5 rounded-full ${m.is_read ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {m.is_read ? "Read" : "Unread"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3" style={{ background: "#fafafa" }}>
          <button onClick={unsubscribe}
            className="text-[0.60rem] px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 uppercase tracking-wider transition-colors">
            {sub.status === "active" ? "Unsubscribe" : "Resubscribe"}
          </button>
          <button onClick={remove}
            className="text-[0.60rem] px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 uppercase tracking-wider transition-colors ml-auto">
            <Trash2 className="h-3 w-3 inline mr-1" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Campaign Composer ────────────────────────────────────────────────────────

function CampaignComposer({
  token, onClose, onSent, initial,
}: {
  token: string; onClose: () => void; onSent: () => void; initial?: Partial<Campaign>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [body, setBody] = useState(initial?.body_text ?? "");
  const [type, setType] = useState(initial?.campaign_type ?? "broadcast");
  const [tagFilter, setTagFilter] = useState<string[]>(initial?.tag_filter ?? []);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const saveFn = useServerFn(saveCampaign);
  const sendFn = useServerFn(sendCampaign);

  const QUICK_TEMPLATES = [
    {
      label: "New Drop Alert",
      icon: Zap,
      type: "drop_alert",
      subject: "✦ Something new just dropped — Qureshi Jewelers",
      body: "A new piece has arrived in the collection.\n\nHand-set VVS moissanite. GRA certified. S925 sterling silver.\n\nThis one won't stay in stock long.\n\nShop the new arrival →",
    },
    {
      label: "VIP Exclusive",
      icon: Crown,
      type: "vip_exclusive",
      subject: "For Inner Circle members only — exclusive access",
      body: "You're one of a select few seeing this.\n\nAs a member of The Inner Circle, you have early access to our newest collection before it opens to the public.\n\nUse this window — it closes in 24 hours.\n\nClaim your access →",
    },
    {
      label: "Seasonal Campaign",
      icon: Sparkles,
      type: "broadcast",
      subject: "The collection that turns heads — Qureshi Jewelers",
      body: "There's a reason people stop and stare.\n\nVVS moissanite with a fire dispersion of 0.104 — nearly 3× that of diamond. In every setting, under every light.\n\nDiscover the full collection →",
    },
    {
      label: "Win-Back",
      icon: Bell,
      type: "winback",
      subject: "We haven't seen you lately — a note from Qureshi",
      body: "It's been a while, and we wanted to check in.\n\nWe've added new pieces, new finishes, and something we think you'll love.\n\nCome back and see what's new →",
    },
  ];

  const applyTemplate = (t: typeof QUICK_TEMPLATES[0]) => {
    setTitle(t.label);
    setSubject(t.subject);
    setBody(t.body);
    setType(t.type);
  };

  const send = async () => {
    if (!title || !subject || !body) return toast.error("Title, subject, and body required");
    setSaving(true);
    try {
      const { id } = await saveFn({ data: { token, title, subject, body_text: body, campaign_type: type, tag_filter: tagFilter } });
      const result = await sendFn({ data: { token, id } });
      toast.success(`Campaign sent to ${result.sent} subscriber${result.sent !== 1 ? "s" : ""}${result.failed > 0 ? ` (${result.failed} failed)` : ""}`);
      onSent();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const saveDraft = async () => {
    if (!title || !subject || !body) return toast.error("Title, subject, and body required");
    setSaving(true);
    try {
      await saveFn({ data: { token, id: initial?.id, title, subject, body_text: body, campaign_type: type, tag_filter: tagFilter } });
      toast.success("Draft saved");
      onSent();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100" style={{ background: "#fafafa" }}>
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-amber-500" />
            <span className="font-semibold text-gray-900">New Campaign</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPreview(v => !v)}
              className={`text-[0.60rem] px-3 py-1.5 rounded-lg border uppercase tracking-wider transition-colors ${preview ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"}`}>
              <Eye className="h-3 w-3 inline mr-1" />{preview ? "Edit" : "Preview"}
            </button>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-5">
          {/* Quick templates */}
          <div>
            <p className="text-[0.60rem] uppercase tracking-[0.14em] text-gray-400 mb-3">Quick Templates</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUICK_TEMPLATES.map(t => (
                <button key={t.label} onClick={() => applyTemplate(t)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all text-center group">
                  <t.icon className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[0.58rem] font-medium text-gray-700">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {preview ? (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-[#faf9f7] px-6 py-4 border-b border-gray-100">
                <p className="text-[0.55rem] uppercase tracking-widest text-amber-600 mb-1">The Inner Circle</p>
                <p className="font-semibold text-gray-900 text-sm">{subject || "(no subject)"}</p>
              </div>
              <div className="bg-white px-6 py-5">
                <p className="text-[0.80rem] text-gray-600 leading-[1.9] whitespace-pre-line">{body || "(empty body)"}</p>
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <div className="inline-block px-8 py-3 bg-gray-900 text-white text-[0.58rem] uppercase tracking-[0.24em]">Shop Now →</div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[0.58rem] uppercase tracking-wider text-gray-400 block mb-1.5">Campaign Title (internal)</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. June Drop Alert"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white" />
                </div>
                <div>
                  <label className="text-[0.58rem] uppercase tracking-wider text-gray-400 block mb-1.5">Campaign Type</label>
                  <select value={type} onChange={e => setType(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white">
                    <option value="broadcast">Broadcast (All)</option>
                    <option value="drop_alert">Drop Alert</option>
                    <option value="vip_exclusive">VIP Exclusive</option>
                    <option value="winback">Win-Back</option>
                    <option value="seasonal">Seasonal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[0.58rem] uppercase tracking-wider text-gray-400 block mb-1.5">Email Subject Line</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject line subscribers will see…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white" />
              </div>

              <div>
                <label className="text-[0.58rem] uppercase tracking-wider text-gray-400 block mb-1.5">Message Body</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={7}
                  placeholder="Write your message… Use line breaks for paragraphs."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-gray-400 bg-white leading-relaxed" />
              </div>

              <div>
                <label className="text-[0.58rem] uppercase tracking-wider text-gray-400 block mb-1.5">Send to (tag filter)</label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setTagFilter([])}
                    className={`text-[0.60rem] px-3 py-1.5 rounded-lg border font-medium transition-all ${tagFilter.length === 0 ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                    All Active
                  </button>
                  {PRESET_TAGS.map(t => (
                    <button key={t} onClick={() => setTagFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                      className={`flex items-center gap-1 text-[0.60rem] px-3 py-1.5 rounded-lg border font-medium transition-all ${tagFilter.includes(t) ? tagStyle(t) + " ring-1 ring-offset-1 ring-current" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                      {tagFilter.includes(t) && <Check className="h-2.5 w-2.5" />}
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3" style={{ background: "#fafafa" }}>
          <button onClick={saveDraft} disabled={saving}
            className="text-[0.62rem] px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 uppercase tracking-wider transition-colors font-medium disabled:opacity-50">
            Save Draft
          </button>
          <button onClick={send} disabled={saving || !title || !subject || !body}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-[0.62rem] uppercase tracking-[0.14em] font-semibold text-white disabled:opacity-40 transition-all"
            style={{ background: "linear-gradient(135deg,#92400e,#d97706)", boxShadow: "0 2px 8px rgba(217,119,6,0.35)" }}>
            {saving ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="h-3 w-3" />}
            Send Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type TabKey = "subscribers" | "campaigns";

function AdminSubscribers() {
  const token = useAdminToken();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>("subscribers");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "unsubscribed">("active");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Subscriber | null>(null);
  const [composing, setComposing] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);

  const listFn = useServerFn(listSubscribers);
  const listCampFn = useServerFn(listCampaigns);
  const delCampFn = useServerFn(deleteCampaign);

  const { data: subData, isLoading: subLoading, refetch: refetchSubs } = useQuery({
    queryKey: ["admin-subscribers", token],
    queryFn: () => listFn({ data: { token } }),
    enabled: !!token,
  });

  const { data: campData, isLoading: campLoading, refetch: refetchCamps } = useQuery({
    queryKey: ["admin-campaigns", token],
    queryFn: () => listCampFn({ data: { token } }),
    enabled: !!token,
  });

  const subs: Subscriber[] = subData?.subscribers ?? [];
  const camps: Campaign[] = campData?.campaigns ?? [];

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const totalActive = subs.filter(s => s.status === "active").length;
  const thisMonth = subs.filter(s => new Date(s.created_at) >= thisMonthStart).length;
  const sentCampaigns = camps.filter(c => c.status === "sent").length;

  const filtered = useMemo(() => {
    return subs.filter(s => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (tagFilter !== "all" && !(s.tags ?? []).includes(tagFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        return s.email.toLowerCase().includes(q) || (s.name ?? "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [subs, statusFilter, tagFilter, search]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    subs.forEach(s => (s.tags ?? []).forEach(t => set.add(t)));
    return [...set].sort();
  }, [subs]);

  const deletecamp = async (id: string) => {
    if (!confirm("Delete this campaign?")) return;
    try {
      await delCampFn({ data: { token, id } });
      toast.success("Campaign deleted");
      refetchCamps();
    } catch (e: any) { toast.error(e.message); }
  };

  const CAMPAIGN_TYPE_ICONS: Record<string, React.ElementType> = {
    broadcast: Mail, drop_alert: Zap, vip_exclusive: Crown, winback: Bell, seasonal: Sparkles,
  };

  return (
    <div className="p-5 lg:p-7 max-w-[1360px]">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[0.52rem] uppercase tracking-[0.30em] text-amber-600 font-medium">Inner Circle</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 leading-none">Subscriber Management</h1>
          <p className="text-[0.72rem] text-gray-400 mt-1.5">Your most valuable marketing asset — own the relationship.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => exportCSV(filtered)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-[0.60rem] uppercase tracking-wider font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button onClick={() => { setEditCampaign(null); setComposing(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[0.60rem] uppercase tracking-[0.14em] font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg,#92400e,#d97706)", boxShadow: "0 2px 8px rgba(217,119,6,0.35)" }}>
            <Mail className="h-3.5 w-3.5" /> New Campaign
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard label="Total Subscribers" value={subs.length} sub={`${totalActive} active`} icon={Users} color="#d97706" />
        <StatCard label="Joined This Month" value={thisMonth} sub="new members" icon={TrendingUp} color="#10b981" />
        <StatCard label="Campaigns Sent" value={sentCampaigns} sub={`${camps.length - sentCampaigns} draft${camps.length - sentCampaigns !== 1 ? "s" : ""}`} icon={Send} color="#6366f1" />
        <StatCard label="VIP Members" value={subs.filter(s => (s.tags ?? []).includes("vip")).length} sub="tagged as VIP" icon={Crown} color="#f59e0b" />
      </div>

      {/* Quick action chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { label: "Drop Alert", icon: Zap, color: "#d97706", bg: "rgba(217,119,6,0.08)", border: "rgba(217,119,6,0.20)", action: () => { setComposing(true); } },
          { label: "VIP Campaign", icon: Crown, color: "#7c3aed", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.20)", action: () => { setTagFilter("vip"); setComposing(true); } },
          { label: "Win-Back", icon: Bell, color: "#0891b2", bg: "rgba(8,145,178,0.08)", border: "rgba(8,145,178,0.20)", action: () => { setComposing(true); } },
        ].map(({ label, icon: Icon, color, bg, border, action }) => (
          <button key={label} onClick={action}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-[0.62rem] font-semibold uppercase tracking-wider transition-all hover:scale-105"
            style={{ background: bg, border: `1px solid ${border}`, color }}>
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 mb-5">
        {([["subscribers", "Subscribers", Users], ["campaigns", "Campaigns", Mail]] as [TabKey, string, React.ElementType][]).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-3 text-[0.62rem] uppercase tracking-[0.12em] font-semibold relative transition-colors ${tab === key ? "text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
            <Icon className="h-3.5 w-3.5" />
            {label}
            {tab === key && <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-gray-900 rounded-t-full" />}
          </button>
        ))}
      </div>

      {/* ── Subscribers tab ─────────────────────────────────────── */}
      {tab === "subscribers" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email or name…"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 bg-white" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white min-w-[130px]">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
            <select value={tagFilter} onChange={e => setTagFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white min-w-[130px]">
              <option value="all">All Tags</option>
              {allTags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <p className="text-[0.60rem] text-gray-400 mb-3 uppercase tracking-wider">{filtered.length} subscriber{filtered.length !== 1 ? "s" : ""}</p>

          {subLoading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Mail className="h-10 w-10 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No subscribers found</p>
              <p className="text-sm mt-1">Adjust your filters or wait for signups.</p>
            </div>
          ) : (
            <div className="admin-surface rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                    <th className="px-5 py-3.5 text-[0.55rem] uppercase tracking-[0.14em] text-gray-400 font-semibold">Subscriber</th>
                    <th className="px-4 py-3.5 text-[0.55rem] uppercase tracking-[0.14em] text-gray-400 font-semibold">Tags</th>
                    <th className="px-4 py-3.5 text-[0.55rem] uppercase tracking-[0.14em] text-gray-400 font-semibold">Source</th>
                    <th className="px-4 py-3.5 text-[0.55rem] uppercase tracking-[0.14em] text-gray-400 font-semibold">Joined</th>
                    <th className="px-4 py-3.5 text-[0.55rem] uppercase tracking-[0.14em] text-gray-400 font-semibold">Status</th>
                    <th className="px-4 py-3.5 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-amber-50/30 transition-colors cursor-pointer"
                      style={{ borderLeft: `3px solid ${s.status === "active" ? "#f59e0b" : "#e5e7eb"}` }}
                      onClick={() => setSelected(s)}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[0.65rem] font-bold shrink-0"
                            style={{ background: `hsl(${(s.email.charCodeAt(0) * 17) % 360},60%,92%)`, color: `hsl(${(s.email.charCodeAt(0) * 17) % 360},50%,35%)` }}>
                            {s.name ? s.name[0].toUpperCase() : s.email[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            {s.name && <p className="text-[0.72rem] font-semibold text-gray-900 truncate">{s.name}</p>}
                            <p className={`text-[0.68rem] truncate ${s.name ? "text-gray-400" : "font-medium text-gray-800"}`}>{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(s.tags ?? []).length === 0
                            ? <span className="text-[0.55rem] text-gray-300">—</span>
                            : (s.tags ?? []).slice(0, 3).map(t => (
                              <span key={t} className={`text-[0.50rem] px-2 py-0.5 rounded-full border font-medium ${tagStyle(t)}`}>{t}</span>
                            ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[0.62rem] text-gray-500">{s.source}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[0.62rem] text-gray-500">{fmt(s.created_at)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-[0.55rem] px-2.5 py-1 rounded-full font-semibold border ${s.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-400 border-gray-200"}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button className="p-1.5 text-gray-300 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Campaigns tab ───────────────────────────────────────── */}
      {tab === "campaigns" && (
        <>
          {campLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : camps.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Send className="h-10 w-10 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No campaigns yet</p>
              <p className="text-sm mt-1 mb-6">Create your first campaign to reach The Inner Circle.</p>
              <button onClick={() => setComposing(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-[0.62rem] uppercase tracking-wider font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#92400e,#d97706)" }}>
                <Plus className="h-3.5 w-3.5" /> New Campaign
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {camps.map(c => {
                const Icon = CAMPAIGN_TYPE_ICONS[c.campaign_type] ?? Mail;
                return (
                  <div key={c.id} className="admin-surface rounded-xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: c.status === "sent" ? "rgba(16,185,129,0.10)" : "rgba(107,114,128,0.10)" }}>
                      <Icon className="h-5 w-5" style={{ color: c.status === "sent" ? "#10b981" : "#9ca3af" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-gray-900">{c.title}</p>
                            <span className={`text-[0.50rem] px-2 py-0.5 rounded-full font-semibold border ${c.status === "sent" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                              {c.status}
                            </span>
                          </div>
                          <p className="text-[0.68rem] text-gray-400 truncate mb-2">{c.subject}</p>
                          <div className="flex flex-wrap items-center gap-3 text-[0.58rem] text-gray-400">
                            {c.status === "sent" && (
                              <>
                                <span className="flex items-center gap-1"><Send className="h-3 w-3" />{c.recipient_count ?? 0} sent</span>
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{c.sent_at ? fmt(c.sent_at) : "—"}</span>
                              </>
                            )}
                            {c.status === "draft" && (
                              <span className="flex items-center gap-1 text-amber-600"><Clock className="h-3 w-3" />Draft · {fmt(c.created_at)}</span>
                            )}
                            {(c.tag_filter ?? []).length > 0 && (
                              <span className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {(c.tag_filter ?? []).join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {c.status === "draft" && (
                            <button onClick={() => { setEditCampaign(c); setComposing(true); }}
                              className="text-[0.58rem] px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 uppercase tracking-wider transition-colors">
                              <Edit3 className="h-3 w-3 inline mr-1" />Edit
                            </button>
                          )}
                          <button onClick={() => deletecamp(c.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Subscriber detail panel */}
      {selected && (
        <SubscriberPanel
          sub={selected}
          token={token}
          onClose={() => setSelected(null)}
          onRefresh={() => { refetchSubs(); setSelected(null); }}
        />
      )}

      {/* Campaign composer */}
      {composing && (
        <CampaignComposer
          token={token}
          initial={editCampaign ?? undefined}
          onClose={() => { setComposing(false); setEditCampaign(null); }}
          onSent={() => { setComposing(false); setEditCampaign(null); refetchCamps(); }}
        />
      )}
    </div>
  );
}
