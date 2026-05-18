// Static product data — complete catalog with all size × color variations
// Colors: S925 Sterling Silver, 18K Yellow Gold, 18K Rose Gold, 18K White Gold
// Sizes: 2mm, 3mm, 4mm, 5mm, 6.5mm
// Lengths: 16", 18", 20", 22", 24" (necklaces) | 8" (bracelets)
// ALL pieces: S925 Sterling Silver base metal + 5× precious metal plating + e-coating

export interface Product {
  id: string;
  slug: string;
  name: string;
  type: "necklace" | "bracelet";
  color: "silver" | "gold" | "rose_gold" | "white_gold";
  size: string | null;
  short_description: string;
  description: string;
  seo_title: string;
  seo_description: string;
  base_price: number;
  image_url: string;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
}

type ColorKey = "silver" | "gold" | "rose_gold" | "white_gold";

const COLORS: { key: ColorKey; label: string; shortLabel: string; plated: string; bp: number; bpBracelet: number }[] = [
  {
    key: "silver",
    label: "S925 Sterling Silver",
    shortLabel: "Sterling Silver",
    plated: "5× rhodium e-coating over S925 sterling silver base",
    bp: 189,
    bpBracelet: 129,
  },
  {
    key: "gold",
    label: "18K Yellow Gold",
    shortLabel: "Yellow Gold",
    plated: "5× 18K yellow gold plating with e-coating over S925 sterling silver base",
    bp: 219,
    bpBracelet: 159,
  },
  {
    key: "rose_gold",
    label: "18K Rose Gold",
    shortLabel: "Rose Gold",
    plated: "5× 18K rose gold plating with e-coating over S925 sterling silver base",
    bp: 229,
    bpBracelet: 169,
  },
  {
    key: "white_gold",
    label: "18K White Gold",
    shortLabel: "White Gold",
    plated: "5× 18K white gold rhodium plating with e-coating over S925 sterling silver base",
    bp: 229,
    bpBracelet: 169,
  },
];

const SIZES: { key: string; mult: number }[] = [
  { key: "2mm", mult: 1 },
  { key: "3mm", mult: 1.45 },
  { key: "4mm", mult: 1.95 },
  { key: "5mm", mult: 2.55 },
  { key: "6.5mm", mult: 3.45 },
];

// === Shared description templates ===
function necklaceDesc(colorLabel: string, plated: string, size: string): string {
  return `Hand-set VVS moissanite tennis chain featuring genuine S925 sterling silver as the base metal, with premium ${plated.toLowerCase()} applied in 5 layers and sealed with our proprietary e-coating for tarnish resistance, water resistance, and lifetime brilliance. Each stone is independently GRA certified at VVS clarity, D color — the highest possible grade.

Available in 2mm, 3mm, 4mm, 5mm, and 6.5mm widths. Necklace lengths: 16", 18", 20", 22", 24". Features a double-locking custom box clasp. Hypoallergenic, lead/nickel/cadmium free.

What makes this ${size || "signature"} chain different:
· S925 sterling silver core — not plated brass or stainless steel
· 5× ${colorLabel} plating with molecular-bonded e-coating
· VVS clarity, D color moissanite — outshines diamond
· GRA certificate of authenticity included with every order
· Double-locking clasp for security
· Lifetime brilliance — backed by our guarantee`;
}

function braceletDesc(colorLabel: string, plated: string, size: string): string {
  return `Hand-set VVS moissanite tennis bracelet featuring genuine S925 sterling silver as the base metal, with premium ${plated.toLowerCase()}. The 5-layer plating is locked in with our proprietary e-coating for lasting shine. 8-inch length with double-locking custom box clasp.

GRA certified VVS clarity, D color moissanite. Available in 2mm, 3mm, 4mm, 5mm, and 6.5mm widths.

What makes this ${size || "signature"} bracelet different:
· S925 sterling silver core — not plated base metals
· 5× ${colorLabel} plating with e-coating protection
· VVS clarity, D color — the highest moissanite grade
· GRA certificate included
· Double-locking clasp for security`;
}

function shortDesc(size: string, colorLabel: string): string {
  const base = `${size} ${colorLabel} moissanite tennis chain. S925 sterling silver base with 5× precious metal plating and e-coating. VVS clarity, GRA certified.`;
  if (size === "2mm") return `${base} Delicate daily wear.`;
  if (size === "6.5mm") return `${base} Ultra-heavy iced out. Maximum presence.`;
  return `${base} Premium hand-set craftsmanship.`;
}

function seoTitle(size: string, colorLabel: string, type: string): string {
  const t = type === "bracelet" ? "Tennis Bracelet" : "Tennis Chain";
  return `${size} ${colorLabel} Moissanite ${t} | S925 VVS GRA Certified | Qureshi Jewelers`;
}

function seoDesc(size: string, colorLabel: string, type: string): string {
  const t = type === "bracelet" ? "tennis bracelet" : "tennis chain";
  return `Shop the ${size} ${colorLabel} moissanite ${t}. S925 sterling silver base with 5× precious metal plating and e-coating. VVS clarity, GRA certified. Double-locking clasp. Free US shipping over $250.`;
}

// Generate all necklace products
const allProducts: Product[] = [];
let sortOrder = 1;

for (const color of COLORS) {
  for (const size of SIZES) {
    const price = Math.round(color.bp * size.mult);
    const slug = `${size.key}-${color.key}-moissanite-tennis-chain`;
    allProducts.push({
      id: `n-${color.key}-${size.key}`,
      slug,
      name: `${size.key} ${color.label} Moissanite Tennis Chain`,
      type: "necklace",
      color: color.key,
      size: size.key,
      short_description: shortDesc(size.key, color.shortLabel),
      description: necklaceDesc(color.shortLabel, color.plated, size.key),
      seo_title: seoTitle(size.key, color.shortLabel, "necklace"),
      seo_description: seoDesc(size.key, color.shortLabel, "necklace"),
      base_price: price,
      image_url: "/main.jpg",
      is_featured: size.key === "3mm" || (size.key === "4mm" && color.key === "silver"),
      is_active: true,
      sort_order: sortOrder++,
    });
  }
}

// Signature products (no size — PDP handles selection)
for (const color of COLORS) {
  const slug = `${color.key}-moissanite-tennis-chain`;
  allProducts.push({
    id: `n-${color.key}-sig`,
    slug,
    name: `${color.label} Moissanite Tennis Chain`,
    type: "necklace",
    color: color.key,
    size: null,
    short_description: `${color.shortLabel} moissanite tennis chain. S925 base with 5× ${color.shortLabel} plating + e-coating. 2mm-6.5mm. VVS GRA certified.`,
    description: necklaceDesc(color.shortLabel, color.plated, "signature"),
    seo_title: `${color.shortLabel} Moissanite Tennis Chain | S925 VVS GRA | Qureshi Jewelers`,
    seo_description: `Shop the ${color.shortLabel} moissanite tennis chain. S925 sterling silver base with 5× ${color.shortLabel} plating and e-coating. VVS clarity, GRA certified. 2mm-6.5mm widths. Free US shipping.`,
    base_price: color.bp,
    image_url: "/main.jpg",
    is_featured: color.key === "silver" || color.key === "gold",
    is_active: true,
    sort_order: sortOrder++,
  });
}

// Bracelet products
for (const color of COLORS) {
  const basePrice = color.bpBracelet;
  for (const size of SIZES) {
    const price = Math.round(basePrice * size.mult);
    const slug = `${size.key}-${color.key}-moissanite-tennis-bracelet`;
    allProducts.push({
      id: `b-${color.key}-${size.key}`,
      slug,
      name: `${size.key} ${color.label} Moissanite Tennis Bracelet`,
      type: "bracelet",
      color: color.key,
      size: size.key,
      short_description: `${size.key} ${color.shortLabel} moissanite tennis bracelet. 8" S925 base with 5× plating + e-coating. VVS GRA certified.`,
      description: braceletDesc(color.shortLabel, color.plated, size.key),
      seo_title: seoTitle(size.key, color.shortLabel, "bracelet"),
      seo_description: seoDesc(size.key, color.shortLabel, "bracelet"),
      base_price: price,
      image_url: "/main.jpg",
      is_featured: false,
      is_active: true,
      sort_order: sortOrder++,
    });
  }
  // Signature bracelet
  allProducts.push({
    id: `b-${color.key}-sig`,
    slug: `${color.key}-moissanite-tennis-bracelet`,
    name: `${color.label} Moissanite Tennis Bracelet`,
    type: "bracelet",
    color: color.key,
    size: null,
    short_description: `8" ${color.shortLabel} moissanite tennis bracelet. S925 base with 5× ${color.shortLabel} plating + e-coating. VVS GRA certified.`,
    description: braceletDesc(color.shortLabel, color.plated, "signature"),
    seo_title: `${color.shortLabel} Moissanite Tennis Bracelet | S925 VVS GRA | Qureshi Jewelers`,
    seo_description: `Shop the 8" ${color.shortLabel} moissanite tennis bracelet. S925 sterling silver base with 5× ${color.shortLabel} plating and e-coating. VVS clarity, GRA certified. 2mm-6.5mm widths. Free US shipping.`,
    base_price: basePrice,
    image_url: "/main.jpg",
    is_featured: false,
    is_active: true,
    sort_order: sortOrder++,
  });
}

export const ALL_PRODUCTS: Product[] = allProducts;