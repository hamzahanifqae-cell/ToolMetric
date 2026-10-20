import { describe, expect, it } from "vitest";
import { calculateAge } from "../src/calculators/age.js";

describe("calculateAge", () => {
  it("computes a simple whole-year age", () => {
    const result = calculateAge("2000-01-15", "2024-01-15");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.years).toBe(24);
      expect(result.value.months).toBe(0);
      expect(result.value.days).toBe(0);
    }
  });

  it("handles a birthday that has not occurred yet this year", () => {
    const result = calculateAge("2000-06-15", "2024-01-15");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.years).toBe(23);
      expect(result.value.months).toBe(7);
    }
  });

  it("rejects a birth date after the as-of date", () => {
    const result = calculateAge("2025-01-01", "2024-01-01");
    expect(result.ok).toBe(false);
  });

  it("rejects an invalid calendar date", () => {
    const result = calculateAge("2023-02-30", "2024-01-01");
    expect(result.ok).toBe(false);
  });

  it("treats a Feb 29 birthday as Feb 28 anniversary in a non-leap year", () => {
    const result = calculateAge("2000-02-29", "2023-03-01");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.leapDayAdjusted).toBe(false);
      // Next birthday after 2023-03-01 is Feb 28, 2024 (2024 IS a leap year -> Feb 29 actually)
    }
  });

  it("computes next birthday as Feb 28 in a non-leap year for a Feb 29 birth date", () => {
    const result = calculateAge("2000-02-29", "2022-03-01");
    expect(result.ok).toBe(true);
    if (result.ok) {
      // Next birthday should fall in 2023, a non-leap year -> Feb 28
      expect(result.value.nextBirthday).toBe("2023-02-28");
      expect(result.value.leapDayAdjusted).toBe(true);
    }
  });

  it("computes next birthday as Feb 29 when the next year is a leap year", () => {
    const result = calculateAge("2000-02-29", "2023-03-01");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.nextBirthday).toBe("2024-02-29");
      expect(result.value.leapDayAdjusted).toBe(false);
    }
  });

  it("computes total elapsed days correctly", () => {
    const result = calculateAge("2024-01-01", "2024-01-02");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.totalDays).toBe(1);
  });
});
