import { describe, it, expect } from "vitest";
import {
  calculatePrice,
  calculateEarringPrice,
  calculateRingPrice,
  getTennisBraceletPrice,
  formatUSD,
} from "./pricing";

describe("calculatePrice", () => {
  it("applies the size multiplier and length adjustment", () => {
    expect(calculatePrice(200, "2mm", '18"')).toBe(200);
    expect(calculatePrice(200, "3mm", '18"')).toBe(290);
    expect(calculatePrice(200, "2mm", '20"')).toBe(230);
    expect(calculatePrice(200, "2mm", '16"')).toBe(180);
  });

  it("never returns below the $99 floor", () => {
    expect(calculatePrice(10, "2mm", '16"')).toBe(99);
  });
});

describe("calculateEarringPrice", () => {
  it("applies the earring size multiplier", () => {
    expect(calculateEarringPrice(100, "3mm")).toBe(100);
    expect(calculateEarringPrice(100, "8mm")).toBe(269);
  });

  it("never returns below the $59 floor", () => {
    expect(calculateEarringPrice(10, "3mm")).toBe(59);
  });
});

describe("calculateRingPrice", () => {
  it("applies the carat-size multiplier", () => {
    expect(calculateRingPrice(400, "0.5ct")).toBe(400);
    expect(calculateRingPrice(400, "3ct")).toBe(3200);
  });

  it("never returns below the $299 floor", () => {
    expect(calculateRingPrice(10, "0.5ct")).toBe(299);
  });
});

describe("getTennisBraceletPrice", () => {
  it("looks up the exact size/length price", () => {
    expect(getTennisBraceletPrice("3mm", '8"')).toBe(199.28);
  });

  it("falls back to 99 for an unknown size/length", () => {
    expect(getTennisBraceletPrice("99mm", '8"')).toBe(99);
  });
});

describe("formatUSD", () => {
  it("formats whole dollars without cents", () => {
    expect(formatUSD(100)).toBe("$100");
  });

  it("formats fractional amounts with cents", () => {
    expect(formatUSD(99.5)).toBe("$99.50");
  });
});
