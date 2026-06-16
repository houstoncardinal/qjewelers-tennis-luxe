import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState, useRef, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ShieldCheck, Truck, Sparkles, Award, ArrowRight, Minus, Plus,
  Eye, Diamond, ShoppingBag, Check, Info, ChevronLeft, ChevronRight, Star,
} from "lucide-react";
import { getProductBySlug, listReviews, submitReview, getProductGallery } from "@/lib/products.functions";
import { getProductImages, buildProductGallery, images as productImages } from "@/lib/product-images";
import {
  calculatePrice, calculateEarringPrice, calculateRingPrice,
  getTennisBraceletPrice,
  formatUSD,
  SIZES_NECKLACE, SIZES_EARRING, SIZES_RING, SIZES_TENNIS_BRACELET,
  LENGTHS_NECKLACE, LENGTHS_BRACELET, LENGTHS_TENNIS_BRACELET,
  LENGTH_BRACELET_DEFAULT, TENNIS_BRACELET_LENGTH_DEFAULT,
  type Size, type EarringSize, type RingSize, type Length,
  COLOR_MAP, COLOR_SHORT,
  SIZE_DESCRIPTIONS, EARRING_SIZE_DESCRIPTIONS, RING_SIZE_DESCRIPTIONS,
  TENNIS_BRACELET_SIZE_DESCRIPTIONS, TENNIS_BRACELET_LENGTH_DESCRIPTIONS,
  LENGTH_DESCRIPTIONS, BRACELET_LENGTH_DESCRIPTIONS,
  MOISSANITE_QUALITY,
} from "@/lib/pricing";
import { useCart } from "@/lib/cart";
import { EmailCapture } from "@/components/marketing/email-capture";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const [res, rev, gal] = await Promise.all([
      getProductBySlug({ data: { slug: params.slug } }),
      listReviews({ data: { slug: params.slug } }),
      getProductGallery({ data: { slug: params.slug } }),
    ]);
    if (!res.product) throw notFound();
    return { ...res, reviews: rev.reviews, galleryImages: gal.images };
  },
  head: ({ loaderData, params }) => {
    const p = loaderData?.product;
    const SITE = (import.meta.env.VITE_SITE_URL ?? "https://qureshijewelers.com").replace(/\/$/, "");
    if (!p) return { meta: [{ title: "Product" }] };
    const pageUrl   = `${SITE}/product/${params.slug}`;
    const imageUrl  = p.image_url?.startsWith("http") ? p.image_url : `${SITE}${p.image_url || "/QURESHIJEWELERSLOGO.png"}`;
    return {
      meta: [
        { title: p.seo_title },
        { name: "description", content: p.seo_description },
        { property: "og:title", content: p.seo_title },
        { property: "og:description", content: p.seo_description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: pageUrl },
        { property: "og:image", content: imageUrl },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:site_name", content: "Qureshi Jewelers" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: p.seo_title },
        { name: "twitter:description", content: p.seo_description },
        { name: "twitter:image", content: imageUrl },
        { property: "product:price:currency", content: "USD" },
        { property: "product:price:amount", content: String(p.base_price) },
      ],
      links: [{ rel: "canonical", href: pageUrl }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: p.description,
          url: pageUrl,
          image: imageUrl,
          brand: { "@type": "Brand", name: "Qureshi Jewelers" },
          offers: {
            "@type": "Offer",
            priceCurrency: "USD",
            price: Number(p.base_price),
            availability: p.is_active ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: pageUrl,
            seller: { "@type": "Organization", name: "Qureshi Jewelers" },
          },
        }),
      }],
    };
  },
  component: ProductPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl">Couldn't load this piece</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <Link to="/shop" className="inline-block mt-6 text-xs uppercase tracking-[0.2em] border-b border-foreground">Back to shop</Link>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl">Piece not found</h1>
      <Link to="/shop" className="inline-block mt-6 text-xs uppercase tracking-[0.2em] border-b border-foreground">Browse the collection</Link>
    </div>
  ),
});

function AccordionSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-[0.57rem] uppercase tracking-[0.30em] font-medium group-hover:text-gold transition-colors duration-200">
          {title}
        </span>
        <span className="text-muted-foreground text-lg leading-none font-light ml-4 shrink-0 select-none">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div className="pb-7 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

const RING_SLUG_SIZE_MAP: Record<string, RingSize> = {
  "0-5ct": "0.5ct",
  "1ct":   "1ct",
  "1-5ct": "1.5ct",
  "2ct":   "2ct",
  "3ct":   "3ct",
};

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "xs" }) {
  const px = size === "xs" ? "w-2.5 h-2.5" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-[2px]">
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          className={px}
          fill={i <= rating ? "var(--gold)" : "none"}
          strokeWidth={1.5}
          style={{ color: "var(--gold)" }}
        />
      ))}
    </div>
  );
}

function ReviewForm({ slug, onSuccess }: { slug: string; onSuccess: () => void }) {
  const doSubmit = useServerFn(submitReview);
  const [form, setForm] = useState({ customer_name: "", customer_email: "", order_number: "", rating: 5, title: "", body: "" });
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: k === "rating" ? Number(e.target.value) : e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name.trim() || !form.body.trim()) {
      toast.error("Name and review text are required");
      return;
    }
    setLoading(true);
    try {
      await doSubmit({ data: { product_slug: slug, ...form } });
      toast.success("Review submitted! It will appear after approval.");
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message ?? "Could not submit review");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full border border-[#ddd8d0] bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors";

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3 border-t border-border pt-6">
      <p className="text-[0.58rem] uppercase tracking-[0.22em] font-medium mb-4">Write a Review</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <input value={form.customer_name} onChange={update("customer_name")} placeholder="Your name *" className={inputCls} />
        <input type="email" value={form.customer_email} onChange={update("customer_email")} placeholder="Email (not published)" className={inputCls} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <select value={form.rating} onChange={update("rating")} className={inputCls}>
          {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} star{r !== 1 ? "s" : ""}</option>)}
        </select>
        <input value={form.order_number} onChange={update("order_number")} placeholder="Order # (optional — for verified badge)" className={inputCls} />
      </div>
      <input value={form.title} onChange={update("title")} placeholder="Review title (optional)" className={inputCls} />
      <textarea value={form.body} onChange={update("body")} placeholder="Your review *" rows={4} className={inputCls + " resize-none"} />
      <button type="submit" disabled={loading} className="bg-foreground text-background px-6 py-2.5 text-[0.58rem] uppercase tracking-[0.22em] disabled:opacity-50 hover:bg-foreground/90 transition-colors flex items-center gap-2">
        {loading && <span className="w-3 h-3 border-2 border-background/30 border-t-background rounded-full animate-spin" />}
        {loading ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}

function ProductPage() {
  const { product: p, reviews, galleryImages } = Route.useLoaderData();
  const product = p!;
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { add } = useCart();

  const isBracelet = product.type === "bracelet";
  const isEarring  = product.type === "earring";
  const isRing     = product.type === "ring";
  const isTennis   = slug.includes("tennis");

  const sizes = isTennis ? SIZES_TENNIS_BRACELET : isEarring ? SIZES_EARRING : isRing ? SIZES_RING : SIZES_NECKLACE;
  const sizeDescriptions = isTennis ? TENNIS_BRACELET_SIZE_DESCRIPTIONS : isEarring ? EARRING_SIZE_DESCRIPTIONS : isRing ? RING_SIZE_DESCRIPTIONS : SIZE_DESCRIPTIONS;

  const defaultSize: string = (() => {
    if (isRing) {
      const match = Object.entries(RING_SLUG_SIZE_MAP).find(([key]) => slug.includes(key));
      return match ? match[1] : "1ct";
    }
    return (["2mm", "3mm", "4mm", "5mm", "6.5mm"] as const).find(s => slug.includes(s)) ?? "3mm";
  })();

  const defaultLength: string = (() => {
    if (isEarring || isRing) return '18"';
    if (isTennis) return TENNIS_BRACELET_LENGTH_DEFAULT;
    if (isBracelet) return LENGTH_BRACELET_DEFAULT;
    return (['16"', '18"', '20"', '22"', '24"'] as const).find(l => slug.includes(l.replace('"', ''))) ?? '20"';
  })();

  const [size,         setSize]         = useState<string>(defaultSize);
  const [length,       setLength]       = useState<string>(defaultLength);
  const [qty,          setQty]          = useState(1);
  const [activeImg,    setActiveImg]    = useState(0);
  const [addedToBag,   setAddedToBag]   = useState(false);
  const [earringMetal, setEarringMetal] = useState<"white_gold" | "gold">("gold");
  const [tennisMetal,  setTennisMetal]  = useState<"gold" | "white_gold">("gold");
  const [touchStartX,  setTouchStartX]  = useState<number | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const thumbRef = useRef<HTMLDivElement>(null);

  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : null;

  // tennis: gallery index for each size (new images occupy [2] and [3], sizes start at [4])
  const tennisSizeImgIdx: Record<string, number> = { "2mm": 4, "3mm": 5, "4mm": 6, "5mm": 7, "6mm": 8 };

  const earringVideo = isEarring ? productImages.earringVideo : null;

  const gallery = buildProductGallery(slug, galleryImages ?? [], product.image_url);

  const price = isTennis
    ? getTennisBraceletPrice(size, length)
    : isEarring
      ? calculateEarringPrice(Number(product.base_price), size as EarringSize)
      : isRing
        ? calculateRingPrice(Number(product.base_price), size as RingSize)
        : calculatePrice(Number(product.base_price), size as Size, length as Length);

  const activeColor = isTennis ? tennisMetal : isEarring ? earringMetal : product.color;
  const colorInfo   = COLOR_MAP[activeColor];

  const showImage = (i: number) => { setActiveImg(i); };

  const prevImg = () => setActiveImg(i => Math.max(0, i - 1));
  const nextImg = () => setActiveImg(i => Math.min(gallery.length - 1, i + 1));

  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 44) delta < 0 ? nextImg() : prevImg();
    setTouchStartX(null);
  };

  const handleAdd = (goToCart = false) => {
    const cartColor = isTennis ? tennisMetal : isEarring ? earringMetal : product.color;
    const cartLength = isRing || isEarring ? "" : length;
    add({
      id: `${product.id}-${size}-${cartLength}-${cartColor}`,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      color: cartColor,
      size,
      length: cartLength,
      unitPrice: price,
      image: isTennis
        ? (tennisMetal === "white_gold" ? gallery[1] : gallery[0])
        : isEarring
          ? (earringMetal === "white_gold" ? gallery[1] : gallery[0])
          : gallery[0],
    }, qty);
    setAddedToBag(true);
    setTimeout(() => setAddedToBag(false), 3000);
    toast.success(`${product.name.split("—")[0].trim()} added to bag`);
    if (goToCart) navigate({ to: "/cart" });
  };

  const siblingSlug = isBracelet
    ? product.slug.replace("bracelet", "chain")
    : isEarring
      ? product.slug.replace("stud-earrings", "tennis-chain")
      : isRing
        ? product.slug.replace(/.*-solitaire-moissanite-ring/, `${product.color}-moissanite-tennis-chain`)
        : product.slug.replace("chain", "bracelet");

  const breadcrumbType  = isRing ? "ring" : isBracelet ? "bracelet" : isEarring ? "earring" : "necklace";
  const breadcrumbLabel = isRing ? "Engagement Rings" : isBracelet ? "Bracelets" : isEarring ? "Earrings" : "Chains";

  // Earring config label for the sticky mobile bar
  const mobileConfigLabel = isTennis
    ? `${size} · ${length} · ${tennisMetal === "white_gold" ? "White Gold" : "Yellow Gold"}`
    : isEarring
      ? `${size} · ${earringMetal === "white_gold" ? "White Gold" : "Yellow Gold"}`
      : isRing
        ? size
        : `${size} · ${length}`;

  return (
    <>
      <div className="bg-background overflow-x-hidden">

        {/* ─── Breadcrumb ──────────────────────────────────────────── */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 pt-5 sm:pt-7 lg:pt-9">
          <nav className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.55rem] uppercase tracking-[0.22em] text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span className="text-border/60">·</span>
            <Link to="/shop" className="hover:text-foreground transition-colors">Shop</Link>
            <span className="text-border/60">·</span>
            <Link to="/shop" search={{ type: breadcrumbType as any }} className="hover:text-foreground transition-colors">
              {breadcrumbLabel}
            </Link>
            <span className="text-border/60">·</span>
            <span className="text-foreground truncate max-w-[220px]">{product.name.split("—")[0].trim()}</span>
          </nav>
        </div>

        {/* ─── Main 2-col grid ─────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 pt-5 sm:pt-8 lg:pt-10 pb-36 lg:pb-24">
          <div className="grid lg:grid-cols-[1fr_440px] xl:grid-cols-[1fr_480px] gap-8 lg:gap-12 xl:gap-16 items-start min-w-0">

            {/* ══ GALLERY ══════════════════════════════════════════ */}
            <div className="min-w-0 space-y-3">

              {/* Main image */}
              <div
                className="relative overflow-hidden bg-[#f8f7f5] group/gallery select-none aspect-square lg:aspect-[4/5]"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  key={activeImg}
                  src={gallery[activeImg]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  style={{ animation: "fade-in 0.22s ease-out" }}
                  loading={activeImg === 0 ? "eager" : "lazy"}
                  decoding="async"
                  draggable={false}
                />

                {/* Prev / Next arrows */}
                {gallery.length > 1 && (
                  <>
                    <button
                      onClick={prevImg}
                      aria-label="Previous image"
                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/88 backdrop-blur-sm border border-border/30 flex items-center justify-center transition-all duration-200 ${
                        activeImg === 0
                          ? "opacity-0 pointer-events-none"
                          : "opacity-40 group-hover/gallery:opacity-100 hover:bg-white hover:opacity-100"
                      }`}
                    >
                      <ChevronLeft className="h-4 w-4 text-foreground" />
                    </button>
                    <button
                      onClick={nextImg}
                      aria-label="Next image"
                      className={`absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/88 backdrop-blur-sm border border-border/30 flex items-center justify-center transition-all duration-200 ${
                        activeImg === gallery.length - 1
                          ? "opacity-0 pointer-events-none"
                          : "opacity-40 group-hover/gallery:opacity-100 hover:bg-white hover:opacity-100"
                      }`}
                    >
                      <ChevronRight className="h-4 w-4 text-foreground" />
                    </button>
                  </>
                )}

                {/* Metal / color badge (top-left) */}
                {(isEarring || isTennis) ? (
                  <div className="absolute top-3.5 left-3.5 bg-white/92 backdrop-blur-sm border border-border/40 px-3 py-2 flex items-center gap-2 shadow-sm">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: isTennis
                        ? (tennisMetal === "white_gold" ? "#E8E8F4" : "#D4AF37")
                        : colorInfo?.hex }}
                    />
                    <span className="text-[0.46rem] uppercase tracking-[0.24em] font-medium">
                      {isTennis
                        ? (tennisMetal === "white_gold" ? "18K White Gold" : "18K Yellow Gold") + " Selected"
                        : (earringMetal === "white_gold" ? "18K White Gold" : "18K Yellow Gold") + " Selected"
                      }
                    </span>
                  </div>
                ) : colorInfo ? (
                  <div className="absolute top-3.5 left-3.5 bg-white/92 backdrop-blur-sm border border-border/40 px-3 py-2 flex items-center gap-2 shadow-sm">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colorInfo.hex }} />
                    <span className="text-[0.46rem] uppercase tracking-[0.24em] font-medium">{colorInfo.label}</span>
                  </div>
                ) : null}

                {/* Image counter (bottom-right) */}
                <div className="absolute bottom-3 right-3 bg-black/38 backdrop-blur-sm px-2.5 py-1.5">
                  <span className="text-[0.46rem] text-white/90 font-mono tracking-[0.06em] leading-none tabular-nums">
                    {activeImg + 1} / {gallery.length}
                  </span>
                </div>
              </div>

              {/* Thumbnail strip — arrows + horizontal scroll, works on all screen sizes */}
              <div className="flex items-center gap-1 mt-0.5 min-w-0">
                <button
                  onClick={() => { const el = thumbRef.current; if (el) el.scrollBy({ left: -(el.clientWidth * 0.8), behavior: "smooth" }); }}
                  aria-label="Scroll thumbnails left"
                  className="shrink-0 w-8 h-8 flex items-center justify-center bg-background border border-border hover:bg-cream hover:border-foreground/30 transition-all duration-150"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>

                <div
                  ref={thumbRef}
                  className="flex gap-1.5 overflow-x-auto flex-1 min-w-0 py-0.5"
                  style={{ scrollbarWidth: "none" } as React.CSSProperties}
                >
                  {gallery.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => showImage(i)}
                      aria-label={`View image ${i + 1}`}
                      className={`shrink-0 overflow-hidden relative transition-all duration-200 ${
                        activeImg === i
                          ? "ring-[1.5px] ring-foreground opacity-100"
                          : "opacity-30 hover:opacity-65"
                      }`}
                      style={{ width: 76, height: 76 }}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      {activeImg === i && (
                        <span
                          className="absolute bottom-0 left-0 right-0 h-[2px]"
                          style={{ background: "var(--gradient-gold-h)" }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => { const el = thumbRef.current; if (el) el.scrollBy({ left: el.clientWidth * 0.8, behavior: "smooth" }); }}
                  aria-label="Scroll thumbnails right"
                  className="shrink-0 w-8 h-8 flex items-center justify-center bg-background border border-border hover:bg-cream hover:border-foreground/30 transition-all duration-150"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* ══ CONFIGURATOR (sticky desktop) ═══════════════════ */}
            <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">

              {/* Eyebrow */}
              <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
                <div className="h-px w-5 shrink-0" style={{ background: "linear-gradient(to right, oklch(0.72 0.10 80), transparent)" }} />
                <p className="text-[0.44rem] uppercase tracking-[0.34em] text-muted-foreground/70">
                  {isTennis
                    ? "18K Yellow & White Gold · S925 · VVS1 · GRA Certified"
                    : isEarring
                      ? "18K Yellow & White Gold · S925 · VVS1 · GRA Certified"
                      : `${colorInfo?.label ?? product.color.replace("_", " ")} · S925 Sterling Silver · VVS · GRA`
                  }
                </p>
              </div>

              {/* Product name */}
              <h1
                className="font-display leading-[1.02] mb-3 sm:mb-4"
                style={{ fontSize: "clamp(1.9rem, 3.2vw, 3rem)" }}
              >
                {product.name.split("—")[0].trim()}
              </h1>

              {/* Star rating */}
              <div className="flex items-center gap-2.5 mb-4">
                <StarRow rating={Math.round(avgRating ?? 5)} />
                {avgRating !== null ? (
                  <>
                    <span className="text-[0.64rem] font-semibold">{avgRating.toFixed(1)}</span>
                    <button
                      onClick={() => document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth" })}
                      className="text-[0.58rem] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setShowReviewForm(true); document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth" }); }}
                    className="text-[0.58rem] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    · Be the first to review
                  </button>
                )}
              </div>

              <p className="text-[0.80rem] text-muted-foreground/80 leading-[1.85] mb-5">
                {product.short_description}
              </p>

              <div className="hairline mb-5" />

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-3 mb-1.5">
                  <span
                    className="font-display leading-none"
                    style={{ fontSize: "clamp(2rem, 3.2vw, 2.8rem)" }}
                  >
                    {formatUSD(price)}
                  </span>
                  <span className="text-[0.48rem] uppercase tracking-[0.18em] text-muted-foreground">USD</span>
                  {isEarring && (
                    <span className="text-[0.48rem] text-muted-foreground/60 uppercase tracking-[0.10em] ml-1">per pair</span>
                  )}
                </div>
                <p className="text-[0.50rem] text-muted-foreground/50 uppercase tracking-[0.14em] mb-3">
                  or 4 interest-free payments of {formatUSD(Math.ceil(price / 4))}
                </p>
                {/* Diamond comparison anchor */}
                {isEarring && (() => {
                  const diamondMap: Record<string, string> = {
                    "3mm": "$820", "4mm": "$1,500", "5mm": "$3,200", "6mm": "$6,800", "8mm": "$24,000",
                  };
                  return (
                    <div className="flex items-center gap-2 text-[0.54rem] text-muted-foreground">
                      <Diamond className="h-3 w-3 shrink-0 opacity-40" />
                      <span>
                        Natural diamond equivalent:{" "}
                        <span className="line-through opacity-50">{diamondMap[size] ?? "$2,000"}+</span>
                        {" "}— <span className="text-foreground font-medium">same brilliance, fraction of the cost</span>
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* ── Tennis Metal selector ─────────────────── */}
              {isTennis && (
                <div className="mb-6">
                  <div className="flex items-baseline justify-between mb-3.5">
                    <p className="text-[0.52rem] uppercase tracking-[0.28em] font-semibold">Metal</p>
                    <span className="text-[0.57rem] italic text-muted-foreground">
                      {tennisMetal === "white_gold" ? "Cool · Icy white brilliance" : "Warm · Classic yellow lustre"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {([
                      { key: "gold"       as const, label: "18K Yellow Gold", hex: "#D4AF37" },
                      { key: "white_gold" as const, label: "18K White Gold",  hex: "#E8E8F4" },
                    ]).map(({ key, label, hex }) => {
                      const active = tennisMetal === key;
                      return (
                        <button
                          key={key}
                          onClick={() => { setTennisMetal(key); showImage(key === "white_gold" ? 1 : 0); }}
                          className={`relative py-5 text-center border transition-all duration-150 flex flex-col items-center justify-center gap-2 ${
                            active
                              ? "border-foreground bg-foreground text-background"
                              : "border-border hover:border-foreground/40 hover:bg-cream"
                          }`}
                        >
                          <span className="w-[18px] h-[18px] rounded-full shrink-0 ring-1 ring-black/10 shadow-sm" style={{ backgroundColor: hex }} />
                          <span className="text-[0.70rem] font-semibold leading-none">{label}</span>
                          <span className={`text-[0.40rem] uppercase tracking-[0.16em] ${active ? "text-background/50" : "text-muted-foreground/50"}`}>5× plated</span>
                          {active && <span className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "var(--gradient-gold-h)" }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Size selector ────────────────────────── */}
              <div className="mb-6">
                <div className="flex items-baseline justify-between mb-3.5">
                  <p className="text-[0.52rem] uppercase tracking-[0.28em] font-semibold">
                    {isEarring ? "Stone Size" : isRing ? "Stone Weight" : "Width"}
                  </p>
                  <span className="text-[0.57rem] italic text-muted-foreground">{sizeDescriptions[size]}</span>
                </div>
                {/* Mobile: horizontal scroll strip — each button wide enough to breathe */}
                {/* Desktop: compact 5-col grid */}
                <div
                  className="grid grid-cols-5 gap-1.5 min-w-0"
                >
                  {(sizes as readonly string[]).map(s => {
                    const sp = isTennis
                      ? getTennisBraceletPrice(s, length)
                      : isEarring
                        ? calculateEarringPrice(Number(product.base_price), s as EarringSize)
                        : isRing
                          ? calculateRingPrice(Number(product.base_price), s as RingSize)
                          : calculatePrice(Number(product.base_price), s as Size, length as Length);
                    const active = size === s;
                    return (
                      <button
                        key={s}
                        onClick={() => {
                          setSize(s);
                          if (isTennis) showImage(tennisSizeImgIdx[s] ?? 5);
                        }}
                        className={`relative py-3 text-center border transition-all duration-150 ${
                          active
                            ? "border-foreground bg-foreground text-background"
                            : "border-border hover:border-foreground/40 hover:bg-cream"
                        }`}
                      >
                        <span className="block text-[0.74rem] font-semibold leading-none mb-1">{s}</span>
                        <span className={`block text-[0.44rem] uppercase tracking-[0.08em] ${active ? "text-background/50" : "text-muted-foreground/55"}`}>
                          {formatUSD(sp)}
                        </span>
                        {active && (
                          <span
                            className="absolute bottom-0 left-0 right-0 h-[2px]"
                            style={{ background: "var(--gradient-gold-h)" }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size-on-ear visual guide (earrings only) */}
              {isEarring && (
                <div className="mt-3 mb-6 px-4 py-4 bg-cream border border-border">
                  <p className="text-[0.42rem] uppercase tracking-[0.22em] text-muted-foreground mb-4">Actual size on ear (to scale)</p>
                  <div className="flex items-end justify-around">
                    {([
                      { s: "3mm", px: 15, label: "Subtle" },
                      { s: "4mm", px: 20, label: "Classic" },
                      { s: "5mm", px: 25, label: "Statement" },
                      { s: "6mm", px: 30, label: "Bold" },
                      { s: "8mm", px: 40, label: "Iced Out" },
                    ] as const).map(({ s, px, label }) => {
                      const active = size === s;
                      return (
                        <button
                          key={s}
                          onClick={() => setSize(s)}
                          className={`flex flex-col items-center gap-2 transition-all duration-150 ${active ? "opacity-100" : "opacity-35 hover:opacity-65"}`}
                        >
                          <div
                            className="rounded-full transition-colors duration-150"
                            style={{
                              width: px,
                              height: px,
                              background: active ? "var(--foreground)" : "var(--foreground)",
                              opacity: active ? 1 : 0.5,
                            }}
                          />
                          <span className={`text-[0.38rem] uppercase tracking-[0.10em] leading-none ${active ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{s}</span>
                          <span className={`text-[0.34rem] uppercase tracking-[0.08em] ${active ? "text-muted-foreground" : "text-muted-foreground/50"}`}>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ring size note */}
              {isRing && (
                <div className="mb-6 flex items-start gap-3 bg-cream border border-border px-4 py-4">
                  <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-[0.60rem] text-muted-foreground leading-[1.75]">
                    US ring sizes 4–12. Specify your ring size in{" "}
                    <strong className="text-foreground font-medium">order notes</strong> at checkout.{" "}
                    <Link to="/size-guide" className="underline hover:text-foreground transition-colors">
                      Size guide →
                    </Link>
                  </p>
                </div>
              )}

              {/* ── Metal selector (earrings) ─────────────── */}
              {isEarring && (
                <div className="mb-6">
                  <div className="flex items-baseline justify-between mb-3.5">
                    <p className="text-[0.52rem] uppercase tracking-[0.28em] font-semibold">Metal</p>
                    <span className="text-[0.57rem] italic text-muted-foreground">
                      {earringMetal === "white_gold" ? "Cool · Icy white brilliance" : "Warm · Classic yellow lustre"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {([
                      { key: "gold"       as const, label: "18K Yellow Gold", hex: "#D4AF37" },
                      { key: "white_gold" as const, label: "18K White Gold",  hex: "#E8E8F4" },
                    ]).map(({ key, label, hex }) => {
                      const active = earringMetal === key;
                      return (
                        <button
                          key={key}
                          onClick={() => { setEarringMetal(key); showImage(key === "white_gold" ? 1 : 0); }}
                          className={`relative py-5 text-center border transition-all duration-150 flex flex-col items-center justify-center gap-2 ${
                            active
                              ? "border-foreground bg-foreground text-background"
                              : "border-border hover:border-foreground/40 hover:bg-cream"
                          }`}
                        >
                          <span
                            className="w-[18px] h-[18px] rounded-full shrink-0 ring-1 ring-black/10 shadow-sm"
                            style={{ backgroundColor: hex }}
                          />
                          <span className="text-[0.70rem] font-semibold leading-none">{label}</span>
                          <span className={`text-[0.40rem] uppercase tracking-[0.16em] ${active ? "text-background/50" : "text-muted-foreground/50"}`}>
                            5× plated
                          </span>
                          {active && (
                            <span
                              className="absolute bottom-0 left-0 right-0 h-[2px]"
                              style={{ background: "var(--gradient-gold-h)" }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Length selector ──────────────────────── */}
              {!isEarring && !isRing && (
                <div className="mb-6">
                  <div className="flex items-baseline justify-between mb-3.5">
                    <p className="text-[0.52rem] uppercase tracking-[0.28em] font-semibold">Length</p>
                    {!isTennis && (
                      <Link to="/size-guide" className="text-[0.52rem] text-muted-foreground hover:text-foreground transition-colors">
                        Size guide →
                      </Link>
                    )}
                    {isTennis && (
                      <span className="text-[0.57rem] italic text-muted-foreground">
                        {TENNIS_BRACELET_LENGTH_DESCRIPTIONS[length] ?? ""}
                      </span>
                    )}
                  </div>
                  <div
                    className={
                      isTennis
                        ? "grid grid-cols-4 sm:grid-cols-7 gap-1.5 min-w-0"
                        : "grid gap-1.5 grid-cols-3"
                    }
                  >
                    {(isTennis ? LENGTHS_TENNIS_BRACELET : isBracelet ? LENGTHS_BRACELET : LENGTHS_NECKLACE).map(l => {
                      const lp = isTennis
                        ? getTennisBraceletPrice(size, l)
                        : calculatePrice(Number(product.base_price), size as Size, l as Length);
                      const desc = isTennis
                        ? TENNIS_BRACELET_LENGTH_DESCRIPTIONS[l]
                        : isBracelet ? BRACELET_LENGTH_DESCRIPTIONS[l] : LENGTH_DESCRIPTIONS[l];
                      const active = length === l;
                      return (
                        <button
                          key={l}
                          onClick={() => setLength(l)}
                          title={desc}
                          className={`relative py-3 sm:py-4 text-center border transition-all duration-150 ${
                            active
                              ? "border-foreground bg-foreground text-background"
                              : "border-border hover:border-foreground/40 hover:bg-cream"
                          }`}
                        >
                          <span className="block text-[0.72rem] sm:text-[0.76rem] font-semibold leading-none mb-1">{l}</span>
                          <span className={`block text-[0.42rem] sm:text-[0.42rem] uppercase tracking-[0.08em] ${active ? "text-background/50" : "text-muted-foreground/55"}`}>
                            {formatUSD(lp)}
                          </span>
                          {active && (
                            <span
                              className="absolute bottom-0 left-0 right-0 h-[2px]"
                              style={{ background: "var(--gradient-gold-h)" }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Live config summary (earrings & tennis) ── */}
              {(isEarring || isTennis) && (
                <div className="mb-6 border border-border overflow-hidden">
                  <div className="h-[2px]" style={{ background: "var(--gradient-gold-h)" }} />
                  <div className="px-4 py-4 flex items-center justify-between gap-3 bg-cream">
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.40rem] uppercase tracking-[0.24em] text-muted-foreground mb-1.5">Your selection</p>
                      {isTennis ? (
                        <>
                          <p className="text-[0.82rem] font-semibold leading-tight">
                            {size} · {length} · {tennisMetal === "white_gold" ? "18K White Gold" : "18K Yellow Gold"}
                          </p>
                          <p className="text-[0.48rem] text-muted-foreground/65 mt-1.5">
                            VVS1 · 4-Prong · Double-Lock Clasp · GRA Certified
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-[0.82rem] font-semibold leading-tight">
                            {size} · {earringMetal === "white_gold" ? "18K White Gold" : "18K Yellow Gold"}
                          </p>
                          <p className="text-[0.48rem] text-muted-foreground/65 mt-1.5">
                            VVS1 · 3-Prong · Screw-back · GRA Certified
                          </p>
                        </>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-display text-[1.45rem] sm:text-[1.65rem] leading-none">{formatUSD(price)}</p>
                      {isEarring && <p className="text-[0.38rem] text-muted-foreground/50 uppercase tracking-[0.12em] mt-1">per pair</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Shipping urgency ─────────────────────── */}
              <div className="flex items-center gap-2.5 mb-5 px-4 py-3.5 border border-border/60 bg-[#faf9f7]">
                <Truck className="h-3.5 w-3.5 text-foreground/60 shrink-0" />
                <p className="text-[0.54rem] leading-snug">
                  <span className="font-semibold text-foreground">Ships within 24 hours</span>
                  <span className="text-muted-foreground"> · Free US shipping on orders $250+</span>
                </p>
              </div>

              {/* ── Qty + Add to Bag ─────────────────────── */}
              <div className="flex gap-2 mb-2.5">
                <div className="flex items-stretch border border-border shrink-0">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="px-3.5 hover:bg-cream transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-9 flex items-center justify-center text-sm font-medium">{qty}</span>
                  <button
                    onClick={() => setQty(q => q + 1)}
                    className="px-3.5 hover:bg-cream transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <button
                  onClick={() => handleAdd(false)}
                  className="flex-1 relative overflow-hidden bg-foreground text-background py-4 sm:py-4.5 text-[0.57rem] uppercase tracking-[0.30em] font-semibold hover:bg-foreground/90 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 group shadow-[0_4px_20px_rgba(0,0,0,0.12)]"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {addedToBag
                      ? <><Check className="h-3.5 w-3.5" /> Added to Bag</>
                      : <><ShoppingBag className="h-3.5 w-3.5" /> Add to Bag</>
                    }
                  </span>
                  <div className="absolute inset-0 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/8 to-transparent" />
                </button>
              </div>

              <button
                onClick={() => handleAdd(true)}
                className="w-full border border-foreground/25 py-4 text-[0.58rem] uppercase tracking-[0.28em] font-semibold hover:border-foreground hover:bg-foreground hover:text-background active:scale-[0.99] transition-all duration-200 mb-7"
              >
                Buy Now
              </button>

              {/* ── Trust strip ──────────────────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/60 border border-border/60 mb-6">
                {[
                  { icon: ShieldCheck, label: "GRA Certified",   sub: "Auth. included" },
                  { icon: Truck,       label: "Free Shipping",   sub: "Orders $250+" },
                  { icon: Award,       label: "14-Day Returns",  sub: "Hassle-free" },
                  { icon: Sparkles,    label: "Gift Ready",      sub: "Luxury packaging" },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="bg-[#faf9f7] flex flex-col items-center justify-center gap-1 px-2 py-5 text-center">
                    <Icon className="h-3.5 w-3.5 text-gold/70 mb-0.5" />
                    <span className="text-[0.42rem] uppercase tracking-[0.10em] font-semibold text-foreground leading-tight">{label}</span>
                    <span className="text-[0.38rem] text-muted-foreground/55 uppercase tracking-[0.08em]">{sub}</span>
                  </div>
                ))}
              </div>

              {/* ── Complete the set ─────────────────────── */}
              {!isRing && (
                <div className="border border-border p-4 flex gap-4 items-center hover:border-foreground/20 transition-colors duration-300">
                  <div className="shrink-0 overflow-hidden bg-cream" style={{ width: 64, height: 64 }}>
                    <img src={gallery[0]} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.40rem] uppercase tracking-[0.28em] text-muted-foreground mb-1">Complete the set</p>
                    <p className="font-display text-[1.02rem] leading-snug">
                      {isBracelet ? "Add the matching chain" : isEarring ? "Add the matching chain" : "Add the matching bracelet"}
                    </p>
                    <p className="text-[0.42rem] uppercase tracking-[0.12em] text-muted-foreground/50 mt-0.5">
                      {colorInfo?.label ?? "Silver"} · S925 · VVS
                    </p>
                  </div>
                  <Link
                    to="/product/$slug"
                    params={{ slug: siblingSlug }}
                    className="shrink-0 flex items-center gap-1 text-[0.46rem] uppercase tracking-[0.18em] hover:text-gold transition-colors duration-200"
                  >
                    View <ArrowRight className="h-2.5 w-2.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ─── Accordion details — full width below grid ───────────── */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-10 pb-16">

            <AccordionSection title="Materials & Details" defaultOpen>
              {/* Luxury spec table */}
              <dl className="border border-border mb-7 overflow-hidden">
                <div className="h-[2px]" style={{ background: "var(--gradient-gold-h)" }} />
                {(isTennis ? [
                  { k: "Material",    v: "Solid S925 Sterling Silver (92.5% purity)",                                                      hl: false },
                  { k: "Plating",     v: `5× 18K ${tennisMetal === "white_gold" ? "White Gold" : "Yellow Gold"}`,                          hl: true  },
                  { k: "Stone",       v: "VVS1 Moissanite · D Colorless · Round Brilliant",                                                hl: false },
                  { k: "Setting",     v: "4-Prong Claw Inlay",                                                                             hl: false },
                  { k: "Clasp",       v: "Double-Locking Box Clasp",                                                                       hl: false },
                  { k: "Widths",      v: "2mm · 3mm · 4mm · 5mm · 6mm",                                                                   hl: false },
                  { k: "Lengths",     v: '6" · 6.5" · 7" · 7.5" · 8" · 8.5" · 9"',                                                       hl: false },
                  { k: "Certificate", v: "GRA Moissanite Certificate",                                                                     hl: false },
                ] : isEarring ? [
                  { k: "Material",    v: "Solid S925 Sterling Silver",                                                                     hl: false },
                  { k: "Plating",     v: `5× 18K ${earringMetal === "white_gold" ? "White Gold" : "Yellow Gold"}`,                        hl: true  },
                  { k: "Stone",       v: "VVS1 Moissanite · D Colorless",                                                                  hl: false },
                  { k: "Setting",     v: "3-Prong Round Brilliant",                                                                        hl: false },
                  { k: "Backing",     v: "Screw Back (Threaded)",                                                                          hl: false },
                  { k: "Certificate", v: "GRA Moissanite Certificate",                                                                     hl: false },
                ] : [
                  { k: "Material",                    v: "Solid S925 Sterling Silver",                                                     hl: false },
                  { k: "Plating",                     v: `${colorInfo?.plated ?? "Rhodium"} · 5× e-coat`,                                 hl: false },
                  { k: "Stone",                       v: "VVS1 Moissanite · D Color",                                                     hl: false },
                  { k: isRing ? "Setting" : "Clasp", v: isRing ? "Classic 4-Prong Solitaire" : "Double-locking box",                     hl: false },
                  { k: "Finish",                      v: "Tarnish-resistant",                                                             hl: false },
                  { k: "Certificate",                 v: "GRA included",                                                                  hl: false },
                ]).map(({ k, v, hl }) => (
                  <div
                    key={k}
                    className={`flex items-start justify-between px-4 sm:px-5 py-3.5 border-b border-border last:border-0 ${hl ? "bg-[oklch(0.97_0.012_80)]" : ""}`}
                  >
                    <dt className="text-[0.44rem] uppercase tracking-[0.22em] text-muted-foreground/60 shrink-0 pt-0.5 pr-3">{k}</dt>
                    <dd className={`text-[0.72rem] sm:text-[0.76rem] font-semibold text-right min-w-0 break-words ${hl ? "text-foreground" : ""}`}>{v}</dd>
                  </div>
                ))}
              </dl>

              {isTennis ? (
                <div className="space-y-5 text-[0.80rem] leading-[1.90]">
                  <p className="text-foreground font-medium">
                    Pure ice. Every stone. Both wrists — the{" "}
                    <span className="italic">VVS1 Moissanite Tennis Bracelet.</span>
                  </p>
                  <p className="text-muted-foreground">
                    Each stone is a{" "}
                    <strong className="text-foreground font-semibold">D Colorless VVS1 Moissanite</strong>{" "}
                    in a precision round brilliant cut — the highest clarity and color grade available. The{" "}
                    <strong className="text-foreground font-semibold">4-prong claw inlay setting</strong>{" "}
                    maximises stone exposure and light return while keeping every stone locked securely in place.
                  </p>
                  <p className="text-muted-foreground">
                    Built on a{" "}
                    <strong className="text-foreground font-semibold">solid S925 sterling silver base</strong>{" "}
                    (92.5% pure) and electroplated{" "}
                    <strong className="text-foreground font-semibold">5 times in 18K gold</strong>{" "}
                    — far beyond the 1–2 coats found on typical fashion jewellery. Choose{" "}
                    <strong className="text-foreground font-semibold">18K Yellow Gold</strong>{" "}
                    for a warm, classic lustre or{" "}
                    <strong className="text-foreground font-semibold">18K White Gold</strong>{" "}
                    for a clean, icy look that pairs with everything.
                  </p>
                  <p className="text-muted-foreground">
                    The{" "}
                    <strong className="text-foreground font-semibold">double-locking box clasp</strong>{" "}
                    keeps the bracelet secured during daily wear, travel, and sport — no accidental openings, no lost jewellery.{" "}
                    <strong className="text-foreground font-semibold">Hypoallergenic, nickel-free, lead-free, and cadmium-free</strong>{" "}
                    — safe for all skin types. A{" "}
                    <strong className="text-foreground font-semibold">GRA moissanite certificate</strong>{" "}
                    is included with every order.
                  </p>
                  <div className="border border-border">
                    {[
                      ["Stone",       "D Colorless VVS1 Moissanite"],
                      ["Cut",         "Round Brilliant · 4-Prong Claw Inlay"],
                      ["Base Metal",  "Solid S925 Sterling Silver (92.5%)"],
                      ["Plating",     "5× 18K Yellow Gold & White Gold"],
                      ["Clasp",       "Double-Locking Box Clasp"],
                      ["Widths",      "2mm · 3mm · 4mm · 5mm · 6mm"],
                      ["Lengths",     '6" · 6.5" · 7" · 7.5" · 8" · 8.5" · 9"'],
                      ["Gender",      "Unisex — Men's & Women's"],
                      ["Health",      "Hypoallergenic · Lead-Free · Nickel-Free"],
                      ["Occasions",   "Daily · Anniversary · Party · Gifting"],
                      ["Certificate", "GRA Certified"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-start border-b border-border last:border-0 px-4 py-3 gap-3">
                        <span className="text-[0.44rem] uppercase tracking-[0.16em] text-muted-foreground/60 shrink-0 w-[72px] sm:w-[90px] pt-0.5">{k}</span>
                        <span className="text-[0.72rem] sm:text-[0.74rem] text-foreground min-w-0 break-words">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : isEarring ? (
                <div className="space-y-5 text-[0.80rem] leading-[1.90]">
                  <p className="text-foreground font-medium">
                    Timeless luxury meets everyday brilliance in our{" "}
                    <span className="italic">3-Prong VVS Moissanite Stud Earrings.</span>
                  </p>
                  <p className="text-muted-foreground">
                    Featuring{" "}
                    <strong className="text-foreground font-semibold">D Colorless VVS1 Moissanite</strong>{" "}
                    stones in a precision round brilliant cut, each pair is set in{" "}
                    <strong className="text-foreground font-semibold">solid S925 sterling silver</strong>{" "}
                    and available in{" "}
                    <strong className="text-foreground font-semibold">18K White Gold or 18K Yellow Gold</strong>{" "}
                    plating — five layers deep for lasting durability. The{" "}
                    <strong className="text-foreground font-semibold">threaded screw-back closure</strong>{" "}
                    locks your earrings securely in place — ideal for active wear, travel, or any occasion where you can't afford to lose a stone.
                  </p>
                  <p className="text-muted-foreground">
                    Crafted to be{" "}
                    <strong className="text-foreground font-semibold">hypoallergenic, lead-free, nickel-free, and cadmium-free</strong>,
                    making them safe for even the most sensitive ears.{" "}
                    <strong className="text-foreground font-semibold">GRA moissanite certificate</strong>{" "}
                    included with every order.
                  </p>
                  <p className="text-muted-foreground">
                    Available in five sizes — from a subtle{" "}
                    <strong className="text-foreground font-semibold">3mm</strong> everyday stud to a bold{" "}
                    <strong className="text-foreground font-semibold">8mm</strong> showstopper.
                    Choose the size and metal that matches your style.
                  </p>
                  <div className="border border-border">
                    {[
                      ["Stone",       "D Colorless VVS1 Moissanite"],
                      ["Cut",         "Round Brilliant · 3-Prong Setting"],
                      ["Base Metal",  "Solid S925 Sterling Silver"],
                      ["Plating",     "5× 18K White Gold & Yellow Gold"],
                      ["Closure",     "Screw-Back (Threaded)"],
                      ["Gender",      "Unisex — Men's & Women's"],
                      ["Health",      "Hypoallergenic · Lead-Free · Nickel-Free"],
                      ["Occasions",   "Daily · Anniversary · Wedding · Gifting"],
                      ["Certificate", "GRA Certified"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-start border-b border-border last:border-0 px-4 py-3 gap-3">
                        <span className="text-[0.44rem] uppercase tracking-[0.16em] text-muted-foreground/60 shrink-0 w-[72px] sm:w-[90px] pt-0.5">{k}</span>
                        <span className="text-[0.72rem] sm:text-[0.74rem] text-foreground min-w-0 break-words">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[0.80rem] leading-[1.90] text-muted-foreground">{product.description}</p>
              )}
            </AccordionSection>

            <AccordionSection title="Why VVS Moissanite?">
              <div className="grid sm:grid-cols-2 gap-3 mb-5">
                {[
                  { icon: Eye,         ...MOISSANITE_QUALITY.clarity },
                  { icon: Award,       ...MOISSANITE_QUALITY.color },
                  { icon: Diamond,     ...MOISSANITE_QUALITY.cut },
                  { icon: ShieldCheck, ...MOISSANITE_QUALITY.certificate },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="p-4 bg-cream border border-border">
                      <Icon className="h-3.5 w-3.5 text-gold/70 mb-3" />
                      <h4 className="text-[0.65rem] font-semibold tracking-wide mb-1.5">{item.label}</h4>
                      <p className="text-[0.62rem] text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>
                  );
                })}
              </div>
              <Link
                to="/moissanite-guide"
                className="inline-flex items-center gap-1.5 text-[0.55rem] uppercase tracking-[0.22em] lux-link text-muted-foreground hover:text-foreground transition-colors"
              >
                Full guide <ArrowRight className="h-2.5 w-2.5" />
              </Link>
            </AccordionSection>

            <AccordionSection title="Shipping & Returns">
              <div className="space-y-5">
                {[
                  {
                    icon: Truck,
                    title: "Free shipping over $250",
                    body: "Continental US. Orders under $250 ship for a flat $9.95.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "14-day returns",
                    body: "Unworn items in original packaging qualify for a full refund within 14 days of delivery.",
                  },
                  {
                    icon: Sparkles,
                    title: "Discreet luxury packaging",
                    body: "Every piece ships in a velvet pouch inside a matte black gift box. No pricing visible outside.",
                  },
                ].map(({ icon: Icon, title, body }) => (
                  <div key={title} className="flex gap-4">
                    <Icon className="h-3.5 w-3.5 text-gold/65 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[0.64rem] font-semibold mb-1">{title}</p>
                      <p className="text-[0.62rem] text-muted-foreground leading-relaxed">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionSection>

            <AccordionSection title="Common Questions">
              <div className="space-y-7">
                {(isTennis ? [
                  {
                    q: "Is this real moissanite or cubic zirconia?",
                    a: "100% genuine lab-grown moissanite — not CZ. Moissanite is silicon carbide (SiC) with a Mohs hardness of 9.25 and a refractive index of 2.65–2.69, exceeding diamond's 2.42. CZ is significantly softer (8.5 Mohs), loses brilliance over time, and is worth a fraction of the price. Every bracelet ships with a GRA (Gemological Research Association) certificate confirming authenticity.",
                  },
                  {
                    q: "Will the 18K gold plating wear off?",
                    a: "We plate 5× — most fashion jewellery gets 1–2 coats. With normal daily wear, our plating lasts 1–3 years before a touch-up is needed. To maximise longevity: remove before swimming, showering, or applying perfume. The S925 sterling silver base (92.5% pure silver) means even worn plating is safe and tarnish-resistant.",
                  },
                  {
                    q: "How do I choose the right width?",
                    a: "2mm: barely-there elegance — ideal for stacking or everyday subtle wear. 3mm: our most popular — visible sparkle without being loud. 4mm: bold daily wear, strong wrist presence. 5mm: full statement piece — maximum coverage, impressive on any wrist. 6mm: ultra iced out — makes a powerful statement. When in doubt, size up — undersizing is the most common regret.",
                  },
                  {
                    q: "How do I find my bracelet length?",
                    a: "Wrap a soft tape measure (or a strip of paper) around the widest part of your wrist. Note the measurement and add 0.5\"–1\" for a comfortable fit. Example: 7\" wrist → order 7.5\" or 8\" for relaxed wear. The 8\" is our most popular length — works for most wrists and gives a slight drape.",
                  },
                  {
                    q: "Is it safe for sensitive skin?",
                    a: "Yes. The S925 sterling silver base is hypoallergenic and the bracelet is completely nickel-free, lead-free, and cadmium-free. Even if the surface plating wears in areas of heavy contact, the metal touching your skin remains safe for all skin types.",
                  },
                ] : [
                  {
                    q: "Is this real moissanite or CZ?",
                    a: "100% genuine lab-grown moissanite — not CZ. Moissanite is silicon carbide (SiC) with a Mohs hardness of 9.25 and a refractive index of 2.65–2.69, which is higher than diamond. CZ is significantly softer and loses brilliance over time. Every pair ships with a GRA (Gemological Research Association) certificate confirming authenticity.",
                  },
                  {
                    q: "Will the 18K gold plating wear off?",
                    a: "We plate 5× — most fashion jewellery gets 1–2 coats. With normal wear, our plating lasts 1–3 years before a touch-up is needed. To maximise longevity: remove before swimming, showering, or applying perfume. The S925 sterling silver base means even light wear is safe and tarnish-resistant.",
                  },
                  {
                    q: "Are these safe for sensitive ears?",
                    a: "Yes. The S925 sterling silver base is hypoallergenic and the screw-back posts are completely nickel-free, lead-free, and cadmium-free. Even if surface plating wears at the post, the metal touching your skin remains safe for even the most sensitive ears.",
                  },
                  {
                    q: "Which size should I choose?",
                    a: "3mm: barely noticeable — great for every day or a second piercing. 4mm: the sweet spot, visible sparkle without being loud (our best seller). 5mm: clear statement piece. 6mm: bold and commanding. 8mm: maximum impact — true 'iced out' look. When in doubt, size up — undersizing is the most common buyer regret.",
                  },
                ]).map(({ q, a }) => (
                  <div key={q} className="border-b border-border/50 last:border-0 pb-6 last:pb-0">
                    <p className="text-[0.74rem] font-semibold mb-2.5">{q}</p>
                    <p className="text-[0.72rem] text-muted-foreground leading-[1.85]">{a}</p>
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* ── Product video — earrings, below all details ───── */}
            {/* Reviews */}
            <div id="reviews-section">
              <AccordionSection title={`Reviews${reviews.length > 0 ? ` (${reviews.length})` : ""}`}>
                {reviews.length > 0 ? (
                  <div className="space-y-5">
                    {reviews.map(r => (
                      <div key={r.id} className="border-b border-border pb-5 last:border-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <StarRow rating={r.rating} size="xs" />
                          {r.verified && (
                            <span className="text-[0.44rem] uppercase tracking-[0.16em] text-emerald-600 flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" /> Verified Purchase
                            </span>
                          )}
                        </div>
                        {r.title && <p className="text-[0.72rem] font-semibold mb-1">{r.title}</p>}
                        <p className="text-[0.72rem] text-muted-foreground leading-relaxed">{r.body}</p>
                        <p className="text-[0.50rem] uppercase tracking-[0.14em] text-muted-foreground/40 mt-2">
                          {r.customer_name} · {new Date(r.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[0.72rem] text-muted-foreground">No reviews yet — be the first!</p>
                )}
                {showReviewForm ? (
                  <ReviewForm slug={slug} onSuccess={() => setShowReviewForm(false)} />
                ) : (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="mt-5 text-[0.56rem] uppercase tracking-[0.22em] border-b border-foreground pb-0.5 hover:opacity-70 transition-opacity"
                  >
                    Write a Review
                  </button>
                )}
              </AccordionSection>
            </div>

            {isEarring && earringVideo && (
              <div className="border-t border-border pt-8 pb-4">
                <p className="text-[0.50rem] uppercase tracking-[0.30em] text-muted-foreground mb-1">See it in motion</p>
                <p className="text-[0.60rem] text-muted-foreground/55 mb-5">
                  VVS1 D Color · Round Brilliant · Natural light
                </p>
                <div className="relative bg-black overflow-hidden w-full">
                  <video
                    src={earringVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    className="w-full"
                    style={{ maxHeight: "min(75vw, 520px)", objectFit: "contain", display: "block" }}
                  />
                </div>
              </div>
            )}

            <div className="pt-7 flex gap-6">
              <Link
                to="/shop"
                className="inline-flex items-center gap-1.5 text-[0.56rem] uppercase tracking-[0.22em] lux-link text-muted-foreground hover:text-foreground transition-colors"
              >
                Continue shopping <ArrowRight className="h-2.5 w-2.5" />
              </Link>
              <Link
                to="/faq"
                className="inline-flex items-center gap-1.5 text-[0.56rem] uppercase tracking-[0.22em] lux-link text-muted-foreground hover:text-foreground transition-colors"
              >
                FAQ <ArrowRight className="h-2.5 w-2.5" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* ── Sticky mobile Add-to-Bag ─────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/96 backdrop-blur-xl border-t border-border"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-2 px-4 pt-3 pb-3">
          <div className="min-w-0" style={{ minWidth: 0, maxWidth: "38%" }}>
            <p className="text-[0.38rem] uppercase tracking-[0.18em] text-muted-foreground mb-0.5 truncate">{mobileConfigLabel}</p>
            <p className="font-display text-[1.1rem] leading-none truncate">{formatUSD(price * qty)}</p>
          </div>
          <button
            onClick={() => handleAdd(false)}
            className="flex-1 bg-foreground text-background py-3.5 text-[0.54rem] uppercase tracking-[0.24em] font-semibold flex items-center justify-center gap-2 hover:bg-foreground/90 active:scale-[0.99] transition-all"
          >
            {addedToBag
              ? <><Check className="h-3.5 w-3.5" /> Added</>
              : <><ShoppingBag className="h-3.5 w-3.5" /> Add to Bag</>
            }
          </button>
          <button
            onClick={() => handleAdd(true)}
            className="shrink-0 border border-foreground/25 px-4 py-3.5 text-[0.54rem] uppercase tracking-[0.16em] font-semibold hover:border-foreground hover:bg-foreground hover:text-background active:scale-[0.99] transition-all whitespace-nowrap"
          >
            Buy Now
          </button>
        </div>
      </div>

      {/* ── Complete the look ────────────────────────────────────── */}
      <section className="bg-cream border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-12 sm:py-16 lg:py-20">
          <div className="flex items-end justify-between mb-8 sm:mb-12">
            <div>
              <p className="eyebrow mb-3">You might also like</p>
              <h2 className="font-display" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)" }}>
                Complete the look
              </h2>
            </div>
            <Link
              to="/shop"
              className="hidden sm:inline-flex items-center gap-2 text-[0.56rem] uppercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors lux-link mb-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[
              isEarring
                ? { name: "Matching Chain", slug: siblingSlug, img: gallery[1] }
                : isRing
                  ? { name: `${COLOR_SHORT[product.color] ?? "Silver"} Tennis Chain`, slug: `${product.color}-moissanite-tennis-chain`, img: gallery[1] }
                  : { name: isBracelet ? "Matching Chain" : "Matching Bracelet", slug: siblingSlug, img: gallery[1] },
              { name: "All Silver", slug: "silver-moissanite-tennis-chain", img: gallery[2] },
              { name: "All Gold",   slug: "gold-moissanite-tennis-chain",   img: gallery[3] },
              isRing
                ? { name: "Engagement Rings", slug: `${product.color}-solitaire-moissanite-ring`, img: gallery[0] }
                : { name: isEarring ? "All Earrings" : "Complete the Set", slug: isEarring ? `${product.color}-moissanite-stud-earrings` : siblingSlug, img: gallery[0] },
            ].slice(0, 4).map(sugg => (
              <Link key={sugg.name} to="/product/$slug" params={{ slug: sugg.slug }} className="group block">
                <div className="aspect-[3/4] overflow-hidden bg-[oklch(0.97_0.004_75)] relative mb-3">
                  <img
                    src={sugg.img}
                    alt={sugg.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    loading="lazy"
                    decoding="async"
                  />
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
                    style={{ background: "var(--gradient-gold-h)" }}
                  />
                </div>
                <p className="text-[0.56rem] uppercase tracking-[0.20em] text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  {sugg.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <EmailCapture />
    </>
  );
}
