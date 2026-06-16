import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { RotateCcw, Check, Package } from "lucide-react";
import { submitReturn } from "@/lib/admin-extended.functions";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Start a Return — Qureshi Jewelers" },
      { name: "description", content: "Submit a return request for your Qureshi Jewelers order. 14-day return window." },
    ],
  }),
  component: Returns,
});

const REASONS = [
  "Wrong size ordered",
  "Item looks different than expected",
  "Received wrong item",
  "Item arrived damaged",
  "Defective — quality issue",
  "Changed my mind",
  "Bought as gift — recipient doesn't want it",
  "Other",
];

function Returns() {
  const doSubmit = useServerFn(submitReturn);

  const [form, setForm] = useState({
    order_number: "",
    customer_name: "",
    customer_email: "",
    reason: "",
    reason_other: "",
    item_desc: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const update = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.order_number.trim() || !form.customer_email.trim() || !form.reason) {
      toast.error("Please fill in all required fields");
      return;
    }
    const reasonFinal = form.reason === "Other" && form.reason_other.trim()
      ? form.reason_other.trim()
      : form.reason;

    setSubmitting(true);
    try {
      await doSubmit({
        data: {
          order_number: form.order_number.trim().toUpperCase(),
          customer_name: form.customer_name.trim(),
          customer_email: form.customer_email.trim().toLowerCase(),
          reason: reasonFinal,
          items: form.item_desc.trim()
            ? [{ name: form.item_desc.trim(), quantity: 1 }]
            : [],
        },
      });
      setDone(true);
    } catch (err: any) {
      toast.error(err?.message ?? "Could not submit return request — please check your order number and email");
    } finally {
      setSubmitting(false);
    }
  };

  const labelCls = "block text-[0.6rem] uppercase tracking-[0.2em] font-medium text-muted-foreground mb-1.5";
  const inputCls = "w-full border border-[#ddd8d0] bg-white px-4 py-3.5 text-sm text-foreground placeholder:text-[#bbb] focus:outline-none focus:border-foreground transition-colors duration-150";

  if (done) {
    return (
      <div className="bg-[#faf9f7] min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full border-2 border-foreground flex items-center justify-center mx-auto">
            <Check className="w-7 h-7 text-foreground" strokeWidth={2.5} />
          </div>
          <p className="eyebrow mt-8">Request Received</p>
          <h1 className="font-display text-4xl mt-2">We've got it.</h1>
          <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
            Your return request has been submitted. Our team will review it and respond within 1–2 business days with next steps.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Do not ship your item until you hear from us.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#faf9f7] min-h-screen">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16 sm:py-24">
        <p className="eyebrow mb-4">Returns</p>
        <h1 className="font-display text-4xl sm:text-5xl">Start a Return</h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          We offer a 14-day return window from the date of delivery.
          Fill in the form below and we'll be in touch within 1–2 business days.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: RotateCcw, label: "14-Day Window" },
            { icon: Package, label: "Free Return Label" },
            { icon: Check, label: "Fast Refunds" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="border border-[#e5e1d9] bg-white p-4">
              <Icon className="w-5 h-5 mx-auto text-muted-foreground mb-2" />
              <p className="text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5">
          <div className="border border-[#e5e1d9] bg-white">
            <div className="px-6 py-4 border-b border-[#f0ece4]">
              <p className="text-[0.65rem] uppercase tracking-[0.18em] font-medium">Order Information</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={labelCls}>Order Number *</label>
                <input
                  value={form.order_number}
                  onChange={update("order_number")}
                  placeholder="QJ-XXXXXXXX"
                  className={inputCls + " font-mono uppercase"}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Full Name *</label>
                  <input
                    value={form.customer_name}
                    onChange={update("customer_name")}
                    placeholder="Jane Smith"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Email Address *</label>
                  <input
                    type="email"
                    value={form.customer_email}
                    onChange={update("customer_email")}
                    placeholder="jane@example.com"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border border-[#e5e1d9] bg-white">
            <div className="px-6 py-4 border-b border-[#f0ece4]">
              <p className="text-[0.65rem] uppercase tracking-[0.18em] font-medium">Return Details</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={labelCls}>Reason for Return *</label>
                <select
                  value={form.reason}
                  onChange={update("reason")}
                  className={inputCls}
                >
                  <option value="">Select a reason…</option>
                  {REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {form.reason === "Other" && (
                <div>
                  <label className={labelCls}>Please describe *</label>
                  <textarea
                    value={form.reason_other}
                    onChange={update("reason_other")}
                    placeholder="Tell us more about your return reason…"
                    rows={3}
                    className="w-full border border-[#ddd8d0] bg-white px-4 py-3.5 text-sm text-foreground placeholder:text-[#bbb] focus:outline-none focus:border-foreground transition-colors duration-150 resize-none"
                  />
                </div>
              )}

              <div>
                <label className={labelCls}>
                  Item description{" "}
                  <span className="normal-case text-muted-foreground/50 lowercase tracking-normal">(optional)</span>
                </label>
                <input
                  value={form.item_desc}
                  onChange={update("item_desc")}
                  placeholder="e.g. 3mm Tennis Chain, 18 inches, Silver"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-[#f7f5f2] border border-[#e8e4de] px-4 py-3">
            By submitting this form, you agree to our{" "}
            <a href="/refund-policy" className="underline hover:text-foreground transition-colors">Refund Policy</a>.
            Do not ship your item until you receive approval from our team.
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-foreground text-background py-4 text-[0.65rem] uppercase tracking-[0.22em] disabled:opacity-60 hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
          >
            {submitting && (
              <span className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            )}
            {submitting ? "Submitting…" : "Submit Return Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
