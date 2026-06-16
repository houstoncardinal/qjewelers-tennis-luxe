// Static product data — complete catalog with all size × color × length variations
// Colors: S925 Sterling Silver, 18K Yellow Gold, 18K Rose Gold, 18K White Gold
// Necklace sizes: 2mm, 3mm, 4mm, 5mm, 6.5mm
// Necklace lengths: 16", 18", 20", 22", 24"
// Bracelet sizes: 2mm, 3mm, 4mm, 5mm, 6.5mm
// Bracelet lengths: 6", 7", 8", 9"
// Earring sizes: 3mm, 4mm, 5mm, 6.5mm
// ALL pieces: S925 Sterling Silver base metal + 5x precious metal plating + e-coating

export interface Product {
  id: string;
  slug: string;
  name: string;
  type: "necklace" | "bracelet" | "earring" | "ring";
  color: "silver" | "gold" | "rose_gold" | "white_gold";
  size: string | null;
  length: string | null;
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

const COLORS: { key: ColorKey; label: string; shortLabel: string; plated: string; bp: number; bpBracelet: number; bpEarring: number }[] = [
  {
    key: "silver",
    label: "S925 Sterling Silver",
    shortLabel: "Sterling Silver",
    plated: "5x rhodium e-coating over S925 sterling silver base",
    bp: 189,
    bpBracelet: 129,
    bpEarring: 89,
  },
  {
    key: "gold",
    label: "18K Yellow Gold",
    shortLabel: "Yellow Gold",
    plated: "5x 18K yellow gold plating with e-coating over S925 sterling silver base",
    bp: 219,
    bpBracelet: 159,
    bpEarring: 119,
  },
  {
    key: "rose_gold",
    label: "18K Rose Gold",
    shortLabel: "Rose Gold",
    plated: "5x 18K rose gold plating with e-coating over S925 sterling silver base",
    bp: 229,
    bpBracelet: 169,
    bpEarring: 129,
  },
  {
    key: "white_gold",
    label: "18K White Gold",
    shortLabel: "White Gold",
    plated: "5x 18K white gold rhodium plating with e-coating over S925 sterling silver base",
    bp: 229,
    bpBracelet: 169,
    bpEarring: 129,
  },
];

const SIZES: { key: string; mult: number }[] = [
  { key: "2mm", mult: 1 },
  { key: "3mm", mult: 1.45 },
  { key: "4mm", mult: 1.95 },
  { key: "5mm", mult: 2.55 },
  { key: "6.5mm", mult: 3.45 },
];

const EARRING_SIZES: { key: string; mult: number }[] = [
  { key: "3mm", mult: 1 },
  { key: "4mm", mult: 1.35 },
  { key: "5mm", mult: 1.85 },
  { key: "6.5mm", mult: 2.5 },
];

function necklaceDesc(colorLabel: string, plated: string, size: string): string {
  return `Hand-set VVS moissanite tennis chain featuring genuine S925 sterling silver as the base metal, with premium ${plated.toLowerCase()} applied in 5 layers and sealed with our proprietary e-coating for tarnish resistance, water resistance, and lifetime brilliance. Each stone is independently GRA certified at VVS clarity, D color.

Available in 2mm, 3mm, 4mm, 5mm, and 6.5mm widths. Necklace lengths: 16", 18", 20", 22", 24". Features a double-locking custom box clasp. Hypoallergenic, lead/nickel/cadmium free.

What makes this ${size || "signature"} chain different:
. S925 sterling silver core
. 5x ${colorLabel} plating with e-coating
. VVS clarity, D color moissanite
. GRA certificate of authenticity included
. Double-locking clasp for security
. Lifetime brilliance`;
}

const BRACELET_SIZE_PERSONALITY: Record<string, string> = {
  "2mm":   "Delicate enough for everyday wear and built for stacking — a constant, refined glimmer on the wrist that never feels heavy or overwhelming.",
  "3mm":   "The everyday icon. Substantial enough to command attention, refined enough to wear anywhere. This is the width most of our customers reach for first.",
  "4mm":   "Bold and unmistakable. Four millimeters of continuous round brilliant-cut fire across the wrist — the definitive statement piece in our lineup.",
  "5mm":   "Maximum wrist presence. At 5mm, every stone is clearly visible from across the room. This bracelet does not go unnoticed.",
  "6.5mm": "The full iced-out experience. Each individual stone at 6.5mm is enormous, and worn as a complete bracelet the effect is nothing short of breathtaking.",
};

function braceletDesc(colorLabel: string, plated: string, size: string): string {
  const personality = size !== "signature"
    ? BRACELET_SIZE_PERSONALITY[size] ?? "A timeless piece built to last."
    : "Available in five widths — 2mm (delicate), 3mm (everyday icon), 4mm (bold statement), 5mm (maximum presence), and 6.5mm (full iced-out) — each a completely different personality on the wrist.";

  return `Hand-set VVS moissanite tennis bracelet on a genuine S925 sterling silver base, finished with premium ${plated.toLowerCase()} applied in 5 layers and sealed with our proprietary e-coating for tarnish resistance and lasting brilliance.

${personality}

Every stone is round brilliant-cut, independently GRA certified at VVS clarity and D color — the highest grades available in moissanite. Each bracelet is verified using a professional Selector II moissanite tester before it ships, confirming every stone is genuine. Your GRA Moissanite Report arrives with your order.

The double-locking box clasp is machined to the same standard used in fine jewelry — it will not open accidentally. Four lengths available to fit every wrist: 6" (petite, snug fit), 7" (standard), 8" (relaxed, most popular), and 9" (loose fit). The bracelet is hypoallergenic — lead-free, nickel-free, cadmium-free.

What sets this bracelet apart from everything else at this price point:
· Genuine S925 sterling silver core — not brass, not copper, not mystery alloy
· 5× ${colorLabel} plating with proprietary e-coat seal — tarnish-resistant and water-resistant
· VVS clarity, D color moissanite — the same grades used in fine diamond jewelry
· Professional moissanite tester verified — every stone, every piece, before shipment
· GRA Moissanite Report included — an independently-issued certificate, not a prop
· Double-locking box clasp — engineered to never open by accident
· Hypoallergenic: zero lead, nickel, or cadmium`;
}

function earringDesc(colorLabel: string, plated: string, size: string): string {
  return `Hand-set VVS moissanite stud earrings featuring genuine S925 sterling silver as the base metal, with premium ${plated.toLowerCase()} applied in 5 layers and sealed with our proprietary e-coating for tarnish resistance and lasting brilliance. Each stone is independently GRA certified at VVS clarity, D color.

Available in 3mm, 4mm, 5mm, and 6.5mm sizes. Features push-back posts with secure friction backing. Hypoallergenic, lead/nickel/cadmium free. Sold as a pair.

What makes these ${size || "signature"} stud earrings different:
. S925 sterling silver core
. 5x ${colorLabel} plating with e-coating
. VVS clarity, D color moissanite
. GRA certificate included
. Secure push-back posts
. Lifetime brilliance`;
}

function shortDesc(size: string, colorLabel: string): string {
  const base = `${size} ${colorLabel} moissanite tennis chain. S925 base with 5x plating and e-coating. VVS clarity, GRA certified.`;
  return base;
}

const BRACELET_SIZE_TAGLINES: Record<string, string> = {
  "2mm":   "Delicate daily wear — effortless brilliance you never take off.",
  "3mm":   "The everyday icon — the width worn most, for good reason.",
  "4mm":   "Bold statement piece — four millimeters of continuous fire.",
  "5mm":   "Maximum wrist presence — every stone impossible to miss.",
  "6.5mm": "The full iced-out experience — enormous stones, breathtaking effect.",
};

function shortDescBracelet(size: string, colorLabel: string): string {
  if (size === "signature") {
    return `${colorLabel} VVS moissanite tennis bracelet — 2mm to 6.5mm widths. S925 sterling silver base, 5× ${colorLabel} plating, e-coat sealed. GRA certified. Lengths 6"–9".`;
  }
  const tagline = BRACELET_SIZE_TAGLINES[size] ?? "";
  return `${size} ${colorLabel} VVS moissanite tennis bracelet. ${tagline} S925 sterling silver base, 5× ${colorLabel} plating, e-coat sealed. GRA certified. Lengths 6"–9".`;
}

function shortDescEarring(size: string, colorLabel: string): string {
  return `${size} ${colorLabel} moissanite stud earrings. S925 base with 5x plating and e-coating. VVS GRA certified. Sold as a pair.`;
}

function braceletSeoTitle(size: string | null, colorLabel: string): string {
  if (!size) {
    return `${colorLabel} VVS Moissanite Tennis Bracelet | 2mm–6.5mm | GRA Certified | Qureshi Jewelers`;
  }
  return `${size} ${colorLabel} VVS Moissanite Tennis Bracelet | GRA Certified | Double-Locking Clasp | Qureshi Jewelers`;
}

function braceletSeoDesc(size: string | null, colorLabel: string): string {
  if (!size) {
    return `Shop the ${colorLabel} moissanite tennis bracelet collection. Genuine S925 sterling silver base, 5× ${colorLabel} plating, e-coat sealed. VVS clarity, D color — GRA Moissanite Report included. Professional Selector II tester-verified. Widths 2mm–6.5mm, lengths 6"–9". Free US shipping over $250.`;
  }
  return `Shop the ${size} ${colorLabel} VVS moissanite tennis bracelet. Genuine S925 sterling silver base, 5× ${colorLabel} plating, e-coat sealed. GRA Moissanite Report included. Professional Selector II tester-verified. Double-locking box clasp. Lengths 6"–9". Free US shipping over $250.`;
}

const BRACELET_SIZE_IMAGES: Record<string, string> = {
  "2mm":   "/2mmbracelet.jpg",
  "3mm":   "/3mmbracelet.jpg",
  "4mm":   "/4mmbracelet.jpg",
  "5mm":   "/5mmbracelet.jpg",
  "6.5mm": "/65mmbracelet.jpg",
};

const BRACELET_SIG_IMAGES: Record<ColorKey, string> = {
  silver:     "/braceletsmultiple.jpg",
  gold:       "/clasps.jpg",
  rose_gold:  "/braceletsvariety.png",
  white_gold: "/braceletslaidout.jpg",
};

function seoTitle(size: string, colorLabel: string, type: string): string {
  const map: Record<string, string> = {
    necklace: "Tennis Chain",
    bracelet: "Tennis Bracelet",
    earring: "Stud Earrings",
  };
  const t = map[type] || "Jewelry";
  return `${size} ${colorLabel} Moissanite ${t} | S925 VVS GRA Certified | Qureshi Jewelers`;
}

function seoDesc(size: string, colorLabel: string, type: string): string {
  const map: Record<string, string> = {
    necklace: "tennis chain",
    bracelet: "tennis bracelet",
    earring: "stud earrings",
  };
  const t = map[type] || "jewelry";
  return `Shop the ${size} ${colorLabel} moissanite ${t}. S925 sterling silver base with 5x precious metal plating and e-coating. VVS clarity, GRA certified. Free US shipping over $250.`;
}

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
      length: null,
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

for (const color of COLORS) {
  const slug = `${color.key}-moissanite-tennis-chain`;
  allProducts.push({
    id: `n-${color.key}-sig`,
    slug,
    name: `${color.label} Moissanite Tennis Chain`,
    type: "necklace",
    color: color.key,
    size: null,
    length: null,
    short_description: `${color.shortLabel} moissanite tennis chain. S925 base with 5x ${color.shortLabel} plating + e-coating. 2mm-6.5mm. VVS GRA certified.`,
    description: necklaceDesc(color.shortLabel, color.plated, "signature"),
    seo_title: `${color.shortLabel} Moissanite Tennis Chain | S925 VVS GRA | Qureshi Jewelers`,
    seo_description: `Shop the ${color.shortLabel} moissanite tennis chain. S925 sterling silver base with 5x ${color.shortLabel} plating and e-coating. VVS clarity, GRA certified. 2mm-6.5mm widths. Free US shipping.`,
    base_price: color.bp,
    image_url: "/main.jpg",
    is_featured: color.key === "silver" || color.key === "gold",
    is_active: true,
    sort_order: sortOrder++,
  });
}

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
      length: null,
      short_description: shortDescBracelet(size.key, color.shortLabel),
      description: braceletDesc(color.shortLabel, color.plated, size.key),
      seo_title: braceletSeoTitle(size.key, color.shortLabel),
      seo_description: braceletSeoDesc(size.key, color.shortLabel),
      base_price: price,
      image_url: BRACELET_SIZE_IMAGES[size.key] ?? "/braceletsmultiple.jpg",
      is_featured: false,
      is_active: true,
      sort_order: sortOrder++,
    });
  }
  allProducts.push({
    id: `b-${color.key}-sig`,
    slug: `${color.key}-moissanite-tennis-bracelet`,
    name: `${color.label} Moissanite Tennis Bracelet`,
    type: "bracelet",
    color: color.key,
    size: null,
    length: null,
    short_description: shortDescBracelet("signature", color.shortLabel),
    description: braceletDesc(color.shortLabel, color.plated, "signature"),
    seo_title: braceletSeoTitle(null, color.shortLabel),
    seo_description: braceletSeoDesc(null, color.shortLabel),
    base_price: basePrice,
    image_url: BRACELET_SIG_IMAGES[color.key],
    is_featured: false,
    is_active: true,
    sort_order: sortOrder++,
  });
}

for (const color of COLORS) {
  const basePrice = color.bpEarring;
  for (const size of EARRING_SIZES) {
    const price = Math.round(basePrice * size.mult);
    const slug = `${size.key}-${color.key}-moissanite-stud-earrings`;
    allProducts.push({
      id: `e-${color.key}-${size.key}`,
      slug,
      name: `${size.key} ${color.label} Moissanite Stud Earrings`,
      type: "earring",
      color: color.key,
      size: size.key,
      length: null,
      short_description: shortDescEarring(size.key, color.shortLabel),
      description: earringDesc(color.shortLabel, color.plated, size.key),
      seo_title: seoTitle(size.key, color.shortLabel, "earring"),
      seo_description: seoDesc(size.key, color.shortLabel, "earring"),
      base_price: price,
      image_url: "/main.jpg",
      is_featured: size.key === "4mm" || (size.key === "6.5mm" && color.key === "silver"),
      is_active: true,
      sort_order: sortOrder++,
    });
  }
  allProducts.push({
    id: `e-${color.key}-sig`,
    slug: `${color.key}-moissanite-stud-earrings`,
    name: `${color.label} Moissanite Stud Earrings`,
    type: "earring",
    color: color.key,
    size: null,
    length: null,
    short_description: `${color.shortLabel} moissanite stud earrings. S925 base with 5x ${color.shortLabel} plating + e-coating. 3mm-6.5mm. VVS GRA certified.`,
    description: earringDesc(color.shortLabel, color.plated, "signature"),
    seo_title: `${color.shortLabel} Moissanite Stud Earrings | S925 VVS GRA | Qureshi Jewelers`,
    seo_description: `Shop the ${color.shortLabel} moissanite stud earrings. S925 sterling silver base with 5x ${color.shortLabel} plating and e-coating. VVS clarity, GRA certified. 3mm-6.5mm sizes. Free US shipping.`,
    base_price: basePrice,
    image_url: "/main.jpg",
    is_featured: false,
    is_active: true,
    sort_order: sortOrder++,
  });
}

const RING_STONE_SIZES: { key: string; slugKey: string; label: string; mult: number }[] = [
  { key: "0.5ct", slugKey: "0-5ct", label: "0.5 Carat", mult: 1.0 },
  { key: "1ct",   slugKey: "1ct",   label: "1 Carat",   mult: 2.0 },
  { key: "1.5ct", slugKey: "1-5ct", label: "1.5 Carat", mult: 3.2 },
  { key: "2ct",   slugKey: "2ct",   label: "2 Carat",   mult: 4.8 },
  { key: "3ct",   slugKey: "3ct",   label: "3 Carat",   mult: 8.0 },
];

const RING_BASE_PRICES: Record<ColorKey, number> = {
  silver:     399,
  gold:       499,
  rose_gold:  549,
  white_gold: 549,
};

function ringDesc(colorLabel: string, plated: string, stoneSize: string): string {
  return `Classic 4-prong solitaire engagement ring featuring a hand-set VVS moissanite center stone, set in genuine S925 sterling silver with premium ${plated.toLowerCase()} applied in 5 layers and sealed with our proprietary e-coating. Each stone is independently GRA certified at VVS clarity, D color.

Available in 0.5ct, 1ct, 1.5ct, 2ct, and 3ct center stone sizes. Band width: 2mm. All rings are available in US sizes 4–12 — please specify your ring size in the order notes at checkout.

What makes this ${stoneSize} solitaire different:
. S925 sterling silver core
. 5x ${colorLabel} plating with e-coating
. VVS clarity, D color moissanite center stone
. GRA certificate of authenticity included
. Classic 4-prong solitaire setting
. Available in US ring sizes 4–12`;
}

for (const color of COLORS) {
  const basePrice = RING_BASE_PRICES[color.key];
  for (const stone of RING_STONE_SIZES) {
    const price = Math.round(basePrice * stone.mult);
    const slug = `${stone.slugKey}-${color.key}-solitaire-moissanite-ring`;
    allProducts.push({
      id: `r-${color.key}-${stone.slugKey}`,
      slug,
      name: `${stone.label} ${color.label} Solitaire Moissanite Ring`,
      type: "ring",
      color: color.key,
      size: stone.key,
      length: null,
      short_description: `${stone.label} ${color.shortLabel} solitaire moissanite ring. S925 base with 5x plating and e-coating. VVS clarity, GRA certified. US sizes 4–12.`,
      description: ringDesc(color.shortLabel, color.plated, stone.label),
      seo_title: `${stone.label} ${color.shortLabel} Solitaire Moissanite Engagement Ring | S925 VVS GRA | Qureshi Jewelers`,
      seo_description: `Shop the ${stone.label} ${color.shortLabel} solitaire moissanite engagement ring. S925 sterling silver base with 5x precious metal plating and e-coating. VVS clarity, GRA certified. US sizes 4–12. Free US shipping over $250.`,
      base_price: price,
      image_url: "/main.jpg",
      is_featured: stone.key === "1ct" && (color.key === "gold" || color.key === "silver"),
      is_active: true,
      sort_order: sortOrder++,
    });
  }
  allProducts.push({
    id: `r-${color.key}-sig`,
    slug: `${color.key}-solitaire-moissanite-ring`,
    name: `${color.label} Solitaire Moissanite Ring`,
    type: "ring",
    color: color.key,
    size: null,
    length: null,
    short_description: `${color.shortLabel} solitaire moissanite ring. S925 base with 5x ${color.shortLabel} plating + e-coating. 0.5ct–3ct center stones. VVS GRA certified.`,
    description: ringDesc(color.shortLabel, color.plated, "signature"),
    seo_title: `${color.shortLabel} Solitaire Moissanite Engagement Ring | S925 VVS GRA | Qureshi Jewelers`,
    seo_description: `Shop the ${color.shortLabel} solitaire moissanite engagement ring. S925 sterling silver base with 5x ${color.shortLabel} plating and e-coating. VVS clarity, GRA certified. 0.5ct–3ct sizes. Free US shipping.`,
    base_price: basePrice,
    image_url: "/main.jpg",
    is_featured: false,
    is_active: true,
    sort_order: sortOrder++,
  });
}

// ── Unified Tennis Bracelet — static fallback ─────────────────────────────
// Single listing page; size/length/metal selected by the user on the product page.
// base_price = $99 (3mm at 8", the most popular config) for listing card display.
allProducts.unshift({
  id:                "tennis-bracelet-vvs",
  slug:              "vvs-moissanite-tennis-bracelet",
  name:              "VVS1 D Moissanite Tennis Bracelet | 18K Gold Plated | S925 Sterling Silver",
  type:              "bracelet",
  color:             "gold",
  size:              null,
  length:            null,
  short_description: 'D Colorless VVS1 moissanite tennis bracelet on a solid S925 sterling silver base, 5× 18K yellow or white gold plated. 4-prong claw inlay setting, double-locking box clasp. Hypoallergenic & GRA certified. Widths 2mm–6mm, lengths 6"–9".',
  description:       "Pure ice. Every stone. Both wrists.\n\nOur VVS1 Moissanite Tennis Bracelet is built for the wrist that demands nothing less than the finest. Each stone is a D Colorless VVS1 moissanite in a precision round brilliant cut, held in a 4-prong claw inlay setting.\n\nThe base is solid S925 sterling silver, electroplated 5× in 18K gold. Choose 18K Yellow Gold or 18K White Gold. Double-locking box clasp. Widths 2mm–6mm, lengths 6\"–9\".",
  seo_title:         "VVS1 Moissanite Tennis Bracelet | 5× 18K Gold Plated | S925 | Qureshi Jewelers",
  seo_description:   'D Colorless VVS1 moissanite tennis bracelet. Solid S925 sterling silver, 5× 18K yellow or white gold plated. 4-prong claw setting, double-locking box clasp. Hypoallergenic. Widths 2mm–6mm, lengths 6"–9".',
  base_price:        99,
  image_url:         "/TennisBracelet/yellowgoldmain.jpg",
  is_featured:       true,
  is_active:         true,
  sort_order:        2,
});

export const ALL_PRODUCTS: Product[] = allProducts;