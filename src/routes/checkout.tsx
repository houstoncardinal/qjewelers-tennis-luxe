import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatUSD } from "@/lib/pricing";
import { createOrder } from "@/lib/products.functions";

export const Route = createFileRoute("/checkout")({
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

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const submit = useServerFn(createOrder);

  const [form, setForm] = useState({
    customer_name: "", customer_email: "", customer_phone: "",
    shipping_address_line1: "", shipping_address_line2: "",
    shipping_city: "", shipping_state: "", shipping_zip: "",
    shipping_country: "United States", notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ orderNumber: string; total: number } | null>(null);

  const shipping = subtotal >= 250 ? 0 : 15;
  const total = subtotal + shipping;

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await submit({
        data: {
          ...parsed.data,
          items: items.map((i) => ({
            productId: i.productId, slug: i.slug, name: i.name, color: i.color,
            size: i.size, length: i.length, unitPrice: i.unitPrice, quantity: i.quantity,
          })),
        },
      });
      setDone(res);
      clear();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Could not place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <section className="mx-auto max-w-xl px-6 py-24 text-center">
        <CheckCircle2 className="h-12 w-12 mx-auto text-foreground" />
        <p className="eyebrow mt-6">Order received</p>
        <h1 className="mt-3 font-display text-4xl">Thank you.</h1>
        <p className="mt-4 text-muted-foreground">
          Your order <span className="font-medium text-foreground">{done.orderNumber}</span> for {formatUSD(done.total)} has been received.
          You'll receive a confirmation email with shipping details shortly.
        </p>
        <Link to="/shop" className="inline-block mt-8 bg-foreground text-background px-8 py-4 text-xs uppercase tracking-[0.22em]">
          Continue shopping
        </Link>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl">Your bag is empty</h1>
        <Link to="/shop" className="inline-block mt-6 text-xs uppercase tracking-[0.2em] border-b border-foreground">Shop the collection</Link>
      </section>
    );
  }

  const inputCls = "w-full border-0 border-b border-border bg-transparent py-3 text-sm focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/60";
  const fieldErr = (k: string) => errors[k] && <span className="text-xs text-destructive mt-1 block">{errors[k]}</span>;

  return (
    <section className="mx-auto max-w-6xl px-6 lg:px-10 py-12 lg:py-16">
      <p className="eyebrow">Checkout</p>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl">Almost yours.</h1>

      <form onSubmit={onSubmit} className="mt-10 grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          <fieldset>
            <legend className="eyebrow mb-5">Contact</legend>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <input placeholder="Full name" value={form.customer_name} onChange={update("customer_name")} className={inputCls} />
                {fieldErr("customer_name")}
              </div>
              <div>
                <input type="email" placeholder="Email address" value={form.customer_email} onChange={update("customer_email")} className={inputCls} />
                {fieldErr("customer_email")}
              </div>
              <div className="sm:col-span-2">
                <input placeholder="Phone (optional)" value={form.customer_phone} onChange={update("customer_phone")} className={inputCls} />
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className="eyebrow mb-5">Shipping address</legend>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <input placeholder="Street address" value={form.shipping_address_line1} onChange={update("shipping_address_line1")} className={inputCls} />
                {fieldErr("shipping_address_line1")}
              </div>
              <div className="sm:col-span-2">
                <input placeholder="Apt, suite (optional)" value={form.shipping_address_line2} onChange={update("shipping_address_line2")} className={inputCls} />
              </div>
              <div>
                <input placeholder="City" value={form.shipping_city} onChange={update("shipping_city")} className={inputCls} />
                {fieldErr("shipping_city")}
              </div>
              <div>
                <input placeholder="State" value={form.shipping_state} onChange={update("shipping_state")} className={inputCls} />
                {fieldErr("shipping_state")}
              </div>
              <div>
                <input placeholder="ZIP" value={form.shipping_zip} onChange={update("shipping_zip")} className={inputCls} />
                {fieldErr("shipping_zip")}
              </div>
              <div>
                <input placeholder="Country" value={form.shipping_country} onChange={update("shipping_country")} className={inputCls} />
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className="eyebrow mb-5">Order notes (optional)</legend>
            <textarea placeholder="Gift message, custom length request, etc." value={form.notes} onChange={update("notes")} rows={3} className={`${inputCls} resize-none`} />
          </fieldset>
        </div>

        <aside className="lg:sticky lg:top-28 h-fit bg-cream border border-border p-6 lg:p-8">
          <p className="eyebrow">Order summary</p>
          <ul className="mt-5 space-y-3 max-h-72 overflow-y-auto">
            {items.map((it) => (
              <li key={it.id} className="flex gap-3 text-sm">
                <div className="w-14 h-14 shrink-0 bg-background overflow-hidden">
                  <img src={it.image} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate">{it.name.split("—")[0].trim()}</p>
                  <p className="text-xs text-muted-foreground">{it.size} · {it.length} · qty {it.quantity}</p>
                </div>
                <span className="text-sm">{formatUSD(it.unitPrice * it.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="hairline my-5" />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatUSD(subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Shipping</dt><dd>{shipping === 0 ? "Free" : formatUSD(shipping)}</dd></div>
            <div className="flex justify-between font-display text-xl pt-3 border-t border-border mt-3"><dt>Total</dt><dd>{formatUSD(total)}</dd></div>
          </dl>
          <button type="submit" disabled={submitting} className="mt-6 w-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.22em] disabled:opacity-60">
            {submitting ? "Placing order..." : "Place order"}
          </button>
          <p className="mt-3 text-xs text-muted-foreground text-center">Order will be confirmed by email. Payment processed on confirmation.</p>
        </aside>
      </form>
    </section>
  );
}
