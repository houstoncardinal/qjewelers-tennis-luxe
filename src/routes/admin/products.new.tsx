import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useMemo, useRef, KeyboardEvent, ChangeEvent } from "react";
import {
  ArrowLeft, Save, Eye, EyeOff, Star, X, Wand2, Tag, Layers,
  Upload, Image as ImageIcon, Search, Trash2, Loader2, Crown, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { createProduct, upsertVariantsBulk, addProductImage, uploadAdminImage, listPublicImages } from "@/lib/admin-extended.functions";
import { useAdminToken } from "@/lib/admin-context";
import {
  AVAILABLE_SIZES, AVAILABLE_LENGTHS, AVAILABLE_COLORS, COLOR_LABELS, COLOR_HEX,
  AVAILABLE_RING_SIZES, DEFAULT_RING_SIZES,
  isTennisBraceletSlug, isRingType, isRingSlug,
  SIZES_TENNIS_BRACELET, LENGTHS_TENNIS_BRACELET, getTennisBraceletPrice,
  formatUSD,
} from "@/lib/pricing";

export const Route = createFileRoute("/admin/products/new")({
  component: AdminNewProduct,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSeoTitle(name: string, type: string): string {
  const map: Record<string, string> = {
    necklace: "Tennis Chain",
    bracelet: "Tennis Bracelet",
    earring: "Stud Earrings",
    ring: "Solitaire Ring",
  };
  const t = map[type] || "Jewelry";
  return name ? `${name} | VVS Moissanite ${t} | Qureshi Jewelers` : "";
}

function buildSeoDesc(name: string, type: string, color: string): string {
  const colorMap: Record<string, string> = {
    silver: "Sterling Silver",
    gold: "18K Yellow Gold",
    rose_gold: "18K Rose Gold",
    white_gold: "18K White Gold",
  };
  const typeMap: Record<string, string> = {
    necklace: "tennis chain",
    bracelet: "tennis bracelet",
    earring: "stud earrings",
    ring: "solitaire ring",
  };
  const c = colorMap[color] || color;
  const t = typeMap[type] || "jewelry";
  return name
    ? `Shop the ${name}. ${c} VVS moissanite ${t}. S925 sterling silver base, 5x precious metal plating, e-coat sealed. GRA certified. Free US shipping over $250.`
    : "";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// ─── Tag Input ────────────────────────────────────────────────────────────────

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
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
  return <span className={`text-[0.58rem] tabular-nums ${color}`}>{len}/{target}–{max}</span>;
}

// ─── Section Header ───────────────────────────────────────────────────────────

function Section({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-5">
        <p className="text-[0.58rem] uppercase tracking-[0.18em] text-gray-400">{title}</p>
        {right}
      </div>
      {children}
    </div>
  );
}

// ─── Multi-select chip row ────────────────────────────────────────────────────

function ChipRow({
  options, selected, onToggle, onAll, onClear, renderLabel, renderSwatch,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  onAll: () => void;
  onClear: () => void;
  renderLabel?: (v: string) => string;
  renderSwatch?: (v: string) => string | undefined;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {options.map(opt => {
          const active = selected.includes(opt);
          const swatch = renderSwatch?.(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[0.65rem] border transition-colors ${
                active
                  ? "bg-gray-900 text-white border-gray-900"
                  : "border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {swatch && (
                <span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ background: swatch }} />
              )}
              {renderLabel?.(opt) ?? opt}
            </button>
          );
        })}
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onAll} className="text-[0.56rem] uppercase tracking-[0.10em] text-gray-400 hover:text-gray-700 transition-colors">
          Select All
        </button>
        <button type="button" onClick={onClear} className="text-[0.56rem] uppercase tracking-[0.10em] text-gray-400 hover:text-gray-700 transition-colors">
          Clear
        </button>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

function AdminNewProduct() {
  const token = useAdminToken();
  const navigate = useNavigate();
  const createFn = useServerFn(createProduct);
  const upsertBulkFn = useServerFn(upsertVariantsBulk);
  const addImageFn = useServerFn(addProductImage);
  const uploadFn = useServerFn(uploadAdminImage);
  const fetchPublicImages = useServerFn(listPublicImages);

  // Identity
  const [name,        setName]        = useState("");
  const [slug,        setSlug]        = useState("");
  const [slugManual,  setSlugManual]  = useState(false);
  const [type,        setType]        = useState<"necklace"|"bracelet"|"earring"|"ring">("necklace");
  const [color,       setColor]       = useState<"silver"|"gold"|"rose_gold"|"white_gold">("silver");
  const [size,        setSize]        = useState("");
  const [length,      setLength]      = useState("");
  // Descriptions
  const [shortDesc,   setShortDesc]   = useState("");
  const [description, setDescription] = useState("");
  // SEO
  const [seoTitle,    setSeoTitle]    = useState("");
  const [seoTitleManual, setSeoTitleManual] = useState(false);
  const [seoDesc,     setSeoDesc]     = useState("");
  const [seoDescManual, setSeoDescManual]   = useState(false);
  const [seoKeywords, setSeoKeywords] = useState("");
  // Tags
  const [tags,        setTags]        = useState<string[]>([]);
  // Pricing & Variants
  const [basePrice,   setBasePrice]   = useState("");
  const [pricingMode, setPricingMode] = useState<"single" | "variants">("single");
  const [selColors,    setSelColors]    = useState<string[]>([]);
  const [selSizes,     setSelSizes]     = useState<string[]>([]);
  const [selLengths,   setSelLengths]   = useState<string[]>([]);
  const [selRingSizes, setSelRingSizes] = useState<string[]>([]);
  const [variantStock, setVariantStock] = useState("-1");
  // Images
  const [images,      setImages]      = useState<string[]>([]);
  const [imageTab,    setImageTab]    = useState<"upload" | "gallery" | "url">("upload");
  const [urlInput,    setUrlInput]    = useState("");
  const [uploading,   setUploading]   = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [galleryData, setGalleryData] = useState<{ files: { path: string; name: string; folder: string }[]; folders: string[] } | null>(null);
  const [galleryFolder, setGalleryFolder] = useState("all");
  const [gallerySearch, setGallerySearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Catalog
  const [isFeatured,  setIsFeatured]  = useState(false);
  const [isActive,    setIsActive]    = useState(true);
  const [sortOrder,   setSortOrder]   = useState("999");
  // UI
  const [saving,      setSaving]      = useState(false);

  const isTennis = isTennisBraceletSlug(slug);
  const isRing   = isRingType(type) || isRingSlug(slug);
  const sizeOptions   = isTennis ? [...SIZES_TENNIS_BRACELET] : AVAILABLE_SIZES;
  const lengthOptions = isTennis ? [...LENGTHS_TENNIS_BRACELET] : AVAILABLE_LENGTHS;
  const hasVariantSelection = selColors.length > 0 || selSizes.length > 0 || selLengths.length > 0 || selRingSizes.length > 0;

  const combos = useMemo(() => {
    const colors  = selColors.length > 0    ? selColors    : [null];
    // For rings, ring sizes go into the "size" slot; regular size/length axes are suppressed
    const sizes   = isRing
      ? (selRingSizes.length > 0 ? selRingSizes : [null])
      : (selSizes.length > 0 ? selSizes : [null]);
    const lengths = isRing ? [null] : (selLengths.length > 0 ? selLengths : [null]);
    const out: { color: string | null; size: string | null; length: string | null }[] = [];
    for (const c of colors) for (const s of sizes) for (const l of lengths) out.push({ color: c, size: s, length: l });
    return out;
  }, [selColors, selSizes, selLengths, selRingSizes, isRing]);

  // Pre-fill from URL import (sessionStorage set by ImportModal in products list)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("qj_product_import");
      if (!raw) return;
      sessionStorage.removeItem("qj_product_import");
      const imp = JSON.parse(raw) as {
        name?: string; shortDescription?: string; description?: string;
        imageUrl?: string; images?: string[];
        detectedType?: string | null; detectedColors?: string[];
        detectedSizes?: string[]; detectedLengths?: string[];
        suggestedTags?: string[]; suggestedPrice?: number | null;
      };
      if (imp.name) setName(imp.name);

      // Both fields are original on-brand copy generated server-side from
      // the detected specs — never the scraped marketing/manufacturer text.
      if (imp.description) setDescription(imp.description);
      if (imp.shortDescription) setShortDesc(imp.shortDescription);

      // All imported images are already re-hosted on our CDN at this point.
      const allImages = imp.images && imp.images.length > 0 ? imp.images : (imp.imageUrl ? [imp.imageUrl] : []);
      if (allImages.length > 0) {
        const cover = imp.imageUrl && allImages.includes(imp.imageUrl) ? imp.imageUrl : allImages[0];
        setImages([cover, ...allImages.filter(i => i !== cover)]);
      }

      const detectedIsRing =
        imp.detectedType === "ring" ||
        /\bring\b/i.test(imp.name ?? "") && !/earring/i.test(imp.name ?? "");

      if (imp.detectedType && ["necklace", "bracelet", "earring", "ring"].includes(imp.detectedType)) {
        setType(imp.detectedType as any);
      }
      if (imp.detectedColors && imp.detectedColors.length > 0) {
        setColor(imp.detectedColors[0] as any);
        setSelColors(imp.detectedColors);
      }

      // For rings: auto-populate default ring sizes (6–11) and switch to
      // variant mode — rings almost always ship in multiple sizes.
      if (detectedIsRing) {
        setSelRingSizes([...DEFAULT_RING_SIZES]);
        setPricingMode("variants");
      } else {
        // A single detected size/length is a fixed spec of the product (e.g.
        // "this anklet is 6mm, 8 inches" — not a customer choice), so it goes
        // on the product's own size/length field. Only genuinely *multiple*
        // detected values represent a real variant axis the customer picks
        // between — pushing a single value into the variant picker would
        // create one redundant variant row and silently switch the product
        // into variant-pricing mode it doesn't need.
        const sizes = imp.detectedSizes ?? [];
        const lengths = imp.detectedLengths ?? [];
        if (sizes.length === 1) setSize(sizes[0]);
        else if (sizes.length > 1) setSelSizes(sizes);
        if (lengths.length === 1) setLength(lengths[0]);
        else if (lengths.length > 1) setSelLengths(lengths);

        // Variant pricing only makes sense when at least one axis genuinely
        // has more than one option.
        const colorCount = imp.detectedColors?.length ?? 0;
        if (colorCount > 1 || sizes.length > 1 || lengths.length > 1) setPricingMode("variants");
      }

      // Auto-fill tags and suggested price from import intelligence.
      if (imp.suggestedTags && imp.suggestedTags.length > 0) setTags(imp.suggestedTags);
      if (imp.suggestedPrice) setBasePrice(String(imp.suggestedPrice));
    } catch {}
  }, []);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManual) setSlug(toSlug(name));
  }, [name, slugManual]);

  // Auto-suggest SEO title
  useEffect(() => {
    if (!seoTitleManual) setSeoTitle(buildSeoTitle(name, type));
  }, [name, type, seoTitleManual]);

  // Auto-suggest SEO description
  useEffect(() => {
    if (!seoDescManual) setSeoDesc(buildSeoDesc(name, type, color));
  }, [name, type, color, seoDescManual]);

  // Load gallery on demand
  useEffect(() => {
    if (imageTab === "gallery" && !galleryData) {
      fetchPublicImages({ data: { token } })
        .then(setGalleryData)
        .catch((e: any) => toast.error(e?.message ?? "Failed to load gallery"));
    }
  }, [imageTab, galleryData, token]);

  const addImage = (path: string) => {
    setImages(prev => (prev.includes(path) ? prev : [...prev, path]));
  };
  const removeImage = (path: string) => setImages(prev => prev.filter(p => p !== path));
  const makeCover = (path: string) => setImages(prev => [path, ...prev.filter(p => p !== path)]);

  const toggleColor = (c: string) => setSelColors(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);
  const toggleSize     = (s: string) => setSelSizes(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const toggleLength   = (l: string) => setSelLengths(p => p.includes(l) ? p.filter(x => x !== l) : [...p, l]);
  const toggleRingSize = (s: string) => setSelRingSizes(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const tooLarge = files.filter(f => f.size > 10 * 1024 * 1024);
    const toUpload = files.filter(f => f.size <= 10 * 1024 * 1024);
    if (tooLarge.length > 0) {
      toast.error(`${tooLarge.length} image${tooLarge.length !== 1 ? "s" : ""} over 10MB skipped`);
    }

    setUploading(true);
    let succeeded = 0;
    let failed = 0;
    try {
      for (let i = 0; i < toUpload.length; i++) {
        const file = toUpload[i];
        setUploadProgress({ done: i, total: toUpload.length });
        try {
          const dataUrl = await readFileAsDataUrl(file);
          const res = await uploadFn({ data: { token, fileName: file.name, dataUrl } });
          addImage(res.path);
          succeeded++;
        } catch (err: any) {
          failed++;
          toast.error(`${file.name}: ${err?.message ?? "Upload failed"}`);
        }
      }
      if (succeeded > 0) toast.success(`Uploaded ${succeeded} image${succeeded !== 1 ? "s" : ""}`);
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    addImage(url);
    setUrlInput("");
    toast.success("Image added");
  };

  const handleCreate = async () => {
    if (!name.trim())       { toast.error("Product name is required"); return; }
    if (!slug.trim())       { toast.error("Slug is required"); return; }
    if (!basePrice || isNaN(Number(basePrice)) || Number(basePrice) <= 0) {
      toast.error("Valid base price required"); return;
    }
    if (!shortDesc.trim())  { toast.error("Short description is required"); return; }
    if (!description.trim()){ toast.error("Full description is required"); return; }
    if (pricingMode === "variants" && !hasVariantSelection) {
      toast.error("Select at least one color, size, or length to generate variants"); return;
    }

    setSaving(true);
    try {
      const result = await createFn({
        data: {
          token,
          slug: slug.trim(),
          name: name.trim(),
          type, color,
          size: size.trim() || null,
          length: length.trim() || null,
          short_description: shortDesc.trim(),
          description: description.trim(),
          seo_title: seoTitle.trim() || name.trim(),
          seo_description: seoDesc.trim() || shortDesc.trim(),
          seo_keywords: seoKeywords.trim(),
          tags,
          base_price: Number(basePrice),
          image_url: images[0] || "/main.jpg",
          is_featured: isFeatured,
          is_active: isActive,
          sort_order: Number(sortOrder) || 999,
        },
      });
      const newSlug = (result as any)?.product?.slug ?? slug.trim();

      if (pricingMode === "variants") {
        const res = await upsertBulkFn({
          data: {
            token,
            variants: combos.map(v => ({
              product_slug: newSlug,
              color: v.color,
              size: v.size,
              length: v.length,
              stock: variantStock.trim() === "" ? -1 : Number(variantStock),
              price_override: isTennis && v.size && v.length ? getTennisBraceletPrice(v.size, v.length) : null,
              is_active: true,
            })),
          },
        });
        toast.success(`Created with ${res.count} variant${res.count !== 1 ? "s" : ""}`);
      } else {
        toast.success("Product created");
      }

      if (images.length > 1) {
        for (const url of images.slice(1)) {
          try {
            await addImageFn({ data: { token, product_slug: newSlug, url, alt_text: name.trim() } });
          } catch { /* non-fatal — gallery images can be added later from the editor */ }
        }
      }

      navigate({ to: "/admin/products/$slug", params: { slug: newSlug } });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors bg-white";
  const labelCls = "block text-[0.60rem] uppercase tracking-[0.14em] text-gray-400 mb-1.5";
  const selectCls = `${inputCls} cursor-pointer`;

  const filteredGallery = (galleryData?.files ?? []).filter(f => {
    const matchFolder = galleryFolder === "all" || f.folder === galleryFolder;
    const matchSearch = !gallerySearch || f.name.toLowerCase().includes(gallerySearch.toLowerCase());
    return matchFolder && matchSearch;
  });

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <Link
        to="/admin/products"
        className="inline-flex items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.14em] text-gray-400 hover:text-gray-700 transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Products
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">New Product</h1>
        <p className="text-xs text-gray-400 mt-0.5">Create a new product in the catalog</p>
      </div>

      {/* Quick status toggles */}
      <div className="flex gap-3 mb-5">
        <button
          onClick={() => setIsActive(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 border text-[0.65rem] uppercase tracking-[0.12em] transition-colors ${
            isActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400"
          }`}
        >
          {isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {isActive ? "Active" : "Hidden"}
        </button>
        <button
          onClick={() => setIsFeatured(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 border text-[0.65rem] uppercase tracking-[0.12em] transition-colors ${
            isFeatured
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400"
          }`}
        >
          <Star className="h-3.5 w-3.5" />
          {isFeatured ? "Featured" : "Not Featured"}
        </button>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Left */}
        <div className="lg:col-span-3 space-y-5">

          <Section title="Product Identity">
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className={labelCls}>Product Name *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 4mm 18K Gold Moissanite Tennis Chain"
                />
              </div>

              {/* Slug */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelCls.replace("mb-1.5", "mb-0")}>URL Slug *</label>
                  {slugManual && (
                    <button
                      onClick={() => { setSlugManual(false); setSlug(toSlug(name)); }}
                      className="text-[0.58rem] text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
                    >
                      <Wand2 className="h-2.5 w-2.5" /> Auto-generate
                    </button>
                  )}
                </div>
                <input
                  value={slug}
                  onChange={e => { setSlugManual(true); setSlug(toSlug(e.target.value)); }}
                  className={`${inputCls} font-mono text-[0.8rem]`}
                  placeholder="auto-generated-from-name"
                />
                {slug && (
                  <p className="mt-1 text-[0.58rem] text-gray-400 font-mono">/product/{slug}</p>
                )}
              </div>

              {/* Type & Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Type *</label>
                  <select value={type} onChange={e => setType(e.target.value as any)} className={selectCls}>
                    <option value="necklace">Chain / Necklace</option>
                    <option value="bracelet">Bracelet</option>
                    <option value="earring">Earring</option>
                    <option value="ring">Ring</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Color *</label>
                  <select value={color} onChange={e => setColor(e.target.value as any)} className={selectCls}>
                    <option value="silver">S925 Sterling Silver</option>
                    <option value="gold">18K Yellow Gold</option>
                    <option value="rose_gold">18K Rose Gold</option>
                    <option value="white_gold">18K White Gold</option>
                  </select>
                </div>
              </div>
              <p className="text-[0.58rem] text-gray-400 -mt-1">
                Used as the default/fallback color{pricingMode === "variants" ? " when no variant is selected" : ""}.
              </p>

              {/* Size & Length */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Size (optional)</label>
                  <input
                    value={size}
                    onChange={e => setSize(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. 4mm, 1ct, 3mm"
                  />
                </div>
                <div>
                  <label className={labelCls}>Length (optional)</label>
                  <input
                    value={length}
                    onChange={e => setLength(e.target.value)}
                    className={inputCls}
                    placeholder='e.g. 18", 8", 7"'
                  />
                </div>
              </div>
            </div>
          </Section>

          <Section title="Descriptions">
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Short Description *</label>
                <input
                  value={shortDesc}
                  onChange={e => setShortDesc(e.target.value)}
                  className={inputCls}
                  placeholder="One-line summary shown in product listings"
                />
              </div>
              <div>
                <label className={labelCls}>Full Description *</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={10}
                  className={`${inputCls} resize-y`}
                  placeholder="Detailed product description with features, materials, and benefits…"
                />
              </div>
            </div>
          </Section>

          <Section title="Search Engine Optimization">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelCls.replace("mb-1.5", "mb-0")}>SEO Title</label>
                  <div className="flex items-center gap-2">
                    <CharCounter value={seoTitle} target={55} max={70} />
                    {seoTitleManual && (
                      <button
                        onClick={() => { setSeoTitleManual(false); setSeoTitle(buildSeoTitle(name, type)); }}
                        className="text-[0.56rem] text-gray-400 hover:text-gray-600 flex items-center gap-0.5 transition-colors"
                      >
                        <Wand2 className="h-2.5 w-2.5" /> Auto
                      </button>
                    )}
                  </div>
                </div>
                <input
                  value={seoTitle}
                  onChange={e => { setSeoTitleManual(true); setSeoTitle(e.target.value); }}
                  className={inputCls}
                  placeholder="Ideal: 50–60 characters"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelCls.replace("mb-1.5", "mb-0")}>Meta Description</label>
                  <div className="flex items-center gap-2">
                    <CharCounter value={seoDesc} target={155} max={170} />
                    {seoDescManual && (
                      <button
                        onClick={() => { setSeoDescManual(false); setSeoDesc(buildSeoDesc(name, type, color)); }}
                        className="text-[0.56rem] text-gray-400 hover:text-gray-600 flex items-center gap-0.5 transition-colors"
                      >
                        <Wand2 className="h-2.5 w-2.5" /> Auto
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  value={seoDesc}
                  onChange={e => { setSeoDescManual(true); setSeoDesc(e.target.value); }}
                  rows={3}
                  className={`${inputCls} resize-none`}
                  placeholder="150–160 characters. Shown below title in search results."
                />
              </div>
              <div>
                <label className={labelCls}>SEO Keywords</label>
                <input
                  value={seoKeywords}
                  onChange={e => setSeoKeywords(e.target.value)}
                  className={inputCls}
                  placeholder="moissanite tennis chain, VVS bracelet, GRA certified…"
                />
                <p className="mt-1 text-[0.58rem] text-gray-400">Comma-separated. Helps internal search and structured data.</p>
              </div>
            </div>

            {/* Google Preview */}
            {(seoTitle || seoDesc) && (
              <div className="mt-5 p-4 bg-gray-50 border border-gray-100">
                <p className="text-[0.56rem] uppercase tracking-[0.14em] text-gray-400 mb-3">Google Preview</p>
                <p className="text-[0.62rem] text-gray-400 font-mono mb-1">qureshijewelers.com/product/{slug || "your-slug"}</p>
                <p className="text-[0.85rem] text-blue-600 font-medium leading-snug mb-1 truncate">
                  {seoTitle || name || "Product Title"}
                </p>
                <p className="text-[0.75rem] text-gray-600 leading-relaxed line-clamp-2">
                  {seoDesc || shortDesc || "Product description…"}
                </p>
              </div>
            )}
          </Section>

          <Section title="Tags">
            <TagInput tags={tags} onChange={setTags} />
            <p className="mt-2 text-[0.58rem] text-gray-400">
              Tags help with filtering and categorization. Press Enter or comma to add each tag.
            </p>
          </Section>

        </div>

        {/* Right */}
        <div className="lg:col-span-2 space-y-5">

          <Section title="Pricing & Variants">
            <div className="space-y-4">
              {/* Mode guide cards */}
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPricingMode("single")}
                  className={`text-left rounded-lg p-3 border transition-all ${
                    pricingMode === "single" ? "border-emerald-300 bg-emerald-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                      <Tag className={`h-3.5 w-3.5 ${pricingMode === "single" ? "text-emerald-600" : "text-gray-400"}`} />
                      Single Price
                    </span>
                    {pricingMode === "single" && (
                      <span className="text-[0.48rem] uppercase tracking-[0.10em] font-bold px-2 py-0.5 rounded-full text-white bg-emerald-500">In Use</span>
                    )}
                  </div>
                  <p className="text-[0.62rem] text-gray-500 leading-relaxed">
                    One product, one price — no size, color, or shape choices.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPricingMode("variants")}
                  className={`text-left rounded-lg p-3 border transition-all ${
                    pricingMode === "variants" ? "border-indigo-300 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                      <Layers className={`h-3.5 w-3.5 ${pricingMode === "variants" ? "text-indigo-600" : "text-gray-400"}`} />
                      Multiple Variations
                    </span>
                    {pricingMode === "variants" && (
                      <span className="text-[0.48rem] uppercase tracking-[0.10em] font-bold px-2 py-0.5 rounded-full text-white bg-indigo-500">
                        {hasVariantSelection ? `${combos.length} Combo${combos.length !== 1 ? "s" : ""}` : "Set Up"}
                      </span>
                    )}
                  </div>
                  <p className="text-[0.62rem] text-gray-500 leading-relaxed">
                    Comes in different sizes, colors, or lengths — generate every combination now.
                  </p>
                </button>
              </div>

              {/* Base price */}
              <div>
                <label className={labelCls}>
                  Base Price ($) * {pricingMode === "variants" && <span className="text-gray-400">— fallback only</span>}
                </label>
                <input
                  type="number" min={0} step={0.01}
                  value={basePrice}
                  onChange={e => setBasePrice(e.target.value)}
                  className={inputCls}
                  placeholder="0.00"
                />
                <p className="mt-1.5 text-[0.58rem] text-gray-400">
                  {pricingMode === "variants"
                    ? "Used only if a customer views the product before selecting a variant."
                    : "This is exactly what customers pay."}
                </p>
              </div>

              {/* Variant generator */}
              {pricingMode === "variants" && (
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  {isTennis && (
                    <p className="text-[0.6rem] text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-2 rounded">
                      Tennis bracelet detected — prices auto-fill from the size × length price table.
                    </p>
                  )}
                  {isRing && (
                    <p className="text-[0.6rem] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded flex items-center gap-1.5">
                      <span>💍</span> Ring detected — use Ring Sizes below. Sizes &amp; Lengths are hidden for rings.
                    </p>
                  )}

                  <div>
                    <label className={labelCls}>Colors</label>
                    <ChipRow
                      options={AVAILABLE_COLORS}
                      selected={selColors}
                      onToggle={toggleColor}
                      onAll={() => setSelColors([...AVAILABLE_COLORS])}
                      onClear={() => setSelColors([])}
                      renderLabel={c => COLOR_LABELS[c] ?? c}
                      renderSwatch={c => COLOR_HEX[c]}
                    />
                  </div>

                  {isRing ? (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={labelCls}>Ring Sizes</label>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setSelRingSizes([...AVAILABLE_RING_SIZES])}
                            className="text-[0.55rem] uppercase tracking-[0.10em] text-gray-400 hover:text-gray-700">All</button>
                          <span className="text-gray-200 text-[0.55rem]">|</span>
                          <button type="button" onClick={() => setSelRingSizes([...DEFAULT_RING_SIZES])}
                            className="text-[0.55rem] uppercase tracking-[0.10em] text-indigo-500 hover:text-indigo-700">Default (6–11)</button>
                          <span className="text-gray-200 text-[0.55rem]">|</span>
                          <button type="button" onClick={() => setSelRingSizes([])}
                            className="text-[0.55rem] uppercase tracking-[0.10em] text-gray-400 hover:text-gray-700">Clear</button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {AVAILABLE_RING_SIZES.map(s => {
                          const active = selRingSizes.includes(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => toggleRingSize(s)}
                              className={`px-3 py-1.5 text-[0.62rem] border rounded-md transition-all ${
                                active
                                  ? "bg-indigo-600 border-indigo-600 text-white font-semibold"
                                  : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"
                              }`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className={labelCls}>Sizes</label>
                        <ChipRow
                          options={sizeOptions}
                          selected={selSizes}
                          onToggle={toggleSize}
                          onAll={() => setSelSizes([...sizeOptions])}
                          onClear={() => setSelSizes([])}
                        />
                      </div>

                      <div>
                        <label className={labelCls}>Lengths</label>
                        <ChipRow
                          options={lengthOptions}
                          selected={selLengths}
                          onToggle={toggleLength}
                          onAll={() => setSelLengths([...lengthOptions])}
                          onClear={() => setSelLengths([])}
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className={labelCls}>Default Stock</label>
                    <input
                      value={variantStock}
                      onChange={e => setVariantStock(e.target.value)}
                      className={inputCls}
                      placeholder="-1"
                    />
                    <p className="mt-1 text-[0.58rem] text-gray-400">-1 = unlimited. Adjust per-variant after creation.</p>
                  </div>

                  {/* Preview */}
                  <div className="bg-gray-50 border border-gray-100 p-3">
                    {hasVariantSelection ? (
                      <>
                        <p className="text-[0.6rem] text-gray-600 mb-2 font-medium">
                          {combos.length} variant{combos.length !== 1 ? "s" : ""} will be created on save
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {combos.slice(0, 10).map((c, i) => {
                            const parts = [c.color && (COLOR_LABELS[c.color] ?? c.color), c.size, c.length].filter(Boolean);
                            const label = parts.join(" / ");
                            const price = isTennis && c.size && c.length ? getTennisBraceletPrice(c.size, c.length) : null;
                            return (
                              <span key={i} className="text-[0.58rem] px-2 py-1 bg-white border border-gray-200 text-gray-600">
                                {label}{price != null ? ` · ${formatUSD(price)}` : ""}
                              </span>
                            );
                          })}
                          {combos.length > 10 && (
                            <span className="text-[0.58rem] px-2 py-1 text-gray-400">+{combos.length - 10} more</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-[0.62rem] text-gray-400">Select at least one color, size, or length above to generate variants.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Section>

          <Section
            title="Product Images"
            right={images.length > 0 ? <span className="text-[0.56rem] text-gray-400">{images.length} image{images.length !== 1 ? "s" : ""}</span> : undefined}
          >
            <div className="space-y-3">
              {/* Cover preview */}
              <div className="h-40 bg-gray-50 border border-gray-100 overflow-hidden relative">
                {images[0] ? (
                  <img src={images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                    <ImageIcon className="h-6 w-6" />
                    <span className="text-xs">No image yet</span>
                  </div>
                )}
                {images[0] && (
                  <span className="absolute bottom-1.5 left-1.5 text-[0.5rem] uppercase tracking-[0.10em] bg-black/60 text-white px-2 py-0.5 rounded">
                    Cover
                  </span>
                )}
              </div>

              {/* Additional thumbnails */}
              {images.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {images.slice(1).map(url => (
                    <div key={url} className="relative group h-16 w-16 border border-gray-200 overflow-hidden">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                        <button type="button" onClick={() => makeCover(url)} title="Make cover" className="p-1 bg-white/90 hover:bg-white rounded">
                          <Crown className="h-3 w-3 text-amber-600" />
                        </button>
                        <button type="button" onClick={() => removeImage(url)} title="Remove" className="p-1 bg-white/90 hover:bg-white rounded">
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Source tabs */}
              <div className="flex gap-1 border-b border-gray-100">
                {[
                  { id: "upload", label: "Upload", icon: Upload },
                  { id: "gallery", label: "Gallery", icon: Layers },
                  { id: "url", label: "URL", icon: ImageIcon },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setImageTab(t.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-[0.6rem] uppercase tracking-[0.10em] border-b-2 transition-colors -mb-px ${
                      imageTab === t.id ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <t.icon className="h-3 w-3" /> {t.label}
                  </button>
                ))}
              </div>

              {imageTab === "upload" && (
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" id="new-product-upload" />
                  <label
                    htmlFor="new-product-upload"
                    className={`flex flex-col items-center justify-center gap-2 h-28 border-2 border-dashed cursor-pointer transition-colors ${
                      uploading ? "border-gray-200 text-gray-300" : "border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                    <span className="text-[0.62rem]">
                      {uploading
                        ? `Uploading ${uploadProgress ? uploadProgress.done + 1 : 1} of ${uploadProgress?.total ?? 1}…`
                        : "Click to upload from your device — select multiple"}
                    </span>
                  </label>
                  <p className="mt-1.5 text-[0.58rem] text-gray-400">JPG, PNG, GIF, WEBP, or AVIF. Max 10MB each. Multiple files supported.</p>
                </div>
              )}

              {imageTab === "gallery" && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {["all", ...(galleryData?.folders ?? [])].map(folder => (
                        <button
                          key={folder}
                          type="button"
                          onClick={() => setGalleryFolder(folder)}
                          className={`px-2 py-1 text-[0.54rem] uppercase tracking-[0.10em] border transition-colors ${
                            galleryFolder === folder ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-500 hover:border-gray-400"
                          }`}
                        >
                          {folder === "all" ? "All" : folder}
                        </button>
                      ))}
                    </div>
                    <div className="ml-auto relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-300" />
                      <input
                        value={gallerySearch}
                        onChange={e => setGallerySearch(e.target.value)}
                        placeholder="Search…"
                        className="pl-6 pr-2 py-1 text-[0.65rem] border border-gray-200 focus:outline-none focus:border-gray-400 bg-white w-32"
                      />
                    </div>
                  </div>

                  {!galleryData ? (
                    <div className="grid grid-cols-5 gap-1.5">
                      {[...Array(10)].map((_, i) => <div key={i} className="aspect-square bg-gray-100 animate-pulse" />)}
                    </div>
                  ) : filteredGallery.length === 0 ? (
                    <p className="text-center py-6 text-[0.65rem] text-gray-400">No images found</p>
                  ) : (
                    <div className="grid grid-cols-5 gap-1.5 max-h-64 overflow-y-auto">
                      {filteredGallery.map(file => {
                        const added = images.includes(file.path);
                        return (
                          <button
                            key={file.path}
                            type="button"
                            onClick={() => addImage(file.path)}
                            disabled={added}
                            title={file.path}
                            className={`relative aspect-square overflow-hidden border transition-all ${
                              added ? "border-amber-400 ring-1 ring-amber-300" : "border-gray-100 hover:border-gray-400 cursor-pointer"
                            }`}
                          >
                            <img src={file.path} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {imageTab === "url" && (
                <div className="flex gap-2">
                  <input
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddUrl(); } }}
                    className={inputCls}
                    placeholder="/my-product.jpg or https://…"
                  />
                  <button type="button" onClick={handleAddUrl} className="px-4 text-[0.6rem] uppercase tracking-[0.10em] border border-gray-900 bg-gray-900 text-white hover:bg-gray-800 transition-colors whitespace-nowrap">
                    Add
                  </button>
                </div>
              )}
            </div>
          </Section>

          <Section title="Catalog Settings">
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Sort Order</label>
                <input
                  type="number" min={0}
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value)}
                  className={inputCls}
                />
                <p className="mt-1 text-[0.58rem] text-gray-400">Lower = appears first. Default: 999 (end of catalog).</p>
              </div>
              <div className="pt-3 border-t border-gray-50 space-y-3">
                {[
                  { id: "new-active",   label: "Visible in store",  sub: "Customers can see and buy this", value: isActive,   set: setIsActive },
                  { id: "new-featured", label: "Featured product",  sub: "Show in featured sections",      value: isFeatured, set: setIsFeatured },
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
          </Section>

          <button
            onClick={handleCreate}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 text-[0.65rem] uppercase tracking-[0.16em] hover:bg-gray-800 transition-colors disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Creating…" : pricingMode === "variants" && hasVariantSelection
              ? <>Create Product + {combos.length} Variant{combos.length !== 1 ? "s" : ""}</>
              : "Create Product"}
          </button>

          <p className="text-center text-[0.60rem] text-gray-400 flex items-center justify-center gap-1">
            You'll be taken to the product editor after creation <ArrowRight className="h-2.5 w-2.5" />
          </p>
        </div>
      </div>
    </div>
  );
}
