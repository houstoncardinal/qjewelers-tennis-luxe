import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { lowestCatalogPrice } from "@/lib/pricing";

const DEFAULT_SITE_URL = "https://qureshijewelers.com";
const DEFAULT_BRAND = "Qureshi Jewelers";
const DEFAULT_CATEGORY = "Apparel & Accessories > Jewelry";

type FeedProduct = {
  slug: string;
  name: string;
  type: string | null;
  color: string | null;
  size: string | null;
  length: string | null;
  short_description: string | null;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  base_price: number | null;
  sale_price: number | null;
  sale_active: boolean | null;
  image_url: string | null;
  is_active: boolean | null;
  track_inventory?: boolean | null;
  stock_quantity?: number | null;
  updated_at?: string | null;
  variant_inventory?: boolean | null;
  variants_in_stock?: boolean | null;
  variants?: Array<{ price_override: number | null; size?: string | null; length?: string | null; stock?: number; is_active?: boolean }>;
};

export type MerchantFeedIssue = {
  slug: string;
  name: string;
  severity: "error" | "warning";
  field: string;
  message: string;
};

function siteUrl(): string {
  return (process.env.VITE_SITE_URL ?? import.meta.env.VITE_SITE_URL ?? DEFAULT_SITE_URL).replace(/\/$/, "");
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max - 1).trimEnd() : value;
}

function absoluteUrl(value: string | null | undefined): string {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${siteUrl()}${value.startsWith("/") ? value : `/${value}`}`;
}

// Uses the same variant-aware resolver as the storefront, cart validation,
// and structured data — sizing/length pricing for configurable products
// (tennis chains, bracelets, rings) is NOT the same as raw base_price, so a
// feed built from base_price alone can advertise a price Google's crawler
// won't find on the actual landing page (a common cause of feed suspension).
function catalogProduct(product: FeedProduct) {
  return {
    slug: product.slug,
    type: product.type ?? "",
    base_price: Number(product.base_price ?? 0),
    sale_price: product.sale_price,
    sale_active: product.sale_active ?? false,
  };
}

function price(product: FeedProduct): number {
  return lowestCatalogPrice(catalogProduct(product), product.variants ?? []);
}

// The pre-discount price shown alongside <g:sale_price> per Google's feed spec.
function regularPrice(product: FeedProduct): number {
  return lowestCatalogPrice({ ...catalogProduct(product), sale_active: false }, product.variants ?? []);
}

function availability(product: FeedProduct): "in_stock" | "out_of_stock" {
  if (product.variant_inventory) return product.variants_in_stock ? "in_stock" : "out_of_stock";
  if (product.track_inventory && product.stock_quantity != null && Number(product.stock_quantity) <= 0) {
    return "out_of_stock";
  }
  return "in_stock";
}

function titleFor(product: FeedProduct): string {
  const title = product.seo_title?.trim() || product.name?.trim() || product.slug;
  return truncate(stripHtml(title), 150);
}

function descriptionFor(product: FeedProduct): string {
  const description = product.seo_description?.trim() || product.short_description?.trim() || product.description?.trim() || product.name;
  return truncate(stripHtml(description ?? ""), 5000);
}

function itemGroupId(product: FeedProduct): string {
  return product.slug
    .replace(/-(white|yellow|rose)-gold/g, "")
    .replace(/-\d+(mm|ct|inch|in)$/g, "")
    .slice(0, 50);
}

function productId(product: FeedProduct): string {
  return product.slug.slice(0, 50);
}

function productType(product: FeedProduct): string {
  const type = product.type?.trim();
  if (!type) return "Jewelry";
  const labels: Record<string, string> = {
    necklace: "Jewelry > Necklaces",
    bracelet: "Jewelry > Bracelets",
    earring: "Jewelry > Earrings",
    ring: "Jewelry > Rings",
  };
  return labels[type] ?? `Jewelry > ${type}`;
}

export function validateMerchantProduct(product: FeedProduct): MerchantFeedIssue[] {
  const issues: MerchantFeedIssue[] = [];
  const add = (severity: MerchantFeedIssue["severity"], field: string, message: string) => {
    issues.push({ slug: product.slug, name: product.name, severity, field, message });
  };

  if (!product.slug?.trim()) add("error", "id", "Missing product slug for the feed ID.");
  if (!product.name?.trim()) add("error", "title", "Missing product name.");
  if (!descriptionFor(product)) add("error", "description", "Missing product description or SEO description.");
  if (!absoluteUrl(product.image_url)) add("error", "image_link", "Missing product image URL.");
  if (price(product) <= 0) add("error", "price", "Missing or invalid product price.");
  if (!product.is_active) add("warning", "availability", "Product is inactive and will not be included.");
  if (!product.seo_title?.trim()) add("warning", "title", "SEO title is empty; feed will use product name.");
  if (!product.seo_description?.trim()) add("warning", "description", "SEO description is empty; feed will use product copy.");
  if (!product.color?.trim()) add("warning", "color", "Color helps Google understand jewelry variants.");

  return issues;
}

const PRODUCT_SELECT =
  "slug, name, type, color, size, length, short_description, description, seo_title, seo_description, base_price, sale_price, sale_active, image_url, is_active, track_inventory, stock_quantity, updated_at";

// Attaches each product's active variants (needed to price it the same way
// the storefront/cart/checkout do) plus the inventory-derived availability
// flags used by validateMerchantProduct.
async function attachVariants(products: FeedProduct[]): Promise<FeedProduct[]> {
  if (!products.length) return [];
  const { data: variants, error: variantError } = await (supabaseAdmin as any)
    .from("product_variants")
    .select("product_slug, stock, is_active, price_override, size, length")
    .in("product_slug", products.map((product) => product.slug))
    .eq("is_active", true);
  if (variantError) throw new Error(variantError.message);
  return products.map((product) => {
    const productVariants = (variants ?? []).filter((variant: any) => variant.product_slug === product.slug);
    return {
      ...product,
      variants: productVariants,
      variant_inventory: productVariants.length > 0,
      variants_in_stock: productVariants.some((variant: any) => Number(variant.stock) === -1 || Number(variant.stock) > 0),
    };
  });
}

export async function fetchMerchantProducts(): Promise<FeedProduct[]> {
  const { data, error } = await (supabaseAdmin as any)
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return attachVariants((data ?? []) as FeedProduct[]);
}

export async function getMerchantFeedReadiness() {
  const { data, error } = await (supabaseAdmin as any)
    .from("products")
    .select(PRODUCT_SELECT)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);

  const products = await attachVariants((data ?? []) as FeedProduct[]);
  const activeProducts = products.filter((p) => p.is_active);
  const issues = products.flatMap(validateMerchantProduct);
  const activeErrors = issues.filter((i) => i.severity === "error" && activeProducts.some((p) => p.slug === i.slug));

  return {
    totalProducts: products.length,
    activeProducts: activeProducts.length,
    readyProducts: activeProducts.filter((p) => validateMerchantProduct(p).every((i) => i.severity !== "error")).length,
    issues,
    feedUrl: `${siteUrl()}/google-merchant.xml`,
    merchantCenterUrl: "https://merchants.google.com/mc/products/sources",
  };
}

export function buildGoogleMerchantXml(products: FeedProduct[]): string {
  const items = products
    .filter((product) => validateMerchantProduct(product).every((issue) => issue.severity !== "error"))
    .map((product) => {
      const link = `${siteUrl()}/product/${encodeURIComponent(product.slug)}`;
      const image = absoluteUrl(product.image_url);
      const effectivePrice = price(product);
      const regular = regularPrice(product);
      const displayPrice = `${effectivePrice.toFixed(2)} USD`;
      const saleTag = product.sale_active && effectivePrice < regular
        ? `\n      <g:sale_price>${escapeXml(displayPrice)}</g:sale_price>`
        : "";
      const optional = [
        product.color ? `<g:color>${escapeXml(product.color)}</g:color>` : "",
        product.size ? `<g:size>${escapeXml(product.size)}</g:size>` : "",
        product.length ? `<g:custom_label_0>${escapeXml(product.length)}</g:custom_label_0>` : "",
      ].filter(Boolean).join("\n      ");

      return `    <item>
      <g:id>${escapeXml(productId(product))}</g:id>
      <g:item_group_id>${escapeXml(itemGroupId(product))}</g:item_group_id>
      <g:title>${escapeXml(titleFor(product))}</g:title>
      <g:description>${escapeXml(descriptionFor(product))}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(image)}</g:image_link>
      <g:availability>${availability(product)}</g:availability>
      <g:price>${escapeXml(`${regular.toFixed(2)} USD`)}</g:price>${saleTag}
      <g:brand>${escapeXml(DEFAULT_BRAND)}</g:brand>
      <g:condition>new</g:condition>
      <g:google_product_category>${escapeXml(DEFAULT_CATEGORY)}</g:google_product_category>
      <g:product_type>${escapeXml(productType(product))}</g:product_type>
      <g:identifier_exists>no</g:identifier_exists>
      ${optional}
    </item>`;
    });

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">`,
    `  <channel>`,
    `    <title>${escapeXml(DEFAULT_BRAND)} Products</title>`,
    `    <link>${escapeXml(siteUrl())}</link>`,
    `    <description>${escapeXml("Live jewelry catalog for Google Merchant Center")}</description>`,
    ...items,
    `  </channel>`,
    `</rss>`,
  ].join("\n");
}
