export interface CommerceVariant {
  id: string;
  product_slug?: string;
  color: string | null;
  size: string | null;
  length: string | null;
  price_override: number | null;
  stock: number;
  is_active?: boolean;
}

export interface VariantSelection {
  color: string;
  size: string;
  length: string;
}

const specificity = (variant: CommerceVariant) =>
  Number(variant.color != null) + Number(variant.size != null) + Number(variant.length != null);

export function resolveConfiguredVariant(
  variants: CommerceVariant[],
  selection: VariantSelection,
): CommerceVariant | null {
  return (
    variants
      .filter((variant) => variant.is_active !== false)
      .filter(
        (variant) =>
          (variant.color == null || variant.color === selection.color) &&
          (variant.size == null || variant.size === selection.size) &&
          (variant.length == null || variant.length === selection.length),
      )
      .sort((a, b) => specificity(b) - specificity(a))[0] ?? null
  );
}

export function effectiveVariantPrice(variant: CommerceVariant | null, fallback: number): number {
  return variant?.price_override == null ? fallback : Number(variant.price_override);
}

export function canFulfillVariant(variant: CommerceVariant | null, quantity: number): boolean {
  if (!variant || quantity < 1) return false;
  return variant.stock === -1 || variant.stock >= quantity;
}

