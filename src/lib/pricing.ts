// Size and length pricing modifiers — applied on top of product base_price.
export const SIZES_NECKLACE = ["2mm", "3mm", "4mm", "5mm", "6.5mm"] as const;
export const SIZES_BRACELET = ["2mm", "3mm", "4mm", "5mm", "6.5mm"] as const;
export const LENGTHS_NECKLACE = ['16"', '18"', '20"', '22"', '24"'] as const;
export const LENGTH_BRACELET = '8"' as const;

export type Size = (typeof SIZES_NECKLACE)[number];
export type Length = (typeof LENGTHS_NECKLACE)[number] | typeof LENGTH_BRACELET;

const SIZE_MULTIPLIER: Record<string, number> = {
  "2mm": 1,
  "3mm": 1.45,
  "4mm": 1.95,
  "5mm": 2.55,
  "6.5mm": 3.45,
};

const LENGTH_ADD: Record<string, number> = {
  '16"': -20,
  '18"': 0,
  '20"': 30,
  '22"': 50,
  '24"': 70,
  '8"': 0,
};

export function calculatePrice(basePrice: number, size: Size, length: Length): number {
  const sized = basePrice * SIZE_MULTIPLIER[size];
  return Math.max(99, Math.round(sized + (LENGTH_ADD[length] ?? 0)));
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
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

export const LENGTH_DESCRIPTIONS: Record<string, string> = {
  '16"': "Choker · Snug fit",
  '18"': "Princess · Collarbone",
  '20"': "Matinee · Below collarbone (most popular)",
  '22"': "Opera · Mid-chest",
  '24"': "Long · Full chest",
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