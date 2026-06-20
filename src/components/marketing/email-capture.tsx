import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { subscribeEmail } from "@/lib/products.functions";

export function EmailCapture({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const subscribe = useServerFn(subscribeEmail);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    try {
      await subscribe({ data: { email, source: "email_capture", _hp: hp } });
    } catch {}
    setSubmitted(true);
    toast.success("You're in. Welcome to The Inner Circle.");
    setEmail("");
  };

  const honeypot = (
    <input
      type="text"
      name="company"
      value={hp}
      onChange={(e) => setHp(e.target.value)}
      tabIndex={-1}
      autoComplete="off"
      className="absolute -left-[9999px] w-px h-px opacity-0"
      aria-hidden="true"
    />
  );

  if (submitted) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-foreground" />
        <span>You're on the list for drops and exclusives.</span>
      </div>
    );
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        {honeypot}
        <input
          type="email"
          placeholder="Email for exclusives"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 border-0 border-b border-border bg-transparent py-2 text-sm focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/60"
        />
        <button
          type="submit"
          className="bg-foreground text-background px-4 py-2 text-xs uppercase tracking-[0.22em] hover:bg-foreground/90 transition-colors shrink-0"
        >
          Join
        </button>
      </form>
    );
  }

  return (
    <section className="bg-foreground text-background">
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="eyebrow" style={{ color: "oklch(0.7 0.1 75)" }}>The Inner Circle</p>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl text-background">First access. Always.</h2>
        <p className="mt-4 text-background/70 max-w-md mx-auto leading-relaxed">
          Join our private list. First to see new drops, limited finishes, and members-only pricing.
          No noise — just the good stuff.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 flex max-w-md mx-auto gap-3">
          {honeypot}
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 border-0 border-b border-background/30 bg-transparent py-3 text-sm focus:outline-none focus:border-background transition-colors placeholder:text-background/40"
          />
          <button
            type="submit"
            className="bg-background text-foreground px-8 py-3 text-xs uppercase tracking-[0.22em] hover:bg-background/90 transition-colors flex items-center gap-2"
          >
            Subscribe <ArrowRight className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-4 text-xs text-background/50">Unsubscribe anytime. No sharing your email.</p>
      </div>
    </section>
  );
}
