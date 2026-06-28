import { useState, useEffect, useRef } from "react";
import {
  Pencil,
  X,
  Check,
  Loader2,
  Rocket,
  Eye,
  ChevronUp,
  ChevronDown,
  LayoutTemplate,
  ExternalLink,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useCms } from "@/lib/cms-context";
import { triggerNetlifyDeploy } from "@/lib/content.functions";

// ─── CmsToolbar ───────────────────────────────────────────────────────────────
// Floating FAB at bottom-right, visible only to admins.
// Expands into a control panel; also renders the inline edit panel when
// an editable element has been clicked.

export function CmsToolbar() {
  const {
    isAdminSession,
    editMode,
    setEditMode,
    editPanel,
    closeEditPanel,
    isSaving,
    savedAt,
    getContent,
    updateContent,
    setOptimistic,
  } = useCms();

  const [expanded, setExpanded] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const deployFn = useServerFn(triggerNetlifyDeploy);

  if (!isAdminSession) return null;

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      await deployFn({ data: { token: "" } });
      toast.success("Deploy triggered — Netlify build started");
    } catch (err: any) {
      toast.error(err?.message ?? "Deploy failed");
    } finally {
      setIsDeploying(false);
    }
  };

  const toggleEditMode = () => {
    const next = !editMode;
    setEditMode(next);
    if (next) {
      setExpanded(false);
      toast.info("Edit mode on — click any highlighted text to edit it", { duration: 3500 });
    } else {
      closeEditPanel();
    }
  };

  return (
    <>
      {/* ── Floating FAB + control panel ─────────────────── */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2 select-none">

        {/* Expanded control panel */}
        {expanded && (
          <div className="bg-[#0f0f0f] text-white rounded-xl shadow-2xl border border-white/10 w-64 overflow-hidden">

            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/10">
              <LayoutTemplate className="h-3.5 w-3.5 text-white/50" />
              <span className="text-[0.62rem] uppercase tracking-[0.22em] font-semibold text-white/80">
                Site Editor
              </span>
              <span className="ml-auto text-[0.50rem] uppercase tracking-[0.16em] text-white/30 border border-white/15 rounded px-1.5 py-0.5">
                Admin
              </span>
            </div>

            {/* Edit mode toggle */}
            <div className="px-4 py-3.5 border-b border-white/10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.70rem] font-medium text-white">Edit Mode</p>
                  <p className="text-[0.57rem] text-white/40 mt-0.5">
                    Click text on the page to edit
                  </p>
                </div>
                <button
                  onClick={toggleEditMode}
                  className={`relative rounded-full transition-colors shrink-0 ${
                    editMode ? "bg-blue-500" : "bg-white/20"
                  }`}
                  style={{ width: 40, height: 22 }}
                  aria-label="Toggle edit mode"
                >
                  <span
                    className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      editMode ? "translate-x-[19px]" : "translate-x-[3px]"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Save status */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 min-h-[40px]">
              {isSaving ? (
                <>
                  <Loader2 className="h-3 w-3 text-blue-400 animate-spin shrink-0" />
                  <span className="text-[0.60rem] text-white/50">Saving changes…</span>
                </>
              ) : savedAt ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                  <span className="text-[0.60rem] text-white/50">
                    Saved {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-[0.60rem] text-white/40">Auto-saves on edit</span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="p-3 space-y-2">
              <a
                href="/admin/content"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Eye className="h-3.5 w-3.5 text-white/50" />
                <span className="text-[0.65rem] text-white/70">Content Dashboard</span>
                <ExternalLink className="h-3 w-3 ml-auto text-white/25" />
              </a>
              <button
                onClick={handleDeploy}
                disabled={isDeploying}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                {isDeploying ? (
                  <Loader2 className="h-3.5 w-3.5 text-white/50 animate-spin" />
                ) : (
                  <Rocket className="h-3.5 w-3.5 text-white/50" />
                )}
                <span className="text-[0.65rem] text-white/70">
                  {isDeploying ? "Deploying…" : "Trigger Redeploy"}
                </span>
              </button>
            </div>

          </div>
        )}

        {/* FAB pill */}
        <button
          onClick={() => {
            if (editMode) {
              toggleEditMode();
            } else {
              setExpanded((v) => !v);
            }
          }}
          className={[
            "flex items-center gap-2 px-4 py-2.5 rounded-full shadow-xl transition-all duration-200",
            "text-[0.62rem] font-semibold uppercase tracking-[0.18em]",
            editMode
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-[#0f0f0f] text-white hover:bg-[#1a1a1a] border border-white/10",
          ].join(" ")}
          aria-label={editMode ? "Exit edit mode" : "Open site editor"}
        >
          <Pencil className={`h-3 w-3 ${editMode ? "" : "opacity-60"}`} />
          {editMode ? (
            <>
              <span>Editing</span>
              <X className="h-3 w-3 opacity-70" />
            </>
          ) : (
            <>
              <span>Edit Site</span>
              {expanded ? (
                <ChevronDown className="h-3 w-3 opacity-40" />
              ) : (
                <ChevronUp className="h-3 w-3 opacity-40" />
              )}
            </>
          )}
        </button>

      </div>

      {/* ── Edit panel (bottom sheet) ─────────────────────── */}
      {editPanel && (
        <EditPanel
          contentKey={editPanel.contentKey}
          label={editPanel.label}
          savedValue={editPanel.savedValue}
          currentValue={getContent(editPanel.contentKey, editPanel.savedValue)}
          onOptimistic={setOptimistic}
          onSave={updateContent}
          onClose={closeEditPanel}
        />
      )}
    </>
  );
}

// ─── EditPanel ────────────────────────────────────────────────────────────────
// Bottom sheet for editing a single content key. Typing updates the element
// live on the page (via setOptimistic). Save persists to Supabase.
// Cancel reverts to the saved value.

function EditPanel({
  contentKey,
  label,
  savedValue,
  currentValue,
  onOptimistic,
  onSave,
  onClose,
}: {
  contentKey: string;
  label: string;
  savedValue: string;
  currentValue: string;
  onOptimistic: (key: string, value: string) => void;
  onSave: (key: string, value: string) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(savedValue);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    const len = textareaRef.current?.value.length ?? 0;
    textareaRef.current?.setSelectionRange(len, len);
  }, []);

  const handleChange = (val: string) => {
    setDraft(val);
    onOptimistic(contentKey, val);
  };

  const handleSave = async () => {
    if (saving || saved) return;
    setSaving(true);
    try {
      await onSave(contentKey, draft);
      setSaved(true);
      setTimeout(() => onClose(), 700);
    } catch (err: any) {
      toast.error(err?.message ?? "Save failed — please try again");
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onOptimistic(contentKey, savedValue);
    onClose();
  };

  const isLong = draft.length > 80;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9990] bg-black/25 backdrop-blur-[2px]"
        onClick={handleCancel}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 inset-x-0 z-[9991] px-4 pb-4">
        <div className="max-w-xl mx-auto bg-[#0f0f0f] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
            <Pencil className="h-4 w-4 text-blue-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[0.82rem] font-semibold text-white truncate">{label}</p>
              <p className="text-[0.52rem] text-white/30 font-mono mt-0.5">{contentKey}</p>
            </div>
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/35 hover:text-white transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Textarea */}
          <div className="px-5 pt-4 pb-3">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") { e.preventDefault(); handleCancel(); }
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleSave(); }
              }}
              rows={isLong ? 4 : 2}
              placeholder="Enter text…"
              className="w-full bg-white/5 text-white text-sm leading-relaxed rounded-xl px-4 py-3 resize-none border border-white/10 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/25 transition-colors placeholder:text-white/20"
            />
            <div className="flex items-center justify-between mt-1.5 px-1">
              <p className="text-[0.52rem] text-white/25">
                <kbd className="font-mono">⌘↵</kbd> save &nbsp;·&nbsp; <kbd className="font-mono">Esc</kbd> cancel &nbsp;·&nbsp; live preview on page
              </p>
              <p className="text-[0.52rem] text-white/25 font-mono">{draft.length} chars</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2 px-5 pb-5">
            <button
              onClick={handleCancel}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/25 text-[0.65rem] font-semibold uppercase tracking-[0.16em] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={[
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl",
                "text-[0.65rem] font-semibold uppercase tracking-[0.16em] transition-all",
                saved
                  ? "bg-emerald-500 text-white"
                  : saving
                  ? "bg-blue-600/60 text-white/50 cursor-wait"
                  : "bg-blue-500 hover:bg-blue-600 text-white",
              ].join(" ")}
            >
              {saved ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Saved!</span>
                </>
              ) : saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
