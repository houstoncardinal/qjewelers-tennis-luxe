// Public folder images — accessible via absolute URL path
const BASE = "";

export const images = {
  // Hero image for homepage (full-width)
  hero: `${BASE}/hero.jpg`,

  // Main product image (primary for all product thumbnails)
  main: `${BASE}/main.jpg`,

  // Square product detail shots (1001x1001)
  product1: `${BASE}/imgi_128_H05a1d33480e447f69e6be8cc141f6c2be.jpg`,
  product2: `${BASE}/imgi_129_H7bc0ac9721af473182da68a3062069ceI.jpg`,
  product3: `${BASE}/imgi_132_He29252b116254f43963b63de4c636de1Z.jpg`,
  product4: `${BASE}/imgi_443_H22f9cbcf06d64199be40339dc5d15d9a3.jpg`,

  // Portrait product shot (794×1035)
  product5: `${BASE}/imgi_475_H4a3fc54b264b4670a0dd05906ebf5845b.jpg`,

  // PNG graphics — infographics, diagrams, certificates
  graphic1: `${BASE}/imgi_447_H7ac01ff2d8f342238f4929467f96bd152.png`,
  graphic2: `${BASE}/imgi_451_H2112b7bb86b4401ab543678029bc6e85W.png`,
  graphic3: `${BASE}/imgi_459_H5a4d5c5c31884c979920fa5c048404a4O.png`,
  graphic4: `${BASE}/imgi_467_Hc1321037093a4820997bd7043dab16c5Y.png`,
};

// Gallery for product pages — main.jpg is always first (primary)
export function getProductImages(slug: string): string[] {
  if (slug.includes("bracelet")) {
    return [
      images.main,
      images.product2,
      images.product4,
      images.graphic1,
    ];
  }
  // Necklaces / default
  return [
    images.main,
    images.product1,
    images.product3,
    images.graphic2,
  ];
}

// Thumbnail for product cards in shop listings — always main.jpg
export function getProductThumb(slug: string): string {
  return images.main;
}