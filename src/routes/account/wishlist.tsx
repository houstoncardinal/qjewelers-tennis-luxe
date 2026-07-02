import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getWishlist, toggleWishlist } from "@/lib/customer.functions";
import type { WishlistItem } from "@/lib/customer.functions";
import { listProducts } from "@/lib/products.functions";
import { toast } from "sonner";
import { ArrowLeft, Heart, ShoppingBag, Loader2, ArrowRight } from "lucide-react";
import { formatUSD } from "@/lib/pricing";
import type { Session } from "@supabase/supabase-js";

export const Route = createFileRoute("/account/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — Qureshi Jewelers" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountWishlist,
});

const SITE = (import.meta.env.VITE_SITE_URL ?? "https://qureshijewelers.com").replace(/\/$/, "");

function AccountWishlist() {
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchWishlist = useServerFn(getWishlist);
  const toggleFn = useServerFn(toggleWishlist);
  const fetchProducts = useServerFn(listProducts);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const s = data.session;
      setSession(s);
      const [, prodRes] = await Promise.all([
        (async () => {
          if (s?.user?.id && s.access_token) {
            try {
              const res = await fetchWishlist({ data: { token: s.access_token, userId: s.user.id } });
              setItems(res.items);
            } catch {}
          }
        })(),
        fetchProducts(),
      ]);
      setProducts(prodRes.products);
      setLoading(false);
      setHydrated(true);
    });
  }, []);

  const handleRemove = async (productSlug: string) => {
    if (!session) return;
    setRemoving(productSlug);
    try {
      await toggleFn({ data: { token: session.access_token, userId: session.user.id, productSlug } });
      setItems(prev => prev.filter(i => i.product_slug !== productSlug));
      toast.success("Removed from wishlist");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not remove item");
    } finally {
      setRemoving(null);
    }
  };

  if (!hydrated || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-[#faf9f7] min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">Sign in to view your wishlist</p>
          <Link to="/account" className="bg-foreground text-background px-6 py-3 text-[0.62rem] uppercase tracking-[0.18em] hover:bg-foreground/90 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const wishlistProducts = items.map(item => ({
    item,
    product: products.find(p => p.slug === item.product_slug),
  })).filter(({ product }) => !!product);

  return (
    <div className="bg-[#faf9f7] min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-20">
        <Link to="/account" className="inline-flex items-center gap-1.5 text-[0.60rem] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-3.5 h-3.5" /> My Account
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="eyebrow mb-1">Saved for Later</p>
            <h1 className="font-display text-3xl">Your Wishlist</h1>
          </div>
          <span className="text-[0.60rem] text-muted-foreground uppercase tracking-[0.12em]">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
        </div>

        {wishlistProducts.length === 0 ? (
          <div className="text-center py-16 border border-[#e5e1d9] bg-white">
            <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-sm text-muted-foreground mb-4">Your wishlist is empty</p>
            <Link to="/shop" className="inline-flex items-center gap-1.5 bg-foreground text-background px-6 py-3 text-[0.62rem] uppercase tracking-[0.18em] hover:bg-foreground/90 transition-colors">
              Browse Collection <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {wishlistProducts.map(({ item, product }) => {
              const thumb = product.image_url?.startsWith("http")
                ? product.image_url
                : product.image_url
                  ? `${SITE}${product.image_url}`
                  : `${SITE}/QURESHIJEWELERSLOGO.png`;
              return (
                <div key={item.id} className="flex items-start gap-4 bg-white border border-[#e5e1d9] p-4 sm:p-5">
                  <Link to="/product/$slug" params={{ slug: product.slug }} className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 overflow-hidden bg-[oklch(0.97_0.004_75)]">
                    <img src={thumb} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.52rem] uppercase tracking-[0.18em] text-muted-foreground mb-0.5">{product.type}</p>
                    <Link to="/product/$slug" params={{ slug: product.slug }} className="text-sm font-semibold text-foreground hover:opacity-70 transition-opacity line-clamp-2">
                      {product.name}
                    </Link>
                    <p className="text-sm font-semibold mt-1">{formatUSD(Number(product.base_price))}</p>
                    <p className="text-[0.52rem] uppercase tracking-[0.12em] text-muted-foreground mt-0.5">
                      Added {new Date(item.added_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Link
                      to="/product/$slug"
                      params={{ slug: product.slug }}
                      className="flex items-center gap-1 text-[0.58rem] uppercase tracking-[0.14em] bg-foreground text-background px-3 py-2 hover:bg-foreground/90 transition-colors whitespace-nowrap"
                    >
                      <ShoppingBag className="w-3 h-3" /> Shop Now
                    </Link>
                    <button
                      onClick={() => handleRemove(item.product_slug)}
                      disabled={removing === item.product_slug}
                      className="flex items-center gap-1 text-[0.55rem] uppercase tracking-[0.12em] text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      {removing === item.product_slug
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Heart className="w-3 h-3 fill-current" />
                      }
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {wishlistProducts.length > 0 && (
          <div className="mt-6 text-center">
            <Link to="/shop" className="inline-flex items-center gap-1.5 text-[0.60rem] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors">
              Continue Shopping <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
