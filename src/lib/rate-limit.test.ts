import { describe, it, expect } from "vitest";
import { checkRateLimitForKey, checkHoneypot } from "./rate-limit";

describe("checkRateLimitForKey", () => {
  it("allows requests under the max within the window", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(() => checkRateLimitForKey(key, { windowMs: 60_000, max: 3 })).not.toThrow();
    }
  });

  it("throws once the max is exceeded within the window", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      checkRateLimitForKey(key, { windowMs: 60_000, max: 3 });
    }
    expect(() => checkRateLimitForKey(key, { windowMs: 60_000, max: 3 })).toThrow(/Too many requests/);
  });

  it("resets once the window has elapsed", () => {
    const key = `test-${Math.random()}`;
    checkRateLimitForKey(key, { windowMs: 1, max: 1 });
    expect(() => checkRateLimitForKey(key, { windowMs: 1, max: 1 })).toThrow();
  });

  it("tracks separate keys independently", () => {
    const keyA = `test-a-${Math.random()}`;
    const keyB = `test-b-${Math.random()}`;
    checkRateLimitForKey(keyA, { windowMs: 60_000, max: 1 });
    expect(() => checkRateLimitForKey(keyB, { windowMs: 60_000, max: 1 })).not.toThrow();
  });
});

describe("checkHoneypot", () => {
  it("passes when the honeypot field is empty or absent", () => {
    expect(() => checkHoneypot(undefined)).not.toThrow();
    expect(() => checkHoneypot("")).not.toThrow();
    expect(() => checkHoneypot("   ")).not.toThrow();
  });

  it("throws when the honeypot field was filled in", () => {
    expect(() => checkHoneypot("bot filled this in")).toThrow(/Submission rejected/);
  });
});
