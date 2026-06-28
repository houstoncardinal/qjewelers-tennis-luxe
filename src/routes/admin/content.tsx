import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef } from "react";
import {
  FileText,
  Save,
  Check,
  Loader2,
  Rocket,
  RotateCcw,
  Search,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminToken } from "@/lib/admin-context";
import {
  listSiteContent,
  updateSiteContent,
  bulkUpdateSiteContent,
  triggerNetlifyDeploy,
} from "@/lib/content.functions";

export const Route = createFileRoute("/admin/content")({
  component: ContentDashboard,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContentRow {
  key: string;
  value: string;
  type: string;
  section: string;
  label: string;
  updated_at: string;
}

// ─── Section badge ────────────────────────────────────────────────────────────

const SECTION_COLORS: Record<string, string> = {
  home:   "bg-blue-50 text-blue-700 border-blue-200",
  footer: "bg-gray-50 text-gray-600 border-gray-200",
  nav:    "bg-purple-50 text-purple-700 border-purple-200",
  seo:    "bg-amber-50 text-amber-700 border-amber-200",
  general: "bg-green-50 text-green-700 border-green-200",
};

function SectionBadge({ section }: { section: string }) {
  const cls = SECTION_COLORS[section] ?? "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.12em] font-semibold rounded border ${cls}`}>
      {section}
    </span>
  );
}

// ─── Editable cell ────────────────────────────────────────────────────────────

function EditableCell({
  row,
  onSave,
}: {
  row: ContentRow;
  onSave: (key: string, value: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(row.value);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const isDirty = draft !== row.value;

  const handleSave = async () => {
    if (!isDirty || saving) return;
    setSaving(true);
    try {
      await onSave(row.key, draft);
      setSaved(true);
      setTimeout(() => { setSaved(false); setEditing(false); }, 1000);
    } catch (err: any) {
      toast.error(err?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setDraft(row.value);
    setEditing(false);
    setSaved(false);
  };

  if (editing) {
    const isLong = draft.length > 80 || draft.includes("\n");
    return (
      <div className="space-y-2">
        <textarea
          ref={ref}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") handleDiscard();
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSave();
          }}
          rows={isLong ? 4 : 2}
          className="w-full text-sm text-gray-800 border border-blue-400 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-blue-50/30"
        />
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSave}
            disabled={!isDirty || saving || saved}
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[0.65rem] font-semibold uppercase tracking-[0.12em] transition-all",
              saved
                ? "bg-emerald-500 text-white"
                : isDirty && !saving
                ? "bg-gray-900 text-white hover:bg-gray-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed",
            ].join(" ")}
          >
            {saved ? (
              <><Check className="h-3 w-3" /><span>Saved</span></>
            ) : saving ? (
              <><Loader2 className="h-3 w-3 animate-spin" /><span>Saving</span></>
            ) : (
              <><Save className="h-3 w-3" /><span>Save</span></>
            )}
          </button>
          <button
            onClick={handleDiscard}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-[0.65rem] text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-colors uppercase tracking-[0.12em]"
          >
            <RotateCcw className="h-3 w-3" />
            Discard
          </button>
          <span className="ml-auto text-[0.52rem] text-gray-400 font-mono">{draft.length} chars</span>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setEditing(true); setTimeout(() => ref.current?.focus(), 50); }}
      className="w-full text-left group"
    >
      <p className="text-sm text-gray-700 leading-relaxed line-clamp-2 group-hover:text-gray-900 transition-colors">
        {row.value || <span className="italic text-gray-300">—empty—</span>}
      </p>
      <p className="text-[0.55rem] text-gray-300 group-hover:text-blue-500 transition-colors mt-1 uppercase tracking-[0.12em]">
        Click to edit
      </p>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function ContentDashboard() {
  const token = useAdminToken();
  const qc = useQueryClient();

  const listFn   = useServerFn(listSiteContent);
  const saveFn   = useServerFn(updateSiteContent);
  const bulkFn   = useServerFn(bulkUpdateSiteContent);
  const deployFn = useServerFn(triggerNetlifyDeploy);

  const [search, setSearch]         = useState("");
  const [section, setSection]       = useState("all");
  const [isDeploying, setIsDeploying] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["site-content", token],
    queryFn: () => listFn({ data: { token } }),
    enabled: !!token,
  });

  const rows: ContentRow[] = data?.rows ?? [];

  const sections = ["all", ...Array.from(new Set(rows.map((r) => r.section))).sort()];

  const filtered = rows.filter((r) => {
    const matchSection = section === "all" || r.section === section;
    const q = search.toLowerCase();
    const matchSearch = !q || r.label.toLowerCase().includes(q) || r.value.toLowerCase().includes(q) || r.key.includes(q);
    return matchSection && matchSearch;
  });

  const handleSave = async (key: string, value: string) => {
    await saveFn({ data: { token, key, value } });
    qc.invalidateQueries({ queryKey: ["site-content"] });
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      await deployFn({ data: { token } });
      toast.success("Deploy triggered — Netlify is rebuilding now");
    } catch (err: any) {
      toast.error(err?.message ?? "Deploy trigger failed");
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f7]">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 flex items-center gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-[0.95rem] font-semibold text-gray-900">Site Content</h1>
            <p className="text-[0.60rem] text-gray-400 mt-0.5">
              Edit website copy — changes go live immediately on next page load
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[0.65rem] text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Site
          </a>
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-[0.65rem] font-semibold hover:bg-gray-700 disabled:opacity-60 disabled:pointer-events-none transition-colors"
          >
            {isDeploying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Rocket className="h-3.5 w-3.5" />
            )}
            {isDeploying ? "Deploying…" : "Trigger Deploy"}
          </button>
        </div>
      </div>

      <div className="px-6 py-6 max-w-5xl mx-auto space-y-5">

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
          <p className="text-[0.68rem] text-blue-800 leading-relaxed">
            <strong>Changes are live immediately</strong> — content is read from the database on every page request (SSR).
            No deploy needed for text edits. Use "Trigger Deploy" only to force a CDN cache purge or after code changes.
            You can also edit text directly on the storefront by clicking <strong>Edit Site</strong> in the bottom-right corner.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search content…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          <div className="relative">
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
            >
              {sections.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All sections" : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>
          <p className="text-[0.65rem] text-gray-400 ml-auto">
            {filtered.length} item{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Content table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading content…</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16 text-red-500 text-sm">
              Failed to load content. Please refresh.
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
              No content matches your search.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/60">
                  <th className="text-left px-5 py-3 text-[0.58rem] uppercase tracking-[0.14em] font-semibold text-gray-400 w-40">
                    Label
                  </th>
                  <th className="text-left px-4 py-3 text-[0.58rem] uppercase tracking-[0.14em] font-semibold text-gray-400">
                    Content
                  </th>
                  <th className="text-left px-4 py-3 text-[0.58rem] uppercase tracking-[0.14em] font-semibold text-gray-400 w-24 hidden sm:table-cell">
                    Section
                  </th>
                  <th className="text-left px-4 py-3 text-[0.58rem] uppercase tracking-[0.14em] font-semibold text-gray-400 w-28 hidden md:table-cell">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((row) => (
                  <tr key={row.key} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 align-top">
                      <p className="text-[0.72rem] font-medium text-gray-800 leading-snug">{row.label}</p>
                      <p className="text-[0.52rem] font-mono text-gray-300 mt-0.5 break-all">{row.key}</p>
                    </td>
                    <td className="px-4 py-4 align-top min-w-[240px]">
                      <EditableCell row={row} onSave={handleSave} />
                    </td>
                    <td className="px-4 py-4 align-top hidden sm:table-cell">
                      <SectionBadge section={row.section} />
                    </td>
                    <td className="px-4 py-4 align-top hidden md:table-cell">
                      <p className="text-[0.60rem] text-gray-400">
                        {new Date(row.updated_at).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
