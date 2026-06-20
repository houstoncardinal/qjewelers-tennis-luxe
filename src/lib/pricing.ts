// Size and length pricing modifiers — applied on top of product base_price.
export const SIZES_NECKLACE = ["2mm", "3mm", "4mm", "5mm", "6.5mm"] as const;
export const SIZES_BRACELET = ["2mm", "3mm", "4mm", "5mm", "6.5mm"] as const;
export const SIZES_EARRING = ["3mm", "4mm", "5mm", "6mm", "8mm"] as const;
export const LENGTHS_NECKLACE = ['16"', '18"', '20"', '22"', '24"'] as const;
export const LENGTHS_BRACELET = ['6"', '7"', '8"', '9"'] as const;
export const LENGTH_BRACELET_DEFAULT = '8"' as const;

export type Size = (typeof SIZES_NECKLACE)[number];
export type EarringSize = (typeof SIZES_EARRING)[number];
export type Length = (typeof LENGTHS_NECKLACE)[number] | (typeof LENGTHS_BRACELET)[number];

const SIZE_MULTIPLIER: Record<string, number> = {
  "2mm": 1,
  "3mm": 1.45,
  "4mm": 1.95,
  "5mm": 2.55,
  "6.5mm": 3.45,
};

const EARRING_SIZE_MULTIPLIER: Record<string, number> = {
  "3mm": 1,
  "4mm": 1.17,
  "5mm": 1.34,
  "6mm": 1.85,
  "8mm": 2.69,
};

const LENGTH_ADD: Record<string, number> = {
  '16"': -20,
  '18"': 0,
  '20"': 30,
  '22"': 50,
  '24"': 70,
  '6"': -25,
  '7"': -12,
  '8"': 0,
  '9"': 18,
};

export function calculatePrice(basePrice: number, size: Size, length: Length): number {
  const sized = basePrice * (SIZE_MULTIPLIER[size] ?? 1);
  return Math.max(99, Math.round(sized + (LENGTH_ADD[length] ?? 0)));
}

export function calculateEarringPrice(basePrice: number, size: EarringSize): number {
  return Math.max(59, Math.round(basePrice * (EARRING_SIZE_MULTIPLIER[size] ?? 1)));
}

export function formatUSD(amount: number): string {
  const hasCents = amount % 1 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(amount);
}

export const COLOR_MAP: Record<string, { label: string; hex: string; plated: string; slugColor: string }> = {
  silver: {
    label: "S925 Sterling Silver",
    hex: "#C0C0C0",
    plated: "S925 Sterling Silver",
    slugColor: "sterling-silver",
  },
  gold: {
    label: "18K Yellow Gold",
    hex: "#D4AF37",
    plated: "18K Yellow Gold",
    slugColor: "yellow-gold",
  },
  rose_gold: {
    label: "18K Rose Gold",
    hex: "#B76E79",
    plated: "18K Rose Gold",
    slugColor: "rose-gold",
  },
  white_gold: {
    label: "18K White Gold",
    hex: "#F5F5F5",
    plated: "18K White Gold",
    slugColor: "white-gold",
  },
};

export const COLOR_SHORT: Record<string, string> = {
  silver: "Sterling Silver",
  gold: "Yellow Gold",
  rose_gold: "Rose Gold",
  white_gold: "White Gold",
};

export const SIZE_DESCRIPTIONS: Record<string, string> = {
  "2mm": "Subtle · Daily wear / layering",
  "3mm": "Versatile · The sweet spot",
  "4mm": "Statement · Bold presence",
  "5mm": "Bold · Maximum ice",
  "6.5mm": "Ultra · Heavy iced out",
};

export const EARRING_SIZE_DESCRIPTIONS: Record<string, string> = {
  "3mm": "Subtle · Everyday sparkle",
  "4mm": "Classic · The sweet spot",
  "5mm": "Statement · Bold look",
  "6mm": "Ultra · Maximum brilliance",
  "8mm": "Showstopper · Iced out",
};

export const LENGTH_DESCRIPTIONS: Record<string, string> = {
  '16"': 'Choker · Snug fit',
  '18"': 'Princess · Collarbone',
  '20"': 'Matinee · Below collarbone (most popular)',
  '22"': 'Opera · Mid-chest',
  '24"': 'Long · Full chest',
};

export const BRACELET_LENGTH_DESCRIPTIONS: Record<string, string> = {
  '6"': 'Petite · Snug fit',
  '7"': 'Standard · Classic fit',
  '8"': 'Comfort · Relaxed fit (most popular)',
  '9"': 'Loose · Extra room',
};

// Moissanite quality info
export const MOISSANITE_QUALITY = {
  clarity: {
    label: "VVS (Very Very Slightly Included)",
    description: "The highest practical clarity grade — invisible to the naked eye even under 10× magnification.",
  },
  color: {
    label: "D Color (Colorless)",
    description: "The highest color grade on the GIA scale. Completely colorless for purest brilliance.",
  },
  cut: {
    label: "Brilliant Cut",
    description: "Precision 57-58 facets. Moissanite's refractive index (2.65-2.69) exceeds diamond (2.42).",
  },
  certificate: {
    label: "GRA Certified",
    description: "Every Qureshi piece ships with an independent GRA certificate of authenticity.",
  },
};

export const SIZES_RING = ["0.5ct", "1ct", "1.5ct", "2ct", "3ct"] as const;
export type RingSize = (typeof SIZES_RING)[number];

const RING_SIZE_MULTIPLIER: Record<string, number> = {
  "0.5ct": 1.0,
  "1ct": 2.0,
  "1.5ct": 3.2,
  "2ct": 4.8,
  "3ct": 8.0,
};

export function calculateRingPrice(basePrice: number, stoneSize: RingSize): number {
  return Math.max(299, Math.round(basePrice * (RING_SIZE_MULTIPLIER[stoneSize] ?? 1)));
}

export const RING_SIZE_DESCRIPTIONS: Record<string, string> = {
  "0.5ct": "Delicate · 5mm · Everyday elegance",
  "1ct": "Classic · 6.5mm · Most popular",
  "1.5ct": "Stunning · 7.5mm center stone",
  "2ct": "Luxurious · 8mm center stone",
  "3ct": "Statement · 9mm · Maximum sparkle",
};

// ─── Admin Variant Options ──────────────────────────────────────────────────
// Shared across the product editor and the new-product screen so generated
// variants always draw from the same option set.

export const AVAILABLE_SIZES = ["2mm", "3mm", "4mm", "5mm", "6mm", "6.5mm", "8mm"];
export const AVAILABLE_LENGTHS = ['6"', '6.5"', '7"', '7.5"', '8"', '8.5"', '9"', '16"', '18"', '20"', '22"', '24"'];
export const AVAILABLE_COLORS = ["silver", "gold", "rose_gold", "white_gold"];

export const COLOR_LABELS: Record<string, string> = {
  silver:     "Sterling Silver",
  gold:       "18K Yellow Gold",
  rose_gold:  "18K Rose Gold",
  white_gold: "18K White Gold",
};

export const COLOR_HEX: Record<string, string> = {
  silver:     "#C0C0C0",
  gold:       "#D4AF37",
  rose_gold:  "#B76E79",
  white_gold: "#E8E8F4",
};

export const TYPE_LABELS: Record<string, string> = {
  necklace: "Chain / Necklace",
  bracelet: "Bracelet",
  earring:  "Earring",
  ring:     "Ring",
};

export const isTennisBraceletSlug = (slug: string) => slug.includes("tennis") && slug.includes("bracelet");

// ─── Tennis Bracelet ─────────────────────────────────────────────────────────

export const SIZES_TENNIS_BRACELET = ["2mm", "3mm", "4mm", "5mm", "6mm"] as const;
export type TennisBraceletSize = (typeof SIZES_TENNIS_BRACELET)[number];

export const LENGTHS_TENNIS_BRACELET = ['6"', '6.5"', '7"', '7.5"', '8"', '8.5"', '9"'] as const;
export type TennisBraceletLength = (typeof LENGTHS_TENNIS_BRACELET)[number];

export const TENNIS_BRACELET_LENGTH_DEFAULT = '8"' as const;

export const TENNIS_BRACELET_PRICES: Record<string, Record<string, number>> = {
  "2mm": { '6"': 107.50, '6.5"': 116.68, '7"': 125.42, '7.5"': 134.60, '8"': 143.34, '8.5"': 152.08, '9"': 160.82 },
  "3mm": { '6"': 149.46, '6.5"': 162.12, '7"': 174.36, '7.5"': 187.04, '8"': 199.28, '8.5"': 211.94, '9"': 224.18 },
  "4mm": { '6"': 209.32, '6.5"': 226.80, '7"': 244.28, '7.5"': 261.32, '8"': 279.24, '8.5"': 295.84, '9"': 312.90 },
  "5mm": { '6"': 224.62, '6.5"': 243.40, '7"': 261.76, '7.5"': 280.56, '8"': 299.34, '8.5"': 318.14, '9"': 333.86 },
  "6mm": { '6"': 313.32, '6.5"': 339.98, '7"': 366.20, '7.5"': 397.24, '8"': 419.96, '8.5"': 446.18, '9"': 472.84 },
};

export function getTennisBraceletPrice(size: string, length: string): number {
  return TENNIS_BRACELET_PRICES[size]?.[length] ?? 99;
}

export const TENNIS_BRACELET_SIZE_DESCRIPTIONS: Record<string, string> = {
  "2mm": "Delicate · Subtle everyday ice",
  "3mm": "Classic · Most popular",
  "4mm": "Premium · Bold presence",
  "5mm": "Statement · Fully iced",
  "6mm": "Ultra · Maximum ice",
};

export const TENNIS_BRACELET_LENGTH_DESCRIPTIONS: Record<string, string> = {
  '6"':   'Petite · Very snug fit',
  '6.5"': 'Small · Snug fit',
  '7"':   'Medium · Standard fit',
  '7.5"': 'Standard · Relaxed fit',
  '8"':   'Comfort · Most popular',
  '8.5"': 'Large · Loose fit',
  '9"':   'XL · Extra room',
};

export const MOISSANITE_VS_DIAMOND = [
  { attribute: "Brilliance (RI)", moissanite: "2.65–2.69", diamond: "2.42", winner: "moissanite" },
  { attribute: "Fire (dispersion)", moissanite: "0.104", diamond: "0.044", winner: "moissanite" },
  { attribute: "Hardness (Mohs)", moissanite: "9.25", diamond: "10", winner: "diamond" },
  { attribute: "Clarity available", moissanite: "VVS (eye-clean)", diamond: "VVS (eye-clean)", winner: "tie" },
  { attribute: "Color grade", moissanite: "D (colorless)", diamond: "D (colorless)", winner: "tie" },
  { attribute: "Price per carat", moissanite: "~$300", diamond: "~$15,000+", winner: "moissanite" },
  { attribute: "Conflict free", moissanite: "Lab-created", diamond: "Varies", winner: "moissanite" },
  { attribute: "Eco footprint", moissanite: "Low (lab)", diamond: "High (mined)", winner: "moissanite" },
];
