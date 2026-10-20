import { parseFiniteNumber, type ValidationResult } from "../validation/number.js";

export interface PercentageOfResult {
  /** X% of Y */
  result: number;
}

/** Computes X% of Y. */
export function percentageOf(x: number, y: number): PercentageOfResult {
  return { result: (x / 100) * y };
}

export interface WhatPercentResult {
  /** X is this percent of Y */
  percent: number;
}

/**
 * Computes "X is what percent of Y?". Y = 0 is undefined (division by
 * zero) and must be rejected by the caller via validation, not silently
 * coerced.
 */
export function whatPercentOf(x: number, y: number): ValidationResult<WhatPercentResult> {
  const yCheck = parseFiniteNumber(y, { label: "Y", disallowZero: true });
  if (!yCheck.ok) return yCheck;
  return { ok: true, value: { percent: (x / y) * 100 } };
}

export interface PercentageChangeResult {
  /** Signed percentage change; positive = increase, negative = decrease. */
  changePercent: number;
  direction: "increase" | "decrease" | "no-change";
}

/**
 * Percentage change from an original value to a new value.
 *
 * When the original value is 0, percentage change is mathematically
 * undefined (0 is in the denominator) in every case, including original=0,
 * updated=0 — 0/0 is indeterminate, not "0%"; math alone does not pick a
 * value here. When both are 0, we deliberately report 0% / "no change" as
 * a product convention (nothing changed numerically, so an "undefined"
 * error would be more confusing than helpful) — not because mathematics
 * requires it. Any other original=0 case is surfaced as undefined rather
 * than returning a fabricated number.
 */
export function percentageChange(
  original: number,
  updated: number
): ValidationResult<PercentageChangeResult> {
  if (original === 0) {
    if (updated === 0) {
      return { ok: true, value: { changePercent: 0, direction: "no-change" } };
    }
    return {
      ok: false,
      error:
        "Percentage change is undefined when the original value is 0 (division by zero), unless the new value is also 0.",
    };
  }

  const changePercent = ((updated - original) / Math.abs(original)) * 100;
  const direction =
    changePercent > 0 ? "increase" : changePercent < 0 ? "decrease" : "no-change";

  return { ok: true, value: { changePercent, direction } };
}
