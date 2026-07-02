import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo, useCallback, useRef } from "react";
import {
  Search, Plus, Eye, EyeOff, Star, Trash2, CheckSquare, Square,
  ChevronDown, LayoutGrid, List, Upload, X, ImageOff,
  Check, AlertCircle, Loader2, AlertTriangle, Download, Copy,
  ArrowUpDown, ArrowUp, ArrowDown, Filter, Package, Tag,
  TrendingDown, AlertTriangle as LowStock, XCircle, Sparkles, Layers, ListChecks,
  CloudUpload, Shield, Hash, Weight, Link2,
} from "lucide-react";
import { toast } from "sonner";
import {
  listAdminProductsAll, bulkUpdateProducts, bulkDeleteProducts,
  deleteAllProducts, importProductFromUrl, importProductFromHtml, importProductFromText, rehostImportImages, duplicateProduct, quickUpdateProduct,
} from "@/lib/admin-extended.functions";
import { useAdminToken } from "@/lib/admin-context";
import { formatUSD } from "@/lib/pricing";

export const Route = createFileRoute("/admin/products/")({
  component: AdminProducts,
});

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  necklace: "Chain",
  bracelet: "Bracelet",
  earring:  "Earring",
  ring:     "Ring",
};

const TYPE_BADGE: Record<string, string> = {
  necklace: "bg-blue-50 text-blue-700 border border-blue-200",
  bracelet: "bg-violet-50 text-violet-700 border border-violet-200",
  earring:  "bg-pink-50 text-pink-700 border border-pink-200",
  ring:     "bg-amber-50 text-amber-700 border border-amber-200",
};

const TYPE_TABS = ["all", "necklace", "bracelet", "earring", "ring"];

type SortField = "sort_order" | "name" | "base_price" | "created_at";
type SortDir = "asc" | "desc";
type StatusFilter = "all" | "active" | "hidden" | "featured" | "sale" | "low_stock" | "oos" | "no_seo" | "no_images";

const SORT_OPTIONS: { field: SortField; dir: SortDir; label: string }[] = [
  { field: "sort_order", dir: "asc",  label: "Manual Order" },
  { field: "name",       dir: "asc",  label: "Name A → Z" },
  { field: "name",       dir: "desc", label: "Name Z → A" },
  { field: "base_price", dir: "asc",  label: "Price Low → High" },
  { field: "base_price", dir: "desc", label: "Price High → Low" },
  { field: "created_at", dir: "desc", label: "Newest First" },
  { field: "created_at", dir: "asc",  label: "Oldest First" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SeoHealth({ title, desc }: { title?: string; desc?: string }) {
  const hasT = !!(title?.trim());
  const hasD = !!(desc?.trim());
  if (hasT && hasD) return <span className="inline-flex items-center gap-1 text-[0.55rem] uppercase tracking-[0.08em] text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Good</span>;
  if (hasT || hasD) return <span className="inline-flex items-center gap-1 text-[0.55rem] uppercase tracking-[0.08em] text-amber-600"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Partial</span>;
  return <span className="inline-flex items-center gap-1 text-[0.55rem] uppercase tracking-[0.08em] text-red-500"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />Missing</span>;
}

function StockBadge({ p }: { p: any }) {
  const qty = p.stock_quantity;
  const tracked = p.track_inventory;
  if (!tracked) return null;
  if (qty === 0) return (
    <span className="inline-flex items-center text-[0.44rem] uppercase tracking-[0.08em] font-semibold bg-red-600 text-white px-1.5 py-0.5">OOS</span>
  );
  if (qty !== null && qty <= 5) return (
    <span className="inline-flex items-center text-[0.44rem] uppercase tracking-[0.08em] font-semibold bg-amber-500 text-white px-1.5 py-0.5">LOW {qty}</span>
  );
  if (qty !== null) return (
    <span className="inline-flex items-center text-[0.44rem] uppercase tracking-[0.08em] font-semibold bg-emerald-500 text-white px-1.5 py-0.5">{qty}</span>
  );
  return null;
}

function StockText({ p }: { p: any }) {
  const qty = p.stock_quantity;
  const tracked = p.track_inventory;
  if (!tracked) return <span className="text-[0.60rem] text-gray-300">—</span>;
  if (qty === 0) return <span className="text-[0.60rem] font-semibold text-red-500">Out of stock</span>;
  if (qty !== null && qty <= 5) return <span className="text-[0.60rem] font-semibold text-amber-600">Low ({qty})</span>;
  if (qty !== null) return <span className="text-[0.60rem] text-emerald-600">{qty} in stock</span>;
  return <span className="text-[0.60rem] text-gray-300">—</span>;
}

function exportToCSV(products: any[], filename = "products.csv") {
  const cols = [
    "name", "slug", "type", "color", "size", "length",
    "base_price", "sale_price", "sale_active", "is_active", "is_featured",
    "short_description", "seo_title", "seo_description", "seo_keywords", "tags", "sort_order", "created_at",
  ];
  const header = cols.join(",");
  const rows = products.map(p => cols.map(col => {
    const val = p[col];
    if (val === null || val === undefined) return "";
    if (Array.isArray(val)) return `"${val.join(", ")}"`;
    const str = String(val).replace(/"/g, '""');
    return str.includes(",") || str.includes("\n") || str.includes('"') ? `"${str}"` : str;
  }).join(","));
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function sortProducts(products: any[], field: SortField, dir: SortDir) {
  return [...products].sort((a, b) => {
    let av: any = a[field];
    let bv: any = b[field];
    if (field === "name") {
      av = (av ?? "").toLowerCase();
      bv = (bv ?? "").toLowerCase();
    } else if (field === "base_price" || field === "sort_order") {
      av = Number(av ?? 0);
      bv = Number(bv ?? 0);
    } else if (field === "created_at") {
      av = new Date(av ?? 0).getTime();
      bv = new Date(bv ?? 0).getTime();
    }
    if (av < bv) return dir === "asc" ? -1 : 1;
    if (av > bv) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

function applyStatusFilter(products: any[], status: StatusFilter): any[] {
  switch (status) {
    case "active":     return products.filter(p => p.is_active);
    case "hidden":     return products.filter(p => !p.is_active);
    case "featured":   return products.filter(p => p.is_featured);
    case "sale":       return products.filter(p => p.sale_active && p.sale_price != null);
    case "low_stock":  return products.filter(p => p.track_inventory && p.stock_quantity != null && p.stock_quantity > 0 && p.stock_quantity <= 5);
    case "oos":        return products.filter(p => p.track_inventory && p.stock_quantity === 0);
    case "no_seo":     return products.filter(p => !p.seo_title?.trim() || !p.seo_description?.trim());
    case "no_images":  return products.filter(p => !p.image_url?.trim());
    default:           return products;
  }
}

// ─── Product Grid Card ────────────────────────────────────────────────────────

function ProductCard({
  product: p,
  selected,
  onToggle,
  onClone,
  onQuickActive,
  onQuickFeatured,
  cloneLoading,
  quickLoading,
}: {
  product: any;
  selected: boolean;
  onToggle: (e: React.MouseEvent) => void;
  onClone: () => void;
  onQuickActive: () => void;
  onQuickFeatured: () => void;
  cloneLoading: boolean;
  quickLoading: boolean;
}) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div className={`group relative bg-white border transition-all duration-150 hover:shadow-md hover:border-gray-300 ${
      selected ? "border-blue-400 ring-1 ring-blue-300" : "border-gray-100"
    }`}>
      {/* Image */}
      <Link to="/admin/products/$slug" params={{ slug: p.slug }} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {!imgErr && p.image_url ? (
            <img
              src={p.image_url}
              alt={p.name}
              className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <ImageOff className="h-8 w-8 text-gray-200" />
            </div>
          )}

          {/* Checkbox */}
          <button
            type="button"
            onClick={onToggle}
            className={`absolute top-2 left-2 w-7 h-7 flex items-center justify-center z-10 transition-all ${
              selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <div className={`w-5 h-5 rounded flex items-center justify-center shadow-sm border-2 transition-colors ${
              selected ? "bg-blue-600 border-blue-600" : "bg-white/90 border-gray-300"
            }`}>
              {selected && <Check className="h-3 w-3 text-white" />}
            </div>
          </button>

          {/* Status indicators */}
          <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
            {p.is_featured && (
              <button
                type="button"
                onClick={e => { e.preventDefault(); e.stopPropagation(); onQuickFeatured(); }}
                disabled={quickLoading}
                className="w-5 h-5 rounded bg-amber-400/90 flex items-center justify-center hover:bg-amber-500 transition-colors"
                title="Click to unfeature"
              >
                <Star className="h-2.5 w-2.5 text-white fill-white" />
              </button>
            )}
            <button
              type="button"
              onClick={e => { e.preventDefault(); e.stopPropagation(); onQuickActive(); }}
              disabled={quickLoading}
              className={`w-2.5 h-2.5 rounded-full shadow-sm border border-white transition-colors hover:scale-125 ${
                p.is_active ? "bg-emerald-400 hover:bg-red-400" : "bg-gray-400 hover:bg-emerald-400"
              }`}
              title={p.is_active ? "Active — click to hide" : "Hidden — click to activate"}
            />
          </div>

          {/* Sale badge */}
          {p.sale_active && p.sale_price != null && (
            <span className="absolute bottom-2 left-2 bg-red-500 text-white text-[0.50rem] uppercase tracking-[0.10em] px-1.5 py-0.5 font-semibold z-10">
              Sale
            </span>
          )}

          {/* Stock badge */}
          <div className="absolute bottom-2 right-2 z-10">
            <StockBadge p={p} />
          </div>

          {/* Clone overlay on hover */}
          <div className={`absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center ${selected ? "pointer-events-none" : ""}`}>
            <button
              type="button"
              onClick={e => { e.preventDefault(); e.stopPropagation(); onClone(); }}
              disabled={cloneLoading}
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-gray-700 text-[0.48rem] uppercase tracking-[0.10em] px-2.5 py-1.5 flex items-center gap-1.5 shadow-md"
              title="Duplicate this product"
            >
              {cloneLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Copy className="h-3 w-3" />}
              Clone
            </button>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-1 mb-1.5">
          <span className={`inline-flex items-center px-1.5 py-0.5 text-[0.52rem] uppercase tracking-[0.06em] font-medium rounded-sm ${TYPE_BADGE[p.type] ?? ""}`}>
            {TYPE_LABELS[p.type] ?? p.type}
          </span>
          <SeoHealth title={p.seo_title} desc={p.seo_description} />
        </div>
        <Link to="/admin/products/$slug" params={{ slug: p.slug }}>
          <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight mb-1.5 hover:text-gray-600">
            {p.name}
          </p>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-900">
              {formatUSD(Number(p.base_price))}
            </span>
            {p.sale_active && p.sale_price != null && (
              <span className="ml-1 text-[0.55rem] text-red-500 line-through">{formatUSD(Number(p.base_price))}</span>
            )}
          </div>
          {p.size && <span className="text-[0.55rem] text-gray-400">{p.size}</span>}
        </div>
        {Array.isArray(p.tags) && p.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {p.tags.slice(0, 3).map((t: string) => (
              <span key={t} className="text-[0.50rem] bg-gray-100 text-gray-500 px-1 py-0.5 rounded-sm">{t}</span>
            ))}
            {p.tags.length > 3 && <span className="text-[0.50rem] text-gray-400">+{p.tags.length - 3}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Import Modal ─────────────────────────────────────────────────────────────

const IMPORT_TYPE_LABELS: Record<string, string> = {
  necklace: "Chain / Necklace", bracelet: "Bracelet", earring: "Earring", ring: "Ring",
};
const IMPORT_COLOR_LABELS: Record<string, string> = {
  gold: "Yellow Gold", rose_gold: "Rose Gold", white_gold: "White Gold", silver: "Sterling Silver",
};

interface ImportResult {
  name: string;
  rawName: string;
  shortDescription: string;
  description: string;
  seoDescription: string;
  sourcePagePreview: string;
  images: string[];
  sourceUrl: string;
  attributes: { name: string; value: string }[];
  detectedType: string | null;
  detectedColors: string[];
  detectedSizes: string[];
  detectedLengths: string[];
  stoneCount: number | null;
  caratWeight: string | null;
  stoneDiameter: string | null;
  stoneShape: string | null;
  metalPurity: string | null;
  chainType: string | null;
  clarity: string | null;
  colorGrade: string | null;
  supplierPrice: number | null;
  suggestedTags: string[];
  suggestedPrice: number | null;
  aiEnriched: boolean;
  confidence: "high" | "medium" | "low" | null;
}

const IS_SUPPLIER_URL = /alibaba\.com|aliexpress\.com|1688\.com|dhgate\.com|temu\.com|made-in-china\.com/i;

function ImportModal({ onClose, token }: { onClose: () => void; token: string }) {
  const [mode,          setMode]          = useState<"url" | "paste">("url");
  const [url,           setUrl]           = useState("");
  const [pastedHtml,    setPastedHtml]    = useState("");
  const [loadStep,      setLoadStep]      = useState<"idle" | "fetching" | "parsing" | "enriching" | "done">("idle");
  const [rehosting,     setRehosting]     = useState(false);
  const [rehostProgress,setRehostProgress]= useState<{ done: number; total: number } | null>(null);
  const [error,         setError]         = useState("");
  const [result,        setResult]        = useState<ImportResult | null>(null);
  const [selectedImgs,  setSelectedImgs]  = useState<string[]>([]);
  const inputRef    = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const importUrlFn  = useServerFn(importProductFromUrl);
  const importHtmlFn = useServerFn(importProductFromHtml);
  const importTextFn = useServerFn(importProductFromText);
  const rehostFn     = useServerFn(rehostImportImages);

  const loading = loadStep !== "idle" && loadStep !== "done";
  const isSupplierUrl = IS_SUPPLIER_URL.test(url);

  const analyze = async () => {
    setLoadStep("fetching"); setError(""); setResult(null); setSelectedImgs([]);
    try {
      let res: ImportResult;
      if (mode === "url") {
        if (!url.trim()) { setLoadStep("idle"); return; }
        // Show sequential step labels while the server processes
        const stepTimer = setTimeout(() => setLoadStep("parsing"), 3000);
        const enrichTimer = setTimeout(() => setLoadStep("enriching"), 7000);
        try {
          res = await importUrlFn({ data: { token, url: url.trim() } }) as ImportResult;
        } finally {
          clearTimeout(stepTimer); clearTimeout(enrichTimer);
        }
      } else {
        if (!pastedHtml.trim()) { setLoadStep("idle"); return; }
        setLoadStep("enriching");
        try {
          res = await importTextFn({ data: { token, text: pastedHtml.trim(), sourceUrl: url.trim() || undefined } }) as ImportResult;
        } finally {
          // nothing to clear
        }
      }
      setLoadStep("done");
      setResult(res);
      setSelectedImgs(res.images.slice(0, 24));
    } catch (e: any) {
      const msg: string = e?.message ?? "Failed";
      setLoadStep("idle");
      if (msg.startsWith("BLOCKED:")) {
        setMode("paste");
        setError(msg.replace("BLOCKED: ", ""));
      } else {
        setError(msg);
      }
    }
  };

  const toggleImage = (img: string) => {
    setSelectedImgs(prev =>
      prev.includes(img)
        ? prev.filter(x => x !== img)
        : [...prev, img]
    );
  };

  const makeCover = (img: string) => {
    setSelectedImgs(prev => [img, ...prev.filter(x => x !== img)]);
  };

  // Re-host all selected images to our CDN, then navigate to the new product form.
  const handleImport = async () => {
    if (!result) return;
    const cover = selectedImgs[0] ?? result.images[0] ?? "";
    const toRehost = selectedImgs.length > 0 ? selectedImgs : result.images.slice(0, 24);

    let finalImages = toRehost;
    let finalCover  = cover;

    if (toRehost.length > 0) {
      setRehosting(true);
      setRehostProgress({ done: 0, total: toRehost.length });
      try {
        // Rehost in batches of 5 so we can show progress
        const hosted: string[] = [];
        const map = new Map<string, string>();
        const batch = 5;
        for (let i = 0; i < toRehost.length; i += batch) {
          const chunk = toRehost.slice(i, i + batch);
          const { results } = await rehostFn({ data: { token, urls: chunk } });
          for (const r of results) {
            if (r.hosted) { hosted.push(r.hosted); map.set(r.original, r.hosted); }
            else hosted.push(r.original); // keep original if rehost failed for this one
          }
          setRehostProgress({ done: Math.min(i + batch, toRehost.length), total: toRehost.length });
        }
        finalImages = hosted;
        finalCover  = map.get(cover) ?? (hosted[0] ?? cover);
        const hosted_count = [...map.values()].length;
        if (hosted_count > 0) toast.success(`${hosted_count} image${hosted_count !== 1 ? "s" : ""} saved to your store's CDN`);
      } catch (e: any) {
        toast.error(`Image re-hosting failed: ${e?.message ?? "Unknown error"}. Images will use original URLs.`);
      } finally {
        setRehosting(false);
        setRehostProgress(null);
      }
    }

    sessionStorage.setItem("qj_product_import", JSON.stringify({
      name:             result.name,
      shortDescription: result.shortDescription,
      description:      result.description,
      seoDescription:   result.seoDescription,
      imageUrl:         finalCover,
      images:           finalImages,
      detectedType:     result.detectedType,
      detectedColors:   result.detectedColors,
      detectedSizes:    result.detectedSizes,
      detectedLengths:  result.detectedLengths,
      suggestedTags:    result.suggestedTags,
      suggestedPrice:   result.suggestedPrice,
      stoneShape:       result.stoneShape,
      metalPurity:      result.metalPurity,
      clarity:          result.clarity,
      colorGrade:       result.colorGrade,
      caratWeight:      result.caratWeight,
      stoneCount:       result.stoneCount,
    }));
    window.location.href = "/admin/products/new";
  };

  const hasVariantAxis = (result?.detectedColors.length ?? 0) > 1 || (result?.detectedSizes.length ?? 0) > 1 || (result?.detectedLengths.length ?? 0) > 1;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={rehosting ? undefined : onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-2xl bg-white shadow-2xl pointer-events-auto flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-900 flex items-center justify-center shrink-0">
                <Upload className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Smart Product Import</p>
                <p className="text-[0.60rem] text-gray-400">Images re-hosted to your CDN · source never visible to customers</p>
              </div>
            </div>
            {!rehosting && (
              <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Mode tabs */}
          <div className="flex border-b border-gray-100 shrink-0">
            <button
              onClick={() => { setMode("url"); setError(""); setResult(null); setSelectedImgs([]); setLoadStep("idle"); }}
              className={`flex-1 py-2.5 text-[0.60rem] uppercase tracking-[0.14em] transition-colors ${mode === "url" ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-700"}`}
            >
              Auto-Fetch from URL
            </button>
            <button
              onClick={() => { setMode("paste"); setError(""); setResult(null); setSelectedImgs([]); setLoadStep("idle"); }}
              className={`flex-1 py-2.5 text-[0.60rem] uppercase tracking-[0.14em] transition-colors ${mode === "paste" ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-700"}`}
            >
              Paste Product Info
            </button>
          </div>

          {/* AI step progress */}
          {loading && (
            <div className="shrink-0 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-0 px-6 py-3">
                {(["fetching", "parsing", "enriching"] as const).map((step, i, arr) => {
                  const labels = { fetching: "Fetching page", parsing: "Parsing specs", enriching: "AI enriching" };
                  const icons  = { fetching: "🔗", parsing: "🔍", enriching: "✨" };
                  const stepOrder = arr.indexOf(loadStep as any);
                  const done   = i < stepOrder;
                  const active = step === loadStep;
                  return (
                    <div key={step} className="flex items-center">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.58rem] font-medium transition-all ${
                        active ? "bg-gray-900 text-white" : done ? "bg-emerald-50 text-emerald-600" : "text-gray-300"
                      }`}>
                        <span>{done ? "✓" : icons[step]}</span>
                        <span className="uppercase tracking-[0.10em]">{labels[step]}</span>
                        {active && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      </div>
                      {i < arr.length - 1 && <div className={`w-6 h-px mx-1 ${done ? "bg-emerald-300" : "bg-gray-200"}`} />}
                    </div>
                  );
                })}
              </div>
              {loadStep === "enriching" && (
                <p className="px-6 pb-2 text-[0.57rem] text-amber-600">
                  ✨ GPT-4o is rewriting your product copy for luxury retail — this takes 3–8 seconds…
                </p>
              )}
            </div>
          )}

          {/* Re-hosting progress */}
          {rehosting && (
            <div className="px-6 py-5 bg-blue-50 border-b border-blue-100 shrink-0">
              <div className="flex items-center gap-3 mb-3">
                <CloudUpload className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-800">Saving images to your store's CDN…</p>
                  <p className="text-[0.60rem] text-blue-500 mt-0.5">Supplier URLs are being replaced — customers will never see where these came from.</p>
                </div>
              </div>
              {rehostProgress && (
                <>
                  <div className="w-full bg-blue-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${Math.round((rehostProgress.done / rehostProgress.total) * 100)}%` }} />
                  </div>
                  <p className="text-[0.58rem] text-blue-500 mt-1.5 text-right">{rehostProgress.done} / {rehostProgress.total} images</p>
                </>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 space-y-5">

            {/* URL mode */}
            {mode === "url" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[0.58rem] uppercase tracking-[0.16em] text-gray-400 mb-2">Product URL</label>
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      value={url}
                      onChange={e => { setUrl(e.target.value); setError(""); setResult(null); setSelectedImgs([]); }}
                      onKeyDown={e => e.key === "Enter" && analyze()}
                      placeholder="https://www.supplier.com/product/..."
                      disabled={loading || rehosting}
                      className="flex-1 border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors bg-white font-mono disabled:opacity-50"
                    />
                    <button
                      onClick={analyze}
                      disabled={loading || rehosting || !url.trim()}
                      className="px-5 py-2.5 bg-gray-900 text-white text-[0.62rem] uppercase tracking-[0.14em] hover:bg-gray-700 transition-colors disabled:opacity-40 shrink-0 flex items-center gap-2"
                    >
                      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      {loadStep === "fetching" ? "Fetching…" : loadStep === "parsing" ? "Parsing…" : loadStep === "enriching" ? "AI Enriching…" : "Fetch"}
                    </button>
                  </div>
                </div>
                {isSupplierUrl && !result && !loading && (
                  <div className="bg-emerald-50 border border-emerald-200 px-4 py-3 text-[0.65rem] text-emerald-800 leading-relaxed">
                    <span className="font-semibold">Supplier URL detected</span> — using enhanced fetch to bypass bot detection automatically.
                  </div>
                )}
              </div>
            )}

            {/* Paste-text mode */}
            {mode === "paste" && (
              <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-200 px-4 py-3 text-[0.65rem] text-gray-700 leading-relaxed">
                  <p className="font-semibold mb-1">Can't auto-fetch? Paste any product text instead:</p>
                  <p className="text-gray-500">Copy the product title, description, and specs from the supplier page — no HTML or technical knowledge needed. GPT-4o will extract everything.</p>
                </div>
                <div>
                  <label className="block text-[0.58rem] uppercase tracking-[0.16em] text-gray-400 mb-1.5">Product URL <span className="normal-case tracking-normal text-gray-300">(optional — helps with image import)</span></label>
                  <input
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://www.supplier.com/product/... (optional)"
                    disabled={loading || rehosting}
                    className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400 bg-white font-mono disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-[0.58rem] uppercase tracking-[0.16em] text-gray-400 mb-1.5">
                    Product Text {pastedHtml.length > 0 && <span className="normal-case tracking-normal text-emerald-600 font-medium">✓ {pastedHtml.length} characters</span>}
                  </label>
                  <textarea
                    ref={textareaRef}
                    value={pastedHtml}
                    onChange={e => { setPastedHtml(e.target.value); setError(""); setResult(null); setSelectedImgs([]); }}
                    placeholder={"Paste product title, description, specs, materials — anything from the supplier page…"}
                    disabled={loading || rehosting}
                    rows={6}
                    className="w-full border border-gray-200 px-3 py-2.5 text-[0.65rem] text-gray-600 focus:outline-none focus:border-gray-400 bg-white font-mono resize-none disabled:opacity-50"
                  />
                </div>
                <button
                  onClick={analyze}
                  disabled={loading || rehosting || pastedHtml.trim().length < 30}
                  className="w-full py-2.5 bg-gray-900 text-white text-[0.62rem] uppercase tracking-[0.14em] hover:bg-gray-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {loadStep === "enriching" ? "AI Enriching…" : loading ? "Analyzing…" : "Analyze with AI"}
                </button>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-red-700">Import failed</p>
                  <p className="text-[0.65rem] text-red-500 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* AI enrichment status banner */}
                {result.aiEnriched && (
                  <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="text-[0.64rem] font-semibold text-amber-800 uppercase tracking-[0.1em]">AI Enriched by GPT-4o</span>
                    </div>
                    {result.confidence && (
                      <span className={`text-[0.58rem] uppercase tracking-[0.12em] font-bold px-2.5 py-1 rounded-full border ${
                        result.confidence === "high"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                          : result.confidence === "medium"
                          ? "bg-amber-100 text-amber-700 border-amber-300"
                          : "bg-gray-100 text-gray-600 border-gray-300"
                      }`}>
                        {result.confidence} confidence
                      </span>
                    )}
                  </div>
                )}

                {/* Generated title */}
                <div className="bg-gray-50 border border-gray-100 p-4">
                  <p className="text-[0.56rem] uppercase tracking-[0.14em] text-gray-400 mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-amber-500" /> Generated Store Title
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {result.name || <span className="text-gray-400 italic">No title detected</span>}
                  </p>
                  {result.rawName && result.rawName !== result.name && (
                    <p className="text-[0.60rem] text-gray-400 mt-1.5 line-clamp-1">
                      Supplier original: <span className="line-through decoration-gray-300 italic">{result.rawName.slice(0, 100)}</span>
                    </p>
                  )}
                  {result.seoDescription && (
                    <p className="text-[0.60rem] text-blue-600 mt-2 italic leading-relaxed line-clamp-2">
                      SEO: {result.seoDescription}
                    </p>
                  )}
                </div>

                {/* Intelligence panel: all detected signals */}
                <div className="bg-emerald-50 border border-emerald-100 p-4 space-y-3">
                  <p className="text-[0.56rem] uppercase tracking-[0.14em] text-emerald-700 flex items-center gap-1.5">
                    <Layers className="h-3 w-3" /> Extracted Product Intelligence
                  </p>

                  {/* Core attributes row */}
                  <div className="flex flex-wrap gap-1.5">
                    {result.detectedType && (
                      <span className="px-2.5 py-1 bg-white border border-emerald-200 text-emerald-700 text-[0.62rem] font-medium">
                        Type: {IMPORT_TYPE_LABELS[result.detectedType] ?? result.detectedType}
                      </span>
                    )}
                    {result.stoneShape && (
                      <span className="px-2.5 py-1 bg-white border border-blue-200 text-blue-700 text-[0.62rem] font-medium capitalize">
                        {result.stoneShape} cut
                      </span>
                    )}
                    {result.metalPurity && (
                      <span className="px-2.5 py-1 bg-white border border-yellow-200 text-yellow-700 text-[0.62rem] font-bold">
                        {result.metalPurity}
                      </span>
                    )}
                    {result.clarity && (
                      <span className="px-2.5 py-1 bg-white border border-purple-200 text-purple-700 text-[0.62rem] font-medium">
                        {result.clarity} clarity
                      </span>
                    )}
                    {result.colorGrade && (
                      <span className="px-2.5 py-1 bg-white border border-purple-200 text-purple-700 text-[0.62rem] font-medium">
                        Color {result.colorGrade}
                      </span>
                    )}
                    {result.detectedColors.map(c => (
                      <span key={c} className="px-2.5 py-1 bg-white border border-emerald-200 text-emerald-700 text-[0.62rem] font-medium">
                        {IMPORT_COLOR_LABELS[c] ?? c}
                      </span>
                    ))}
                    {result.detectedSizes.map(s => (
                      <span key={s} className="px-2.5 py-1 bg-white border border-emerald-200 text-emerald-700 text-[0.62rem] font-medium">
                        Size {s}
                      </span>
                    ))}
                    {result.detectedLengths.map(l => (
                      <span key={l} className="px-2.5 py-1 bg-white border border-emerald-200 text-emerald-700 text-[0.62rem] font-medium">
                        {l}
                      </span>
                    ))}
                  </div>

                  {/* Extended signals */}
                  {(result.stoneCount || result.caratWeight || result.stoneDiameter || result.chainType) && (
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-100">
                      {result.stoneCount && (
                        <div className="flex items-center gap-2 text-[0.65rem] text-emerald-700">
                          <Hash className="h-3 w-3 shrink-0" />
                          <span><strong>{result.stoneCount}</strong> stones detected</span>
                        </div>
                      )}
                      {result.caratWeight && (
                        <div className="flex items-center gap-2 text-[0.65rem] text-emerald-700">
                          <Weight className="h-3 w-3 shrink-0" />
                          <span><strong>{result.caratWeight}</strong> total weight</span>
                        </div>
                      )}
                      {result.stoneDiameter && (
                        <div className="flex items-center gap-2 text-[0.65rem] text-emerald-700">
                          <span className="h-3 w-3 shrink-0 text-center text-[0.6rem] font-bold">⌀</span>
                          <span><strong>{result.stoneDiameter}</strong> per stone</span>
                        </div>
                      )}
                      {result.chainType && (
                        <div className="flex items-center gap-2 text-[0.65rem] text-emerald-700">
                          <Link2 className="h-3 w-3 shrink-0" />
                          <span><strong className="capitalize">{result.chainType.replace("-", " ")}</strong> style</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggested retail price */}
                  {result.suggestedPrice && (
                    <div className="flex items-center gap-2 pt-1 border-t border-emerald-100">
                      <Tag className="h-3 w-3 text-emerald-600 shrink-0" />
                      <p className="text-[0.65rem] text-emerald-700">
                        Suggested retail: <strong>${result.suggestedPrice}</strong> (based on detected type × metal)
                      </p>
                    </div>
                  )}

                  {hasVariantAxis && (
                    <p className="text-[0.60rem] text-emerald-600 bg-white border border-emerald-200 px-2.5 py-1.5">
                      Multiple options on one axis — variant pricing will be pre-enabled on the product form.
                    </p>
                  )}
                </div>

                {/* Supplier cost panel — admin eyes only */}
                {result.supplierPrice && (
                  <div className="border border-dashed border-gray-300 bg-gray-900 p-4 space-y-2">
                    <p className="text-[0.56rem] uppercase tracking-[0.14em] text-gray-400 flex items-center gap-1.5">
                      <Tag className="h-3 w-3 text-amber-400" />
                      <span className="text-amber-400">Admin Only</span> — Supplier Cost Intelligence
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-800 rounded p-2.5 text-center">
                        <p className="text-[0.52rem] uppercase tracking-[0.10em] text-gray-500 mb-1">Supplier Cost</p>
                        <p className="text-base font-bold text-white">${result.supplierPrice.toFixed(2)}</p>
                      </div>
                      <div className="bg-gray-800 rounded p-2.5 text-center">
                        <p className="text-[0.52rem] uppercase tracking-[0.10em] text-gray-500 mb-1">4× Markup</p>
                        <p className="text-base font-bold text-amber-400">${(result.supplierPrice * 4).toFixed(2)}</p>
                      </div>
                      <div className="bg-gray-800 rounded p-2.5 text-center">
                        <p className="text-[0.52rem] uppercase tracking-[0.10em] text-gray-500 mb-1">8× Markup</p>
                        <p className="text-base font-bold text-emerald-400">${(result.supplierPrice * 8).toFixed(2)}</p>
                      </div>
                    </div>
                    <p className="text-[0.57rem] text-gray-500">
                      Supplier pricing extracted from product page. These figures are never shown to customers.
                    </p>
                  </div>
                )}

                {/* Source privacy badge */}
                <div className="flex items-center gap-2.5 bg-gray-900 text-white px-4 py-2.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <p className="text-[0.60rem]">
                    <strong>Source protection:</strong> All {result.images.length} images will be re-hosted on your own CDN before saving —
                    no supplier URLs will ever reach your customers.
                  </p>
                </div>

                {/* Image multi-select grid */}
                {result.images.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[0.56rem] uppercase tracking-[0.14em] text-gray-400">
                        Images — {selectedImgs.length}/{result.images.length} selected · first = cover
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedImgs(result.images.slice(0, 24))}
                          className="text-[0.55rem] uppercase tracking-[0.1em] text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          All
                        </button>
                        <span className="text-gray-200">|</span>
                        <button
                          type="button"
                          onClick={() => setSelectedImgs([])}
                          className="text-[0.55rem] uppercase tracking-[0.1em] text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          None
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {result.images.map((img, i) => {
                        const isSelected = selectedImgs.includes(img);
                        const isCover = selectedImgs[0] === img;
                        return (
                          <div key={i} className="relative group">
                            <button
                              type="button"
                              onClick={() => toggleImage(img)}
                              className={`w-full aspect-square border-2 overflow-hidden transition-all relative block ${
                                isCover
                                  ? "border-amber-500 ring-1 ring-amber-300"
                                  : isSelected
                                  ? "border-emerald-500 ring-1 ring-emerald-300"
                                  : "border-gray-200 opacity-50 hover:opacity-80 hover:border-gray-400"
                              }`}
                            >
                              <img
                                src={img}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).src = "/main.jpg"; }}
                              />
                              {isSelected && (
                                <span className="absolute top-1 right-1 bg-emerald-500 rounded-full w-4 h-4 flex items-center justify-center">
                                  <Check className="h-2.5 w-2.5 text-white" />
                                </span>
                              )}
                              {isCover && (
                                <span className="absolute bottom-0 left-0 right-0 bg-amber-500 text-white text-[0.45rem] uppercase tracking-wider text-center py-0.5 font-semibold">
                                  Cover
                                </span>
                              )}
                            </button>
                            {isSelected && !isCover && (
                              <button
                                type="button"
                                onClick={() => makeCover(img)}
                                className="absolute top-1 left-1 bg-black/60 text-white text-[0.45rem] uppercase px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Make cover
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[0.57rem] text-gray-400 mt-2">Click to toggle selection · hover to set cover image</p>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-100 px-4 py-3 flex items-center gap-2.5">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    <p className="text-[0.65rem] text-amber-700">No images found. Add them manually in the editor.</p>
                  </div>
                )}

                {/* Auto-generated tags */}
                {result.suggestedTags.length > 0 && (
                  <div className="bg-gray-50 border border-gray-100 p-4">
                    <p className="text-[0.56rem] uppercase tracking-[0.14em] text-gray-400 mb-2 flex items-center gap-1.5">
                      <Tag className="h-3 w-3" /> Auto-Generated Tags
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.suggestedTags.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-600 text-[0.60rem] font-mono">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generated copy preview */}
                <div className="bg-emerald-50 border border-emerald-100 p-4">
                  <p className="text-[0.56rem] uppercase tracking-[0.14em] text-emerald-700 mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" /> Generated Description Preview
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line line-clamp-5">{result.description}</p>
                  <p className="text-[0.58rem] text-emerald-600 mt-2">
                    Written from detected specs — zero supplier language will appear in your listing.
                  </p>
                </div>

                {/* Specs (collapsed by default) */}
                {result.attributes.length > 0 && (
                  <details className="group">
                    <summary className="text-[0.56rem] uppercase tracking-[0.14em] text-gray-400 cursor-pointer hover:text-gray-600 transition-colors flex items-center gap-1.5">
                      <ListChecks className="h-3 w-3" /> Scraped Specs ({result.attributes.length}) — for your reference only
                    </summary>
                    <div className="mt-3 bg-gray-50 border border-gray-100 p-4">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 max-h-36 overflow-y-auto">
                        {result.attributes.map(a => (
                          <div key={a.name} className="flex items-baseline gap-1.5 text-xs">
                            <span className="text-gray-400 shrink-0">{a.name}:</span>
                            <span className="text-gray-700 truncate">{a.value}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[0.58rem] text-gray-400 mt-2.5">Brand/supplier/origin fields excluded automatically.</p>
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
            <button
              onClick={onClose}
              disabled={rehosting}
              className="text-[0.62rem] uppercase tracking-[0.14em] text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-30"
            >
              Cancel
            </button>
            {result && (
              <button
                onClick={handleImport}
                disabled={rehosting || selectedImgs.length === 0 && result.images.length > 0}
                className="px-5 py-2.5 bg-gray-900 text-white text-[0.62rem] uppercase tracking-[0.14em] hover:bg-gray-700 transition-colors disabled:opacity-40 flex items-center gap-2"
              >
                {rehosting
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Re-hosting images…</>
                  : <><CloudUpload className="h-3.5 w-3.5" /> Save to Store & Create Product</>
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Delete All Modal ─────────────────────────────────────────────────────────

function DeleteAllModal({ onClose, onConfirm, loading }: { onClose: () => void; onConfirm: () => void; loading: boolean }) {
  const [confirm, setConfirm] = useState("");
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-md bg-white shadow-2xl pointer-events-auto" onClick={e => e.stopPropagation()}>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Delete All Products</h2>
                <p className="text-xs text-gray-500 mt-1">
                  This permanently deletes every product in your catalog.
                </p>
              </div>
            </div>
            <div>
              <label className="block text-[0.60rem] uppercase tracking-[0.14em] text-gray-400 mb-1.5">
                Type <strong className="text-gray-700">DELETE ALL</strong> to confirm
              </label>
              <input
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="DELETE ALL"
                autoFocus
                className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 transition-colors"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 text-[0.65rem] uppercase tracking-[0.12em] hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={confirm !== "DELETE ALL" || loading}
                className="flex-1 bg-red-600 text-white py-2.5 text-[0.65rem] uppercase tracking-[0.12em] hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {loading ? "Deleting…" : "Delete Everything"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Status Filter Pill ───────────────────────────────────────────────────────

function FilterPill({
  label, icon: Icon, active, onClick, count,
}: {
  label: string;
  icon?: React.ElementType;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.58rem] uppercase tracking-[0.10em] font-medium border transition-all whitespace-nowrap ${
        active
          ? "bg-gray-900 text-white border-gray-900"
          : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
      }`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
      {count !== undefined && (
        <span className={`text-[0.50rem] rounded-full px-1.5 py-0.5 font-semibold ${
          active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function AdminProducts() {
  const token = useAdminToken();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // View mode
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window === "undefined") return "grid";
    return (localStorage.getItem("qj_admin_products_view") as "grid" | "list") ?? "grid";
  });

  // Filters & sort
  const [activeType,    setActiveType]    = useState("all");
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState<StatusFilter>("all");
  const [sortField,     setSortField]     = useState<SortField>("sort_order");
  const [sortDir,       setSortDir]       = useState<SortDir>("asc");
  const [showSortMenu,  setShowSortMenu]  = useState(false);
  const [showFilters,   setShowFilters]   = useState(false);

  // Selection
  const [selected,      setSelected]      = useState<Set<string>>(new Set());
  const [bulkLoading,   setBulkLoading]   = useState(false);
  const [showBulkMenu,  setShowBulkMenu]  = useState(false);

  // Modals
  const [showImport,    setShowImport]    = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);

  // Inline quick-edit loading state (keyed by slug)
  const [quickLoading,  setQuickLoading]  = useState<Set<string>>(new Set());
  const [cloneLoading,  setCloneLoading]  = useState<string | null>(null);

  const changeView = (mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("qj_admin_products_view", mode);
  };

  // Server functions
  const fetchProducts  = useServerFn(listAdminProductsAll);
  const bulkUpdateFn   = useServerFn(bulkUpdateProducts);
  const bulkDeleteFn   = useServerFn(bulkDeleteProducts);
  const deleteAllFn    = useServerFn(deleteAllProducts);
  const duplicateFn    = useServerFn(duplicateProduct);
  const quickUpdateFn  = useServerFn(quickUpdateProduct);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-products", token],
    queryFn:  () => fetchProducts({ data: { token } }),
    staleTime: 2 * 60 * 1000,
  });

  const products = (data?.products ?? []) as any[];

  // Derived counts for stat chips
  const counts = useMemo(() => ({
    total:    products.length,
    active:   products.filter(p => p.is_active).length,
    hidden:   products.filter(p => !p.is_active).length,
    featured: products.filter(p => p.is_featured).length,
    sale:     products.filter(p => p.sale_active && p.sale_price != null).length,
    low_stock: products.filter(p => p.track_inventory && p.stock_quantity != null && p.stock_quantity > 0 && p.stock_quantity <= 5).length,
    oos:      products.filter(p => p.track_inventory && p.stock_quantity === 0).length,
    no_seo:   products.filter(p => !p.seo_title?.trim() || !p.seo_description?.trim()).length,
    no_images: products.filter(p => !p.image_url?.trim()).length,
  }), [products]);

  // Type counts
  const typeCounts = useMemo(() => TYPE_TABS.reduce<Record<string, number>>((acc, t) => {
    acc[t] = t === "all" ? products.length : products.filter(p => p.type === t).length;
    return acc;
  }, {}), [products]);

  // Filtered + sorted products
  const filtered = useMemo(() => {
    let list = products;
    // Type filter
    if (activeType !== "all") list = list.filter(p => p.type === activeType);
    // Text search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.color ?? "").toLowerCase().includes(q) ||
        (p.tags ?? []).some((t: string) => t.toLowerCase().includes(q))
      );
    }
    // Status filter
    list = applyStatusFilter(list, statusFilter);
    // Sort
    list = sortProducts(list, sortField, sortDir);
    return list;
  }, [products, activeType, search, statusFilter, sortField, sortDir]);

  const allFilteredSlugs = filtered.map(p => p.slug);
  const allSelected = allFilteredSlugs.length > 0 && allFilteredSlugs.every(s => selected.has(s));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => { const n = new Set(prev); allFilteredSlugs.forEach(s => n.delete(s)); return n; });
    } else {
      setSelected(prev => new Set([...prev, ...allFilteredSlugs]));
    }
  };

  const toggleOne = (slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(prev => { const n = new Set(prev); n.has(slug) ? n.delete(slug) : n.add(slug); return n; });
  };

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-products", token] });
    refetch();
  }, [queryClient, token, refetch]);

  // Bulk actions
  const doBulkUpdate = async (updates: { is_active?: boolean; is_featured?: boolean }) => {
    setBulkLoading(true); setShowBulkMenu(false);
    try {
      await bulkUpdateFn({ data: { token, slugs: [...selected], updates } });
      toast.success(`Updated ${selected.size} products`);
      setSelected(new Set());
      await invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Bulk update failed");
    } finally { setBulkLoading(false); }
  };

  const doBulkDelete = async () => {
    if (!confirm(`Permanently delete ${selected.size} product${selected.size !== 1 ? "s" : ""}?`)) return;
    setBulkLoading(true); setShowBulkMenu(false);
    try {
      await bulkDeleteFn({ data: { token, slugs: [...selected] } });
      toast.success(`Deleted ${selected.size} products`);
      setSelected(new Set());
      await invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Delete failed");
    } finally { setBulkLoading(false); }
  };

  const doDeleteAll = async () => {
    setDeleteAllLoading(true);
    try {
      await deleteAllFn({ data: { token } });
      toast.success("All products deleted.");
      setShowDeleteAll(false);
      setSelected(new Set());
      await invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Delete failed");
    } finally { setDeleteAllLoading(false); }
  };

  // Quick inline toggle (active/featured)
  const doQuickUpdate = useCallback(async (slug: string, updates: { is_active?: boolean; is_featured?: boolean }) => {
    setQuickLoading(prev => new Set([...prev, slug]));
    // Optimistic update in local state via query cache mutation
    queryClient.setQueryData(["admin-products", token], (old: any) => {
      if (!old?.products) return old;
      return { ...old, products: old.products.map((p: any) => p.slug === slug ? { ...p, ...updates } : p) };
    });
    try {
      await quickUpdateFn({ data: { token, slug, ...updates } });
    } catch (e: any) {
      toast.error(e?.message ?? "Update failed");
      await invalidate(); // Revert on error
    } finally {
      setQuickLoading(prev => { const n = new Set(prev); n.delete(slug); return n; });
    }
  }, [token, quickUpdateFn, queryClient, invalidate]);

  // Clone product
  const doClone = useCallback(async (slug: string) => {
    setCloneLoading(slug);
    try {
      const res = await duplicateFn({ data: { token, slug } });
      toast.success(`Cloned → ${res.newSlug}`);
      await invalidate();
      navigate({ to: "/admin/products/$slug", params: { slug: res.newSlug } });
    } catch (e: any) {
      toast.error(e?.message ?? "Clone failed");
    } finally { setCloneLoading(null); }
  }, [token, duplicateFn, invalidate, navigate]);

  // CSV export
  const doExport = useCallback(() => {
    const toExport = someSelected ? filtered.filter(p => selected.has(p.slug)) : filtered;
    exportToCSV(toExport, `products-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(`Exported ${toExport.length} products`);
  }, [filtered, selected, someSelected]);

  // Current sort label
  const currentSort = SORT_OPTIONS.find(o => o.field === sortField && o.dir === sortDir) ?? SORT_OPTIONS[0];

  const activeSortIdx = SORT_OPTIONS.findIndex(o => o.field === sortField && o.dir === sortDir);

  return (
    <>
      {showImport && <ImportModal token={token} onClose={() => setShowImport(false)} />}
      {showDeleteAll && (
        <DeleteAllModal
          onClose={() => setShowDeleteAll(false)}
          onConfirm={doDeleteAll}
          loading={deleteAllLoading}
        />
      )}

      {/* Close dropdowns when clicking outside */}
      {(showSortMenu || showBulkMenu) && (
        <div className="fixed inset-0 z-10" onClick={() => { setShowSortMenu(false); setShowBulkMenu(false); }} />
      )}

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Products</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {counts.active} active · {counts.hidden} hidden · {counts.featured} featured
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={doExport}
              className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-600 px-2.5 py-2 text-[0.60rem] uppercase tracking-[0.10em] hover:border-gray-400 hover:text-gray-900 transition-colors"
              title={someSelected ? "Export selected products to CSV" : "Export all filtered products to CSV"}
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{someSelected ? `Export (${selected.size})` : "Export CSV"}</span>
            </button>
            <button
              onClick={() => setShowDeleteAll(true)}
              className="inline-flex items-center gap-1.5 border border-red-200 text-red-500 px-2.5 py-2 text-[0.60rem] uppercase tracking-[0.10em] hover:border-red-400 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Delete All</span>
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-600 px-2.5 py-2 text-[0.60rem] uppercase tracking-[0.10em] hover:border-gray-400 hover:text-gray-900 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Import URL</span>
              <span className="sm:hidden">Import</span>
            </button>
            <Link
              to="/admin/products/new"
              className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-3 py-2 text-[0.62rem] uppercase tracking-[0.12em] hover:bg-gray-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Product</span>
              <span className="sm:hidden">New</span>
            </Link>
          </div>
        </div>

        {/* Clickable stat chips */}
        <div className="flex flex-wrap gap-2.5 mb-4">
          {[
            { label: "Total",     value: counts.total,    filter: "all"     as StatusFilter, accent: false },
            { label: "Active",    value: counts.active,   filter: "active"  as StatusFilter, accent: false },
            { label: "Hidden",    value: counts.hidden,   filter: "hidden"  as StatusFilter, accent: false },
            { label: "Featured",  value: counts.featured, filter: "featured"as StatusFilter, accent: true  },
          ].map(({ label, value, filter, accent }) => {
            const active = statusFilter === filter;
            return (
              <button
                key={label}
                onClick={() => setStatusFilter(statusFilter === filter ? "all" : filter)}
                className={`px-5 py-3 border transition-all text-left ${
                  active
                    ? accent
                      ? "bg-amber-50 border-amber-400"
                      : "bg-gray-900 border-gray-900"
                    : accent
                      ? "bg-white border-amber-200 hover:border-amber-400"
                      : "bg-white border-gray-100 hover:border-gray-300"
                }`}
              >
                <p className={`text-[0.56rem] uppercase tracking-[0.16em] mb-0.5 ${active ? (accent ? "text-amber-700" : "text-gray-300") : (accent ? "text-amber-500" : "text-gray-400")}`}>{label}</p>
                <p className={`text-lg font-semibold ${active ? (accent ? "text-amber-700" : "text-white") : (accent ? "text-amber-600" : "text-gray-900")}`}>{value}</p>
              </button>
            );
          })}
        </div>

        {/* Advanced filter chips (collapsible) */}
        <div className="mb-5">
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`inline-flex items-center gap-2 text-[0.60rem] uppercase tracking-[0.12em] transition-colors ${
              showFilters || (statusFilter !== "all" && !["active","hidden","featured"].includes(statusFilter))
                ? "text-gray-900"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <Filter className="h-3 w-3" />
            Advanced Filters
            {!["all","active","hidden","featured"].includes(statusFilter) && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
            <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>

          {showFilters && (
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { id: "sale",      label: "On Sale",      icon: Tag,        count: counts.sale },
                { id: "low_stock", label: "Low Stock",    icon: TrendingDown, count: counts.low_stock },
                { id: "oos",       label: "Out of Stock", icon: XCircle,    count: counts.oos },
                { id: "no_seo",    label: "Missing SEO",  icon: AlertCircle, count: counts.no_seo },
                { id: "no_images", label: "No Images",    icon: ImageOff,   count: counts.no_images },
              ].map(({ id, label, icon, count }) => (
                <FilterPill
                  key={id}
                  label={label}
                  icon={icon}
                  active={statusFilter === id}
                  onClick={() => setStatusFilter(statusFilter === id ? "all" : id as StatusFilter)}
                  count={count}
                />
              ))}
              {statusFilter !== "all" && (
                <button
                  onClick={() => setStatusFilter("all")}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[0.58rem] uppercase tracking-[0.10em] text-gray-400 hover:text-gray-700 border border-gray-200 hover:border-gray-400 transition-colors"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Main panel */}
        <div className="bg-white border border-gray-100">
          {/* Type tabs */}
          <div className="border-b border-gray-100 overflow-x-auto">
            <div className="flex px-2 min-w-max">
              {TYPE_TABS.map(t => (
                <button
                  key={t}
                  onClick={() => { setActiveType(t); setSelected(new Set()); }}
                  className={`px-4 py-3.5 text-[0.65rem] uppercase tracking-[0.12em] font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeType === t ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700"
                  }`}
                >
                  {t === "all" ? "All" : TYPE_LABELS[t]}
                  {typeCounts[t] > 0 && <span className="ml-1 text-gray-300">({typeCounts[t]})</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Toolbar */}
          <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 flex-wrap">
            {/* Search */}
            <Search className="h-4 w-4 text-gray-300 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, slug, color, or tag…"
              className="flex-1 min-w-[180px] text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-xs text-gray-300 hover:text-gray-500">Clear</button>
            )}

            {/* Sort dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowSortMenu(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 text-[0.60rem] uppercase tracking-[0.10em] border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors"
              >
                <ArrowUpDown className="h-3 w-3" />
                {currentSort.label}
                <ChevronDown className="h-3 w-3" />
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 shadow-lg z-20">
                  {SORT_OPTIONS.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => { setSortField(opt.field); setSortDir(opt.dir); setShowSortMenu(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-xs text-left hover:bg-gray-50 transition-colors ${
                        sortField === opt.field && sortDir === opt.dir ? "text-gray-900 font-medium bg-gray-50" : "text-gray-600"
                      }`}
                    >
                      {opt.label}
                      {sortField === opt.field && sortDir === opt.dir && (
                        <Check className="h-3 w-3 text-gray-700" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View mode */}
            <div className="flex items-center border border-gray-200 shrink-0">
              <button
                onClick={() => changeView("grid")}
                title="Grid view"
                className={`p-2 transition-colors ${viewMode === "grid" ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-700"}`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => changeView("list")}
                title="List view"
                className={`p-2 transition-colors ${viewMode === "list" ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-700"}`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Bulk actions */}
            {someSelected && (
              <div className="flex items-center gap-2 pl-3 border-l border-gray-100 shrink-0 relative">
                <span className="text-[0.60rem] text-gray-500">{selected.size} selected</span>
                <div className="relative">
                  <button
                    onClick={() => setShowBulkMenu(v => !v)}
                    disabled={bulkLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[0.60rem] uppercase tracking-[0.10em] border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors disabled:opacity-40"
                  >
                    Actions <ChevronDown className="h-3 w-3" />
                  </button>
                  {showBulkMenu && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 shadow-lg z-20 divide-y divide-gray-50">
                      <button onClick={() => doBulkUpdate({ is_active: true })}    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left hover:bg-gray-50"><Eye     className="h-3.5 w-3.5 text-emerald-500" /> Activate</button>
                      <button onClick={() => doBulkUpdate({ is_active: false })}   className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left hover:bg-gray-50"><EyeOff  className="h-3.5 w-3.5 text-gray-400" /> Hide</button>
                      <button onClick={() => doBulkUpdate({ is_featured: true })}  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left hover:bg-gray-50"><Star    className="h-3.5 w-3.5 text-amber-500" /> Feature</button>
                      <button onClick={() => doBulkUpdate({ is_featured: false })} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left hover:bg-gray-50"><Star    className="h-3.5 w-3.5 text-gray-300" /> Unfeature</button>
                      <button onClick={doExport}                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left hover:bg-gray-50"><Download className="h-3.5 w-3.5 text-blue-500" /> Export Selected</button>
                      <button onClick={doBulkDelete}                               className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left hover:bg-red-50 text-red-600"><Trash2 className="h-3.5 w-3.5" /> Delete Selected</button>
                    </div>
                  )}
                </div>
                <button onClick={() => setSelected(new Set())} className="text-[0.58rem] text-gray-400 hover:text-gray-600 uppercase tracking-[0.08em] transition-colors">
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-100 mb-2" />
                  <div className="h-3 bg-gray-100 rounded mb-1.5 w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="px-6 py-20 text-center">
              <div className="w-16 h-16 bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-7 w-7 text-red-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">Couldn't load products</p>
              <p className="text-xs text-gray-400 mb-6 max-w-md mx-auto">{(error as any)?.message ?? "Something went wrong talking to the server."}</p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2.5 text-[0.65rem] uppercase tracking-[0.14em] hover:border-gray-400 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="w-16 h-16 bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
                <Package className="h-7 w-7 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">No products yet</p>
              <p className="text-xs text-gray-400 mb-6">Your catalog is empty. Add your first product or import one from a URL.</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={() => setShowImport(true)}
                  className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2.5 text-[0.65rem] uppercase tracking-[0.14em] hover:border-gray-400 transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" /> Import from URL
                </button>
                <Link
                  to="/admin/products/new"
                  className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 text-[0.65rem] uppercase tracking-[0.14em] hover:bg-gray-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Product
                </Link>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-gray-400 mb-3">No products match your filter.</p>
              <button
                onClick={() => { setSearch(""); setActiveType("all"); setStatusFilter("all"); }}
                className="text-[0.65rem] uppercase tracking-[0.14em] text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-2 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* ── GRID VIEW ── */
            <div className="p-3 sm:p-5">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <button onClick={toggleAll} className="flex items-center gap-2 text-[0.60rem] uppercase tracking-[0.10em] text-gray-400 hover:text-gray-700 transition-colors">
                  {allSelected
                    ? <CheckSquare className="h-4 w-4 text-blue-600" />
                    : <Square className="h-4 w-4" />
                  }
                  {allSelected ? "Deselect all" : `Select all (${filtered.length})`}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {filtered.map(p => (
                  <ProductCard
                    key={p.slug}
                    product={p}
                    selected={selected.has(p.slug)}
                    onToggle={e => toggleOne(p.slug, e)}
                    onClone={() => doClone(p.slug)}
                    onQuickActive={() => doQuickUpdate(p.slug, { is_active: !p.is_active })}
                    onQuickFeatured={() => doQuickUpdate(p.slug, { is_featured: !p.is_featured })}
                    cloneLoading={cloneLoading === p.slug}
                    quickLoading={quickLoading.has(p.slug)}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* ── LIST VIEW ── */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="pl-4 pr-2 py-3 text-left w-10">
                      <button onClick={toggleAll} className="text-gray-300 hover:text-gray-600 transition-colors">
                        {allSelected ? <CheckSquare className="h-4 w-4 text-gray-700" /> : <Square className="h-4 w-4" />}
                      </button>
                    </th>
                    <th className="pl-2 pr-3 py-3 text-left text-[0.56rem] uppercase tracking-[0.14em] text-gray-400 font-medium w-14">Img</th>
                    {[
                      { label: "Product", field: "name" as SortField },
                      { label: "Type",    field: null },
                      { label: "Price",   field: "base_price" as SortField },
                      { label: "Stock",   field: null },
                      { label: "Status",  field: null },
                      { label: "SEO",     field: null },
                    ].map(({ label, field }) => (
                      <th
                        key={label}
                        className={`px-3 py-3 text-left text-[0.56rem] uppercase tracking-[0.14em] text-gray-400 font-medium whitespace-nowrap ${field ? "cursor-pointer hover:text-gray-700 select-none" : ""}`}
                        onClick={() => {
                          if (!field) return;
                          if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
                          else { setSortField(field); setSortDir("asc"); }
                        }}
                      >
                        <span className="inline-flex items-center gap-1">
                          {label}
                          {field && (
                            sortField === field
                              ? sortDir === "asc" ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />
                              : <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />
                          )}
                        </span>
                      </th>
                    ))}
                    <th className="px-3 py-3 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(p => {
                    const isSel = selected.has(p.slug);
                    const isQL = quickLoading.has(p.slug);
                    return (
                      <tr key={p.slug} className={`group ${isSel ? "bg-blue-50/40" : "hover:bg-gray-50/60"} transition-colors`}>
                        <td className="pl-4 pr-2 py-3">
                          <button onClick={e => toggleOne(p.slug, e)} className="text-gray-300 hover:text-gray-600 transition-colors">
                            {isSel ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4" />}
                          </button>
                        </td>
                        <td className="pl-2 pr-3 py-2">
                          <Link to="/admin/products/$slug" params={{ slug: p.slug }}>
                            <div className="w-11 h-11 overflow-hidden bg-gray-50 border border-gray-100 hover:border-gray-300 transition-colors">
                              <img
                                src={p.image_url || "/main.jpg"} alt=""
                                className="w-full h-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).src = "/main.jpg"; }}
                              />
                            </div>
                          </Link>
                        </td>
                        {/* Product name + slug */}
                        <td className="px-3 py-3 max-w-[200px]">
                          <Link to="/admin/products/$slug" params={{ slug: p.slug }} className="block">
                            <div className="flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.is_active ? "bg-emerald-400" : "bg-gray-300"}`} />
                              <span className="text-xs font-medium text-gray-800 truncate hover:text-gray-600">{p.name}</span>
                            </div>
                            <p className="font-mono text-[0.57rem] text-gray-400 mt-0.5 pl-3.5 truncate">{p.slug}</p>
                          </Link>
                        </td>
                        {/* Type */}
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 text-[0.56rem] uppercase tracking-[0.08em] font-medium rounded-sm ${TYPE_BADGE[p.type] ?? ""}`}>
                            {TYPE_LABELS[p.type] ?? p.type}
                          </span>
                        </td>
                        {/* Price */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="text-xs font-medium text-gray-800">{formatUSD(Number(p.base_price))}</span>
                          {p.sale_active && p.sale_price != null && (
                            <span className="ml-1.5 text-[0.55rem] text-red-500">Sale</span>
                          )}
                        </td>
                        {/* Stock */}
                        <td className="px-3 py-3">
                          <StockText p={p} />
                        </td>
                        {/* Active/Featured toggles */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => doQuickUpdate(p.slug, { is_active: !p.is_active })}
                              disabled={isQL}
                              title={p.is_active ? "Active — click to hide" : "Hidden — click to activate"}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[0.52rem] uppercase tracking-[0.08em] border transition-colors ${
                                p.is_active
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                              } disabled:opacity-50`}
                            >
                              {isQL ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : p.is_active ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
                              {p.is_active ? "Live" : "Off"}
                            </button>
                            <button
                              onClick={() => doQuickUpdate(p.slug, { is_featured: !p.is_featured })}
                              disabled={isQL}
                              title={p.is_featured ? "Featured — click to unfeature" : "Not featured — click to feature"}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[0.52rem] border transition-colors ${
                                p.is_featured
                                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                  : "bg-gray-50 text-gray-300 border-gray-200 hover:bg-gray-100"
                              } disabled:opacity-50`}
                            >
                              <Star className="h-2.5 w-2.5" fill={p.is_featured ? "currentColor" : "none"} />
                            </button>
                          </div>
                        </td>
                        {/* SEO */}
                        <td className="px-3 py-3">
                          <SeoHealth title={p.seo_title} desc={p.seo_description} />
                        </td>
                        {/* Row actions */}
                        <td className="px-3 py-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => doClone(p.slug)}
                              disabled={cloneLoading === p.slug}
                              className="text-[0.55rem] uppercase tracking-[0.08em] text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1"
                              title="Clone product"
                            >
                              {cloneLoading === p.slug ? <Loader2 className="h-3 w-3 animate-spin" /> : <Copy className="h-3 w-3" />}
                              Clone
                            </button>
                            <Link
                              to="/admin/products/$slug"
                              params={{ slug: p.slug }}
                              className="text-[0.58rem] uppercase tracking-[0.10em] text-gray-300 hover:text-gray-700 transition-colors"
                            >
                              Edit →
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!isLoading && products.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between flex-wrap gap-2">
              <p className="text-[0.58rem] uppercase tracking-[0.14em] text-gray-400">
                {filtered.length === products.length
                  ? `${products.length} products`
                  : `${filtered.length} of ${products.length} products`}
                {statusFilter !== "all" && ` · filtered by ${statusFilter.replace(/_/g, " ")}`}
              </p>
              <div className="flex items-center gap-3">
                {(search || statusFilter !== "all" || activeType !== "all") && (
                  <button
                    onClick={() => { setSearch(""); setStatusFilter("all"); setActiveType("all"); }}
                    className="text-[0.56rem] uppercase tracking-[0.10em] text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
                <Link
                  to="/admin/products/new"
                  className="inline-flex items-center gap-1 text-[0.58rem] uppercase tracking-[0.12em] text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <Plus className="h-3 w-3" /> Add product
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
