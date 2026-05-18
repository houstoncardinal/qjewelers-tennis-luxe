import { Link } from "@tanstack/react-router";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useCart } from "@/lib/cart";

export function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  const nav = (
    <>
      <Link to="/shop" className="hover:text-foreground transition-colors" onClick={() => setOpen(false)}>Shop</Link>
      <Link to="/shop" search={{ type: "necklace" }} className="hover:text-foreground transition-colors" onClick={() => setOpen(false)}>Chains</Link>
      <Link to="/shop" search={{ type: "bracelet" }} className="hover:text-foreground transition-colors" onClick={() => setOpen(false)}>Bracelets</Link>
      <Link to="/about" className="hover:text-foreground transition-colors" onClick={() => setOpen(false)}>Our Craft</Link>
      <Link to="/contact" className="hover:text-foreground transition-colors" onClick={() => setOpen(false)}>Contact</Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-20 flex items-center justify-between gap-6">
        <button className="md:hidden -ml-2 p-2" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-display text-2xl tracking-tight">Qureshi</span>
          <span className="hidden sm:inline text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground border-l border-border pl-2">Jewelers</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {nav}
        </nav>

        <Link to="/cart" className="relative flex items-center gap-2 text-sm hover:text-foreground transition-colors">
          <ShoppingBag className="h-5 w-5" />
          <span className="hidden sm:inline">Bag</span>
          {count > 0 && (
            <span className="absolute -top-2 -right-3 sm:static sm:ml-1 sm:-top-0 sm:-right-0 min-w-5 h-5 px-1 rounded-full bg-foreground text-background text-[0.65rem] font-medium flex items-center justify-center">
              {count}
            </span>
          )}
        </Link>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="flex flex-col gap-4 px-6 py-6 text-sm">{nav}</nav>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-32 border-t border-border bg-cream">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-display text-3xl">Qureshi <span className="text-muted-foreground">Jewelers</span></div>
          <p className="mt-4 text-sm text-muted-foreground max-w-sm leading-relaxed">
            America's destination for S925 sterling silver, VVS moissanite tennis chains.
            Hand-set. GRA certified. Lifetime brilliance.
          </p>
        </div>
        <div>
          <div className="eyebrow mb-4">Shop</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/shop" search={{ type: "necklace" }} className="hover:text-foreground">Tennis Chains</Link></li>
            <li><Link to="/shop" search={{ type: "bracelet" }} className="hover:text-foreground">Tennis Bracelets</Link></li>
            <li><Link to="/shop" className="hover:text-foreground">All Pieces</Link></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-4">House</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">Our Craft</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
            <li><span className="text-muted-foreground">Free US shipping over $250</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-6 flex flex-col sm:flex-row gap-2 justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Qureshi Jewelers. All rights reserved.</span>
          <span>S925 · VVS Moissanite · GRA Certified</span>
        </div>
      </div>
    </footer>
  );
}
