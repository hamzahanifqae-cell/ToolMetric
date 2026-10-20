import { describe, expect, it } from "vitest";
import { percentageOf, whatPercentOf, percentageChange } from "../src/calculators/percentage.js";

describe("percentageOf", () => {
  it("computes X% of Y", () => {
    expect(percentageOf(20, 50).result).toBeCloseTo(10);
    expect(percentageOf(150, 10).result).toBeCloseTo(15);
    expect(percentageOf(0, 100).result).toBe(0);
  });
});

describe("whatPercentOf", () => {
  it("computes X is what percent of Y", () => {
    const result = whatPercentOf(10, 50);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.percent).toBeCloseTo(20);
  });

  it("rejects division by zero", () => {
    const result = whatPercentOf(10, 0);
    expect(result.ok).toBe(false);
  });
});

describe("percentageChange", () => {
  it("computes an increase", () => {
    const result = percentageChange(100, 150);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.changePercent).toBeCloseTo(50);
      expect(result.value.direction).toBe("increase");
    }
  });

  it("computes a decrease", () => {
    const result = percentageChange(100, 50);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.changePercent).toBeCloseTo(-50);
      expect(result.value.direction).toBe("decrease");
    }
  });

  it("defines zero-original behavior as no-change when new value is also zero", () => {
    const result = percentageChange(0, 0);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.direction).toBe("no-change");
  });

  it("rejects zero-original with nonzero new value as undefined", () => {
    const result = percentageChange(0, 10);
    expect(result.ok).toBe(false);
  });
});
