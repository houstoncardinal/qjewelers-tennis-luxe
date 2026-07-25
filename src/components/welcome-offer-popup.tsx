import { useEffect, useState, useCallback } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { X, Copy, Check, Truck, ShieldCheck } from "lucide-react";

const STORAGE_KEY = "qj_welcome_offer_dismissed";
const SHOW_DELAY_MS = 10_000;
const PROMO_CODE = "QJ2026";
const GOLD = "#C9A84C";

// Never interrupt the admin console or an in-progress checkout.
const EXCLUDED_PREFIXES = ["/admin", "/checkout"];

export function WelcomeOfferPopup() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const excluded = EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  useEffect(() => {
    if (excluded) return;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {}
    if (dismissed) return;
    const timer = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [excluded]);

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, dismiss]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const shopNow = () => {
    dismiss();
    navigate({ to: "/shop" });
  };

  if (excluded || !open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-offer-title"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-500"
        onClick={dismiss}
      />

      <div className="relative w-full max-w-[880px] bg-[#faf9f7] shadow-[0_30px_80px_rgba(0,0,0,0.35)] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div
          className="h-[3px] w-full"
          style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }}
        />

        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/85 backdrop-blur-sm text-[#1a1814] hover:bg-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col sm:flex-row">
          {/* Image panel */}
          <div className="relative h-36 sm:h-auto sm:w-[42%] shrink-0 overflow-hidden">
            <img src="/main.jpg" alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/35 via-transparent to-transparent" />
          </div>

          {/* Content panel */}
          <div className="flex-1 px-6 py-7 sm:px-10 sm:py-10 flex flex-col justify-center text-center sm:text-left">
            <p
              className="text-[0.6rem] uppercase tracking-[0.32em] font-medium mb-3"
              style={{ color: GOLD }}
            >
              Welcome to Qureshi Jewelers
            </p>
            <h2
              id="welcome-offer-title"
              className="font-display text-[1.85rem] sm:text-[2.3rem] leading-[1.06] text-[#1a1814]"
            >
              15% Off Your First Order
            </h2>
            <p className="mt-3 text-sm text-[#6b6560] leading-relaxed max-w-sm mx-auto sm:mx-0">
              Plus free shipping, on us. GRA-certified VVS moissanite, hand-set in S925 sterling
              silver — brilliance that doesn't compromise.
            </p>

            <button
              onClick={copyCode}
              className="mt-6 group flex items-center justify-between gap-3 border border-dashed px-4 py-3 sm:px-5 sm:py-3.5 mx-auto sm:mx-0 max-w-[280px] w-full transition-colors"
              style={{ borderColor: `${GOLD}80`, background: `${GOLD}0D` }}
            >
              <span className="font-mono text-base sm:text-lg font-bold tracking-[0.1em] text-[#1a1814]">
                {PROMO_CODE}
              </span>
              <span className="flex items-center gap-1.5 text-[0.6rem] uppercase tracking-[0.14em] text-[#8a6d1f] shrink-0">
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </>
                )}
              </span>
            </button>

            <button
              onClick={shopNow}
              className="mt-4 w-full sm:w-auto sm:self-start bg-[#1a1814] text-white px-8 py-3.5 text-[0.65rem] uppercase tracking-[0.22em] hover:bg-[#1a1814]/90 transition-colors"
            >
              Shop Now
            </button>

            <div className="mt-6 flex items-center justify-center sm:justify-start gap-4 text-[0.56rem] uppercase tracking-[0.1em] text-[#9b9490]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> GRA Certified
              </span>
              <span className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" /> Free US Shipping
              </span>
            </div>

            <button
              onClick={dismiss}
              className="mt-5 text-[0.58rem] uppercase tracking-[0.16em] text-[#9b9490] hover:text-[#1a1814] underline underline-offset-2 transition-colors mx-auto sm:mx-0"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
