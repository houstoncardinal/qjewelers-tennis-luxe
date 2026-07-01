import { Link } from "@tanstack/react-router";
import {
  ShoppingBag, Menu, X, User,
  Link2, CircleDot, Sparkle, Circle,
  PackageSearch, Ruler, Phone, ChevronRight,
} from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useCart } from "@/lib/cart";
import { subscribeEmail } from "@/lib/products.functions";

const NAV_ITEMS = [
  { label: "Shop All",   to: "/shop",                      search: {} },
  { label: "Chains",     to: "/shop", search: { type: "necklace" } },
  { label: "Bracelets",  to: "/shop", search: { type: "bracelet" } },
  { label: "Earrings",   to: "/shop", search: { type: "earring" } },
  { label: "Rings",      to: "/shop", search: { type: "ring" } },
  { label: "Our Craft",  to: "/about",                     search: {} },
  { label: "Moissanite", to: "/moissanite-guide",          search: {} },
];

// Mobile drawer — top serif links (destinations, not product types)
const EXPLORE_LINKS = [
  { label: "Shop All",         to: "/shop",             search: {} },
  { label: "Our Craft",        to: "/about",            search: {} },
  { label: "Moissanite Guide", to: "/moissanite-guide", search: {} },
];

// Mobile drawer — product-type quick grid
const CATEGORY_LINKS = [
  { label: "Chains",    to: "/shop", search: { type: "necklace" }, icon: Link2 },
  { label: "Bracelets", to: "/shop", search: { type: "bracelet" }, icon: CircleDot },
  { label: "Earrings",  to: "/shop", search: { type: "earring" },  icon: Sparkle },
  { label: "Rings",     to: "/shop", search: { type: "ring" },     icon: Circle },
];

// Mobile drawer — utility shortcuts
const QUICK_LINKS = [
  { label: "My Account",  to: "/account",     icon: User },
  { label: "Track Order", to: "/track-order", icon: PackageSearch },
  { label: "Size Guide",  to: "/size-guide",  icon: Ruler },
  { label: "Contact Us",  to: "/contact",     icon: Phone },
];

export function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <header className={`sticky top-0 z-40 bg-background/92 backdrop-blur-xl transition-shadow duration-300 ${scrolled ? "shadow-[0_1px_0_oklch(0.932_0.004_75),0_4px_24px_oklch(0.14_0.006_50_/_0.04)]" : ""}`}>
        {/* Full-bleed bar — padding matches the hero's content padding (px-5 sm:px-8
            lg:px-14 xl:px-20) instead of a separate boxed max-width, so the logo and
            nav line up with the hero's headline/CTA edges at every breakpoint. */}
        <div className="w-full px-5 sm:px-8 lg:px-14 xl:px-20 h-16 md:h-20 lg:h-24 flex items-center justify-between gap-6">

          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0" onClick={close}>
            <img
              src="/QURESHIJEWELERSLOGO.png"
              alt="Qureshi Jewelers"
              className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-[0.68rem] uppercase tracking-[0.12em] text-muted-foreground flex-1 justify-center">
            {NAV_ITEMS.map(({ label, to, search }) => (
              <Link
                key={label}
                to={to as any}
                search={search as any}
                className="lux-link hover:text-foreground transition-colors duration-250 py-1"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop icon cluster */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            <Link
              to="/account"
              className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground transition-colors duration-250"
              aria-label="My Account"
            >
              <User className="h-[18px] w-[18px]" />
            </Link>
            <Link
              to="/cart"
              className="flex items-center gap-2 group shrink-0 text-muted-foreground hover:text-foreground transition-colors duration-250 ml-1"
            >
              <div className="relative">
                <ShoppingBag className="h-[18px] w-[18px]" />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-0.5 bg-foreground text-background text-[0.45rem] font-semibold flex items-center justify-center leading-none rounded-sm">
                    {count}
                  </span>
                )}
              </div>
              <span className="hidden lg:block text-[0.68rem] uppercase tracking-[0.12em]">Bag</span>
            </Link>
          </div>

          {/* Mobile icon cluster — logo stays left, all icons grouped right */}
          <div className="flex md:hidden items-center gap-0.5 shrink-0">
            <Link
              to="/cart"
              className="relative p-1.5 text-muted-foreground hover:text-foreground transition-colors duration-250"
              aria-label="Bag"
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[15px] h-[15px] px-0.5 bg-foreground text-background text-[0.45rem] font-semibold flex items-center justify-center leading-none rounded-sm">
                  {count}
                </span>
              )}
            </Link>
            <button
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setOpen(v => !v)}
              aria-label="Menu"
              aria-expanded={open}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="h-px bg-border/70" />
      </header>

      {/* Mobile navigation overlay — rendered OUTSIDE <header> to avoid stacking context issues */}
      <div
        className={`fixed inset-0 z-[99999] md:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={close}
        />

        {/* Panel — slides in from the right */}
        <div
          className={`absolute top-0 right-0 bottom-0 w-full max-w-sm bg-background shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          {/* ── Top bar: logo + close ── */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
            <Link to="/" onClick={close} className="flex items-center">
              <img src="/QURESHIJEWELERSLOGO.png" alt="Qureshi Jewelers" className="h-9 w-auto" />
            </Link>
            <button
              onClick={close}
              className="w-9 h-9 flex items-center justify-center rounded-sm text-foreground/50 hover:text-foreground hover:bg-border/40 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">

            {/* Primary navigation */}
            <nav className="py-2">
              {[
                { label: "Shop All",          to: "/shop",             search: {} },
                { label: "Chains",            to: "/shop",             search: { type: "necklace" } },
                { label: "Bracelets",         to: "/shop",             search: { type: "bracelet" } },
                { label: "Earrings",          to: "/shop",             search: { type: "earring"  } },
                { label: "Rings",             to: "/shop",             search: { type: "ring"     } },
                { label: "Our Craft",         to: "/about",            search: {} },
                { label: "Moissanite Guide",  to: "/moissanite-guide", search: {} },
              ].map(({ label, to, search }) => (
                <Link
                  key={label}
                  to={to as any}
                  search={search as any}
                  onClick={close}
                  className="flex items-center justify-between px-5 py-3.5 border-b border-border/40 hover:bg-cream transition-colors duration-150"
                >
                  <span className="text-[0.82rem] font-medium uppercase tracking-[0.10em] text-foreground">{label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                </Link>
              ))}
            </nav>

            {/* Account & Support */}
            <div className="mt-2 border-t border-border">
              <p className="px-5 pt-5 pb-2 text-[0.44rem] uppercase tracking-[0.32em] text-muted-foreground/40">
                Account & Support
              </p>
              {QUICK_LINKS.map(({ label, to, icon: Icon }) => (
                <Link
                  key={label}
                  to={to as any}
                  onClick={close}
                  className="flex items-center justify-between px-5 py-3.5 border-b border-border/30 last:border-b-0 hover:bg-cream transition-colors duration-150"
                >
                  <span className="flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.10em] text-muted-foreground">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {label}
                  </span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/25 shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* ── Footer strip ── */}
          <div className="shrink-0 border-t border-border bg-cream/50 px-5 py-4">
            <div className="flex items-center gap-3">
              <img src="/QURESHIJEWELERSLOGO.png" alt="Qureshi Jewelers" className="h-6 w-auto opacity-40 shrink-0" />
              <p className="text-[0.42rem] uppercase tracking-[0.20em] text-muted-foreground/45 leading-relaxed">
                GRA Certified · VVS1 Moissanite · S925 Sterling Silver
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function FooterCol({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[0.52rem] uppercase tracking-[0.38em] mb-5 text-muted-foreground/50">
        {heading}
      </p>
      {children}
    </div>
  );
}

function FooterLink({
  to, search, children,
}: {
  to: string; search?: Record<string, string>; children: ReactNode;
}) {
  return (
    <li>
      <Link
        to={to as any}
        search={search as any}
        className="text-[0.82rem] text-muted-foreground hover:text-foreground lux-link transition-colors duration-250"
      >
        {children}
      </Link>
    </li>
  );
}

export function Footer() {
  const [email, setEmail] = useState("");
  const [subbed, setSubbed] = useState(false);
  const year = new Date().getFullYear();
  const subscribe = useServerFn(subscribeEmail);

  const handleSub = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    try {
      await subscribe({ data: { email, source: "footer" } });
    } catch {}
    setSubbed(true);
    setEmail("");
  };

  return (
    <footer className="border-t border-[#ece8e0]">
      <div className="mx-auto max-w-[1360px] px-5 lg:px-10 pt-16 pb-12">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">

          {/* Brand col */}
          <div className="lg:col-span-2 space-y-6">
            <Link to="/" className="inline-block">
              <img src="/QURESHIJEWELERSLOGO.png" alt="Qureshi Jewelers" className="h-16 sm:h-20 w-auto" />
            </Link>

            <p className="text-[0.82rem] leading-[1.85] max-w-xs text-muted-foreground">
              Hand-set VVS moissanite in solid S925 sterling silver.
              GRA certified. Built for those who demand brilliance without compromise.
            </p>

            <div className="flex flex-wrap gap-2">
              {["S925 Sterling", "VVS · D Color", "GRA Certified"].map(badge => (
                <span
                  key={badge}
                  className="px-3 py-1.5 text-[0.46rem] uppercase tracking-[0.22em] border border-[#e0dbd3] text-muted-foreground"
                >
                  {badge}
                </span>
              ))}
            </div>

            <div>
              <p className="text-[0.52rem] uppercase tracking-[0.30em] mb-4 text-muted-foreground/40">
                Join the Qureshi Circle
              </p>
              {subbed ? (
                <p className="text-[0.82rem] text-muted-foreground">You're on the list. Welcome.</p>
              ) : (
                <form onSubmit={handleSub} className="flex gap-3 max-w-xs">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className="flex-1 min-w-0 bg-transparent pb-2 text-[0.82rem] focus:outline-none text-foreground border-b border-[#d0cbc3] placeholder:text-muted-foreground/40 focus:border-foreground transition-colors"
                  />
                  <button
                    type="submit"
                    className="pb-2 text-[0.52rem] uppercase tracking-[0.26em] text-muted-foreground hover:text-foreground transition-colors duration-250 shrink-0"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>

          <FooterCol heading="Shop">
            <ul className="space-y-3.5">
              <FooterLink to="/shop" search={{ type: "necklace" }}>Tennis Chains</FooterLink>
              <FooterLink to="/shop" search={{ type: "bracelet" }}>Tennis Bracelets</FooterLink>
              <FooterLink to="/shop" search={{ type: "earring" }}>Stud Earrings</FooterLink>
              <FooterLink to="/shop" search={{ type: "ring" }}>Engagement Rings</FooterLink>
              <FooterLink to="/shop">All Pieces</FooterLink>
            </ul>
          </FooterCol>

          <FooterCol heading="Learn">
            <ul className="space-y-3.5">
              <FooterLink to="/moissanite-guide">Moissanite Guide</FooterLink>
              <FooterLink to="/size-guide">Size Guide</FooterLink>
              <FooterLink to="/faq">FAQ</FooterLink>
              <FooterLink to="/about">Our Craft</FooterLink>
            </ul>
          </FooterCol>

          <FooterCol heading="Support">
            <ul className="space-y-3.5">
              <FooterLink to="/account">My Account</FooterLink>
              <FooterLink to="/account/orders">Order History</FooterLink>
              <FooterLink to="/contact">Contact Us</FooterLink>
              <FooterLink to="/returns">Start a Return</FooterLink>
              <FooterLink to="/track-order">Track Order</FooterLink>
              <FooterLink to="/faq">Shipping & FAQ</FooterLink>
              <FooterLink to="/privacy-policy">Privacy Policy</FooterLink>
              <FooterLink to="/terms-of-service">Terms of Service</FooterLink>
              <FooterLink to="/refund-policy">Refund Policy</FooterLink>
            </ul>
          </FooterCol>
        </div>
      </div>

      <div className="h-px mx-5 lg:mx-10 bg-[#ece8e0]" />

      <div className="mx-auto max-w-[1360px] px-5 lg:px-10 py-6 flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="text-[0.52rem] uppercase tracking-[0.24em] text-muted-foreground/40">
          © {year} Qureshi Jewelers. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-[0.52rem] uppercase tracking-[0.18em] text-muted-foreground/40">
          <span>S925 Sterling Silver</span>
          <span className="opacity-50">·</span>
          <span>VVS Moissanite</span>
          <span className="opacity-50">·</span>
          <span>GRA Certified</span>
        </div>
      </div>
    </footer>
  );
}
