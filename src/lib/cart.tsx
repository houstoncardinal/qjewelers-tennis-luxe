import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { saveAbandonedCart, markCartRecovered } from "@/lib/customer.functions";
import { useServerFn } from "@tanstack/react-start";

export interface CartItem {
  id: string; // composite: productId-size-length
  productId: string;
  slug: string;
  name: string;
  color: string;
  size: string;
  length: string;
  unitPrice: number;
  quantity: number;
  image: string;
}

interface CartCtx {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  subtotal: number;
  count: number;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "qj_cart_v1";
// Debounce: wait 8 seconds after the last cart change before syncing as "abandoned"
const ABANDON_DEBOUNCE_MS = 8_000;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const abandonTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef<{ id: string; email: string; token: string } | null>(null);

  const saveFn = useServerFn(saveAbandonedCart);
  const recoverFn = useServerFn(markCartRecovered);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, hydrated]);

  // Track Supabase session for abandoned cart sync
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      if (s?.user?.id && s.user.email) {
        sessionRef.current = { id: s.user.id, email: s.user.email, token: s.access_token };
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s?.user?.id && s.user.email) {
        sessionRef.current = { id: s.user.id, email: s.user.email, token: s.access_token };
      } else {
        sessionRef.current = null;
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Debounced abandoned-cart sync: whenever cart items change, schedule a save.
  // This captures carts where the user adds items then navigates away.
  useEffect(() => {
    if (!hydrated) return;
    if (abandonTimer.current) clearTimeout(abandonTimer.current);

    const sess = sessionRef.current;
    if (!sess || items.length === 0) return;

    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

    abandonTimer.current = setTimeout(async () => {
      try {
        await saveFn({
          data: {
            token: sess.token,
            userId: sess.id,
            userEmail: sess.email,
            cartItems: items,
            cartTotal: subtotal,
          },
        });
      } catch {
        // Silent fail — abandoned cart tracking is best-effort
      }
    }, ABANDON_DEBOUNCE_MS);

    return () => {
      if (abandonTimer.current) clearTimeout(abandonTimer.current);
    };
  }, [items, hydrated]);

  const value: CartCtx = useMemo(() => ({
    items,
    add: (item, qty = 1) => {
      setItems((prev) => {
        const idx = prev.findIndex((p) => p.id === item.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
          return next;
        }
        return [...prev, { ...item, quantity: qty }];
      });
    },
    remove: (id) => setItems((prev) => prev.filter((p) => p.id !== id)),
    setQty: (id, qty) =>
      setItems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, quantity: Math.max(1, qty) } : p)),
      ),
    clear: () => {
      setItems([]);
      // When cart is cleared (after purchase), mark as recovered
      const sess = sessionRef.current;
      if (sess) {
        recoverFn({ data: { token: sess.token, userId: sess.id } }).catch(() => {});
      }
    },
    subtotal: items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
    count: items.reduce((s, i) => s + i.quantity, 0),
  }), [items, hydrated]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
