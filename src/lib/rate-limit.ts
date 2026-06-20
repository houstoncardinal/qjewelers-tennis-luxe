import { getRequestIP } from "@tanstack/react-start/server";

// In-memory sliding-window rate limiter, keyed by client IP + form name.
// Resets on server restart/redeploy — acceptable for abuse-deterrence on a
// single-instance Netlify Function rather than a hard security boundary.
const attempts = new Map<string, number[]>();

function clientIp(): string {
  return getRequestIP({ xForwardedFor: true }) ?? "unknown";
}

// Pure sliding-window check, keyed explicitly — separated from clientIp()
// so the algorithm itself is unit-testable without a live request context.
export function checkRateLimitForKey(
  key: string,
  { windowMs, max }: { windowMs: number; max: number },
): void {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= max) {
    throw new Error("Too many requests. Please try again later.");
  }

  recent.push(now);
  attempts.set(key, recent);
}

export function checkRateLimit(
  formName: string,
  opts: { windowMs: number; max: number },
): void {
  checkRateLimitForKey(`${formName}:${clientIp()}`, opts);
}

// Throws if a hidden honeypot field was filled in — only bots fill fields
// that are invisible to real users.
export function checkHoneypot(value: unknown): void {
  if (typeof value === "string" && value.trim().length > 0) {
    throw new Error("Submission rejected.");
  }
}
