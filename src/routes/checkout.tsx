import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  Check, Tag, X, Lock, CreditCard, Truck,
  ShieldCheck, RotateCcw, Package, ChevronLeft,
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatUSD } from "@/lib/pricing";
import { createOrder, getShippingConfig } from "@/lib/products.functions";
import { validatePromoCode } from "@/lib/admin-extended.functions";

export const Route = createFileRoute("/checkout")({
  loader: async () => {
    const config = await getShippingConfig();
    return { shippingConfig: config };
  },
  head: () => ({
    meta: [
      { title: "Checkout — Qureshi Jewelers" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

const schema = z.object({
  customer_name: z.string().trim().min(1, "Required").max(120),
  customer_email: z.string().trim().email("Valid email required").max(255),
  customer_phone: z.string().trim().max(30).optional().or(z.literal("")),
  shipping_address_line1: z.string().trim().min(1, "Required").max(200),
  shipping_address_line2: z.string().trim().max(200).optional().or(z.literal("")),
  shipping_city: z.string().trim().min(1, "Required").max(100),
  shipping_state: z.string().trim().min(1, "Required").max(100),
  shipping_zip: z.string().trim().min(3, "Required").max(20),
  shipping_country: z.string().trim().min(2).max(100),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

type ShipMethod = "standard" | "express" | "overnight";

function formatCard(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 16);
  return d.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  if (d.length > 2) return `${d.slice(0, 2)} / ${d.slice(2)}`;
  return d;
}

function detectCardType(num: string): string | null {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "VISA";
  if (/^5[1-5]|^2[2-7]/.test(n)) return "MC";
  if (/^3[47]/.test(n)) return "AMEX";
  return null;
}

function SectionHeader({
  num, title, right,
}: {
  num: number;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-6 sm:px-8 py-4 sm:py-5 border-b border-[#f0ece4]">
      <div className="w-6 h-6 rounded-full bg-foreground text-background text-[0.62rem] font-medium flex items-center justify-center shrink-0">
        {num}
      </div>
      <h2 className="text-[0.72rem] font-medium uppercase tracking-[0.16em]">{title}</h2>
      {right && <div className="ml-auto">{right}</div>}
    </div>
  );
}

function firePurchaseEvents(orderNumber: string, total: number, items: Array<{ name: string; unitPrice: number; quantity: number }>) {
  try {
    const w = window as any;
    if (typeof w.gtag === "function") {
      w.gtag("event", "purchase", {
        transaction_id: orderNumber,
        value: total,
        currency: "USD",
        items: items.map(i => ({ item_name: i.name, price: i.unitPrice, quantity: i.quantity })),
      });
    }
    if (typeof w.fbq === "function") {
      w.fbq("track", "Purchase", { value: total, currency: "USD", content_ids: [orderNumber] });
    }
    if (w.ttq?.track) {
      w.ttq.track("CompletePayment", { value: total, currency: "USD", content_id: orderNumber });
    }
  } catch {}
}

function Checkout() {
  const { shippingConfig } = Route.useLoaderData();
  const { freeShippingThreshold, flatShippingRate, taxRate } = shippingConfig;
  const { items, subtotal, clear } = useCart();
  const submit = useServerFn(createOrder);
  const validatePromo = useServerFn(validatePromoCode);

  const [form, setForm] = useState({
    customer_name: "", customer_email: "", customer_phone: "",
    shipping_address_line1: "", shipping_address_line2: "",
    shipping_city: "", shipping_state: "", shipping_zip: "",
    shipping_country: "United States", notes: "",
    shipping_method: "standard" as ShipMethod,
  });

  const [payment, setPayment] = useState({
    card_number: "", card_expiry: "", card_cvv: "", card_name: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{
    orderNumber: string;
    total: number;
    tax: number;
    shipping_method: ShipMethod;
    customer_name: string;
  } | null>(null);

  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState<null | {
    code: string; name: string; discountAmount: number;
    discountType: string; discountValue: number;
  }>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    try {
      const result = await validatePromo({ data: { code: promoInput.trim(), orderSubtotal: subtotal } });
      setPromoApplied({
        code: result.code, name: result.name, discountAmount: result.discountAmount,
        discountType: result.discountType, discountValue: result.discountValue,
      });
      toast.success(
        `Promo applied: ${result.discountType === "percentage" ? `${result.discountValue}% off` : formatUSD(result.discountValue)} off`
      );
    } catch (err: any) {
      toast.error(err?.message ?? "Invalid promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => { setPromoApplied(null); setPromoInput(""); };

  const discount = promoApplied?.discountAmount ?? 0;
  const standardPrice = (subtotal - discount) >= freeShippingThreshold ? 0 : flatShippingRate;
  const shippingCost = form.shipping_method === "express" ? 24.95
    : form.shipping_method === "overnight" ? 49.95
    : standardPrice;
  const tax = taxRate > 0 ? Math.round((subtotal - discount) * (taxRate / 100) * 100) / 100 : 0;
  const total = subtotal - discount + shippingCost + tax;

  const update = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const fieldErr = (k: string, map = errors) =>
    map[k] ? <p className="text-xs text-red-500 mt-1.5">{map[k]}</p> : null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      toast.error("Please fill in all required fields");
      return;
    }

    const pErrs: Record<string, string> = {};
    const digits = payment.card_number.replace(/\s/g, "");
    if (digits.length < 13) pErrs.card_number = "Enter a valid card number";
    if (!/^\d{2} \/ \d{2}$/.test(payment.card_expiry)) pErrs.card_expiry = "Enter MM / YY";
    if (payment.card_cvv.length < 3) pErrs.card_cvv = "Enter CVV";
    if (!payment.card_name.trim()) pErrs.card_name = "Required";
    if (Object.keys(pErrs).length) {
      setPaymentErrors(pErrs);
      toast.error("Please enter your payment details");
      return;
    }

    setErrors({});
    setPaymentErrors({});
    setSubmitting(true);
    try {
      const orderItems = items.map((i) => ({
        productId: i.productId, slug: i.slug, name: i.name, color: i.color,
        size: i.size, length: i.length, unitPrice: i.unitPrice, quantity: i.quantity,
      }));
      const res = await submit({
        data: {
          ...parsed.data,
          shipping_method: form.shipping_method,
          items: orderItems,
          promo_code: promoApplied?.code ?? "",
          discount_amount: discount,
        },
      });
      firePurchaseEvents(res.orderNumber, res.total, orderItems);
      setDone({ ...res, shipping_method: form.shipping_method, customer_name: form.customer_name });
      clear();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order");
    } finally {
      setSubmitting(false);
    }
  };

  const SHIP_METHODS: Array<{
    id: ShipMethod; label: string; sub: string; price: number; badge?: string;
  }> = [
    { id: "standard",  label: "Standard Shipping", sub: "5–7 business days",  price: standardPrice },
    { id: "express",   label: "Express Shipping",  sub: "2–3 business days",  price: 24.95, badge: "Popular" },
    { id: "overnight", label: "Overnight",         sub: "Next business day",  price: 49.95 },
  ];

  const labelCls = "block text-[0.6rem] uppercase tracking-[0.2em] font-medium text-muted-foreground mb-1.5";
  const inputCls = (hasErr: boolean) =>
    `w-full border ${hasErr ? "border-red-400" : "border-[#ddd8d0]"} bg-white px-4 py-3.5 text-sm text-foreground placeholder:text-[#bbb] focus:outline-none focus:border-foreground transition-colors duration-150`;

  // ── Empty cart ──
  if (items.length === 0 && !done) {
    return (
      <div className="bg-[#faf9f7] min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-10 h-10 mx-auto text-muted-foreground/30 mb-4" />
          <h1 className="font-display text-3xl mb-4">Your bag is empty</h1>
          <Link to="/shop" className="inline-block text-xs uppercase tracking-[0.2em] border-b border-foreground pb-0.5 hover:opacity-70 transition-opacity">
            Shop the collection
          </Link>
        </div>
      </div>
    );
  }

  // ── Success screen ──
  if (done) {
    const DELIVERY: Record<ShipMethod, string> = {
      standard: "5–7 business days",
      express: "2–3 business days",
      overnight: "next business day",
    };
    const firstName = done.customer_name.split(" ")[0] || done.customer_name;
    const today = new Date().toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });

    return (
      <div className="bg-[#faf9f7] min-h-screen">
        <div className="mx-auto max-w-lg px-4 sm:px-6 py-16 sm:py-24">
          <div className="flex items-center justify-center">
            <div className="w-20 h-20 rounded-full border-2 border-foreground flex items-center justify-center">
              <Check className="w-8 h-8 text-foreground" strokeWidth={2.5} />
            </div>
          </div>

          <p className="eyebrow text-center mt-8">Order confirmed</p>
          <h1 className="font-display text-4xl sm:text-5xl text-center mt-2 leading-tight">
            Thank you,<br />{firstName}.
          </h1>
          <p className="text-center text-muted-foreground mt-4 text-sm leading-relaxed">
            Order <span className="font-mono font-medium text-foreground">{done.orderNumber}</span> — {formatUSD(done.total)}<br />
            A confirmation email is on its way to you.
          </p>

          <div className="mt-10 border border-[#e5e1d9] bg-white">
            <div className="px-6 sm:px-8 py-4 border-b border-[#f0ece4]">
              <p className="text-[0.6rem] uppercase tracking-[0.2em] font-medium text-muted-foreground">Order Status</p>
            </div>
            <div className="px-6 sm:px-8 py-6">
              {[
                { label: "Order Received", sub: today, done: true },
                { label: "Processing", sub: "1–2 business days", done: false },
                { label: "Shipped", sub: `Estimated in ${DELIVERY[done.shipping_method]}`, done: false },
                { label: "Delivered", sub: "", done: false },
              ].map((step, i, arr) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-foreground" : "border-2 border-[#d8d3cb] bg-white"}`}>
                      {step.done && <Check className="w-2.5 h-2.5 text-background" strokeWidth={3} />}
                    </div>
                    {i < arr.length - 1 && (
                      <div className="w-px bg-[#e8e4de] flex-1 my-1" style={{ minHeight: 24 }} />
                    )}
                  </div>
                  <div className={i < arr.length - 1 ? "pb-5" : ""}>
                    <p className={`text-sm ${step.done ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                    {step.sub && (
                      <p className="text-xs text-muted-foreground mt-0.5">{step.sub}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              to="/track-order"
              className="flex items-center justify-center gap-2 border border-foreground px-4 py-3.5 text-xs uppercase tracking-[0.16em] hover:bg-foreground hover:text-background transition-colors"
            >
              <Package className="w-3.5 h-3.5" />
              Track Order
            </Link>
            <Link
              to="/shop"
              className="flex items-center justify-center bg-foreground text-background px-4 py-3.5 text-xs uppercase tracking-[0.16em] hover:bg-foreground/90 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-5 text-[0.65rem] text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" />SSL Secured</span>
            <span>·</span>
            <span className="flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" />14-Day Returns</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Main checkout ──
  return (
    <div className="bg-[#faf9f7] min-h-screen">
      <div className="border-b border-[#ece8e0] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-4 sm:py-6">
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to Shop
          </Link>
          <div className="mt-3 flex items-baseline gap-4">
            <h1 className="font-display text-3xl sm:text-4xl">Checkout</h1>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              <span>Secure</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10">
        <form
          onSubmit={onSubmit}
          noValidate
          className="grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-6 lg:gap-8 items-start"
        >
          {/* ── Left: form sections ── */}
          <div className="space-y-4">

            {/* 1 · Contact */}
            <div className="border border-[#e5e1d9] bg-white">
              <SectionHeader num={1} title="Contact Information" />
              <div className="px-6 sm:px-8 py-5 sm:py-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Full Name *</label>
                    <input
                      placeholder="Jane Smith"
                      value={form.customer_name}
                      onChange={update("customer_name")}
                      className={inputCls(!!errors.customer_name)}
                    />
                    {fieldErr("customer_name")}
                  </div>
                  <div>
                    <label className={labelCls}>Email Address *</label>
                    <input
                      type="email"
                      placeholder="jane@example.com"
                      value={form.customer_email}
                      onChange={update("customer_email")}
                      className={inputCls(!!errors.customer_email)}
                    />
                    {fieldErr("customer_email")}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>
                      Phone{" "}
                      <span className="normal-case text-muted-foreground/50 lowercase tracking-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      placeholder="+1 (555) 000-0000"
                      value={form.customer_phone}
                      onChange={update("customer_phone")}
                      className={inputCls(false)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2 · Shipping address */}
            <div className="border border-[#e5e1d9] bg-white">
              <SectionHeader num={2} title="Shipping Address" />
              <div className="px-6 sm:px-8 py-5 sm:py-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Street Address *</label>
                    <input
                      placeholder="123 Maple Street"
                      value={form.shipping_address_line1}
                      onChange={update("shipping_address_line1")}
                      className={inputCls(!!errors.shipping_address_line1)}
                    />
                    {fieldErr("shipping_address_line1")}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>
                      Apartment / Suite{" "}
                      <span className="normal-case text-muted-foreground/50 lowercase tracking-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      placeholder="Apt 4B"
                      value={form.shipping_address_line2}
                      onChange={update("shipping_address_line2")}
                      className={inputCls(false)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>City *</label>
                    <input
                      placeholder="New York"
                      value={form.shipping_city}
                      onChange={update("shipping_city")}
                      className={inputCls(!!errors.shipping_city)}
                    />
                    {fieldErr("shipping_city")}
                  </div>
                  <div>
                    <label className={labelCls}>State *</label>
                    <input
                      placeholder="NY"
                      value={form.shipping_state}
                      onChange={update("shipping_state")}
                      className={inputCls(!!errors.shipping_state)}
                    />
                    {fieldErr("shipping_state")}
                  </div>
                  <div>
                    <label className={labelCls}>ZIP Code *</label>
                    <input
                      placeholder="10001"
                      value={form.shipping_zip}
                      onChange={update("shipping_zip")}
                      className={inputCls(!!errors.shipping_zip)}
                    />
                    {fieldErr("shipping_zip")}
                  </div>
                  <div>
                    <label className={labelCls}>Country</label>
                    <input
                      value={form.shipping_country}
                      onChange={update("shipping_country")}
                      className={inputCls(false)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3 · Delivery method */}
            <div className="border border-[#e5e1d9] bg-white">
              <SectionHeader num={3} title="Delivery Method" />
              <div className="px-6 sm:px-8 py-5 sm:py-6">
                <div className="space-y-2.5">
                  {SHIP_METHODS.map((m) => (
                    <label
                      key={m.id}
                      className={`flex items-center gap-4 px-4 sm:px-5 py-4 border cursor-pointer transition-all ${
                        form.shipping_method === m.id
                          ? "border-foreground bg-[#f7f5f2]"
                          : "border-[#e5e1d9] bg-white hover:border-[#c5bdb3]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping_method"
                        value={m.id}
                        checked={form.shipping_method === m.id}
                        onChange={() => setForm((f) => ({ ...f, shipping_method: m.id }))}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          form.shipping_method === m.id ? "border-foreground" : "border-[#ccc]"
                        }`}
                      >
                        {form.shipping_method === m.id && (
                          <div className="w-2 h-2 rounded-full bg-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{m.label}</span>
                          {m.badge && (
                            <span className="text-[0.55rem] uppercase tracking-[0.16em] px-1.5 py-0.5 bg-foreground text-background">
                              {m.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.sub}</p>
                        {m.id === "standard" && standardPrice === 0 && (
                          <p className="text-[0.58rem] uppercase tracking-[0.12em] text-emerald-600 mt-0.5">
                            Complimentary on this order
                          </p>
                        )}
                        {m.id === "standard" && standardPrice > 0 && (
                          <p className="text-[0.58rem] text-muted-foreground/50 mt-0.5">
                            Free on orders over {formatUSD(freeShippingThreshold)}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-medium shrink-0">
                        {m.price === 0 ? (
                          <span className="text-emerald-600">Free</span>
                        ) : (
                          formatUSD(m.price)
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 4 · Payment */}
            <div className="border border-[#e5e1d9] bg-white">
              <SectionHeader
                num={4}
                title="Payment"
                right={
                  <div className="flex items-center gap-1.5 text-[0.58rem] text-muted-foreground uppercase tracking-[0.14em]">
                    <Lock className="w-3 h-3" />
                    SSL Secured
                  </div>
                }
              />
              <div className="px-6 sm:px-8 py-5 sm:py-6 space-y-4">
                <div>
                  <label className={labelCls}>Card Number *</label>
                  <div className="relative">
                    <input
                      value={payment.card_number}
                      onChange={(e) =>
                        setPayment((p) => ({ ...p, card_number: formatCard(e.target.value) }))
                      }
                      placeholder="1234  5678  9012  3456"
                      maxLength={19}
                      inputMode="numeric"
                      className={`${inputCls(!!paymentErrors.card_number)} pr-16 font-mono tracking-widest`}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {detectCardType(payment.card_number) ? (
                        <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
                          {detectCardType(payment.card_number)}
                        </span>
                      ) : (
                        <CreditCard className="w-4 h-4 text-muted-foreground/30" />
                      )}
                    </div>
                  </div>
                  {fieldErr("card_number", paymentErrors)}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Expiry Date *</label>
                    <input
                      value={payment.card_expiry}
                      onChange={(e) =>
                        setPayment((p) => ({ ...p, card_expiry: formatExpiry(e.target.value) }))
                      }
                      placeholder="MM / YY"
                      maxLength={7}
                      inputMode="numeric"
                      className={`${inputCls(!!paymentErrors.card_expiry)} font-mono`}
                    />
                    {fieldErr("card_expiry", paymentErrors)}
                  </div>
                  <div>
                    <label className={labelCls}>CVV *</label>
                    <input
                      value={payment.card_cvv}
                      onChange={(e) =>
                        setPayment((p) => ({
                          ...p,
                          card_cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                        }))
                      }
                      placeholder="•••"
                      maxLength={4}
                      inputMode="numeric"
                      type="password"
                      className={`${inputCls(!!paymentErrors.card_cvv)} font-mono`}
                    />
                    {fieldErr("card_cvv", paymentErrors)}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Name on Card *</label>
                  <input
                    value={payment.card_name}
                    onChange={(e) =>
                      setPayment((p) => ({ ...p, card_name: e.target.value }))
                    }
                    placeholder="JANE SMITH"
                    className={`${inputCls(!!paymentErrors.card_name)} uppercase placeholder:normal-case`}
                  />
                  {fieldErr("card_name", paymentErrors)}
                </div>

                <p className="text-xs text-muted-foreground flex items-start gap-2 pt-1 leading-relaxed">
                  <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  Your payment information is encrypted with 256-bit SSL. Card details are never stored on
                  our servers and will be processed securely via Stripe when your order is confirmed.
                </p>
              </div>
            </div>

            {/* 5 · Notes */}
            <div className="border border-[#e5e1d9] bg-white">
              <SectionHeader num={5} title="Order Notes" />
              <div className="px-6 sm:px-8 py-5 sm:py-6">
                <label className={labelCls}>
                  Special instructions{" "}
                  <span className="normal-case text-muted-foreground/50 lowercase tracking-normal">
                    (optional)
                  </span>
                </label>
                <textarea
                  placeholder="Gift message, custom length request, special delivery instructions…"
                  value={form.notes}
                  onChange={update("notes")}
                  rows={3}
                  className="w-full border border-[#ddd8d0] bg-white px-4 py-3.5 text-sm text-foreground placeholder:text-[#bbb] focus:outline-none focus:border-foreground transition-colors duration-150 resize-none"
                />
              </div>
            </div>
          </div>

          {/* ── Right: order summary (sticky on desktop) ── */}
          <aside className="lg:sticky lg:top-8 h-fit border border-[#e5e1d9] bg-white">
            <div className="px-5 sm:px-6 py-4 border-b border-[#f0ece4]">
              <p className="text-[0.6rem] uppercase tracking-[0.2em] font-medium">Order Summary</p>
            </div>

            <ul className="divide-y divide-[#f5f2ee] max-h-64 overflow-y-auto">
              {items.map((it) => (
                <li key={it.id} className="flex gap-3 px-5 sm:px-6 py-3.5">
                  <div className="w-12 h-12 shrink-0 bg-[#f5f3ef] overflow-hidden">
                    <img src={it.image} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.78rem] font-medium truncate leading-tight">
                      {it.name.split("—")[0].trim()}
                    </p>
                    <p className="text-[0.67rem] text-muted-foreground mt-0.5">
                      {[it.size, it.length, it.color].filter(Boolean).join(" · ")}
                      {it.quantity > 1 && ` · Qty ${it.quantity}`}
                    </p>
                  </div>
                  <span className="text-[0.8rem] font-medium shrink-0">
                    {formatUSD(it.unitPrice * it.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="px-5 sm:px-6 py-3.5 border-t border-[#f5f2ee]">
              {promoApplied ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2">
                  <span className="flex items-center gap-2 text-xs text-emerald-700">
                    <Tag className="h-3.5 w-3.5" />
                    <span className="font-mono font-semibold">{promoApplied.code}</span>
                    <span>— {formatUSD(discount)} off</span>
                  </span>
                  <button
                    type="button"
                    onClick={removePromo}
                    className="text-emerald-400 hover:text-emerald-700 transition-colors ml-2"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyPromo())}
                    placeholder="Promo code"
                    className="flex-1 border border-[#ddd8d0] bg-white px-3 py-2 text-xs font-mono uppercase placeholder:normal-case placeholder:text-[#bbb] focus:outline-none focus:border-foreground transition-colors"
                  />
                  <button
                    type="button"
                    onClick={applyPromo}
                    disabled={promoLoading || !promoInput.trim()}
                    className="border border-[#ddd8d0] px-3 text-[0.58rem] uppercase tracking-[0.16em] text-muted-foreground hover:border-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                  >
                    {promoLoading ? "…" : "Apply"}
                  </button>
                </div>
              )}
            </div>

            <div className="px-5 sm:px-6 py-4 border-t border-[#f5f2ee] space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatUSD(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({promoApplied?.code})</span>
                  <span>−{formatUSD(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {shippingCost === 0 ? (
                    <span className="text-emerald-600">Free</span>
                  ) : (
                    formatUSD(shippingCost)
                  )}
                </span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatUSD(tax)}</span>
                </div>
              )}
            </div>

            <div className="px-5 sm:px-6 py-4 border-t border-[#e5e1d9]">
              <div className="flex justify-between items-baseline">
                <span className="text-[0.65rem] uppercase tracking-[0.16em] font-medium">Total</span>
                <span className="font-display text-2xl">{formatUSD(total)}</span>
              </div>
            </div>

            <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-foreground text-background py-4 text-[0.65rem] uppercase tracking-[0.22em] disabled:opacity-60 hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
              >
                {submitting && (
                  <span className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                )}
                {submitting ? "Placing Order…" : "Complete Order"}
              </button>

              <div className="flex items-center justify-center gap-3 text-[0.58rem] text-muted-foreground/70 uppercase tracking-[0.14em]">
                <span className="flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />SSL
                </span>
                <span className="opacity-40">·</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" />GRA
                </span>
                <span className="opacity-40">·</span>
                <span className="flex items-center gap-1">
                  <RotateCcw className="w-2.5 h-2.5" />14-Day Returns
                </span>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
