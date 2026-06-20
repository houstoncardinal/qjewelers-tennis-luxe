import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "orders@qureshijewelers.com";

let lastSentAt = 0;
const THROTTLE_MS = 60 * 1000; // avoid an alert storm from a repeating failure

// Best-effort email alert on a server-side error. Never throws — a failure to
// alert must not crash the request that triggered the alert in the first place.
export function alertAdminOnError(context: string, error: unknown): void {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_your")) {
    console.error(`[ErrorAlert] ${context}:`, error);
    return;
  }

  const now = Date.now();
  if (now - lastSentAt < THROTTLE_MS) {
    console.error(`[ErrorAlert] (throttled) ${context}:`, error);
    return;
  }
  lastSentAt = now;

  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  resend.emails.send({
    from: FROM,
    to: FROM,
    subject: `[Alert] Server error — ${context}`,
    html: `<p><strong>Context:</strong> ${context}</p><p><strong>Message:</strong> ${message}</p>${stack ? `<pre style="white-space:pre-wrap;font-size:12px;">${stack}</pre>` : ""}`,
  }).catch((e) => console.error("[ErrorAlert] Failed to send alert email:", e));
}
