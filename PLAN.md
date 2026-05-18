# Qureshi Jewelers — Build Plan

## Current State
TanStack Start e-commerce site for S925 VVS moissanite tennis chains & bracelets.
6 seed products: 3 colors (silver, gold, rose_gold) × 2 types (necklace, bracelet).
Pricing engine with size multipliers (2-5mm) and length adders (18",20",24").

## Changes Needed for "Revolutionary" Experience

### 1. Add White Gold Color Variant
- Update DB CHECK constraint to include `white_gold`
- Add 4 new seed products (white gold chain + bracelet, and size-specific variants)
- Update shop filters
- Update color display mappings

### 2. Size-Specific Product Listings
- Add `size` column to products table so each size is its own listing
- Create individual product slugs per size/color combo
- Update product detail page to show size-specific pricing upfront
- Add "sizes" as a filter on the shop page

### 3. Enhanced Product Detail Page  
- Moissanite quality education panel (VVS → D color → GRA)
- Interactive size visualization (actual mm scale)
- "Why moissanite beats diamond" comparison section
- Real-time price calculator with size/length
- Video/gallery product tour
- Quick-add feature with recommended sizes

### 4. Revolutionary Shopping Features
- "Build My Piece" configurator flow on PDP
- Live size comparison using interactive tool
- Moissanite education modal/panel
- GRA certificate preview
- Afterpay/Klarna-style payment messaging
- Size guide with printable chart
- Virtual bracelet/chain fit guide

### 5. Trust & Social Proof
- Customer review section on PDP
- Real customer photos section
- "As seen on" social proof strip
- Tarnish-tested guarantee badge
- Live shipping counter
- FAQ accordions on PDP

### 6. New Pages
- `/moissanite-guide` — Educational hub about moissanite quality
- `/size-guide` — Printable + interactive sizing
- `/reviews` — Customer testimonials
- `/faq` — Shipping, care, returns

### 7. Marketing & Conversion
- Email capture / newsletter signup
- Exit-intent popup
- "Complete the set" cross-sell (chain + bracelet)
- Gift message option at checkout
- Order tracking by email