import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Clock, MapPin } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { submitContactMessage } from "@/lib/contact.functions";

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://qureshijewelers.com").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/contact`;

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Qureshi Jewelers | Custom Lengths & Concierge" },
      { name: "description", content: "Reach the Qureshi Jewelers concierge for custom lengths, order help, or wholesale inquiries on S925 moissanite tennis chains." },
      { property: "og:title", content: "Contact — Qureshi Jewelers | Custom Lengths & Concierge" },
      { property: "og:description", content: "Reach the Qureshi Jewelers concierge for custom lengths, order help, or wholesale inquiries on S925 moissanite tennis chains." },
      { property: "og:url", content: PAGE_URL },
      { property: "og:image", content: `${SITE_URL}/QURESHIJEWELERSLOGO.png` },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Contact — Qureshi Jewelers" },
      { name: "twitter:description", content: "Reach the Qureshi concierge for custom lengths, order help, or wholesale inquiries." },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact — Qureshi Jewelers",
          url: PAGE_URL,
          about: { "@id": `${SITE_URL}/#organization` },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Contact", item: PAGE_URL },
          ],
        }),
      },
    ],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(1, "Required").max(120),
  email: z.string().trim().email("Valid email required").max(255),
  message: z.string().trim().min(5, "Tell us a little more").max(2000),
});

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "", _hp: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const doSubmit = useServerFn(submitContactMessage);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await doSubmit({ data: { ...parsed.data, _hp: form._hp } });
      toast.success("Message received. We'll reply within one business day.");
      setForm({ name: "", email: "", message: "", _hp: "" });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not send your message — please try again");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full border-0 border-b border-border bg-transparent py-3 text-sm focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/60";

  return (
    <section className="mx-auto max-w-6xl px-6 lg:px-10 py-20 grid lg:grid-cols-2 gap-16">
      <div>
        <p className="eyebrow">Contact</p>
        <h1 className="mt-3 font-display text-5xl sm:text-6xl">Talk to a person.</h1>
        <p className="mt-6 text-muted-foreground leading-relaxed max-w-md">
          Custom lengths, order help, gift advice, wholesale — write us and a real human will
          respond within one business day.
        </p>
        <ul className="mt-10 space-y-5 text-sm">
          <li className="flex gap-3"><Mail className="h-5 w-5 mt-0.5" /><div><p className="font-medium">concierge@qureshijewelers.com</p><p className="text-xs text-muted-foreground">Replies within 1 business day</p></div></li>
          <li className="flex gap-3"><Clock className="h-5 w-5 mt-0.5" /><div><p className="font-medium">Mon–Fri, 9am–6pm ET</p><p className="text-xs text-muted-foreground">Weekend orders ship Monday</p></div></li>
          <li className="flex gap-3"><MapPin className="h-5 w-5 mt-0.5" /><div><p className="font-medium">Shipping from the United States</p><p className="text-xs text-muted-foreground">Free over $250</p></div></li>
        </ul>
      </div>
      <form onSubmit={submit} className="space-y-6 lg:pt-10">
        <input
          type="text"
          name="company"
          value={form._hp}
          onChange={(e) => setForm((f) => ({ ...f, _hp: e.target.value }))}
          tabIndex={-1}
          autoComplete="off"
          className="absolute -left-[9999px] w-px h-px opacity-0"
          aria-hidden="true"
        />
        <div>
          <input placeholder="Your name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>
        <div>
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputCls} />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
        </div>
        <div>
          <textarea placeholder="How can we help?" rows={6} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} className={`${inputCls} resize-none`} />
          {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="bg-foreground text-background px-8 py-4 text-xs uppercase tracking-[0.22em] disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Send message"}
        </button>
      </form>
    </section>
  );
}
