// Size and length pricing modifiers — applied on top of product base_price.
export const SIZES_NECKLACE = ["2mm", "3mm", "4mm", "5mm"] as const;
export const SIZES_BRACELET = ["2mm", "3mm", "4mm", "5mm"] as const;
export const LENGTHS_NECKLACE = ['18"', '20"', '24"'] as const;
export const LENGTH_BRACELET = '8"' as const;

export type Size = (typeof SIZES_NECKLACE)[number];
export type Length = (typeof LENGTHS_NECKLACE)[number] | typeof LENGTH_BRACELET;

const SIZE_MULTIPLIER: Record<Size, number> = {
  "2mm": 1,
  "3mm": 1.45,
  "4mm": 1.95,
  "5mm": 2.55,
};

const LENGTH_ADD: Record<string, number> = {
  '18"': 0,
  '20"': 30,
  '24"': 70,
  '8"': 0,
};

export function calculatePrice(basePrice: number, size: Size, length: Length): number {
  const sized = basePrice * SIZE_MULTIPLIER[size];
  return Math.round(sized + (LENGTH_ADD[length] ?? 0));
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
