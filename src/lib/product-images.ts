import chainsDetail from "@/assets/chains-detail.jpg";
import collectionSpread from "@/assets/collection-spread.jpg";
import heroModel from "@/assets/hero-model-chains.jpg";
import lifestyleWoman from "@/assets/lifestyle-woman.jpg";
import sizesComparison from "@/assets/sizes-comparison.jpg";
import graCertificate from "@/assets/gra-certificate.jpg";

export const images = {
  chainsDetail,
  collectionSpread,
  heroModel,
  lifestyleWoman,
  sizesComparison,
  graCertificate,
};

// Map product slugs to gallery images
export function getProductImages(slug: string): string[] {
  if (slug.includes("bracelet")) {
    return [collectionSpread, chainsDetail, sizesComparison, heroModel];
  }
  return [chainsDetail, heroModel, sizesComparison, collectionSpread];
}

export function getProductThumb(slug: string): string {
  if (slug.includes("bracelet")) return collectionSpread;
  return chainsDetail;
}
