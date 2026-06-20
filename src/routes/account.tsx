import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getOrdersByEmail } from "@/lib/admin-extended.functions";
import { toast } from "sonner";
import { Mail, LogOut, ShoppingBag, User, ArrowRight, Check, Loader2 } from "lucide-react";
import { formatUSD } from "@/lib/pricing";
import type { Session } from "@supabase/supabase-js";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account — Qureshi Jewelers" },
      { name: "description", content: "Sign in to view your orders and manage your Qureshi Jewelers account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountRoot,
});

function AccountRoot() {
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setHydrated(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return <AccountSignIn />;
  return <AccountDashboard session={session} onSignOut={() => setSession(null)} />;
}

// ─── Sign-in form (magic link) ────────────────────────────────────────────────

function AccountSignIn() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes("@")) { toast.error("Enter a valid email address"); return; }
    setSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: clean,
        options: { emailRedirectTo: `${window.location.origin}/account`, shouldCreateUser: true },
      });
      if (error) throw error;
      setSentTo(clean);
      setSent(true);
    } catch (err: any) {
      toast.error(err?.message ?? "Could not send sign-in link");
    } finally {
      setSending(false);
    }
  };

  const inputCls = "w-full border border-[#ddd8d0] bg-white px-4 py-3.5 text-sm text-foreground placeholder:text-[#bbb] focus:outline-none focus:border-foreground transition-colors";

  if (sent) {
    return (
      <div className="bg-[#faf9f7] min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full border-2 border-foreground flex items-center justify-center mx-auto">
            <Mail className="w-7 h-7 text-foreground" />
          </div>
          <p className="eyebrow mt-8">Check Your Inbox</p>
          <h1 className="font-display text-4xl mt-2">Link Sent</h1>
          <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
            We sent a secure sign-in link to <strong>{sentTo}</strong>. Click it to access your account — no password needed.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">Link expires in 60 minutes. Check your spam folder if you don't see it.</p>
          <button
            onClick={() => setSent(false)}
            className="mt-6 text-[0.62rem] uppercase tracking-[0.16em] underline text-muted-foreground hover:text-foreground transition-colors"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#faf9f7] min-h-screen">
      <div className="mx-auto max-w-md px-4 sm:px-6 py-16 sm:py-24">
        <p className="eyebrow mb-4">My Account</p>
        <h1 className="font-display text-4xl sm:text-5xl">Sign In</h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Enter your email and we'll send you a secure sign-in link — no password required.
        </p>

        <form onSubmit={handleSignIn} className="mt-10 space-y-5">
          <div>
            <label className="block text-[0.60rem] uppercase tracking-[0.16em] font-medium text-muted-foreground mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              className={inputCls}
              required
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="w-full bg-foreground text-background py-4 text-[0.65rem] uppercase tracking-[0.22em] disabled:opacity-60 hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
          >
            {sending && <span className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />}
            {sending ? "Sending…" : "Send Sign-In Link"}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-[#e8e4de]">
          <p className="text-xs text-muted-foreground text-center mb-4">
            New to Qureshi Jewelers? An account is created automatically when you sign in.
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { icon: ShoppingBag, label: "Order History" },
              { icon: User, label: "Easy Returns" },
              { icon: Check, label: "Order Tracking" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="border border-[#e5e1d9] bg-white p-3">
                <Icon className="w-4 h-4 mx-auto text-muted-foreground mb-1.5" />
                <p className="text-[0.58rem] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Account dashboard (signed in) ───────────────────────────────────────────

function AccountDashboard({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  const navigate = useNavigate();
  const email = session.user.email ?? "";
  const displayName = email.split("@")[0];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onSignOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  return (
    <div className="bg-[#faf9f7] min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="eyebrow mb-2">My Account</p>
            <h1 className="font-display text-3xl sm:text-4xl capitalize">{displayName}</h1>
            <p className="text-sm text-muted-foreground mt-1">{email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-[0.60rem] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors mt-1"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <Link
            to="/account/orders"
            className="group flex items-center justify-between p-5 bg-white border border-[#e5e1d9] hover:border-foreground transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.14em] font-medium">Order History</p>
                <p className="text-xs text-muted-foreground mt-0.5">View and track all your orders</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            to="/returns"
            className="group flex items-center justify-between p-5 bg-white border border-[#e5e1d9] hover:border-foreground transition-colors"
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.14em] font-medium">Start a Return</p>
                <p className="text-xs text-muted-foreground mt-0.5">14-day hassle-free returns</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <RecentOrders email={email} />
      </div>
    </div>
  );
}

// ─── Recent orders widget (shows last 3) ─────────────────────────────────────

function RecentOrders({ email }: { email: string }) {
  const fetchOrders = useServerFn(getOrdersByEmail);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders({ data: { email } })
      .then(res => { setOrders(res.orders.slice(0, 3)); setLoading(false); })
      .catch(() => setLoading(false));
  }, [email]);

  const STATUS_BADGE: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    processing: "bg-blue-50 text-blue-700 border-blue-200",
    shipped: "bg-violet-50 text-violet-700 border-violet-200",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-16 bg-white border border-[#e5e1d9] animate-pulse" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-10 border border-[#e5e1d9] bg-white">
        <ShoppingBag className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
        <p className="text-sm text-muted-foreground">No orders yet</p>
        <Link to="/shop" className="mt-3 inline-block text-[0.62rem] uppercase tracking-[0.16em] underline text-muted-foreground hover:text-foreground transition-colors">
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[0.62rem] uppercase tracking-[0.18em] font-medium text-muted-foreground">Recent Orders</p>
        <Link to="/account/orders" className="text-[0.58rem] uppercase tracking-[0.14em] underline text-muted-foreground hover:text-foreground transition-colors">
          View All
        </Link>
      </div>
      <div className="space-y-2">
        {orders.map(o => (
          <div key={o.order_number} className="flex items-center justify-between p-4 bg-white border border-[#e5e1d9]">
            <div>
              <p className="font-mono text-xs font-semibold text-foreground">{o.order_number}</p>
              <p className="text-[0.60rem] text-muted-foreground mt-0.5">
                {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[0.58rem] uppercase tracking-[0.08em] font-medium px-2 py-0.5 border ${STATUS_BADGE[o.status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                {o.status}
              </span>
              <span className="text-sm font-semibold text-foreground">{formatUSD(Number(o.total))}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
