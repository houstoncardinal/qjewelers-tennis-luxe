import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Fragment, useState, useEffect, useRef, useMemo, KeyboardEvent, useCallback } from "react";
import {
  ArrowLeft, Save, Star, Eye, EyeOff, Tag, Trash2, X, ExternalLink, AlertTriangle,
  GripVertical, Plus, Upload, ImagePlus, Check, Loader2, Settings, Palette,
  Ruler, Hash, FileText, Package, Search, ChevronDown, ChevronUp, RefreshCw,
  Copy, CheckCheck, AlertCircle, MoveUp, MoveDown, Pen, Layers, Maximize2,
  Minimize2, Link2, Link2Off, Scan, Wand2, FileImage, ImageOff, SlidersHorizontal,
  BarChart2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAdminProduct, updateProduct, deleteProduct,
  getProductImagesAdmin, addProductImage, updateProductImage,
  deleteProductImage, reorderProductImages,
  getVariants, upsertVariantsBulk, updateVariant, deleteVariant,
  deleteVariantsBulk, toggleVariantsBulk, updateVariantsPriceBulk,
  updateVariantsStockBulk, deleteAllVariants, importProductFromUrl,
  listPublicImages, duplicateProduct,
  type ProductVariant,
} from "@/lib/admin-extended.functions";
import { useAdminToken } from "@/lib/admin-context";
import {
  formatUSD,
  TENNIS_BRACELET_PRICES,
  SIZES_TENNIS_BRACELET,
  LENGTHS_TENNIS_BRACELET,
  TENNIS_BRACELET_LENGTH_DEFAULT,
  getTennisBraceletPrice,
} from "@/lib/pricing";
import { getProductThumb } from "@/lib/product-images";

export const Route = createFileRoute("/admin/products/$slug")({
  component: AdminProductEditor,
});

const COLOR_LABELS: Record<string, string> = {
  silver:     "Sterling Silver",
  gold:       "18K Yellow Gold",
  rose_gold:  "18K Rose Gold",
  white_gold: "18K White Gold",
};

const COLOR_HEX: Record<string, string> = {
  silver:     "#C0C0C0",
  gold:       "#D4AF37",
  rose_gold:  "#B76E79",
  white_gold: "#E8E8F4",
};

const TYPE_LABELS: Record<string, string> = {
  necklace: "Chain / Necklace",
  bracelet: "Bracelet",
  earring:  "Earring",
  ring:     "Ring",
};

// ─── Tag Input ────────────────────────────────────────────────────────────────

function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/[^a-z0-9-\s]/g, "").replace(/\s+/g, "-");
    if (!tag || tags.includes(tag) || tags.length >= 20) return;
    onChange([...tags, tag]);
    setInput("");
  };

  const removeTag = (tag: string) => onChange(tags.filter(t => t !== tag));

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div
      className="min-h-[44px] border border-gray-200 px-2 py-1.5 flex flex-wrap gap-1.5 cursor-text focus-within:border-gray-400 transition-colors bg-white"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-[0.65rem] px-2 py-0.5 rounded-sm">
          {tag}
          <button type="button" onClick={() => removeTag(tag)} className="text-gray-400 hover:text-gray-700 transition-colors ml-0.5">
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => { if (input.trim()) addTag(input); }}
        placeholder={tags.length === 0 ? "Type a tag and press Enter or comma…" : ""}
        className="flex-1 min-w-[120px] text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none bg-transparent py-0.5"
      />
    </div>
  );
}

// ─── SEO Character Counter ────────────────────────────────────────────────────

function CharCounter({ value, target, max }: { value: string; target: number; max: number }) {
  const len = value.length;
  const color = len === 0 ? "text-gray-300" : len > max ? "text-red-500" : len >= target ? "text-emerald-600" : "text-amber-600";
  return (
    <span className={`text-[0.58rem] tabular-nums ${color}`}>
      {len}/{target}–{max}
    </span>
  );
}

// ─── Delete Confirmation Panel ────────────────────────────────────────────────

function DeletePanel({ onDelete, loading }: { onDelete: () => void; loading: boolean }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 py-2.5 text-[0.65rem] uppercase tracking-[0.14em] hover:bg-red-50 hover:border-red-300 transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete Product
      </button>
    );
  }

  return (
    <div className="border border-red-200 bg-red-50 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-red-700">Delete this product?</p>
          <p className="text-[0.65rem] text-red-500 mt-0.5">This action is permanent and cannot be undone. Type <strong>DELETE</strong> to confirm.</p>
        </div>
      </div>
      <input
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        placeholder="Type DELETE to confirm"
        className="w-full border border-red-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-red-400"
      />
      <div className="flex gap-2">
        <button
          onClick={() => { setOpen(false); setConfirm(""); }}
          className="flex-1 border border-gray-200 text-gray-600 py-2 text-[0.62rem] uppercase tracking-[0.10em] hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onDelete}
          disabled={confirm !== "DELETE" || loading}
          className="flex-1 bg-red-600 text-white py-2 text-[0.62rem] uppercase tracking-[0.10em] hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Deleting…" : "Confirm Delete"}
        </button>
      </div>
    </div>
  );
}

// ─── Image Gallery Manager ────────────────────────────────────────────────────

function ImageGalleryManager({
  slug,
  token,
  images: initialImages,
  onImagesChange,
}: {
  slug: string;
  token: string;
  images: any[];
  onImagesChange: (images: any[]) => void;
}) {
  const [images, setImages] = useState<any[]>(initialImages);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editAlt, setEditAlt] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addAlt, setAddAlt] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const addFn = useServerFn(addProductImage);
  const updateFn = useServerFn(updateProductImage);
  const deleteFn = useServerFn(deleteProductImage);
  const reorderFn = useServerFn(reorderProductImages);

  useEffect(() => { setImages(initialImages); }, [initialImages]);

  const refresh = useCallback(async () => {
    try {
      const res = await useServerFn(getProductImagesAdmin)({ data: { token, slug } });
      setImages(res.images);
      onImagesChange(res.images);
    } catch {}
  }, [slug, token, onImagesChange]);

  const handleAdd = async () => {
    if (!addUrl.trim()) { toast.error("Image URL is required"); return; }
    setSaving(true);
    try {
      await addFn({ data: { token, product_slug: slug, url: addUrl.trim(), alt_text: addAlt.trim() || undefined } });
      toast.success("Image added");
      setAddUrl(""); setAddAlt(""); setShowAddForm(false);
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add image");
    } finally { setSaving(false); }
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    try {
      await updateFn({ data: { token, id, url: editUrl.trim() || undefined, alt_text: editAlt.trim() || "" } });
      toast.success("Image updated");
      setEditingId(null);
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update image");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this image?")) return;
    setSaving(true);
    try {
      await deleteFn({ data: { token, id } });
      toast.success("Image removed");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete image");
    } finally { setSaving(false); }
  };

  const handleSetPrimary = async (id: string) => {
    setSaving(true);
    try {
      const newOrder = images.map((img, i) => ({
        id: img.id,
        sort_order: i,
        is_primary: img.id === id,
      }));
      await reorderFn({ data: { token, slug, order: newOrder } });
      toast.success("Primary image updated");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update");
    } finally { setSaving(false); }
  };

  const handleMove = async (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= images.length) return;
    const newImages = [...images];
    const [moved] = newImages.splice(fromIdx, 1);
    newImages.splice(toIdx, 0, moved);
    setImages(newImages);
    setSaving(true);
    try {
      const order = newImages.map((img, i) => ({
        id: img.id,
        sort_order: i,
        is_primary: img.is_primary,
      }));
      await reorderFn({ data: { token, slug, order } });
      onImagesChange(newImages);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to reorder");
      refresh();
    } finally { setSaving(false); }
  };

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleDrop = async (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === toIdx) return;
    const newImages = [...images];
    const [moved] = newImages.splice(draggedIdx, 1);
    newImages.splice(toIdx, 0, moved);
    setImages(newImages);
    setDraggedIdx(null);
    setDragOverIdx(null);
    setSaving(true);
    try {
      const order = newImages.map((img, i) => ({
        id: img.id,
        sort_order: i,
        is_primary: img.is_primary,
      }));
      await reorderFn({ data: { token, slug, order } });
      onImagesChange(newImages);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to reorder");
      refresh();
    } finally { setSaving(false); }
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleBulkAdd = async (urls: string[]) => {
    setSaving(true);
    try {
      for (const url of urls) {
        if (url.trim()) {
          await addFn({ data: { token, product_slug: slug, url: url.trim() } });
        }
      }
      toast.success(`Added ${urls.length} images`);
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add images");
    } finally { setSaving(false); }
  };

  const [bulkUrls, setBulkUrls] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  const primaryImage = images.find(img => img.is_primary);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
      <div className="p-5 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileImage className="h-4 w-4 text-gray-400" />
          <p className="text-[0.58rem] uppercase tracking-[0.18em] text-gray-400">
            Gallery Images <span className="text-gray-300 ml-1">({images.length})</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulk(v => !v)}
            className="text-[0.58rem] uppercase tracking-[0.10em] text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1.5 px-2 py-1.5 border border-gray-200"
          >
            <Copy className="h-3 w-3" /> Bulk Add
          </button>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="text-[0.58rem] uppercase tracking-[0.10em] text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100"
          >
            <ImagePlus className="h-3 w-3" /> Add Image
          </button>
        </div>
      </div>

      {showBulk && (
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 space-y-3">
          <label className="block text-[0.56rem] uppercase tracking-[0.14em] text-gray-400">
            Bulk Add URLs — one per line
          </label>
          <textarea
            value={bulkUrls}
            onChange={e => setBulkUrls(e.target.value)}
            rows={4}
            placeholder={`/images/product-1.jpg\n/images/product-2.jpg\nhttps://example.com/image.jpg`}
            className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors bg-white resize-none font-mono text-[0.80rem]"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setBulkUrls(""); setShowBulk(false); }}
              className="text-[0.60rem] uppercase tracking-[0.10em] text-gray-400 hover:text-gray-600 px-3 py-2"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const urls = bulkUrls.split("\n").filter(u => u.trim());
                if (urls.length > 0) handleBulkAdd(urls);
              }}
              disabled={saving || !bulkUrls.trim()}
              className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 text-[0.60rem] uppercase tracking-[0.10em] hover:bg-gray-700 transition-colors disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              Add {bulkUrls.split("\n").filter(u => u.trim()).length || 0} Images
            </button>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 space-y-3">
          <div>
            <label className="block text-[0.56rem] uppercase tracking-[0.14em] text-gray-400 mb-1.5">Image URL *</label>
            <input
              value={addUrl}
              onChange={e => setAddUrl(e.target.value)}
              placeholder="/images/product.jpg or https://…"
              className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors bg-white"
              onKeyDown={e => e.key === "Enter" && handleAdd()}
            />
          </div>
          <div>
            <label className="block text-[0.56rem] uppercase tracking-[0.14em] text-gray-400 mb-1.5">Alt Text</label>
            <input
              value={addAlt}
              onChange={e => setAddAlt(e.target.value)}
              placeholder="Descriptive text for accessibility & SEO"
              className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors bg-white"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setShowAddForm(false); setAddUrl(""); setAddAlt(""); }}
              className="text-[0.60rem] uppercase tracking-[0.10em] text-gray-400 hover:text-gray-600 px-3 py-2"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={saving || !addUrl.trim()}
              className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 text-[0.60rem] uppercase tracking-[0.10em] hover:bg-gray-700 transition-colors disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Add Image
            </button>
          </div>
        </div>
      )}

      {/* Image grid */}
      <div className="p-5">
        {images.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200">
            <ImageOff className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 mb-2">No gallery images yet</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-[0.60rem] uppercase tracking-[0.10em] text-gray-600 hover:text-gray-900 border border-gray-200 px-4 py-2 hover:bg-gray-50 transition-colors"
            >
              <ImagePlus className="h-3 w-3 inline mr-1.5" /> Add First Image
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {images.map((img, idx) => {
              const isPrimary = img.is_primary;
              const isEditing = editingId === img.id;
              const isDraggedOver = dragOverIdx === idx;

              return (
                <div
                  key={img.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`group relative bg-gray-50 border overflow-hidden transition-all ${
                    isDraggedOver ? "border-blue-400 ring-2 ring-blue-200 scale-[1.02]" : "border-gray-100"
                  } ${isPrimary ? "ring-2 ring-amber-300" : ""} ${draggedIdx === idx ? "opacity-30" : ""} cursor-grab active:cursor-grabbing`}
                >
                  {/* Image */}
                  <div className="aspect-[4/5] overflow-hidden bg-gray-50">
                    <img
                      src={img.url}
                      alt={img.alt_text || ""}
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-300 text-[0.55rem]">Broken</div>'; }}
                    />
                  </div>

                  {/* Badges */}
                  <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                    {isPrimary && (
                      <span className="bg-amber-400 text-white text-[0.45rem] uppercase tracking-[0.08em] px-1.5 py-0.5 font-semibold shadow-sm flex items-center gap-1">
                        <Star className="h-2.5 w-2.5 fill-white" /> Primary
                      </span>
                    )}
                    <span className="bg-black/50 text-white text-[0.40rem] px-1.5 py-0.5 font-mono">
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Position arrows */}
                  <div className="absolute top-1.5 right-1.5 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleMove(idx, idx - 1)}
                      disabled={idx === 0 || saving}
                      className="w-6 h-6 bg-white/90 hover:bg-white shadow-sm flex items-center justify-center disabled:opacity-30 border border-gray-100"
                      title="Move up"
                    >
                      <ChevronUp className="h-3 w-3 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, idx + 1)}
                      disabled={idx === images.length - 1 || saving}
                      className="w-6 h-6 bg-white/90 hover:bg-white shadow-sm flex items-center justify-center disabled:opacity-30 border border-gray-100"
                      title="Move down"
                    >
                      <ChevronDown className="h-3 w-3 text-gray-600" />
                    </button>
                  </div>

                  {/* Actions overlay on hover */}
                  <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-wrap gap-1">
                    {!isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(img.id)}
                        disabled={saving}
                        className="bg-white/90 hover:bg-white text-[0.50rem] px-1.5 py-1 text-gray-700 font-medium flex items-center gap-1 shadow-sm"
                      >
                        <Star className="h-2.5 w-2.5" /> Set Primary
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingId(img.id);
                        setEditUrl(img.url);
                        setEditAlt(img.alt_text || "");
                      }}
                      className="bg-white/90 hover:bg-white text-[0.50rem] px-1.5 py-1 text-gray-700 font-medium flex items-center gap-1 shadow-sm"
                    >
                      <Pen className="h-2.5 w-2.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(img.id)}
                      disabled={saving}
                      className="bg-red-500/90 hover:bg-red-500 text-[0.50rem] px-1.5 py-1 text-white font-medium flex items-center gap-1 shadow-sm"
                    >
                      <Trash2 className="h-2.5 w-2.5" /> Remove
                    </button>
                  </div>

                  {/* Inline edit */}
                  {isEditing && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 p-3 flex flex-col gap-2">
                      <label className="text-[0.45rem] uppercase tracking-[0.12em] text-gray-400">URL</label>
                      <input
                        value={editUrl}
                        onChange={e => setEditUrl(e.target.value)}
                        className="w-full border border-gray-200 px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-gray-400 bg-white"
                      />
                      <label className="text-[0.45rem] uppercase tracking-[0.12em] text-gray-400">Alt Text</label>
                      <input
                        value={editAlt}
                        onChange={e => setEditAlt(e.target.value)}
                        className="w-full border border-gray-200 px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-gray-400 bg-white"
                      />
                      <div className="flex gap-1.5 mt-auto">
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 border border-gray-200 text-gray-500 py-1.5 text-[0.50rem] uppercase tracking-[0.10em] hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdate(img.id)}
                          disabled={saving}
                          className="flex-1 bg-gray-900 text-white py-1.5 text-[0.50rem] uppercase tracking-[0.10em] hover:bg-gray-700 disabled:opacity-40 flex items-center justify-center gap-1"
                        >
                          {saving ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Check className="h-2.5 w-2.5" />}
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-3 text-[0.55rem] text-gray-400 flex items-center gap-1.5">
          <GripVertical className="h-3 w-3" /> Drag images to reorder · First image (index 1) is typically the hero
        </p>
      </div>
    </div>
  );
}

// ─── Advanced Variants Manager ────────────────────────────────────────────────

const AVAILABLE_SIZES = ["2mm", "3mm", "4mm", "5mm", "6mm", "6.5mm", "8mm"];
const AVAILABLE_LENGTHS = ['6"', '6.5"', '7"', '7.5"', '8"', '8.5"', '9"', '16"', '18"', '20"', '22"', '24"'];
const AVAILABLE_COLORS = ["silver", "gold", "rose_gold", "white_gold"];

const isTennisBraceletSlug = (slug: string) => slug.includes("tennis") && slug.includes("bracelet");
const tennisMatrixValues = SIZES_TENNIS_BRACELET.flatMap(size =>
  LENGTHS_TENNIS_BRACELET.map(length => getTennisBraceletPrice(size, length))
);
const TENNIS_MATRIX_MIN = Math.min(...tennisMatrixValues);
const TENNIS_MATRIX_MAX = Math.max(...tennisMatrixValues);

function tennisIntensity(price: number) {
  return (price - TENNIS_MATRIX_MIN) / Math.max(TENNIS_MATRIX_MAX - TENNIS_MATRIX_MIN, 1);
}

function TennisBraceletPriceHeatmap() {
  // Calculate min/max for intensity scaling
  const allPrices = SIZES_TENNIS_BRACELET.flatMap(size =>
    LENGTHS_TENNIS_BRACELET.map(length => getTennisBraceletPrice(size, length))
  );
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice || 1;

  return (
    <div className="space-y-5">
      {/* Header with legend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.18em] admin-heading font-semibold">Price Matrix</p>
          <p className="text-[0.55rem] admin-muted mt-0.5">All size × length combinations with live pricing from the price table</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[0.50rem] uppercase tracking-[0.12em] admin-muted">Low</span>
          <div className="flex h-2.5 w-24 rounded-full overflow-hidden" style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)" }}>
            <div className="flex-1" style={{ background: "var(--at-matrix-low)" }} />
            <div className="flex-1" style={{ background: "var(--at-matrix-mid)" }} />
            <div className="flex-1" style={{ background: "var(--at-matrix-high)" }} />
          </div>
          <span className="text-[0.50rem] uppercase tracking-[0.12em] admin-muted">High</span>
        </div>
      </div>

      {/* Desktop grid */}
      <div className="hidden md:grid gap-2" style={{ gridTemplateColumns: `100px repeat(${LENGTHS_TENNIS_BRACELET.length}, minmax(80px, 1fr))` }}>
        {/* Header row */}
        <div className="flex items-end justify-center pb-1">
          <span className="text-[0.48rem] uppercase tracking-[0.14em] admin-muted text-center leading-tight">Size ↓ / Length →</span>
        </div>
        {LENGTHS_TENNIS_BRACELET.map(length => (
          <div key={length} className="text-center pb-1">
            <span className="text-[0.52rem] uppercase tracking-[0.10em] admin-heading font-semibold">{length}</span>
            <br />
            <span className="text-[0.44rem] uppercase tracking-[0.08em] admin-muted">
              {length === '6"' ? "petite" : length === '7"' ? "standard" : length === '7.5"' ? "relaxed" : length === '8"' ? "popular" : length === '8.5"' ? "loose" : length === '9"' ? "xl" : "snug"}
            </span>
          </div>
        ))}

        {/* Data rows */}
        {SIZES_TENNIS_BRACELET.map((size, sizeIdx) => (
          <Fragment key={size}>
            {/* Row label */}
            <div
              className="flex flex-col justify-center rounded-xl px-3 min-h-[72px] transition-all"
              style={{
                background: "var(--at-tile-bg)",
                border: "1px solid var(--at-tile-border)",
                boxShadow: "var(--at-card-shadow)",
              }}
            >
              <span className="text-[0.82rem] font-bold admin-heading font-mono">{size}</span>
              <span className="text-[0.44rem] uppercase tracking-[0.10em] admin-muted mt-0.5">
                {size === "2mm" ? "delicate" : size === "3mm" ? "classic" : size === "4mm" ? "bold" : size === "5mm" ? "statement" : "ultra"}
              </span>
            </div>

            {/* Price cells */}
            {LENGTHS_TENNIS_BRACELET.map((length, lengthIdx) => {
              const price = getTennisBraceletPrice(size, length);
              const t = (price - minPrice) / priceRange;
              const isDefault = length === TENNIS_BRACELET_LENGTH_DEFAULT;
              const isPopular = size === "3mm" || size === "4mm";

              // Create a smooth color blend based on intensity
              const bgColor = t < 0.5
                ? `color-mix(in srgb, var(--at-matrix-low), var(--at-matrix-mid) ${Math.round(t * 200)}%)`
                : `color-mix(in srgb, var(--at-matrix-mid), var(--at-matrix-high) ${Math.round((t - 0.5) * 200)}%)`;

              return (
                <div
                  key={`${size}-${length}`}
                  className="group relative min-h-[72px] rounded-xl p-3 flex flex-col justify-between overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02]"
                  style={{
                    background: `linear-gradient(135deg, ${bgColor} 0%, color-mix(in srgb, ${bgColor}, white 15%) 100%)`,
                    border: isDefault
                      ? "2px solid var(--at-kpi-top)"
                      : isPopular
                        ? "1px solid var(--at-diamond-accent, var(--at-card-divider))"
                        : "1px solid var(--at-card-divider)",
                    boxShadow: isDefault
                      ? "0 0 0 2px color-mix(in srgb, var(--at-kpi-top), transparent 60%), 0 4px 12px rgba(0,0,0,0.08)"
                      : "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* Top accent line */}
                  <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl opacity-60" style={{ background: "linear-gradient(90deg,#d97706,#fbbf24,#d97706)" }} />

                  {/* Status indicators */}
                  <div className="flex items-center justify-between">
                    <span className="text-[0.46rem] uppercase tracking-[0.10em] admin-muted font-medium">
                      {isDefault ? "★ default" : isPopular ? "popular" : "live"}
                    </span>
                    {isDefault && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--at-kpi-top)", boxShadow: `0 0 6px var(--at-kpi-top)` }} />
                    )}
                  </div>

                  {/* Price */}
                  <div>
                    <span className="text-[0.85rem] font-bold admin-heading tabular-nums leading-none">{formatUSD(price)}</span>
                  </div>

                  {/* Hover tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[0.48rem] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" style={{ background: "var(--at-chart-tip-bg)", color: "var(--at-chart-tip-text)" }}>
                    {size} × {length}
                  </div>
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden grid grid-cols-1 gap-3">
        {SIZES_TENNIS_BRACELET.map(size => (
          <div
            key={size}
            className="rounded-xl p-4 transition-all"
            style={{
              background: "var(--at-tile-bg)",
              border: "1px solid var(--at-tile-border)",
              boxShadow: "var(--at-card-shadow)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-bold admin-heading font-mono">{size}</span>
                <span className="text-[0.48rem] uppercase tracking-[0.10em] admin-muted ml-2">
                  {size === "2mm" ? "delicate" : size === "3mm" ? "classic" : size === "4mm" ? "bold" : size === "5mm" ? "statement" : "ultra"}
                </span>
              </div>
              <div className="w-6 h-[2px] rounded-full" style={{ background: "linear-gradient(90deg,#d97706,#fbbf24)" }} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {LENGTHS_TENNIS_BRACELET.map(length => {
                const price = getTennisBraceletPrice(size, length);
                const t = (price - minPrice) / priceRange;
                const isDefault = length === TENNIS_BRACELET_LENGTH_DEFAULT;
                const bgColor = t < 0.5
                  ? `color-mix(in srgb, var(--at-matrix-low), var(--at-matrix-mid) ${Math.round(t * 200)}%)`
                  : `color-mix(in srgb, var(--at-matrix-mid), var(--at-matrix-high) ${Math.round((t - 0.5) * 200)}%)`;
                return (
                  <div
                    key={`${size}-${length}`}
                    className="rounded-lg p-2.5 transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${bgColor}, color-mix(in srgb, ${bgColor}, white 12%))`,
                      border: isDefault ? "2px solid var(--at-kpi-top)" : "1px solid var(--at-card-divider)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[0.52rem] uppercase tracking-[0.10em] admin-muted font-medium">{length}</span>
                      {isDefault && <span className="text-[0.42rem] uppercase tracking-[0.08em] font-semibold" style={{ color: "var(--at-text-accent)" }}>★</span>}
                    </div>
                    <div className="text-[0.82rem] font-bold admin-heading tabular-nums mt-1">{formatUSD(price)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="flex flex-wrap gap-3 pt-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "var(--at-tile-bg)", border: "1px solid var(--at-tile-border)" }}>
          <span className="text-[0.48rem] uppercase tracking-[0.10em] admin-muted">Range:</span>
          <span className="text-[0.65rem] font-semibold admin-heading">{formatUSD(minPrice)} — {formatUSD(maxPrice)}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "var(--at-tile-bg)", border: "1px solid var(--at-tile-border)" }}>
          <span className="text-[0.48rem] uppercase tracking-[0.10em] admin-muted">Variants:</span>
          <span className="text-[0.65rem] font-semibold admin-heading">{SIZES_TENNIS_BRACELET.length * LENGTHS_TENNIS_BRACELET.length}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "var(--at-tile-bg)", border: "1px solid var(--at-tile-border)" }}>
          <span className="text-[0.48rem] uppercase tracking-[0.10em] admin-muted">Most popular:</span>
          <span className="text-[0.65rem] font-semibold admin-heading">3mm × 8" ({formatUSD(getTennisBraceletPrice("3mm", '8"'))})</span>
        </div>
      </div>
    </div>
  );
}

function VariantsManager({
  slug,
  productType,
  basePrice,
  size,
  onSizeChange,
  length,
  onLengthChange,
  color,
  onColorChange,
  onSaved,
}: {
  slug: string;
  productType: string;
  basePrice: number;
  size: string;
  onSizeChange: (s: string) => void;
  length: string;
  onLengthChange: (l: string) => void;
  color: string;
  onColorChange: (c: string) => void;
  onSaved: () => void;
}) {
  const token = useAdminToken();
  const [expanded, setExpanded] = useState(true);

  // Server functions (must be at top level)
  const getVariantsFn = useServerFn(getVariants);
  const upsertBulkFn = useServerFn(upsertVariantsBulk);
  const updateVariantFn = useServerFn(updateVariant);
  const deleteVariantFn = useServerFn(deleteVariant);
  const deleteBulkFn = useServerFn(deleteVariantsBulk);
  const toggleBulkFn = useServerFn(toggleVariantsBulk);
  const priceBulkFn = useServerFn(updateVariantsPriceBulk);
  const stockBulkFn = useServerFn(updateVariantsStockBulk);
  const deleteAllFn = useServerFn(deleteAllVariants);

  // Variant configuration state
  const [selColors, setSelColors] = useState<string[]>([color].filter(Boolean));
  const [selSizes, setSelSizes] = useState<string[]>([size].filter(Boolean));
  const [selLengths, setSelLengths] = useState<string[]>([length].filter(Boolean));

  // Database variants
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Bulk action mode
  const [bulkMode, setBulkMode] = useState<"none" | "price" | "stock">("none");
  const [bulkPrice, setBulkPrice] = useState<string>("");
  const [bulkStock, setBulkStock] = useState<string>("-1");

  // Preview
  const [preview, setPreview] = useState<Array<{ color: string | null; size: string | null; length: string | null }>>([]);

  // Smart pricing
  const [alibabaUrl, setAlibabaUrl] = useState("");
  const [pricingMode, setPricingMode] = useState<"none" | "alibaba" | "markup">("none");
  const [markupPercent, setMarkupPercent] = useState<string>("500");
  const [fetchingCost, setFetchingCost] = useState(false);
  const isTennis = isTennisBraceletSlug(slug);
  const sizeOptions = isTennis ? [...SIZES_TENNIS_BRACELET] : AVAILABLE_SIZES;
  const lengthOptions = isTennis ? [...LENGTHS_TENNIS_BRACELET] : AVAILABLE_LENGTHS;
  const visibleVariantPrice = (v: ProductVariant) =>
    isTennis && v.size && v.length
      ? getTennisBraceletPrice(v.size, v.length)
      : (v.price_override ?? basePrice);

  // Load variants from DB
  const loadVariants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getVariantsFn({ data: { token, slug } });
      setVariants(res.variants ?? []);
    } catch (e: any) {
      console.warn("Failed to load variants:", e.message);
    } finally {
      setLoading(false);
    }
  }, [token, slug]);

  useEffect(() => {
    if (expanded && variants.length === 0) loadVariants();
  }, [expanded]);

  // Generate preview of all combinations
  const generatePreview = useCallback(() => {
    const combos: Array<{ color: string | null; size: string | null; length: string | null }> = [];
    const colors = selColors.length > 0 ? selColors : [null];
    const sizes = selSizes.length > 0 ? selSizes : [null];
    const lengths = selLengths.length > 0 ? selLengths : [null];
    for (const c of colors) for (const s of sizes) for (const l of lengths) combos.push({ color: c, size: s, length: l });
    return combos;
  }, [selColors, selSizes, selLengths]);

  // Regenerate preview when selections change
  useEffect(() => {
    setPreview(generatePreview());
  }, [selColors, selSizes, selLengths]);

  // Toggle selection
  const toggleColor = (c: string) => setSelColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const toggleSize = (s: string) => setSelSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleLength = (l: string) => setSelLengths(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);

  // Generate all variants from selection
  const generateVariants = async () => {
    const combos = generatePreview();
    if (combos.length === 0) {
      toast.error("Select at least one option to generate variants");
      return;
    }
    setSaving(true);
    try {
      const res = await upsertBulkFn({ data: {
        token,
        variants: combos.map(v => ({
          product_slug: slug,
          color: v.color,
          size: v.size,
          length: v.length,
          stock: -1,
          price_override: isTennis && v.size && v.length ? getTennisBraceletPrice(v.size, v.length) : null,
          is_active: true,
        })),
      }});
      toast.success(`Generated ${res.count} variant${res.count !== 1 ? "s" : ""}`);
      await loadVariants();
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Bulk select
  const allIds = variants.map(v => v.id);
  const allSelected = selectedIds.size === allIds.length && allIds.length > 0;
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(allIds));
  };
  const toggleId = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Bulk actions
  const handleBulkToggle = async (active: boolean) => {
    if (selectedIds.size === 0) return;
    setSaving(true);
    try {
      await toggleBulkFn({ data: { token, ids: [...selectedIds], is_active: active } });
      toast.success(`${selectedIds.size} variant${selectedIds.size !== 1 ? "s" : ""} ${active ? "enabled" : "disabled"}`);
      setSelectedIds(new Set());
      await loadVariants();
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleBulkPrice = async () => {
    if (selectedIds.size === 0) return;
    const price = bulkPrice.trim() === "" ? null : parseFloat(bulkPrice);
    if (bulkPrice !== "" && (isNaN(price!) || price! < 0)) {
      toast.error("Enter a valid price");
      return;
    }
    setSaving(true);
    try {
      await priceBulkFn({ data: { token, slug, ids: [...selectedIds], price_override: price } });
      toast.success(`Updated price for ${selectedIds.size} variant${selectedIds.size !== 1 ? "s" : ""}`);
      setBulkMode("none");
      setSelectedIds(new Set());
      await loadVariants();
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleBulkStock = async () => {
    if (selectedIds.size === 0) return;
    const stock = parseInt(bulkStock);
    if (isNaN(stock)) { toast.error("Enter a valid stock number"); return; }
    setSaving(true);
    try {
      await stockBulkFn({ data: { token, slug, ids: [...selectedIds], stock } });
      toast.success(`Updated stock for ${selectedIds.size} variant${selectedIds.size !== 1 ? "s" : ""}`);
      setBulkMode("none");
      setSelectedIds(new Set());
      await loadVariants();
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} variant${selectedIds.size !== 1 ? "s" : ""}?`)) return;
    setSaving(true);
    try {
      await deleteBulkFn({ data: { token, ids: [...selectedIds] } });
      toast.success(`Deleted ${selectedIds.size} variant${selectedIds.size !== 1 ? "s" : ""}`);
      setSelectedIds(new Set());
      await loadVariants();
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Delete ALL variants for this product?")) return;
    setSaving(true);
    try {
      await deleteAllFn({ data: { token, slug } });
      toast.success("All variants deleted");
      setSelectedIds(new Set());
      await loadVariants();
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  // Inline variant update — auto-saves on blur, shows brief confirmation
  const handleInlineUpdate = async (id: string, field: string, value: any) => {
    try {
      await updateVariantFn({ data: { token, id, [field]: value } });
      setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
      toast.success("Saved", { duration: 1000, id: `inline-${id}-${field}` });
      onSaved();
    } catch (e: any) {
      toast.error(`Failed to save: ${e.message}`);
      await loadVariants();
    }
  };

  // Auto-generate SKU for all variants
  const handleAutoSku = async () => {
    setSaving(true);
    try {
      const updates = variants.map(v => {
        const parts = [slug.substring(0, 8).toUpperCase()];
        if (v.color) parts.push(v.color.substring(0, 3).toUpperCase());
        if (v.size) parts.push(v.size.replace(/\./g, "").toUpperCase());
        if (v.length) parts.push(v.length.replace(/["']/g, "").replace(".", "").toUpperCase());
        return { id: v.id, sku: parts.join("-") };
      });
      for (const u of updates) {
        await updateVariantFn({ data: { token, id: u.id, sku: u.sku } });
      }
      toast.success(`Generated SKUs for ${updates.length} variants`);
      await loadVariants();
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  // Smart pricing: apply markup to base price for all variants
  const handleMarkupPricing = async () => {
    const pct = parseFloat(markupPercent);
    if (isNaN(pct) || pct <= 0) { toast.error("Enter a valid markup percentage"); return; }
    const multiplier = 1 + (pct / 100);
    const newPrice = Math.round(basePrice * multiplier * 100) / 100;
    setSaving(true);
    try {
      const allIds = variants.map(v => v.id);
      await priceBulkFn({ data: { token, slug, ids: allIds, price_override: newPrice } });
      toast.success(`All variants priced at ${formatUSD(newPrice)} (${pct}% markup)`);
      setPricingMode("none");
      await loadVariants();
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleSyncTennisPricing = async () => {
    const priceable = variants.filter(v => v.size && v.length && TENNIS_BRACELET_PRICES[v.size]?.[v.length]);
    if (priceable.length === 0) {
      toast.info("No tennis bracelet variants with size and length found");
      return;
    }
    setSaving(true);
    try {
      for (const v of priceable) {
        await updateVariantFn({
          data: {
            token,
            id: v.id,
            price_override: getTennisBraceletPrice(v.size!, v.length!),
          },
        });
      }
      toast.success(`Synced ${priceable.length} variant prices from the tennis bracelet price table`);
      await loadVariants();
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Smart pricing: Alibaba cost extraction + 5x markup
  const handleAlibabaPricing = async () => {
    if (!alibabaUrl.trim()) { toast.error("Enter an Alibaba listing URL"); return; }
    setFetchingCost(true);
    try {
      const fn = useServerFn(importProductFromUrl);
      const res = await fn({ data: { token, url: alibabaUrl.trim() } });
      // Try to extract a price from the description or name
      const text = `${res.name} ${res.description}`;
      const priceMatch = text.match(/\$[\d,]+\.?\d*/g) || text.match(/USD\s*[\d,]+\.?\d*/gi) || text.match(/US\s*\$[\d,]+\.?\d*/gi);
      if (priceMatch && priceMatch.length > 0) {
        const costs = priceMatch.map(p => parseFloat(p.replace(/[^0-9.]/g, ""))).filter(n => !isNaN(n) && n > 0);
        if (costs.length > 0) {
          const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
          const suggestedPrice = Math.ceil(avgCost * 5 * 100) / 100;
          // Apply to all variants
          const allIds = variants.map(v => v.id);
          await priceBulkFn({ data: { token, slug, ids: allIds, price_override: suggestedPrice } });
          toast.success(`Cost: ~${formatUSD(avgCost)} → Priced at ${formatUSD(suggestedPrice)} (5× markup)`);
          setPricingMode("none");
          setAlibabaUrl("");
          await loadVariants();
          onSaved();
        } else {
          toast.error("Could not extract cost prices from listing. Try setting markup manually.");
        }
      } else {
        toast.error("No prices found in listing. Try setting markup manually.");
      }
    } catch (e: any) {
      toast.error(`Failed to fetch listing: ${e.message}`);
    } finally { setFetchingCost(false); }
  };

  // Bulk quick-stock actions
  const handleQuickStock = async (value: number) => {
    if (variants.length === 0) return;
    setSaving(true);
    try {
      const allIds = variants.map(v => v.id);
      await stockBulkFn({ data: { token, slug, ids: allIds, stock: value } });
      toast.success(`Set all variants stock to ${value === -1 ? "unlimited" : value}`);
      await loadVariants();
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  // Delete single variant
  const handleDeleteSingle = async (id: string) => {
    try {
      await deleteVariantFn({ data: { token, id } });
      toast.success("Variant deleted");
      await loadVariants();
      onSaved();
    } catch (e: any) { toast.error(e.message); }
  };

  const variantCount = variants.length;
  const activeCount = variants.filter(v => v.is_active).length;

  return (
    <div className="space-y-5">

      {/* ── Option Generator ─────────────────────────────────── */}
      <div className="rounded-xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center gap-3 mb-5">
          <Wand2 className="h-4 w-4 text-amber-500" />
          <p className="text-sm font-semibold text-gray-900">Option Generator</p>
          {variantCount > 0 && (
            <span className="text-[0.58rem] font-medium px-2.5 py-1 rounded-full"
              style={{ background: "rgba(16,185,129,0.10)", color: "#065f46", border: "1px solid rgba(16,185,129,0.20)" }}>
              {variantCount} variant{variantCount !== 1 ? "s" : ""} · {activeCount} active
            </span>
          )}
          {isTennis && variants.length > 0 && (
            <button onClick={handleSyncTennisPricing} disabled={saving}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-[0.58rem] uppercase tracking-[0.12em] font-semibold rounded-lg transition-colors"
              style={{ border: "1px solid #fbbf24", color: "#92400e", background: "#fffbeb" }}>
              <RefreshCw className={`h-3 w-3 ${saving ? "animate-spin" : ""}`} />
              Sync Table Prices
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-5">

          {/* Colors */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[0.60rem] uppercase tracking-[0.16em] font-semibold text-gray-500 flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5" /> Colors
              </label>
              <button onClick={() => setSelColors(selColors.length === AVAILABLE_COLORS.length ? [] : [...AVAILABLE_COLORS])}
                className="text-[0.52rem] text-gray-400 hover:text-gray-700 underline underline-offset-2 transition-colors">
                {selColors.length === AVAILABLE_COLORS.length ? "Clear" : "All"}
              </button>
            </div>
            <div className="space-y-2">
              {AVAILABLE_COLORS.map(c => {
                const active = selColors.includes(c);
                return (
                  <button key={c} onClick={() => toggleColor(c)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left"
                    style={active ? { background: "#111827", border: "1px solid #111827", color: "white" }
                      : { background: "white", border: "1px solid rgba(0,0,0,0.10)", color: "#374151" }}>
                    <span className="w-5 h-5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: COLOR_HEX[c], outline: active ? "2px solid rgba(255,255,255,0.4)" : "2px solid rgba(0,0,0,0.08)", outlineOffset: "1px" }} />
                    <span className="text-[0.70rem] font-medium">{COLOR_LABELS[c]}</span>
                    {active && <Check className="h-3.5 w-3.5 ml-auto shrink-0 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sizes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[0.60rem] uppercase tracking-[0.16em] font-semibold text-gray-500 flex items-center gap-1.5">
                <Ruler className="h-3.5 w-3.5" /> Sizes
              </label>
              <button onClick={() => setSelSizes(selSizes.length === sizeOptions.length ? [] : [...sizeOptions])}
                className="text-[0.52rem] text-gray-400 hover:text-gray-700 underline underline-offset-2 transition-colors">
                {selSizes.length === sizeOptions.length ? "Clear" : "All"}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {sizeOptions.map(s => {
                const active = selSizes.includes(s);
                return (
                  <button key={s} onClick={() => toggleSize(s)}
                    className="flex flex-col items-center justify-center px-2 py-3 rounded-lg border transition-all"
                    style={active ? { background: "#111827", border: "1px solid #111827", color: "white" }
                      : { background: "white", border: "1px solid rgba(0,0,0,0.10)", color: "#6b7280" }}>
                    <span className="text-[0.80rem] font-bold leading-none">{s}</span>
                    {active && <Check className="h-3 w-3 mt-1 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lengths */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[0.60rem] uppercase tracking-[0.16em] font-semibold text-gray-500 flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" /> Lengths
              </label>
              <button onClick={() => setSelLengths(selLengths.length === lengthOptions.length ? [] : [...lengthOptions])}
                className="text-[0.52rem] text-gray-400 hover:text-gray-700 underline underline-offset-2 transition-colors">
                {selLengths.length === lengthOptions.length ? "Clear" : "All"}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {lengthOptions.map(l => {
                const active = selLengths.includes(l);
                return (
                  <button key={l} onClick={() => toggleLength(l)}
                    className="flex flex-col items-center justify-center px-1 py-3 rounded-lg border transition-all"
                    style={active ? { background: "#111827", border: "1px solid #111827", color: "white" }
                      : { background: "white", border: "1px solid rgba(0,0,0,0.10)", color: "#6b7280" }}>
                    <span className="text-[0.68rem] font-semibold leading-none">{l}</span>
                    {active && <Check className="h-3 w-3 mt-1 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Generate button */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-4">
          <button onClick={generateVariants} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-[0.62rem] uppercase tracking-[0.16em] font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#111827,#1f2937)", boxShadow: "0 2px 8px rgba(0,0,0,0.20)" }}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            {variantCount > 0 ? "Regenerate Variants" : "Generate Variants"}
          </button>
          {preview.length > 0 && (
            <span className="text-[0.62rem] text-gray-500">
              Will create <strong className="text-gray-800">{preview.length}</strong> combination{preview.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* ── Smart Pricing ─────────────────────────────────────────── */}
      {variants.length > 0 && (
        <div className="rounded-xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-semibold text-gray-900">Smart Pricing</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-lg p-4" style={{ background: "#f9fafb", border: "1px solid rgba(0,0,0,0.07)" }}>
              <p className="text-[0.60rem] uppercase tracking-[0.12em] font-semibold text-gray-500 mb-3">Alibaba → 5× Markup</p>
              <div className="flex gap-2">
                <input type="text" value={alibabaUrl} onChange={e => setAlibabaUrl(e.target.value)}
                  placeholder="Paste listing URL…"
                  className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-[0.65rem] focus:outline-none focus:border-gray-400 bg-white" />
                <button onClick={handleAlibabaPricing} disabled={fetchingCost || !alibabaUrl.trim()}
                  className="px-3 py-2 rounded-lg bg-gray-900 text-white text-[0.55rem] uppercase tracking-wider hover:bg-gray-800 disabled:opacity-40 transition-colors shrink-0">
                  {fetchingCost ? <Loader2 className="h-3 w-3 animate-spin" /> : "Price"}
                </button>
              </div>
            </div>
            <div className="rounded-lg p-4" style={{ background: "#f9fafb", border: "1px solid rgba(0,0,0,0.07)" }}>
              <p className="text-[0.60rem] uppercase tracking-[0.12em] font-semibold text-gray-500 mb-3">Apply Markup %</p>
              <div className="flex gap-2 items-center">
                <input type="number" min="1" value={markupPercent} onChange={e => setMarkupPercent(e.target.value)}
                  className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:border-gray-400 bg-white" />
                <span className="text-[0.62rem] text-gray-400 shrink-0">%</span>
                <button onClick={handleMarkupPricing} disabled={saving}
                  className="ml-auto px-3 py-2 rounded-lg bg-gray-900 text-white text-[0.55rem] uppercase tracking-wider hover:bg-gray-800 disabled:opacity-40 transition-colors shrink-0">
                  Apply
                </button>
              </div>
              <p className="text-[0.52rem] text-gray-400 mt-2">{formatUSD(basePrice)} → {formatUSD(Math.round(basePrice * (1 + parseFloat(markupPercent || "500") / 100) * 100) / 100)}</p>
            </div>
            <div className="rounded-lg p-4" style={{ background: "#f9fafb", border: "1px solid rgba(0,0,0,0.07)" }}>
              <p className="text-[0.60rem] uppercase tracking-[0.12em] font-semibold text-gray-500 mb-3">Auto-Generate SKUs</p>
              <button onClick={handleAutoSku} disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-[0.60rem] uppercase tracking-wider text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors bg-white">
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Generate SKU Codes
              </button>
              <p className="text-[0.52rem] text-gray-400 mt-2">Assigns {slug.substring(0,6).toUpperCase()}-COLOR-SIZE codes to all variants</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Variant Table ─────────────────────────────────────────── */}
      {variants.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          {/* Toolbar */}
          <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-100" style={{ background: "#f9fafb" }}>
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 accent-gray-900 rounded" />
                <span className="text-[0.62rem] font-semibold text-gray-600 uppercase tracking-[0.10em]">
                  {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${variants.length} variant${variants.length !== 1 ? "s" : ""}`}
                </span>
              </label>
              <div className="flex items-center gap-1.5 pl-4 border-l border-gray-200">
                <span className="text-[0.52rem] text-gray-400 uppercase tracking-wider">All stock:</span>
                {([{v:-1,l:"∞",s:"bg-gray-100 text-gray-600 hover:bg-gray-200"},{v:0,l:"0",s:"bg-red-50 text-red-600 hover:bg-red-100"},{v:10,l:"10",s:"bg-amber-50 text-amber-700 hover:bg-amber-100"},{v:50,l:"50",s:"bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}] as const).map(({v,l,s}) => (
                  <button key={String(v)} onClick={() => handleQuickStock(v)} disabled={saving}
                    className={`text-[0.55rem] px-2 py-1 rounded font-semibold transition-colors ${s}`}>{l}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedIds.size > 0 && (
                <>
                  <button onClick={() => handleBulkToggle(true)} disabled={saving}
                    className="text-[0.55rem] px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 uppercase tracking-wider transition-colors font-medium">Enable</button>
                  <button onClick={() => handleBulkToggle(false)} disabled={saving}
                    className="text-[0.55rem] px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 uppercase tracking-wider transition-colors font-medium">Disable</button>
                  <button onClick={() => { setBulkMode(bulkMode === "price" ? "none" : "price"); setBulkPrice(""); }}
                    className={`text-[0.55rem] px-3 py-1.5 rounded-lg border uppercase tracking-wider transition-colors font-medium ${bulkMode === "price" ? "bg-blue-50 text-blue-700 border-blue-300" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                    Set Price
                  </button>
                  <button onClick={() => { setBulkMode(bulkMode === "stock" ? "none" : "stock"); setBulkStock("-1"); }}
                    className={`text-[0.55rem] px-3 py-1.5 rounded-lg border uppercase tracking-wider transition-colors font-medium ${bulkMode === "stock" ? "bg-blue-50 text-blue-700 border-blue-300" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                    Set Stock
                  </button>
                  <button onClick={handleBulkDelete} disabled={saving}
                    className="text-[0.55rem] px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 uppercase tracking-wider transition-colors font-medium">Delete</button>
                </>
              )}
              <button onClick={handleDeleteAll} disabled={saving}
                className="text-[0.55rem] px-3 py-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 uppercase tracking-wider transition-colors">Delete All</button>
            </div>
          </div>

          {/* Bulk input bars */}
          {bulkMode === "price" && selectedIds.size > 0 && (
            <div className="px-5 py-3 flex items-center gap-3 border-b" style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}>
              <span className="text-[0.60rem] text-blue-700 font-semibold">Price for {selectedIds.size} variants:</span>
              <div className="flex items-center gap-1.5">
                <span className="text-blue-400 font-medium">$</span>
                <input type="number" step="0.01" min="0" value={bulkPrice} onChange={e => setBulkPrice(e.target.value)}
                  placeholder="Blank = base price"
                  className="w-36 px-3 py-1.5 border border-blue-200 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-400" />
              </div>
              <button onClick={handleBulkPrice} disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-[0.58rem] uppercase tracking-wider hover:bg-blue-700 transition-colors font-semibold">Apply</button>
              <button onClick={() => setBulkMode("none")} className="text-[0.55rem] text-blue-500 hover:text-blue-700 underline">Cancel</button>
            </div>
          )}
          {bulkMode === "stock" && selectedIds.size > 0 && (
            <div className="px-5 py-3 flex items-center gap-3 border-b" style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}>
              <span className="text-[0.60rem] text-blue-700 font-semibold">Stock for {selectedIds.size} variants:</span>
              <input type="number" min="-1" value={bulkStock} onChange={e => setBulkStock(e.target.value)}
                placeholder="-1 = unlimited"
                className="w-32 px-3 py-1.5 border border-blue-200 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-400" />
              <span className="text-[0.55rem] text-gray-500">−1 = unlimited · 0 = out of stock</span>
              <button onClick={handleBulkStock} disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-[0.58rem] uppercase tracking-wider hover:bg-blue-700 transition-colors font-semibold">Apply</button>
              <button onClick={() => setBulkMode("none")} className="text-[0.55rem] text-blue-500 hover:text-blue-700 underline">Cancel</button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                  <th className="pl-5 pr-2 py-3.5 w-10"></th>
                  <th className="px-4 py-3.5 text-[0.58rem] uppercase tracking-[0.14em] text-gray-500 font-semibold">Variant</th>
                  <th className="px-4 py-3.5 text-[0.58rem] uppercase tracking-[0.14em] text-gray-500 font-semibold">SKU</th>
                  <th className="px-4 py-3.5 text-[0.58rem] uppercase tracking-[0.14em] text-gray-500 font-semibold text-right">Price Override</th>
                  <th className="px-4 py-3.5 text-[0.58rem] uppercase tracking-[0.14em] text-gray-500 font-semibold text-right">Stock</th>
                  <th className="px-4 py-3.5 text-[0.58rem] uppercase tracking-[0.14em] text-gray-500 font-semibold">Status</th>
                  <th className="px-4 py-3.5 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {variants.map(v => {
                  const isSelected = selectedIds.has(v.id);
                  const stockNum = Number(v.stock);
                  const stockColor = stockNum === 0 ? "#ef4444" : stockNum > 0 && stockNum <= 5 ? "#d97706" : "#374151";
                  return (
                    <tr key={v.id} className="border-b border-gray-50 transition-colors hover:bg-gray-50/40"
                      style={{ borderLeft: `3px solid ${v.is_active ? (isSelected ? "#3b82f6" : "#10b981") : "#e5e7eb"}`,
                        background: isSelected ? "rgba(59,130,246,0.03)" : "white",
                        opacity: v.is_active ? 1 : 0.55 }}>
                      <td className="pl-4 pr-2 py-4">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleId(v.id)} className="w-4 h-4 accent-gray-900 rounded" />
                      </td>
                      <td className="px-4 py-4 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          {v.color && (
                            <span className="w-7 h-7 rounded-full shrink-0 shadow ring-2 ring-white"
                              style={{ backgroundColor: COLOR_HEX[v.color] ?? "#ccc" }} title={COLOR_LABELS[v.color] ?? v.color} />
                          )}
                          <div>
                            <div className="flex flex-wrap items-center gap-1 text-[0.75rem] font-semibold text-gray-800">
                              {v.color && <span>{COLOR_LABELS[v.color] ?? v.color}</span>}
                              {v.size && <><span className="text-gray-300 font-normal">·</span><span>{v.size}</span></>}
                              {v.length && <><span className="text-gray-300 font-normal">·</span><span>{v.length}</span></>}
                              {!v.color && !v.size && !v.length && <span className="text-gray-400 italic font-normal text-sm">Default</span>}
                            </div>
                            <div className="text-[0.60rem] text-gray-400 mt-0.5">{formatUSD(visibleVariantPrice(v))} effective</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 min-w-[200px]">
                        <input type="text"
                          defaultValue={v.sku ?? ""}
                          key={`${v.id}-sku`}
                          onBlur={e => handleInlineUpdate(v.id, "sku", e.target.value || null)}
                          placeholder="e.g. QJ-GOLD-3MM-18"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[0.68rem] font-mono text-gray-700 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white transition-all" />
                      </td>
                      <td className="px-4 py-4 min-w-[140px]">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-gray-400 text-sm">$</span>
                          <input type="number" step="0.01" min="0"
                            defaultValue={isTennis ? visibleVariantPrice(v) : (v.price_override ?? "")}
                            key={`${v.id}-price`}
                            onBlur={e => {
                              const val = e.target.value.trim();
                              handleInlineUpdate(v.id, "price_override", val === "" ? null : parseFloat(val));
                            }}
                            placeholder={String(visibleVariantPrice(v))}
                            title={isTennis ? `Table price: ${formatUSD(visibleVariantPrice(v))}` : "Blank = base price"}
                            className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-[0.72rem] text-right font-semibold text-gray-800 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white transition-all" />
                        </div>
                      </td>
                      <td className="px-4 py-4 min-w-[120px]">
                        <div className="flex items-center justify-end gap-2">
                          <input type="number" min="-1"
                            defaultValue={v.stock}
                            key={`${v.id}-stock`}
                            onBlur={e => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val)) handleInlineUpdate(v.id, "stock", val);
                            }}
                            className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-[0.72rem] text-right font-semibold focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white transition-all"
                            style={{ color: stockColor }} />
                          <span className="text-[0.52rem] text-gray-400 w-8 text-left font-medium">
                            {stockNum === -1 ? "∞" : stockNum === 0 ? "OUT" : stockNum <= 5 ? "LOW" : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button onClick={() => handleInlineUpdate(v.id, "is_active", !v.is_active)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.58rem] uppercase tracking-wider font-semibold transition-colors"
                          style={v.is_active ? { background: "#f0fdf4", color: "#15803d", border: "1px solid rgba(21,128,61,0.20)" }
                            : { background: "#f9fafb", color: "#9ca3af", border: "1px solid rgba(0,0,0,0.10)" }}>
                          {v.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          {v.is_active ? "Active" : "Off"}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <button onClick={() => handleDeleteSingle(v.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer stats */}
          <div className="px-5 py-3 flex items-center justify-between border-t border-gray-100 text-[0.55rem] text-gray-500 uppercase tracking-wider" style={{ background: "#f9fafb" }}>
            <span className="font-medium">{variantCount} variants · {activeCount} active · {variantCount - activeCount} disabled</span>
            {variantCount > 0 && <span>Price range: {formatUSD(Math.min(...variants.map(visibleVariantPrice)))} – {formatUSD(Math.max(...variants.map(visibleVariantPrice)))}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Rich Description Editor ──────────────────────────────────────────────────

function DescriptionEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode("write")}
            className={`text-[0.52rem] uppercase tracking-[0.12em] px-2.5 py-1.5 transition-colors ${
              mode === "write" ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-700 bg-gray-50"
            }`}
          >
            <Pen className="h-3 w-3 inline mr-1" /> Write
          </button>
          <button
            onClick={() => setMode("preview")}
            className={`text-[0.52rem] uppercase tracking-[0.12em] px-2.5 py-1.5 transition-colors ${
              mode === "preview" ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-700 bg-gray-50"
            }`}
          >
            <Eye className="h-3 w-3 inline mr-1" /> Preview
          </button>
        </div>
        <button
          onClick={() => setShowHelp(v => !v)}
          className="text-[0.50rem] text-gray-400 hover:text-gray-600 underline underline-offset-2"
        >
          Formatting help
        </button>
      </div>

      {showHelp && (
        <div className="bg-gray-50 border border-gray-100 px-4 py-3 text-[0.62rem] text-gray-500 leading-relaxed">
          <p className="font-medium text-gray-700 mb-1">Available formatting:</p>
          <code className="block text-[0.55rem]">{"$$text$$"}</code> — Double dollar signs create paragraphs / preserved line breaks.
          <br />
          <code className="text-[0.55rem]">{"•"}</code> Start a line with • for a bullet list.
          <br />
          <code className="text-[0.55rem]">{"/italic/"}</code> Surround text with forward slashes for <em>italic</em>.
          <br />
          <code className="text-[0.55rem]">{"**bold**"}</code> Surround text with double asterisks for <strong>bold</strong>.
          <br />
          HTML tags like {'<br>'} and {'<strong>'} are rendered as-is.
        </div>
      )}

      {mode === "write" ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={14}
          placeholder={placeholder || "Product description… Use $$ for paragraph breaks, • for bullet lists, /italic/ and **bold**"}
          className="w-full border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors bg-white resize-y font-mono text-[0.80rem] leading-relaxed"
        />
      ) : (
        <div className="min-h-[280px] border border-gray-200 px-4 py-3.5 bg-white text-sm text-gray-700 leading-relaxed whitespace-pre-wrap overflow-auto">
          {value ? (
            value.split("$$").map((block, i) => (
              i % 2 === 1 ? (
                <p key={i} className="mb-3">{formatInline(block)}</p>
              ) : (
                <span key={i}>{formatInline(block)}</span>
              )
            ))
          ) : (
            <span className="text-gray-300 italic">No content — write your description</span>
          )}
        </div>
      )}
    </div>
  );
}

function formatInline(text: string): React.ReactNode {
  // Split by lines to handle bullet lists
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("•")) {
      const content = trimmed.slice(1).trim();
      return (
        <span key={i} className="block pl-3 -indent-2.5">
          <span className="mr-1.5">•</span>
          {renderInlineFormatting(content)}
        </span>
      );
    }
    return <span key={i}>{i > 0 ? "\n" : ""}{renderInlineFormatting(line)}</span>;
  });
}

function renderInlineFormatting(text: string): React.ReactNode {
  // Bold: **text**
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
  return boldParts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    // Italic: /text/
    const italicParts = part.split(/(\/[^/]+\/)/g);
    return italicParts.map((p, j) => {
      if (p.startsWith("/") && p.endsWith("/") && p.length > 2) {
        return <em key={j} className="italic">{p.slice(1, -1)}</em>;
      }
      return p;
    });
  });
}

// ─── SEO Preview ──────────────────────────────────────────────────────────────

function SEOPreview({ slug, seoTitle, seoDesc, productName, productShortDesc }: {
  slug: string;
  seoTitle: string;
  seoDesc: string;
  productName: string;
  productShortDesc: string;
}) {
  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");

  return (
    <div className="mt-5 p-4 pb-5 bg-gray-50 border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Scan className="h-3.5 w-3.5 text-gray-400" />
          <p className="text-[0.56rem] uppercase tracking-[0.14em] text-gray-400">Search Preview</p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200">
          <button
            onClick={() => setMode("desktop")}
            className={`px-2 py-1 text-[0.50rem] uppercase tracking-[0.10em] ${mode === "desktop" ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-700"}`}
          >
            <Monitor className="h-3 w-3 inline mr-1" /> Desktop
          </button>
          <button
            onClick={() => setMode("mobile")}
            className={`px-2 py-1 text-[0.50rem] uppercase tracking-[0.10em] ${mode === "mobile" ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-700"}`}
          >
            <Smartphone className="h-3 w-3 inline mr-1" /> Mobile
          </button>
        </div>
      </div>
      <div className={`bg-white border border-gray-100 p-3.5 ${mode === "mobile" ? "max-w-[360px] mx-auto" : ""}`}>
        <p className="text-[0.62rem] text-gray-400 font-mono mb-1 truncate">
          qureshijewelers.com/product/{slug}
        </p>
        <p className="text-[0.85rem] text-blue-700 font-medium leading-snug mb-1 truncate hover:text-blue-900 cursor-default">
          {seoTitle || productName}
        </p>
        <p className="text-[0.75rem] text-gray-600 leading-relaxed line-clamp-2">
          {seoDesc || productShortDesc}
        </p>
      </div>
      {(seoTitle || seoDesc) && (
        <p className="mt-2 text-[0.50rem] text-gray-400 flex items-center gap-1">
          <Check className="h-2.5 w-2.5 text-emerald-500" />
          SEO content set — this will appear in Google search results
        </p>
      )}
    </div>
  );
}

// Missing icons used in SEOPreview
function Monitor({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  );
}
function Smartphone({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

function AdminProductEditor() {
  const token = useAdminToken();
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchProduct = useServerFn(getAdminProduct);
  const fetchImages = useServerFn(getProductImagesAdmin);
  const updateFn     = useServerFn(updateProduct);
  const deleteFn     = useServerFn(deleteProduct);
  const addImageFn   = useServerFn(addProductImage);
  const duplicateFn  = useServerFn(duplicateProduct);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-product", token, slug],
    queryFn: () => fetchProduct({ data: { token, slug } }),
    enabled: !!token && !!slug,
  });

  const { data: imagesData, isLoading: imagesLoading } = useQuery({
    queryKey: ["admin-product-images", token, slug],
    queryFn: () => fetchImages({ data: { token, slug } }),
    enabled: !!token && !!slug,
  });

  const fetchPublicImages = useServerFn(listPublicImages);

  // Core
  const [name,          setName]          = useState("");
  const [slugField,     setSlugField]     = useState("");
  const [shortDesc,     setShortDesc]     = useState("");
  const [description,   setDescription]   = useState("");
  const [imageUrl,      setImageUrl]      = useState("");
  const [imageErr,      setImageErr]      = useState(false);

  // Type & Color
  const [productType,   setProductType]   = useState("bracelet");
  const [productColor,  setProductColor]  = useState("gold");
  const [productSize,   setProductSize]   = useState("");
  const [productLength, setProductLength] = useState("");

  // Pricing
  const [basePrice,     setBasePrice]     = useState("");
  const [salePrice,     setSalePrice]     = useState("");
  const [saleActive,    setSaleActive]    = useState(false);

  // Catalog
  const [isFeatured,    setIsFeatured]    = useState(false);
  const [isActive,      setIsActive]      = useState(true);
  const [sortOrder,     setSortOrder]     = useState("");

  // Inventory
  const [trackInventory, setTrackInventory] = useState(false);
  const [stockQty,       setStockQty]       = useState("");

  // SEO
  const [seoTitle,      setSeoTitle]      = useState("");
  const [seoDesc,       setSeoDesc]       = useState("");
  const [seoKeywords,   setSeoKeywords]   = useState("");

  // Tags
  const [tags,          setTags]          = useState<string[]>([]);

  // Notes
  const [adminNotes,    setAdminNotes]    = useState("");

  // Original values for dirty tracking (updated on load + after successful save)
  const origRef = useRef<Record<string, any>>({});

  // UI
  const [saving,        setSaving]        = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [cloning,       setCloning]       = useState(false);
  const [activeTab,     setActiveTab]     = useState<"details" | "variants" | "pricing" | "media" | "seo" | "advanced">("details");

  // Public media browser
  const [mediaFolder,   setMediaFolder]   = useState<string>("all");
  const [mediaSearch,   setMediaSearch]   = useState("");
  const [addingMedia,   setAddingMedia]   = useState(false);

  const { data: publicMediaData } = useQuery({
    queryKey: ["admin-public-images", token],
    queryFn: () => fetchPublicImages({ data: { token } }),
    enabled: !!token && activeTab === "media",
    staleTime: 5 * 60 * 1000,
  });

  const product = data?.product as any;
  const galleryImages = imagesData?.images ?? [];

  useEffect(() => {
    if (product) {
      const n    = product.name ?? "";
      const sd   = product.short_description ?? "";
      const desc = product.description ?? "";
      const bp   = String(product.base_price ?? "");
      const sp   = product.sale_price != null ? String(product.sale_price) : "";
      const sa   = product.sale_active ?? false;
      const img  = product.image_url ?? "";
      const feat = product.is_featured ?? false;
      const act  = product.is_active ?? true;
      const so   = String(product.sort_order ?? 0);
      const ti   = product.track_inventory ?? false;
      const sq   = product.stock_quantity != null ? String(product.stock_quantity) : "";
      const st   = product.seo_title ?? "";
      const sds  = product.seo_description ?? "";
      const sk   = product.seo_keywords ?? "";
      const tgs  = Array.isArray(product.tags) ? product.tags : [];
      const an   = product.admin_notes ?? "";

      setName(n); setSlugField(product.slug ?? "");
      setShortDesc(sd); setDescription(desc);
      setBasePrice(bp); setSalePrice(sp); setSaleActive(sa);
      setImageUrl(img); setIsFeatured(feat); setIsActive(act);
      setSortOrder(so); setTrackInventory(ti); setStockQty(sq);
      setSeoTitle(st); setSeoDesc(sds); setSeoKeywords(sk);
      setTags(tgs); setAdminNotes(an);
      setProductType(product.type ?? "bracelet");
      setProductColor(product.color ?? "gold");
      setProductSize(product.size ?? "");
      setProductLength(product.length ?? "");

      origRef.current = { name: n, short_description: sd, description: desc,
        base_price: bp, sale_price: sp, sale_active: sa, image_url: img,
        is_featured: feat, is_active: act, sort_order: so,
        track_inventory: ti, stock_qty: sq,
        seo_title: st, seo_description: sds, seo_keywords: sk,
        tags: JSON.stringify(tgs), admin_notes: an,
        type_val: product.type ?? "bracelet",
        color_val: product.color ?? "gold",
        size_val: product.size ?? "",
        length_val: product.length ?? "",
      };
    }
  }, [product]);

  // Compute which fields differ from the saved-on-load originals
  const dirtyFields = useMemo(() => {
    const o = origRef.current;
    if (!Object.keys(o).length) return new Set<string>();
    const d = new Set<string>();
    if (name !== o.name) d.add("name");
    if (shortDesc !== o.short_description) d.add("short_description");
    if (description !== o.description) d.add("description");
    if (basePrice !== o.base_price) d.add("base_price");
    if (salePrice !== o.sale_price) d.add("sale_price");
    if (saleActive !== o.sale_active) d.add("sale_active");
    if (imageUrl !== o.image_url) d.add("image_url");
    if (isFeatured !== o.is_featured) d.add("is_featured");
    if (isActive !== o.is_active) d.add("is_active");
    if (sortOrder !== o.sort_order) d.add("sort_order");
    if (trackInventory !== o.track_inventory) d.add("track_inventory");
    if (stockQty !== o.stock_qty) d.add("stock_quantity");
    if (seoTitle !== o.seo_title) d.add("seo_title");
    if (seoDesc !== o.seo_description) d.add("seo_description");
    if (seoKeywords !== o.seo_keywords) d.add("seo_keywords");
    if (JSON.stringify(tags) !== o.tags) d.add("tags");
    if (adminNotes !== o.admin_notes) d.add("admin_notes");
    if (productType   !== o.type_val)   d.add("type");
    if (productColor  !== o.color_val)  d.add("color");
    if (productSize   !== o.size_val)   d.add("size");
    if (productLength !== o.length_val) d.add("length");
    return d;
  }, [name, shortDesc, description, basePrice, salePrice, saleActive, imageUrl,
      isFeatured, isActive, sortOrder, trackInventory, stockQty,
      seoTitle, seoDesc, seoKeywords, tags, adminNotes,
      productType, productColor, productSize, productLength]);

  const save = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!basePrice || isNaN(Number(basePrice))) { toast.error("Valid base price required"); return; }

    const d = dirtyFields;
    if (d.size === 0) { toast.info("No changes to save"); return; }

    const changes: Record<string, any> = { token, slug };
    if (d.has("name"))              changes.name              = name.trim();
    if (d.has("short_description")) changes.short_description = shortDesc.trim();
    if (d.has("description"))       changes.description       = description.trim();
    if (d.has("base_price"))        changes.base_price        = Number(basePrice);
    if (d.has("sale_price"))        changes.sale_price        = salePrice !== "" ? Number(salePrice) : null;
    if (d.has("sale_active"))       changes.sale_active       = saleActive;
    if (d.has("image_url"))         changes.image_url         = imageUrl.trim() || undefined;
    if (d.has("is_featured"))       changes.is_featured       = isFeatured;
    if (d.has("is_active"))         changes.is_active         = isActive;
    if (d.has("sort_order"))        changes.sort_order        = sortOrder !== "" ? Number(sortOrder) : undefined;
    if (d.has("track_inventory"))   changes.track_inventory   = trackInventory;
    if (d.has("stock_quantity"))    changes.stock_quantity    = trackInventory && stockQty !== "" ? Number(stockQty) : null;
    if (d.has("seo_title"))         changes.seo_title         = seoTitle.trim();
    if (d.has("seo_description"))   changes.seo_description   = seoDesc.trim();
    if (d.has("seo_keywords"))      changes.seo_keywords      = seoKeywords.trim();
    if (d.has("tags"))              changes.tags              = tags;
    if (d.has("admin_notes"))       changes.admin_notes       = adminNotes.trim();
    if (d.has("type"))              changes.type              = productType;
    if (d.has("color"))             changes.color             = productColor;
    if (d.has("size"))              changes.size              = productSize || null;
    if (d.has("length"))            changes.length            = productLength || null;

    setSaving(true);
    try {
      await updateFn({ data: changes as any });
      // Update origRef so dirty tracking resets for saved fields
      const o = origRef.current;
      if (d.has("name"))              o.name              = name.trim();
      if (d.has("short_description")) o.short_description = shortDesc.trim();
      if (d.has("description"))       o.description       = description.trim();
      if (d.has("base_price"))        o.base_price        = basePrice;
      if (d.has("sale_price"))        o.sale_price        = salePrice;
      if (d.has("sale_active"))       o.sale_active       = saleActive;
      if (d.has("image_url"))         o.image_url         = imageUrl.trim();
      if (d.has("is_featured"))       o.is_featured       = isFeatured;
      if (d.has("is_active"))         o.is_active         = isActive;
      if (d.has("sort_order"))        o.sort_order        = sortOrder;
      if (d.has("track_inventory"))   o.track_inventory   = trackInventory;
      if (d.has("stock_quantity"))    o.stock_qty         = stockQty;
      if (d.has("seo_title"))         o.seo_title         = seoTitle.trim();
      if (d.has("seo_description"))   o.seo_description   = seoDesc.trim();
      if (d.has("seo_keywords"))      o.seo_keywords      = seoKeywords.trim();
      if (d.has("tags"))              o.tags              = JSON.stringify(tags);
      if (d.has("admin_notes"))       o.admin_notes       = adminNotes.trim();
      if (d.has("type"))              o.type_val          = productType;
      if (d.has("color"))             o.color_val         = productColor;
      if (d.has("size"))              o.size_val          = productSize;
      if (d.has("length"))            o.length_val        = productLength;

      await queryClient.invalidateQueries({ queryKey: ["admin-product", token, slug] });
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-product-images", token, slug] });
      const count = d.size;
      toast.success(`${count} field${count !== 1 ? "s" : ""} updated successfully`);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteFn({ data: { token, slug } });
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product deleted");
      navigate({ to: "/admin/products" });
    } catch (err: any) {
      toast.error(err?.message ?? "Delete failed");
      setDeleting(false);
    }
  };

  const handleClone = async () => {
    setCloning(true);
    try {
      const res = await duplicateFn({ data: { token, slug } });
      toast.success(`Cloned → ${res.newSlug} (hidden, ready to edit)`);
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      navigate({ to: "/admin/products/$slug", params: { slug: res.newSlug } });
    } catch (err: any) {
      toast.error(err?.message ?? "Clone failed");
    } finally { setCloning(false); }
  };

  // Cmd+S / Ctrl+S keyboard shortcut — uses a ref so the handler is always current
  const saveRef = useRef(save);
  useEffect(() => { saveRef.current = save; });
  useEffect(() => {
    const handler = (e: Event) => {
      const ke = e as globalThis.KeyboardEvent;
      if ((ke.metaKey || ke.ctrlKey) && ke.key === "s") {
        ke.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 animate-pulse space-y-4 max-w-5xl">
        <div className="h-3 w-20 bg-gray-100 rounded" />
        <div className="h-20 bg-gray-100 rounded" />
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-80 bg-gray-100 rounded" />
          <div className="h-80 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-8 text-center max-w-sm mx-auto mt-16">
        <p className="text-sm text-gray-400 mb-4">Product not found.</p>
        <Link to="/admin/products" className="text-[0.65rem] uppercase tracking-[0.14em] text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to products
        </Link>
      </div>
    );
  }

  const inputCls  = "w-full border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all bg-white rounded-lg";
  const labelCls  = "block text-[0.60rem] uppercase tracking-[0.16em] text-gray-500 mb-1.5 font-semibold";
  const cardCls   = "rounded-xl p-5";
  const thumbSrc  = imageUrl || getProductThumb(slug);
  const effectivePrice = saleActive && salePrice !== "" ? Number(salePrice) : Number(basePrice);

  const tabs = [
    { id: "details"  as const, label: "Details",  icon: FileText },
    { id: "variants" as const, label: "Variants",  icon: Layers },
    { id: "pricing"  as const, label: "Pricing",   icon: Tag },
    { id: "media"    as const, label: "Media",     icon: FileImage },
    { id: "seo"      as const, label: "SEO",       icon: Scan },
    { id: "advanced" as const, label: "Advanced",  icon: Settings },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.14em] text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Products
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClone}
            disabled={cloning}
            className="flex items-center gap-1.5 px-3 py-2 text-[0.60rem] uppercase tracking-[0.12em] transition-all rounded-lg disabled:opacity-40"
            style={{ background: "white", color: "#6b7280", border: "1px solid rgba(0,0,0,0.10)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            title="Duplicate this product (creates a hidden copy)"
          >
            {cloning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Copy className="h-3 w-3" />}
            {cloning ? "Cloning…" : "Clone"}
          </button>
          <Link
            to="/product/$slug"
            params={{ slug }}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 text-[0.60rem] uppercase tracking-[0.12em] transition-all rounded-lg"
            style={{ background: "white", color: "#6b7280", border: "1px solid rgba(0,0,0,0.10)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <ExternalLink className="h-3 w-3" /> View Storefront
          </Link>
        </div>
      </div>

      {/* Product header card */}
      <div
        className="p-5 mb-5 flex flex-wrap items-center gap-4 rounded-xl"
        style={{
          background: "white",
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.03)",
        }}
      >
        <div
          className="w-20 h-20 overflow-hidden shrink-0 rounded-lg"
          style={{ border: "1px solid rgba(0,0,0,0.08)" }}
        >
          <img
            src={thumbSrc}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={() => setImageErr(true)}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-gray-900 truncate">{product.name}</h1>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {[TYPE_LABELS[product.type] ?? product.type, COLOR_LABELS[product.color] ?? product.color, ...(product.size ? [product.size] : [])].map(label => (
              <span key={label} className="text-[0.58rem] uppercase tracking-[0.12em] text-gray-500 px-2 py-0.5 rounded-md" style={{ background: "#f5f5f5", border: "1px solid rgba(0,0,0,0.08)" }}>
                {label}
              </span>
            ))}
          </div>
          <p className="text-[0.62rem] text-gray-400 font-mono mt-1.5">/product/{slug}</p>
        </div>
        <div className="text-right shrink-0 space-y-1">
          <p className="text-2xl font-semibold text-gray-900">{formatUSD(effectivePrice)}</p>
          {saleActive && salePrice !== "" && (
            <p className="text-xs text-gray-400 line-through">{formatUSD(Number(basePrice))}</p>
          )}
          {saleActive && (
            <span className="inline-flex items-center gap-1 text-[0.58rem] uppercase tracking-[0.08em] font-semibold px-2.5 py-1 rounded-full" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid rgba(220,38,38,0.18)" }}>
              <Tag className="h-2.5 w-2.5" /> Sale Active
            </span>
          )}
          {dirtyFields.size > 0 && (
            <p className="text-[0.58rem] uppercase tracking-[0.10em] text-amber-600 font-medium">
              {dirtyFields.size} unsaved change{dirtyFields.size !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {/* Quick toggles */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setIsActive(v => !v)}
          className="flex items-center gap-2 px-4 py-2 text-[0.62rem] uppercase tracking-[0.12em] transition-all rounded-lg font-medium"
          style={isActive ? {
            background: "#f0fdf4", color: "#15803d",
            border: "1px solid rgba(21,128,61,0.20)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          } : {
            background: "white", color: "#6b7280",
            border: "1px solid rgba(0,0,0,0.10)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          {isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {isActive ? "Active" : "Hidden"}
        </button>
        <button
          onClick={() => setIsFeatured(v => !v)}
          className="flex items-center gap-2 px-4 py-2 text-[0.62rem] uppercase tracking-[0.12em] transition-all rounded-lg font-medium"
          style={isFeatured ? {
            background: "#fffbeb", color: "#b45309",
            border: "1px solid rgba(251,191,36,0.30)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          } : {
            background: "white", color: "#6b7280",
            border: "1px solid rgba(0,0,0,0.10)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <Star className="h-3.5 w-3.5" fill={isFeatured ? "currentColor" : "none"} />
          {isFeatured ? "Featured" : "Not Featured"}
        </button>
        {saleActive && (
          <span
            className="flex items-center gap-1.5 px-4 py-2 text-[0.62rem] uppercase tracking-[0.12em] rounded-lg font-medium"
            style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid rgba(220,38,38,0.20)" }}
          >
            <Tag className="h-3.5 w-3.5" /> On Sale
          </span>
        )}
      </div>

      {/* Tab navigation — glass card buttons */}
      <div
        className="mb-6 p-1.5 rounded-xl overflow-x-auto flex gap-1.5"
        style={{
          background: "rgba(0,0,0,0.04)",
          border: "1px solid rgba(0,0,0,0.07)",
          backdropFilter: "blur(8px)",
        }}
      >
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          const tabDirty = (
            (tab.id === "details"  && (dirtyFields.has("name") || dirtyFields.has("short_description") || dirtyFields.has("description"))) ||
            (tab.id === "variants" && false) ||
            (tab.id === "pricing"  && (dirtyFields.has("base_price") || dirtyFields.has("sale_price") || dirtyFields.has("sale_active") || dirtyFields.has("track_inventory") || dirtyFields.has("stock_quantity"))) ||
            (tab.id === "media"    && dirtyFields.has("image_url")) ||
            (tab.id === "seo"      && (dirtyFields.has("seo_title") || dirtyFields.has("seo_description") || dirtyFields.has("seo_keywords") || dirtyFields.has("tags"))) ||
            (tab.id === "advanced" && (dirtyFields.has("is_active") || dirtyFields.has("is_featured") || dirtyFields.has("sort_order") || dirtyFields.has("admin_notes")))
          );
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 text-[0.62rem] uppercase tracking-[0.12em] font-medium transition-all whitespace-nowrap rounded-lg relative"
              style={active ? {
                background: "white",
                border: "1px solid rgba(251,191,36,0.22)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
                color: "#111827",
              } : {
                background: "transparent",
                border: "1px solid transparent",
                color: "#9ca3af",
              }}
            >
              <Icon
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: active ? "#f59e0b" : "#d1d5db" }}
              />
              {tab.label}
              {tabDirty && !active && (
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: "#f59e0b", boxShadow: "0 0 4px rgba(245,158,11,0.6)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Main edit form */}
      <div className={`grid gap-5 ${activeTab === "variants" ? "" : "lg:grid-cols-5"}`}>
        {/* Left: active tab content */}
        <div className={`space-y-5 ${activeTab === "variants" ? "" : "lg:col-span-3"}`}>
          {/* ═══ DETAILS TAB ═══ */}
          {activeTab === "details" && (
            <>
              <div className={cardCls} style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
                <p className="text-[0.58rem] uppercase tracking-[0.18em] text-gray-400 mb-5">Product Details</p>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Product Name *</label>
                    <input value={name} onChange={e => setName(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Slug</label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[0.62rem] text-gray-300 font-mono">/product/</span>
                      <input value={slugField} onChange={e => setSlugField(e.target.value)} className={inputCls} />
                    </div>
                    <p className="mt-1 text-[0.58rem] text-gray-400">URL path — use hyphens, no spaces</p>
                  </div>
                  <div>
                    <label className={labelCls}>Short Description</label>
                    <input
                      value={shortDesc}
                      onChange={e => setShortDesc(e.target.value)}
                      className={inputCls}
                      placeholder="One-line summary shown in listings"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Full Description</label>
                    <DescriptionEditor
                      value={description}
                      onChange={setDescription}
                      placeholder="Product description… Use $$ for paragraph breaks, • for bullet lists"
                    />
                  </div>

                  <p className="text-[0.56rem] text-gray-400 mt-2">
                    Manage size, color, and length options in the <button onClick={() => setActiveTab("variants")} className="underline hover:text-gray-700 transition-colors">Variants tab</button>.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ═══ VARIANTS TAB ═══ */}
          {activeTab === "variants" && (
            <>
              {/* Floating save bar for product-level changes while on Variants tab */}
              {dirtyFields.size > 0 && (
                <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
                  <span className="text-[0.62rem] text-amber-700 font-medium">
                    {dirtyFields.size} unsaved product change{dirtyFields.size !== 1 ? "s" : ""} — {[...dirtyFields].slice(0,3).map(f => f.replace(/_/g," ")).join(" · ")}{dirtyFields.size > 3 ? ` +${dirtyFields.size - 3}` : ""}
                  </span>
                  <button
                    onClick={save}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-[0.60rem] uppercase tracking-[0.12em] font-semibold text-white rounded-lg transition-all disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#111827,#1f2937)", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}
                  >
                    {saving ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : <><Save className="h-3 w-3" /> Save Changes</>}
                  </button>
                </div>
              )}
              <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Variants & Options</p>
                  <p className="text-xs text-gray-400 mt-0.5">Generate color, size, and length combinations. Set per-variant pricing, stock, and SKUs.</p>
                </div>
                {isTennisBraceletSlug(slug) && (
                  <span className="text-[0.56rem] uppercase tracking-[0.12em] px-3 py-1.5 rounded-lg font-medium" style={{ background: "var(--at-live-bg)", color: "var(--at-live-text)", border: "1px solid var(--at-live-border)" }}>
                    Tennis Bracelet — Price Table Active
                  </span>
                )}
              </div>
              <VariantsManager
                slug={slug}
                productType={productType}
                basePrice={Number(basePrice || 0)}
                size={productSize}
                onSizeChange={setProductSize}
                length={productLength}
                onLengthChange={setProductLength}
                color={productColor}
                onColorChange={setProductColor}
                onSaved={() => {
                  queryClient.invalidateQueries({ queryKey: ["admin-product", token, slug] });
                }}
              />
            </>
          )}

          {/* ═══ PRICING TAB ═══ */}
          {activeTab === "pricing" && (
            <>
              <div className={`${cardCls} admin-surface`}>
                <p className="text-[0.58rem] uppercase tracking-[0.18em] admin-muted mb-5">Pricing</p>
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Base Price ($) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input
                        type="number" min={0} step={0.01}
                        value={basePrice} onChange={e => setBasePrice(e.target.value)}
                        className="w-full border border-gray-200 pl-7 pr-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors bg-white"
                      />
                    </div>
                    <p className="mt-1 text-[0.58rem] admin-muted">
                      {isTennisBraceletSlug(slug)
                        ? `For tennis bracelets, live prices come from the synced table below. Base price fallback starts at ${formatUSD(TENNIS_MATRIX_MIN)}.`
                        : "Starting price before size/length modifiers."}
                    </p>
                  </div>

                  {/* Compare-at / Sale Price */}
                  <div className="pt-4 border-t border-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-[0.60rem] uppercase tracking-[0.14em] text-gray-400">Compare-at Price (Sale)</label>
                      <div className="flex items-center gap-2">
                        <span className="text-[0.58rem] text-gray-400">{saleActive ? "On" : "Off"}</span>
                        <button
                          onClick={() => setSaleActive(v => !v)}
                          className={`w-9 h-5 rounded-full transition-colors relative ${saleActive ? "bg-red-500" : "bg-gray-200"}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${saleActive ? "translate-x-4" : "translate-x-0.5"}`} />
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input
                        type="number" min={0} step={0.01}
                        value={salePrice}
                        onChange={e => setSalePrice(e.target.value)}
                        placeholder={saleActive ? "Sale price…" : "Enter sale price"}
                        disabled={!saleActive}
                        className={`w-full border border-gray-200 pl-7 pr-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors bg-white ${
                          !saleActive ? "opacity-40 cursor-not-allowed" : ""
                        }`}
                      />
                    </div>
                    {saleActive && salePrice !== "" && Number(basePrice) > 0 && (
                      <div className="mt-3 flex items-center gap-3 flex-wrap">
                        <p className="text-[0.60rem] text-emerald-600 font-medium">
                          {Math.round((1 - Number(salePrice) / Number(basePrice)) * 100)}% off
                        </p>
                        <span className="text-[0.50rem] text-gray-300">·</span>
                        <p className="text-[0.60rem] text-gray-500">
                          Save {formatUSD(Number(basePrice) - Number(salePrice))}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Price Summary */}
              <div className={`${cardCls} admin-surface`}>
                <p className="text-[0.58rem] uppercase tracking-[0.18em] admin-muted mb-3">Price Summary</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg" style={{ background: "var(--at-tile-bg)", border: "1px solid var(--at-tile-border)" }}>
                    <p className="text-[0.46rem] uppercase tracking-[0.14em] admin-muted mb-1">Base Price</p>
                    <p className="text-lg font-semibold admin-heading">{formatUSD(Number(basePrice || 0))}</p>
                  </div>
                  <div className="border p-4 rounded-lg" style={{ background: saleActive && salePrice ? "rgba(239,68,68,0.08)" : "var(--at-tile-bg)", borderColor: saleActive && salePrice ? "rgba(239,68,68,0.24)" : "var(--at-tile-border)" }}>
                    <p className="text-[0.46rem] uppercase tracking-[0.14em] admin-muted mb-1">
                      {saleActive && salePrice ? "Sale Price" : "Effective Price"}
                    </p>
                    <p className={`text-lg font-semibold ${saleActive && salePrice ? "text-red-600" : "text-gray-900"}`}>
                      {formatUSD(effectivePrice)}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[0.55rem] admin-muted flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3" /> Price shown is the base. Final price varies by size/length selection.
                </p>
              </div>

              {/* Tennis Bracelet Pricing Matrix */}
              {isTennisBraceletSlug(slug) && (
                <div className={`${cardCls} admin-surface overflow-hidden`}>
                  <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
                    <div>
                      <p className="text-[0.58rem] uppercase tracking-[0.18em] admin-muted">Tennis Bracelet Price Matrix</p>
                      <p className="text-[0.56rem] admin-muted mt-0.5">Live source of truth used by the storefront and checkout validation</p>
                    </div>
                    <span className="text-[0.46rem] uppercase tracking-[0.14em] px-2.5 py-1 rounded-full font-semibold" style={{ background: "var(--at-live-bg)", color: "var(--at-live-text)", border: "1px solid var(--at-live-border)" }}>
                      Synced Prices
                    </span>
                  </div>
                  <TennisBraceletPriceHeatmap />
                  <div className="mt-4 flex items-center gap-4 text-[0.52rem] admin-muted flex-wrap">
                    <span className="flex items-center gap-1.5"><span className="w-8 h-1 rounded-full inline-block" style={{ background: "linear-gradient(90deg,#d97706,#fbbf24)" }} /> Accent intensity rises with price</span>
                    <span>Default length: {TENNIS_BRACELET_LENGTH_DEFAULT}</span>
                    <span>Range: {formatUSD(TENNIS_MATRIX_MIN)} to {formatUSD(TENNIS_MATRIX_MAX)}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══ MEDIA TAB ═══ */}
          {activeTab === "media" && (
            <>
              {/* Product Image */}
              <div className={cardCls} style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
                <p className="text-[0.58rem] uppercase tracking-[0.18em] text-gray-400 mb-4">Primary Product Image</p>
                <div className="flex gap-4">
                  <div className="w-28 h-28 bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                    {imageErr || !thumbSrc ? (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No image</div>
                    ) : (
                      <img
                        src={thumbSrc}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={() => setImageErr(true)}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className={labelCls}>Image URL</label>
                    <input
                      value={imageUrl}
                      onChange={e => { setImageUrl(e.target.value); setImageErr(false); }}
                      placeholder="/images/product.jpg or https://…"
                      className={inputCls}
                    />
                    <p className="mt-1.5 text-[0.58rem] text-gray-400">
                      Relative path from /public (e.g. /TennisBracelet/yellowgoldmain.jpg) or full URL.
                    </p>
                  </div>
                </div>
              </div>

              {/* Image Gallery */}
              <ImageGalleryManager
                slug={slug}
                token={token}
                images={galleryImages}
                onImagesChange={() => {
                  queryClient.invalidateQueries({ queryKey: ["admin-product-images", token, slug] });
                }}
              />

              {/* Public Folder Browser */}
              <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
                <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-gray-400" />
                    <p className="text-[0.58rem] uppercase tracking-[0.18em] text-gray-400">
                      Public Folder Browser
                      {publicMediaData?.files && (
                        <span className="text-gray-300 ml-1.5">({publicMediaData.files.length} images)</span>
                      )}
                    </p>
                  </div>
                  <p className="text-[0.54rem] text-gray-300">Click any image to add it to this product's gallery</p>
                </div>

                {/* Folder + search filters */}
                <div className="px-5 py-3 bg-gray-50/60 border-b border-gray-50 flex flex-wrap gap-2 items-center">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {["all", ...(publicMediaData?.folders ?? [])].map(folder => (
                      <button
                        key={folder}
                        onClick={() => setMediaFolder(folder)}
                        className={`px-2.5 py-1 text-[0.56rem] uppercase tracking-[0.10em] border transition-colors ${
                          mediaFolder === folder
                            ? "bg-gray-900 text-white border-gray-900"
                            : "border-gray-200 text-gray-500 hover:border-gray-400"
                        }`}
                      >
                        {folder === "all" ? "All" : folder}
                      </button>
                    ))}
                  </div>
                  <div className="ml-auto relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-300" />
                    <input
                      value={mediaSearch}
                      onChange={e => setMediaSearch(e.target.value)}
                      placeholder="Search images…"
                      className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 focus:outline-none focus:border-gray-400 bg-white w-44"
                    />
                  </div>
                </div>

                {/* Image grid */}
                <div className="p-5">
                  {!publicMediaData ? (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded-sm" />
                      ))}
                    </div>
                  ) : (() => {
                    const filtered = publicMediaData.files.filter(f => {
                      const matchFolder = mediaFolder === "all" || f.folder === mediaFolder;
                      const matchSearch = !mediaSearch || f.name.toLowerCase().includes(mediaSearch.toLowerCase());
                      return matchFolder && matchSearch;
                    });
                    const galleryPaths = new Set(galleryImages.map((g: any) => g.url));

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-10 text-[0.68rem] text-gray-400">
                          No images found{mediaSearch ? ` matching "${mediaSearch}"` : ""}
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                        {filtered.map(file => {
                          const isAdded = galleryPaths.has(file.path);
                          return (
                            <button
                              key={file.path}
                              disabled={addingMedia}
                              onClick={async () => {
                                if (isAdded) return;
                                setAddingMedia(true);
                                try {
                                  await addImageFn({ data: { token, product_slug: slug, url: file.path, alt_text: file.name.replace(/\.[^.]+$/, "") } });
                                  await queryClient.invalidateQueries({ queryKey: ["admin-product-images", token, slug] });
                                  toast.success(`Added: ${file.name}`);
                                } catch (e: any) {
                                  toast.error(e?.message ?? "Failed to add image");
                                } finally {
                                  setAddingMedia(false);
                                }
                              }}
                              className={`relative group aspect-square overflow-hidden border transition-all ${
                                isAdded
                                  ? "border-amber-400 ring-1 ring-amber-300 cursor-default"
                                  : "border-gray-100 hover:border-gray-400 cursor-pointer"
                              }`}
                              title={file.path}
                            >
                              <img
                                src={file.path}
                                alt={file.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              {isAdded ? (
                                <div className="absolute inset-0 bg-amber-400/20 flex items-end">
                                  <div className="w-full bg-amber-400 py-0.5 flex items-center justify-center gap-1">
                                    <Check className="h-2.5 w-2.5 text-white" />
                                    <span className="text-[0.44rem] text-white font-semibold uppercase tracking-wide">Added</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <Plus className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                </div>
                              )}
                              <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[0.40rem] bg-black/60 text-white px-1 py-0.5 max-w-[80px] truncate block">
                                  {file.name}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </>
          )}

          {/* ═══ SEO TAB ═══ */}
          {activeTab === "seo" && (
            <>
              <div className={cardCls} style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
                <p className="text-[0.58rem] uppercase tracking-[0.18em] text-gray-400 mb-5">Search Engine Optimization</p>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={labelCls.replace("mb-1.5", "mb-0")}>SEO Title</label>
                      <CharCounter value={seoTitle} target={55} max={70} />
                    </div>
                    <input
                      value={seoTitle}
                      onChange={e => setSeoTitle(e.target.value)}
                      className={inputCls}
                      placeholder="Ideal: 50–60 characters · Include primary keyword"
                    />
                    <p className="mt-1 text-[0.58rem] text-gray-400">This is the {'<title>'} tag shown in search results. Keep it under 60 chars.</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={labelCls.replace("mb-1.5", "mb-0")}>Meta Description</label>
                      <CharCounter value={seoDesc} target={155} max={170} />
                    </div>
                    <textarea
                      value={seoDesc}
                      onChange={e => setSeoDesc(e.target.value)}
                      rows={3}
                      className={`${inputCls} resize-none`}
                      placeholder="Ideal: 150–160 characters. Shown below title in search results."
                    />
                  </div>
                  <div>
                    <label className={labelCls}>SEO Keywords</label>
                    <input
                      value={seoKeywords}
                      onChange={e => setSeoKeywords(e.target.value)}
                      className={inputCls}
                      placeholder="moissanite tennis chain, VVS bracelet, GRA certified jewelry…"
                    />
                    <p className="mt-1 text-[0.58rem] text-gray-400">Comma-separated keywords. Not used directly by Google but helps internal search.</p>
                  </div>
                </div>

                {/* SEO Preview */}
                <SEOPreview
                  slug={slug}
                  seoTitle={seoTitle}
                  seoDesc={seoDesc}
                  productName={product?.name ?? ""}
                  productShortDesc={product?.short_description ?? ""}
                />
              </div>

              {/* Tags */}
              <div className={cardCls} style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[0.58rem] uppercase tracking-[0.18em] text-gray-400">Tags</p>
                  {tags.length > 0 && (
                    <span className="text-[0.58rem] text-gray-400">{tags.length}/20</span>
                  )}
                </div>
                <TagInput tags={tags} onChange={setTags} />
                <p className="mt-2 text-[0.58rem] text-gray-400">
                  Tags help with internal filtering and product categorization. Press Enter or comma to add.
                </p>
              </div>
            </>
          )}

          {/* ═══ ADVANCED TAB ═══ */}
          {activeTab === "advanced" && (
            <>
              {/* Catalog */}
              <div className={cardCls} style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
                <p className="text-[0.58rem] uppercase tracking-[0.18em] text-gray-400 mb-5">Catalog Settings</p>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Sort Order</label>
                    <input
                      type="number" min={0}
                      value={sortOrder} onChange={e => setSortOrder(e.target.value)}
                      className={inputCls}
                    />
                    <p className="mt-1 text-[0.58rem] text-gray-400">Lower numbers appear first in the catalog.</p>
                  </div>
                  <div className="pt-3 border-t border-gray-50 space-y-4">
                    {[
                      { id: "is-active",   label: "Visible in store",  sub: "Customers can see and buy this product", value: isActive,   set: setIsActive },
                      { id: "is-featured", label: "Featured product",  sub: "Shown in featured sections on the homepage", value: isFeatured, set: setIsFeatured },
                    ].map(({ id, label, sub, value, set }) => (
                      <label key={id} className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" id={id} checked={value} onChange={e => set(e.target.checked)} className="accent-gray-900 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-700">{label}</p>
                          <p className="text-[0.60rem] text-gray-400">{sub}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Inventory */}
              <div className={cardCls} style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
                <p className="text-[0.58rem] uppercase tracking-[0.18em] text-gray-400 mb-5">Inventory</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-700">Track inventory</p>
                      <p className="text-[0.60rem] text-gray-400">Reduce stock on each order placed</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTrackInventory(v => !v)}
                      className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${trackInventory ? "bg-gray-900" : "bg-gray-200"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${trackInventory ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                  {trackInventory && (
                    <div>
                      <label className={labelCls}>Stock Quantity</label>
                      <input
                        type="number" min={0} step={1}
                        value={stockQty}
                        onChange={e => setStockQty(e.target.value)}
                        placeholder="e.g. 25"
                        className={inputCls}
                      />
                      {stockQty !== "" && Number(stockQty) <= 5 && (
                        <p className="mt-1 text-[0.60rem] text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Low stock — consider restocking soon.
                        </p>
                      )}
                      {stockQty !== "" && Number(stockQty) === 0 && (
                        <p className="mt-1 text-[0.60rem] text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Out of stock — product will still be visible to customers.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              <div className={cardCls} style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}>
                <p className="text-[0.58rem] uppercase tracking-[0.18em] text-gray-400 mb-4">Admin Notes (internal)</p>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  rows={4}
                  placeholder="Internal notes — not visible to customers"
                  className={`${inputCls} resize-none`}
                />
              </div>
            </>
          )}
        </div>

        {/* Right: sticky summary & actions */}
        <div className={`lg:col-span-2 space-y-5 ${activeTab === "variants" ? "hidden lg:hidden" : ""}`}>
          {/* Summary card */}
          <div
            className="p-5 sticky top-5 rounded-xl"
            style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 8px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.04)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-4 w-4 text-gray-400" />
              <p className="text-[0.58rem] uppercase tracking-[0.18em] text-gray-500 font-semibold">Product Summary</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-[0.62rem] text-gray-400">Status</span>
                <span className={`inline-flex items-center gap-1.5 text-[0.62rem] font-medium px-2 py-0.5 ${
                  isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-50 text-gray-500"
                }`}>
                  {isActive ? "Active" : "Hidden"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-[0.62rem] text-gray-400">Type</span>
                <span className="text-[0.62rem] font-medium text-gray-700">{productType || product?.type}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-[0.62rem] text-gray-400">Color</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: COLOR_HEX[productColor] || COLOR_HEX[product?.color] }} />
                  <span className="text-[0.62rem] font-medium text-gray-700">{COLOR_LABELS[productColor] || COLOR_LABELS[product?.color]}</span>
                </div>
              </div>
              {productSize && (
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-[0.62rem] text-gray-400">Size</span>
                  <span className="text-[0.62rem] font-medium text-gray-700">{productSize}</span>
                </div>
              )}
              {productLength && (
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-[0.62rem] text-gray-400">Length</span>
                  <span className="text-[0.62rem] font-medium text-gray-700">{productLength}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-[0.62rem] text-gray-400">Inventory</span>
                <span className="text-[0.62rem] font-medium text-gray-700">
                  {trackInventory ? `${stockQty || "0"} in stock` : "Not tracked"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[0.62rem] text-gray-400">Price</span>
                {slug.includes("tennis") ? (
                  <span className="text-[0.62rem] font-semibold text-amber-700 text-right">
                    {formatUSD(getTennisBraceletPrice("2mm", '6"'))} – {formatUSD(getTennisBraceletPrice("6mm", '9"'))}
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-gray-900">{formatUSD(effectivePrice)}</span>
                )}
              </div>
            </div>

            {/* Gallery stats */}
            {galleryImages.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="text-[0.55rem] text-gray-400 flex items-center gap-1.5">
                  <FileImage className="h-3 w-3" />
                  {galleryImages.length} gallery image{galleryImages.length !== 1 ? "s" : ""}
                  {galleryImages.filter((img: any) => img.is_primary).length > 0 && " · 1 primary"}
                </p>
              </div>
            )}

            {/* Quick nav */}
            <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-1.5">
              {(["details","variants","pricing","media","seo","advanced"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[0.52rem] uppercase tracking-[0.10em] py-1.5 px-2 text-left transition-colors rounded ${
                    activeTab === tab ? "bg-gray-100 text-gray-800 font-semibold" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-5 space-y-2.5">
              <button
                onClick={save}
                disabled={saving || dirtyFields.size === 0}
                className="w-full flex items-center justify-center gap-2 text-white py-3.5 text-[0.62rem] uppercase tracking-[0.18em] transition-all rounded-xl relative overflow-hidden"
                style={{
                  background: saving ? "#374151"
                    : dirtyFields.size === 0 ? "#9ca3af"
                    : "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
                  boxShadow: dirtyFields.size > 0 && !saving ? "0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)" : "none",
                }}
              >
                {saving ? (
                  <><span className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                ) : dirtyFields.size === 0 ? (
                  <><Check className="h-3.5 w-3.5" /> Saved</>
                ) : (
                  <><Save className="h-3.5 w-3.5" /> Save {dirtyFields.size} Change{dirtyFields.size !== 1 ? "s" : ""}</>
                )}
              </button>
              {dirtyFields.size > 0 ? (
                <p className="text-[0.55rem] text-center text-amber-600 uppercase tracking-[0.12em]">
                  {[...dirtyFields].slice(0, 3).map(f => f.replace(/_/g, " ")).join(" · ")}
                  {dirtyFields.size > 3 ? ` · +${dirtyFields.size - 3} more` : ""}
                </p>
              ) : (
                <p className="text-[0.52rem] text-center text-gray-300 uppercase tracking-[0.10em]">
                  ⌘S to save · all changes saved
                </p>
              )}
            </div>
          </div>

          {/* Delete */}
          <DeletePanel onDelete={handleDelete} loading={deleting} />
        </div>
      </div>
    </div>
  );
}
