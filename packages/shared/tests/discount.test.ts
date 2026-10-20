import { describe, expect, it } from "vitest";
import { calculateDiscount } from "../src/calculators/discount.js";

describe("calculateDiscount", () => {
  it("computes a standard discount", () => {
    const result = calculateDiscount(100, 20);
    expect(result.discountAmount).toBeCloseTo(20);
    expect(result.finalPrice).toBeCloseTo(80);
  });

  it("handles a zero discount", () => {
    const result = calculateDiscount(50, 0);
    expect(result.discountAmount).toBe(0);
    expect(result.finalPrice).toBe(50);
  });

  it("handles a 100% discount", () => {
    const result = calculateDiscount(50, 100);
    expect(result.finalPrice).toBe(0);
  });
});
