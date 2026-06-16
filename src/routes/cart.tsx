import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, X, ArrowRight, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatUSD } from "@/lib/pricing";
import { getShippingConfig } from "@/lib/products.functions";

export const Route = createFileRoute("/cart")({
  loader: async () => {
    const config = await getShippingConfig();
    return { shippingConfig: config };
  },
  head: () => ({
    meta: [
      { title: "Your Bag — Qureshi Jewelers" },
      { name: "description", content: "Review your selected S925 moissanite tennis chains and bracelets." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { shippingConfig } = Route.useLoaderData();
  const { freeShippingThreshold, flatShippingRate } = shippingConfig;
  const { items, setQty, remove, subtotal } = useCart();
  const shipping = subtotal === 0 ? 0 : subtotal >= freeShippingThreshold ? 0 : flatShippingRate;

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground" />
        <h1 className="mt-6 font-display text-4xl">Your bag is empty</h1>
        <p className="mt-3 text-sm text-muted-foreground">Discover the collection that's redefining iced out.</p>
        <Link to="/shop" className="inline-flex mt-8 bg-foreground text-background px-8 py-4 text-xs uppercase tracking-[0.22em]">
          Shop the collection
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-6 lg:px-10 py-12 lg:py-16">
      <p className="eyebrow">Your bag</p>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl">{items.length} {items.length === 1 ? "piece" : "pieces"}</h1>

      <div className="mt-10 grid lg:grid-cols-3 gap-12">
        <ul className="lg:col-span-2 divide-y divide-border border-t border-b border-border">
          {items.map((it) => (
            <li key={it.id} className="py-6 flex gap-4">
              <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-cream overflow-hidden">
                <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">{it.color.replace("_", " ")}</p>
                    <Link to="/product/$slug" params={{ slug: it.slug }} className="font-display text-lg sm:text-xl leading-tight block mt-1">
                      {it.name.split("—")[0].trim()}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">{it.size} · {it.length}</p>
                  </div>
                  <button onClick={() => remove(it.id)} aria-label="Remove" className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center border border-border">
                    <button onClick={() => setQty(it.id, it.quantity - 1)} className="p-2"><Minus className="h-3 w-3" /></button>
                    <span className="w-8 text-center text-sm">{it.quantity}</span>
                    <button onClick={() => setQty(it.id, it.quantity + 1)} className="p-2"><Plus className="h-3 w-3" /></button>
                  </div>
                  <span className="font-display text-lg">{formatUSD(it.unitPrice * it.quantity)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-28 h-fit">
          <div className="bg-cream border border-border p-6 lg:p-8">
            <p className="eyebrow">Summary</p>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatUSD(subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Shipping</dt><dd>{shipping === 0 ? "Free" : formatUSD(shipping)}</dd></div>
              {subtotal > 0 && subtotal < freeShippingThreshold && <p className="text-xs text-muted-foreground">Spend {formatUSD(freeShippingThreshold - subtotal)} more for free shipping.</p>}
              <div className="hairline" />
              <div className="flex justify-between font-display text-xl"><dt>Total</dt><dd>{formatUSD(subtotal + shipping)}</dd></div>
            </dl>
            <Link to="/checkout" className="mt-6 flex items-center justify-center gap-2 bg-foreground text-background w-full py-4 text-xs uppercase tracking-[0.22em]">
              Checkout <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/shop" className="block text-center mt-3 text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground">
              Continue shopping
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground text-center">Free US shipping over $250 · GRA certificate included</p>
        </aside>
      </div>
    </section>
  );
}
