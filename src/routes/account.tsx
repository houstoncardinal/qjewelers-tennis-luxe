import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getOrdersByEmail } from "@/lib/admin-extended.functions";
import { toast } from "sonner";
import {
  LogOut, ShoppingBag, User, ArrowRight, Loader2,
  Eye, EyeOff, Heart, MapPin, Package,
} from "lucide-react";
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

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls =
  "w-full border border-[#ddd8d0] bg-white px-4 py-3.5 text-sm text-foreground placeholder:text-[#bbb] focus:outline-none focus:border-foreground transition-colors";

const btnPrimary =
  "w-full bg-foreground text-background py-4 text-[0.65rem] uppercase tracking-[0.22em] disabled:opacity-60 hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2";

// ─── Sign-in / Sign-up page ───────────────────────────────────────────────────

type AuthMode = "signin" | "signup" | "magic" | "reset";

function AccountSignIn() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const SITE =
    typeof window !== "undefined"
      ? window.location.origin
      : (import.meta.env.VITE_SITE_URL ?? "https://qureshijewelers.com");

  const handleGoogleSignIn = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${SITE}/account` },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(
        err?.message ?? "Google sign-in failed. Enable Google Auth in your Supabase project settings.",
      );
      setBusy(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean) { toast.error("Enter your email address"); return; }
    if (!password) { toast.error("Enter your password"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: clean, password });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err?.message ?? "Sign-in failed — check your email and password");
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes("@")) { toast.error("Enter a valid email address"); return; }
    if (!password || password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (password !== confirmPassword) { toast.error("Passwords don't match"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: clean,
        password,
        options: { emailRedirectTo: `${SITE}/account` },
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      toast.error(err?.message ?? "Could not create account");
    } finally {
      setBusy(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes("@")) { toast.error("Enter a valid email address"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: clean,
        options: { emailRedirectTo: `${SITE}/account`, shouldCreateUser: true },
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      toast.error(err?.message ?? "Could not send sign-in link");
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes("@")) { toast.error("Enter your email address"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(clean, {
        redirectTo: `${SITE}/account`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Password reset email sent");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not send reset email");
    } finally {
      setBusy(false);
    }
  };

  // Confirmation screens after form submit
  if (sent) {
    const copy: Record<AuthMode, { title: string; body: string }> = {
      magic:  { title: "Check Your Inbox",   body: `We sent a secure sign-in link to ${email}. Click it to access your account — no password needed.` },
      signup: { title: "Confirm Your Email", body: `We sent a confirmation link to ${email}. Click it to activate your account, then sign in with your password.` },
      reset:  { title: "Reset Link Sent",    body: `We sent a password reset link to ${email}. Follow the link in the email to choose a new password.` },
      signin: { title: "", body: "" },
    };
    const { title, body } = copy[mode];
    return (
      <div className="bg-[#faf9f7] min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full border-2 border-foreground flex items-center justify-center mx-auto text-2xl">✉️</div>
          <h1 className="font-display text-4xl mt-6">{title}</h1>
          <p className="mt-4 text-muted-foreground text-sm leading-relaxed">{body}</p>
          <p className="mt-2 text-xs text-muted-foreground">Check your spam folder if you don't see it within a minute.</p>
          <button
            onClick={() => { setSent(false); setMode("signin"); }}
            className="mt-6 text-[0.62rem] uppercase tracking-[0.16em] underline text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#faf9f7] min-h-screen">
      <div className="mx-auto max-w-md px-4 sm:px-6 py-16 sm:py-24">
        <p className="eyebrow mb-4">My Account</p>
        <h1 className="font-display text-4xl sm:text-5xl">
          {mode === "signup" ? "Create Account" : mode === "reset" ? "Reset Password" : "Sign In"}
        </h1>
        <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
          {mode === "signup"
            ? "Create a free account to track orders, save addresses, and build your wishlist."
            : mode === "reset"
            ? "Enter your email and we'll send a secure reset link."
            : "Sign in to access your orders, saved addresses, and wishlist."}
        </p>

        {/* Google sign-in */}
        {mode !== "reset" && (
          <>
            <button
              onClick={handleGoogleSignIn}
              disabled={busy}
              className="mt-8 w-full flex items-center justify-center gap-3 border border-[#ddd8d0] bg-white py-3.5 text-sm font-medium hover:border-foreground transition-colors disabled:opacity-60"
            >
              {/* Google "G" SVG */}
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-[#e8e4de]" />
              <span className="text-[0.60rem] uppercase tracking-[0.16em] text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-[#e8e4de]" />
            </div>
          </>
        )}

        {/* Mode tabs: Sign In / Create Account */}
        {(mode === "signin" || mode === "signup") && (
          <div className="flex border border-[#e5e1d9] mb-6">
            {(["signin", "signup"] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setSent(false); }}
                className={`flex-1 py-2.5 text-[0.60rem] uppercase tracking-[0.18em] transition-colors ${
                  mode === m ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>
        )}

        {/* Password sign-in form */}
        {mode === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-[0.60rem] uppercase tracking-[0.16em] font-medium text-muted-foreground mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" autoComplete="email" className={inputCls} required />
            </div>
            <div>
              <label className="block text-[0.60rem] uppercase tracking-[0.16em] font-medium text-muted-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`${inputCls} pr-11`}
                  required
                />
                <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={busy} className={btnPrimary}>
              {busy && <span className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />}
              {busy ? "Signing in…" : "Sign In"}
            </button>
            <div className="flex items-center justify-between text-[0.60rem] uppercase tracking-[0.12em] text-muted-foreground pt-1">
              <button type="button" onClick={() => setMode("magic")} className="hover:text-foreground transition-colors">
                Use magic link instead
              </button>
              <button type="button" onClick={() => setMode("reset")} className="hover:text-foreground transition-colors">
                Forgot password?
              </button>
            </div>
          </form>
        )}

        {/* Create account form */}
        {mode === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-[0.60rem] uppercase tracking-[0.16em] font-medium text-muted-foreground mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" autoComplete="email" className={inputCls} required />
            </div>
            <div>
              <label className="block text-[0.60rem] uppercase tracking-[0.16em] font-medium text-muted-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className={`${inputCls} pr-11`}
                  required minLength={8}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[0.60rem] uppercase tracking-[0.16em] font-medium text-muted-foreground mb-1.5">Confirm Password</label>
              <input
                type={showPw ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
                className={inputCls}
                required
              />
            </div>
            <button type="submit" disabled={busy} className={btnPrimary}>
              {busy && <span className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />}
              {busy ? "Creating account…" : "Create Account"}
            </button>
          </form>
        )}

        {/* Magic link form */}
        {mode === "magic" && (
          <form onSubmit={handleMagicLink} className="space-y-4 mt-2">
            <div>
              <label className="block text-[0.60rem] uppercase tracking-[0.16em] font-medium text-muted-foreground mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" autoComplete="email" className={inputCls} required />
            </div>
            <button type="submit" disabled={busy} className={btnPrimary}>
              {busy && <span className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />}
              {busy ? "Sending…" : "Send Sign-In Link"}
            </button>
            <button type="button" onClick={() => setMode("signin")} className="w-full text-center text-[0.60rem] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors">
              Sign in with password instead
            </button>
          </form>
        )}

        {/* Password reset form */}
        {mode === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4 mt-8">
            <div>
              <label className="block text-[0.60rem] uppercase tracking-[0.16em] font-medium text-muted-foreground mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" autoComplete="email" className={inputCls} required />
            </div>
            <button type="submit" disabled={busy} className={btnPrimary}>
              {busy && <span className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />}
              {busy ? "Sending…" : "Send Reset Link"}
            </button>
            <button type="button" onClick={() => setMode("signin")} className="w-full text-center text-[0.60rem] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors">
              Back to sign in
            </button>
          </form>
        )}

        {/* Benefits footer */}
        {(mode === "signin" || mode === "signup") && (
          <div className="mt-10 pt-8 border-t border-[#e8e4de]">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { icon: ShoppingBag, label: "Order History" },
                { icon: MapPin,      label: "Saved Addresses" },
                { icon: Heart,       label: "Wishlist" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="border border-[#e5e1d9] bg-white p-3">
                  <Icon className="w-4 h-4 mx-auto text-muted-foreground mb-1.5" />
                  <p className="text-[0.58rem] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Account dashboard (signed in) ───────────────────────────────────────────

function AccountDashboard({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  const navigate = useNavigate();
  const email = session.user.email ?? "";
  const displayName = (session.user.user_metadata?.full_name as string | undefined) ?? email.split("@")[0];

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
          {[
            { icon: ShoppingBag, label: "Order History",      sub: "View and track all your orders",      to: "/account/orders" as const },
            { icon: MapPin,      label: "Saved Addresses",    sub: "Manage your shipping addresses",       to: "/account/addresses" as const },
            { icon: Heart,       label: "Wishlist",           sub: "Items you've saved for later",         to: "/account/wishlist" as const },
            { icon: User,        label: "Start a Return",     sub: "14-day hassle-free returns",           to: "/returns" as const },
          ].map(({ icon: Icon, label, sub, to }) => (
            <Link
              key={label}
              to={to}
              className="group flex items-center justify-between p-5 bg-white border border-[#e5e1d9] hover:border-foreground transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.14em] font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>

        <RecentOrders email={email} />
      </div>
    </div>
  );
}

// ─── Recent orders widget ─────────────────────────────────────────────────────

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
    pending:    "bg-amber-50 text-amber-700 border-amber-200",
    processing: "bg-blue-50 text-blue-700 border-blue-200",
    shipped:    "bg-violet-50 text-violet-700 border-violet-200",
    delivered:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled:  "bg-red-50 text-red-700 border-red-200",
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
        <Package className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
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
