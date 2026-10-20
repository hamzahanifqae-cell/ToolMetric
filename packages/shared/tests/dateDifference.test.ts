import { describe, expect, it } from "vitest";
import { calculateDateDifference } from "../src/calculators/dateDifference.js";

describe("calculateDateDifference", () => {
  it("computes a simple day difference", () => {
    const result = calculateDateDifference("2024-01-01", "2024-01-02");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.totalDays).toBe(1);
  });

  it("is order-independent (swaps if from > to)", () => {
    const result = calculateDateDifference("2024-01-10", "2024-01-01");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.totalDays).toBe(9);
  });

  it("handles a leap-year span correctly", () => {
    const result = calculateDateDifference("2024-02-28", "2024-03-01");
    expect(result.ok).toBe(true);
    // 2024 is a leap year: Feb 28 -> Feb 29 -> Mar 1 = 2 days
    if (result.ok) expect(result.value.totalDays).toBe(2);
  });

  it("handles a non-leap-year span correctly", () => {
    const result = calculateDateDifference("2023-02-28", "2023-03-01");
    expect(result.ok).toBe(true);
    // 2023 is not a leap year: Feb 28 -> Mar 1 = 1 day
    if (result.ok) expect(result.value.totalDays).toBe(1);
  });

  it("rejects malformed dates", () => {
    const result = calculateDateDifference("not-a-date", "2024-01-01");
    expect(result.ok).toBe(false);
  });

  it("returns zero difference for identical dates", () => {
    const result = calculateDateDifference("2024-05-05", "2024-05-05");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.totalDays).toBe(0);
  });
});
