// Public folder image registry
const BASE = "";

export const images = {
  hero:      `${BASE}/hero.jpg`,
  // Drop a macro gemstone loop at public/hero.mp4 and set this to `${BASE}/hero.mp4`
  // to switch the hero to video — leave blank to keep the static photo.
  heroVideo: "",
  main:     `${BASE}/main.jpg`,

  // Original product shots
  product1: `${BASE}/imgi_128_H05a1d33480e447f69e6be8cc141f6c2be.jpg`,
  product2: `${BASE}/imgi_129_H7bc0ac9721af473182da68a3062069ceI.jpg`,
  product4: `${BASE}/imgi_443_H22f9cbcf06d64199be40339dc5d15d9a3.jpg`,
  product5: `${BASE}/imgi_475_H4a3fc54b264b4670a0dd05906ebf5845b.jpg`,

  // Graphics / infographics
  graphic1: `${BASE}/imgi_447_H7ac01ff2d8f342238f4929467f96bd152.png`,
  graphic2: `${BASE}/imgi_451_H2112b7bb86b4401ab543678029bc6e85W.png`,
  graphic3: `${BASE}/imgi_459_H5a4d5c5c31884c979920fa5c048404a4O.png`,
  graphic4: `${BASE}/imgi_467_Hc1321037093a4820997bd7043dab16c5Y.png`,

  // ── 3-Prong VVS Moissanite Stud Earrings ────────────────────────────────
  earringVideo: `${BASE}/3%20Prong%20Moissanite%20Earrings/3prongearring.mp4`,
  earring1: `${BASE}/3%20Prong%20Moissanite%20Earrings/yellowgoldfirstimage.png`,
  earring2: `${BASE}/3%20Prong%20Moissanite%20Earrings/silverandwhitegoldsecondimage.jpg`,
  earring3: `${BASE}/3%20Prong%20Moissanite%20Earrings/thirdimage.jpg`,
  earring4: `${BASE}/3%20Prong%20Moissanite%20Earrings/fourthimagee.jpg`,
  earring5: `${BASE}/3%20Prong%20Moissanite%20Earrings/fifthimage.jpg`,
  earring6: `${BASE}/3%20Prong%20Moissanite%20Earrings/sixthimage.jpg`,
  earring7: `${BASE}/3%20Prong%20Moissanite%20Earrings/seventhimage.jpg`,

  // ── Tennis Bracelet ──────────────────────────────────────────────────────
  tennisBraceletYellowGold: `${BASE}/TennisBracelet/yellowgoldmain.jpg`,
  tennisBraceletWhiteGold:  `${BASE}/TennisBracelet/whitegoldmain.jpg`,
  tennisBracelet2mm:        `${BASE}/TennisBracelet/2mmbracelet.jpg`,
  tennisBracelet3mm:        `${BASE}/TennisBracelet/3mmbracelet.jpg`,
  tennisBracelet4mm:        `${BASE}/TennisBracelet/4mmbracelet.jpg`,
  tennisBracelet5mm:        `${BASE}/TennisBracelet/5mmbracelet.jpg`,
  tennisBracelet6mm:        `${BASE}/TennisBracelet/65mmbracelet.jpg`,
  tennisBraceletLaidOut:    `${BASE}/TennisBracelet/braceletslaidout.jpg`,
  tennisBraceletMultiple:   `${BASE}/TennisBracelet/braceletsmultiple.jpg`,
  tennisBraceletAdditional: `${BASE}/TennisBracelet/braceletsadditional.jpg`,
  tennisBraceletClasps:     `${BASE}/TennisBracelet/clasps.jpg`,
  tennisBraceletTest:       `${BASE}/TennisBracelet/bracelettest.jpg`,
  tennisBraceletVariations: `${BASE}/TennisBracelet/braceletvariations.jpg`,

  // ── Bracelet images ──────────────────────────────────────────────────────
  // Size-specific on-wrist comparison shots (silver + gold side by side, labeled)
  bracelet2mm:   `${BASE}/2mmbracelet.jpg`,
  bracelet3mm:   `${BASE}/3mmbracelet.jpg`,
  bracelet4mm:   `${BASE}/4mmbracelet.jpg`,
  bracelet5mm:   `${BASE}/5mmbracelet.jpg`,
  bracelet65mm:  `${BASE}/65mmbracelet.jpg`,

  // Lifestyle & detail shots
  // All five widths stacked on one wrist — silver, labeled 2mm–6mm
  braceletsMultiple:    `${BASE}/braceletsmultiple.jpg`,
  // Flat lay: 3 gold + 3 silver, double-locking clasps clearly visible
  braceletsLaidOut:     `${BASE}/braceletslaidout.jpg`,
  // "Original image under natural light" — real moissanite rainbow fire visible
  braceletsNaturalLight:`${BASE}/edit.jpg`,
  // GRA Moissanite Report + professional Selector II tester confirming authenticity
  braceletsGRATested:   `${BASE}/braceletsadditional.jpg`,
  // Extreme close-up of double-locking box clasps on yellow gold bracelets
  braceletsClasps:      `${BASE}/clasps.jpg`,
  // Overhead grid — alternating gold/silver, all widths
  braceletsVariety:     `${BASE}/braceletsvariety.png`,
};

// ─── Gallery builder ─────────────────────────────────────────────────────────
//
// Returns an ordered array of images for the product detail page gallery.
// First image is always the hero/primary shot; subsequent images add depth.

export function getProductImages(slug: string): string[] {
  // ── Tennis Bracelet unified products (must come before generic bracelet) ──
  if (slug.includes("tennis-bracelet") || slug.includes("tennis_bracelet")) {
    return [
      images.tennisBraceletYellowGold,  // [0] yellow gold hero
      images.tennisBraceletWhiteGold,   // [1] white gold hero
      images.tennisBraceletTest,        // [2] new lifestyle
      images.tennisBraceletVariations,  // [3] new variations
      images.tennisBracelet2mm,         // [4] 2mm size
      images.tennisBracelet3mm,         // [5] 3mm size
      images.tennisBracelet4mm,         // [6] 4mm size
      images.tennisBracelet5mm,         // [7] 5mm size
      images.tennisBracelet6mm,         // [8] 6mm size
      images.tennisBraceletLaidOut,     // [9] lifestyle
      images.tennisBraceletMultiple,    // [10] lifestyle
      images.tennisBraceletAdditional,  // [11] lifestyle
      images.tennisBraceletClasps,      // [12] clasp detail
    ];
  }

  // ── Earrings — must come before ring check ("earrings" contains "ring") ───
  if (slug.includes("earring") || slug.includes("stud")) {
    return [
      images.earring1,
      images.earring2,
      images.earring3,
      images.earring4,
      images.earring5,
      images.earring6,
      images.earring7,
    ];
  }

  // ── Rings ──────────────────────────────────────────────────────────────────
  if (slug.includes("ring")) {
    return [
      images.main,
      images.product5,
      images.product4,
      images.graphic4,
    ];
  }

  // ── Bracelets ──────────────────────────────────────────────────────────────
  if (slug.includes("bracelet")) {
    // Size-specific primary: use the labeled on-wrist comparison shot.
    // Check 6.5mm BEFORE 5mm — "6.5mm" contains "5mm" as a substring.
    const sizePrimary =
      slug.includes("6.5mm") ? images.bracelet65mm :
      slug.includes("5mm")   ? images.bracelet5mm  :
      slug.includes("4mm")   ? images.bracelet4mm  :
      slug.includes("3mm")   ? images.bracelet3mm  :
      slug.includes("2mm")   ? images.bracelet2mm  :
      null;

    if (sizePrimary) {
      // Sized product — lead with the size-specific wrist shot
      return [
        sizePrimary,               // labeled comparison shot (e.g. "4mm" on wrist)
        images.braceletsMultiple,  // all widths stacked on wrist
        images.braceletsLaidOut,   // flat lay + clasps detail
        images.braceletsNaturalLight, // natural light brilliance / fire
        images.braceletsGRATested, // GRA cert + moissanite tester
        images.braceletsClasps,    // double-locking clasp close-up
      ];
    }

    // Signature / no-size product
    return [
      images.braceletsMultiple,     // all widths stacked — shows the full range
      images.braceletsLaidOut,      // flat lay with clasps
      images.braceletsNaturalLight, // natural light fire shot
      images.braceletsGRATested,    // GRA cert + tester
      images.braceletsClasps,       // clasp close-up
      images.braceletsVariety,      // overhead variety grid
    ];
  }

  // ── Necklaces / default ────────────────────────────────────────────────────
  return [
    images.main,
    images.product1,
    images.product4,
    images.graphic2,
  ];
}

// ─── Thumbnail ───────────────────────────────────────────────────────────────
//
// Single image used in product cards (shop grid, homepage category rows).
// Prefers image_url from the DB product record; falls back to slug-pattern logic.

export function getProductThumb(slug: string, imageUrl?: string | null): string {
  // If the product has a custom image set in admin (not the bare defaults), use it
  if (imageUrl && imageUrl.trim() && imageUrl !== "/main.jpg" && imageUrl !== "") {
    return imageUrl;
  }

  // Tennis bracelet — use white gold hero as primary. Check BEFORE generic bracelet.
  if (slug.includes("tennis-bracelet") || slug.includes("tennis_bracelet")) return images.tennisBraceletWhiteGold;

  if (slug.includes("bracelet")) {
    // Sized products — use the matching labeled on-wrist shot
    if (slug.includes("6.5mm")) return images.bracelet65mm;
    if (slug.includes("5mm"))   return images.bracelet5mm;
    if (slug.includes("4mm"))   return images.bracelet4mm;
    if (slug.includes("3mm"))   return images.bracelet3mm;
    if (slug.includes("2mm"))   return images.bracelet2mm;

    // Signature products — vary by metal so the homepage grid has visual variety
    if (slug.includes("rose"))                                return images.braceletsVariety;
    if (slug.includes("white_gold") || slug.includes("white-gold")) return images.braceletsLaidOut;
    if (slug.includes("gold") && !slug.includes("silver"))   return images.braceletsClasps;
    return images.braceletsMultiple; // silver / fallback
  }
  if (slug.includes("earring") || slug.includes("stud")) return images.earring1;
  return images.main;
}

// ─── Gallery with DB image fallback ──────────────────────────────────────────
//
// Used in the storefront product detail page. Prefers DB-stored images fetched
// separately; if none exist, falls back to getProductImages(slug).

export function buildProductGallery(
  slug: string,
  dbImages: Array<{ url: string; alt_text?: string }>,
  imageUrl?: string | null,
): string[] {
  // If the product has DB-managed gallery images, use those
  if (dbImages && dbImages.length > 0) {
    return dbImages.map(i => i.url);
  }
  // Fallback: slug-pattern gallery, but swap the first image if admin set a custom one
  const base = getProductImages(slug);
  if (imageUrl && imageUrl.trim() && imageUrl !== "/main.jpg" && imageUrl !== "") {
    return [imageUrl, ...base.slice(1)];
  }
  return base;
}
