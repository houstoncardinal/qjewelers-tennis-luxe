import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { ArrowLeft, Save, Eye, EyeOff, Star, X, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { createProduct } from "@/lib/admin-extended.functions";
import { useAdminToken } from "@/lib/admin-context";

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 p-5">
      <p className="text-[0.58rem] uppercase tracking-[0.18em] text-gray-400 mb-5">{title}</p>
      {children}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

function AdminNewProduct() {
  const token = useAdminToken();
  const navigate = useNavigate();
  const createFn = useServerFn(createProduct);

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
  // Pricing
  const [basePrice,   setBasePrice]   = useState("");
  // Image
  const [imageUrl,    setImageUrl]    = useState("");
  const [imageErr,    setImageErr]    = useState(false);
  // Catalog
  const [isFeatured,  setIsFeatured]  = useState(false);
  const [isActive,    setIsActive]    = useState(true);
  const [sortOrder,   setSortOrder]   = useState("999");
  // UI
  const [saving,      setSaving]      = useState(false);

  // Pre-fill from URL import (sessionStorage set by ImportModal in products list)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("qj_product_import");
      if (!raw) return;
      sessionStorage.removeItem("qj_product_import");
      const imp = JSON.parse(raw) as {
        name?: string; description?: string; imageUrl?: string; images?: string[];
      };
      if (imp.name)        { setName(imp.name); }
      if (imp.description) { setDescription(imp.description); setShortDesc(imp.description.slice(0, 200)); }
      if (imp.imageUrl)    { setImageUrl(imp.imageUrl); setImageErr(false); }
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

  const handleCreate = async () => {
    if (!name.trim())       { toast.error("Product name is required"); return; }
    if (!slug.trim())       { toast.error("Slug is required"); return; }
    if (!basePrice || isNaN(Number(basePrice)) || Number(basePrice) <= 0) {
      toast.error("Valid base price required"); return;
    }
    if (!shortDesc.trim())  { toast.error("Short description is required"); return; }
    if (!description.trim()){ toast.error("Full description is required"); return; }

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
          image_url: imageUrl.trim() || "/main.jpg",
          is_featured: isFeatured,
          is_active: isActive,
          sort_order: Number(sortOrder) || 999,
        },
      });
      toast.success("Product created");
      const newSlug = (result as any)?.product?.slug ?? slug.trim();
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

  const thumbSrc = imageUrl || "/main.jpg";

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

          <Section title="Pricing">
            <div>
              <label className={labelCls}>Base Price ($) *</label>
              <input
                type="number" min={0} step={0.01}
                value={basePrice}
                onChange={e => setBasePrice(e.target.value)}
                className={inputCls}
                placeholder="0.00"
              />
              <p className="mt-1.5 text-[0.58rem] text-gray-400">
                Starting price before size/length modifiers. Additional variants can be set after creating the product.
              </p>
            </div>
          </Section>

          <Section title="Product Image">
            <div className="space-y-3">
              <div className="h-40 bg-gray-50 border border-gray-100 overflow-hidden">
                {imageErr || !imageUrl ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                    <span className="text-2xl">🖼</span>
                    <span className="text-xs">No image</span>
                  </div>
                ) : (
                  <img
                    src={imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => setImageErr(true)}
                  />
                )}
              </div>
              <div>
                <label className={labelCls}>Image URL</label>
                <input
                  value={imageUrl}
                  onChange={e => { setImageUrl(e.target.value); setImageErr(false); }}
                  className={inputCls}
                  placeholder="/public/my-product.jpg or https://…"
                />
                <p className="mt-1.5 text-[0.58rem] text-gray-400">
                  Relative path from /public or a full URL. Leave blank to use the default image.
                </p>
              </div>
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
            {saving ? "Creating…" : "Create Product"}
          </button>

          <p className="text-center text-[0.60rem] text-gray-400">
            You'll be taken to the product editor after creation where you can set sale pricing and more.
          </p>
        </div>
      </div>
    </div>
  );
}
