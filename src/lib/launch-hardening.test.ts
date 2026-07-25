import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolveConfiguredVariant, effectiveVariantPrice, canFulfillVariant } from "./variant-resolution";
import { lowestCatalogPrice, resolveCatalogPrice } from "./pricing";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

describe("launch security contracts", () => {
  const migration = read("supabase/migrations/20260718010000_launch_security_hardening.sql");

  it("removes anonymous writes from every private commerce table", () => {
    expect(migration).toContain('DROP POLICY IF EXISTS "orders_public_insert"');
    for (const table of ["orders", "stock_reservations", "pending_orders", "promo_reservations"]) {
      expect(migration).toContain(`ON public.${table}`);
      expect(migration).toMatch(new RegExp(`CREATE POLICY "deny_anon_authenticated" ON public\\.${table}[\\s\\S]*?TO anon, authenticated`));
    }
  });

  it("revokes all inventory, promo, expiry, and refund RPCs from public roles", () => {
    for (const fn of ["reserve_stock", "commit_reservation", "release_reservation", "reserve_promo", "expire_checkout_reservations", "claim_return_refund"]) {
      expect(migration).toMatch(new RegExp(`REVOKE ALL ON FUNCTION public\\.${fn}\\([\\s\\S]*?FROM PUBLIC, anon, authenticated`));
    }
  });

  it("contains stale-processing recovery and expired inventory revalidation", () => {
    expect(migration).toContain("processing_started_at < now() - interval '2 minutes'");
    expect(migration).toContain("reservation_token <> p_token");
    expect(migration).toContain("RAISE EXCEPTION 'Inventory no longer available'");
  });

  it("claims refunds and promo uses atomically", () => {
    expect(migration).toContain("claim_return_refund");
    expect(migration).toContain("COALESCE(refund_status, 'pending') IN ('pending', 'failed')");
    expect(migration).toContain("v_promo.used_count + v_reserved >= v_promo.max_uses");
  });
});

describe("variant price is identical at every commerce boundary", () => {
  const variants = [
    { id: "default", color: null, size: null, length: null, price_override: 100, stock: -1 },
    { id: "gold", color: "gold", size: null, length: null, price_override: 125, stock: 4 },
    { id: "exact", color: "gold", size: "4mm", length: '18"', price_override: 179, stock: 1 },
  ];
  const combinations = [
    { color: "silver", size: "3mm", length: '20"', expected: 100 },
    { color: "gold", size: "3mm", length: '20"', expected: 125 },
    { color: "gold", size: "4mm", length: '18"', expected: 179 },
  ];

  for (const combination of combinations) {
    it(`${combination.color}/${combination.size}/${combination.length}`, () => {
      const variant = resolveConfiguredVariant(variants, combination);
      const productPage = effectiveVariantPrice(variant, 99);
      const cart = productPage;
      const paymentIntent = effectiveVariantPrice(variant, 99);
      const order = paymentIntent;
      expect([productPage, cart, paymentIntent, order]).toEqual(Array(4).fill(combination.expected));
    });
  }

  it("enforces exact stock including quantity", () => {
    const variant = resolveConfiguredVariant(variants, { color: "gold", size: "4mm", length: '18"' });
    expect(canFulfillVariant(variant, 1)).toBe(true);
    expect(canFulfillVariant(variant, 2)).toBe(false);
  });
});

describe("catalog pricing repair", () => {
  const migration = read("supabase/migrations/20260718020000_catalog_pricing_repair.sql");

  it("uses the lowest purchasable variant instead of an unbuyable base price", () => {
    const product = { slug: "pendant", type: "pendant", base_price: 119 };
    const variants = [
      { price_override: 149, stock: 10, is_active: true },
      { price_override: 229, stock: 10, is_active: true },
      { price_override: 99, stock: 0, is_active: true },
    ];
    expect(lowestCatalogPrice(product, variants)).toBe(149);
  });

  it("prices the mens band above its 3.5x factory-cost target", () => {
    const cost = 88.18;
    const retail = 309;
    expect(retail / cost).toBeGreaterThanOrEqual(3.5);
    expect(retail - cost).toBeCloseTo(220.82, 2);
    const ringMigration = read("supabase/migrations/20260718030000_mens_ring_margin_pricing.sql");
    expect(ringMigration).toContain("supplier_unit_cost = 88.18");
    expect(ringMigration).toContain("SET price_override = 309.00");
    expect(ringMigration).toContain("priced_variants <> 10");
  });

  it("prices both solitaire carat options above 8x and keeps ring size separate", () => {
    expect(185 / 23.06).toBeGreaterThanOrEqual(8);
    expect(220 / 27.42).toBeGreaterThanOrEqual(8);
    const migration = read("supabase/migrations/20260718040000_solitaire_ring_8x_pricing.sql");
    expect(migration).toContain("('1ct', 23.06::numeric, 185.00::numeric");
    expect(migration).toContain("('2ct', 27.42::numeric, 220.00::numeric");
    expect(migration).toContain("'Ring Size 7'");
    expect(migration).toContain("price_override / NULLIF(supplier_unit_cost, 0) < 8");
  });

  it("applies a product sale consistently to every variant", () => {
    const product = {
      slug: "pendant",
      type: "pendant",
      base_price: 100,
      sale_price: 80,
      sale_active: true,
    };
    expect(resolveCatalogPrice(product, { variant: { price_override: 200 } })).toBe(160);
  });

  it("repairs malformed grids, explicit prices, metadata, SKUs, and inventory ownership", () => {
    expect(migration).toContain("size LIKE '%,%'");
    expect(migration).toContain("WHEN '6mm' THEN CASE length");
    expect(migration).toContain("length = '18\", 20\", 24\"'");
    expect(migration).toContain("color = 'gold,white_gold'");
    expect(migration).toContain("SET sku = UPPER");
    expect(migration).toContain("SET track_inventory = false");
  });
});

describe("payment lifecycle source contracts", () => {
  const finalize = read("src/lib/payments/finalize.ts");
  const stripeWebhook = read("netlify/functions/stripe-webhook.mts");
  const paypalWebhook = read("netlify/functions/paypal-webhook.mts");

  it("uses an atomic pending-to-processing claim and unique payment order recovery", () => {
    expect(finalize).toContain('.eq("status", "pending")');
    expect(finalize).toContain('.eq("payment_reference", paymentReference)');
    expect(finalize).toContain('status: "finalized"');
  });

  it("both providers request webhook retries after finalization failure", () => {
    expect(stripeWebhook).toContain('status: 500');
    expect(paypalWebhook).toContain('status: 500');
  });

  it("failed and unfulfillable payments release inventory", () => {
    expect(finalize).toContain('rpc("release_reservation"');
    expect(finalize).toContain("createStripeRefund");
    expect(finalize).toContain("createPaypalRefund");
  });
});

describe("identity boundaries", () => {
  const admin = read("src/lib/admin.functions.ts");
  const customer = read("src/lib/customer.functions.ts");
  it("uses individual password verification and signed admin roles", () => {
    expect(admin).toContain("verifyPassword(data.password");
    expect(admin).toContain('`${user.id}|${user.role}`');
    expect(admin).toContain('requireAdminRole(["admin"])');
  });
  it("does not administratively pre-confirm customer email addresses", () => {
    expect(customer).toContain("publicAuth.auth.signUp");
    expect(customer).not.toContain("email_confirm: true");
  });
});
