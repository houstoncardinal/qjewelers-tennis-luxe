import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  type ElementType,
  type HTMLAttributes,
  type CSSProperties,
} from "react";
import { useServerFn } from "@tanstack/react-start";
import { updateSiteContent } from "@/lib/content.functions";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EditPanelState {
  contentKey: string;
  label: string;
  savedValue: string;
}

interface CmsContextValue {
  content: Record<string, string>;
  editMode: boolean;
  editPanel: EditPanelState | null;
  isSaving: boolean;
  savedAt: Date | null;
  isAdminSession: boolean;
  setEditMode: (on: boolean) => void;
  openEditPanel: (key: string, label: string) => void;
  closeEditPanel: () => void;
  getContent: (key: string, fallback?: string) => string;
  updateContent: (key: string, value: string) => Promise<void>;
  setOptimistic: (key: string, value: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CmsContext = createContext<CmsContextValue | null>(null);

export function useCms(): CmsContextValue {
  const ctx = useContext(CmsContext);
  if (!ctx) throw new Error("useCms must be inside CmsProvider");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CmsProvider({
  children,
  initialContent,
  isAdminSession,
}: {
  children: ReactNode;
  initialContent: Record<string, string>;
  isAdminSession: boolean;
}) {
  const [content, setContent] = useState<Record<string, string>>(initialContent);
  const [editMode, setEditMode] = useState(false);
  const [editPanel, setEditPanel] = useState<EditPanelState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const updateFn = useServerFn(updateSiteContent);

  const getContent = useCallback(
    (key: string, fallback = "") => content[key] ?? fallback,
    [content]
  );

  const setOptimistic = useCallback((key: string, value: string) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateContent = useCallback(
    async (key: string, value: string) => {
      setContent((prev) => ({ ...prev, [key]: value }));
      setIsSaving(true);
      try {
        await updateFn({ data: { token: "", key, value } });
        setSavedAt(new Date());
      } catch (err) {
        console.error("[CMS] save failed:", err);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [updateFn]
  );

  const openEditPanel = useCallback(
    (key: string, label: string) => {
      setEditPanel({ contentKey: key, label, savedValue: content[key] ?? "" });
    },
    [content]
  );

  const closeEditPanel = useCallback(() => setEditPanel(null), []);

  return (
    <CmsContext.Provider
      value={{
        content,
        editMode,
        editPanel,
        isSaving,
        savedAt,
        isAdminSession,
        setEditMode,
        openEditPanel,
        closeEditPanel,
        getContent,
        updateContent,
        setOptimistic,
      }}
    >
      {children}
    </CmsContext.Provider>
  );
}

// ─── EditableText ─────────────────────────────────────────────────────────────
// Renders a plain element in view mode. In edit mode, clicking opens the
// CmsToolbar edit panel so the admin can change the text in-place.

interface EditableTextProps extends HTMLAttributes<HTMLElement> {
  contentKey: string;
  label: string;
  defaultValue: string;
  tag?: ElementType;
  style?: CSSProperties;
}

export function EditableText({
  contentKey,
  label,
  defaultValue,
  tag: Tag = "span",
  className = "",
  style,
  children: _children,
  ...rest
}: EditableTextProps) {
  const { editMode, getContent, openEditPanel } = useCms();
  const value = getContent(contentKey, defaultValue);

  if (!editMode) {
    return (
      <Tag className={className} style={style} {...rest}>
        {value}
      </Tag>
    );
  }

  return (
    <Tag
      className={[
        className,
        "relative cursor-pointer rounded-[2px]",
        "outline outline-dashed outline-2 outline-offset-2 outline-blue-400/40",
        "hover:outline-blue-500 hover:bg-blue-500/[0.06]",
        "transition-colors duration-100",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      onClick={(e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        openEditPanel(contentKey, label);
      }}
      title={`Click to edit: ${label}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openEditPanel(contentKey, label);
        }
      }}
      {...rest}
    >
      {value}
    </Tag>
  );
}
