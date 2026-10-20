import type { ValidationResult } from "../validation/number.js";

/**
 * Total resistance of resistors in series: R_total = R1 + R2 + ... + Rn.
 * This applies to pure resistance (DC/resistive); for AC circuits with
 * reactive components, impedances combine as complex numbers, not scalars.
 */
export function seriesResistance(resistances: number[]): ValidationResult<number> {
  if (resistances.length === 0) {
    return { ok: false, error: "Provide at least one resistor value." };
  }
  for (const r of resistances) {
    if (r < 0) return { ok: false, error: "Resistance values cannot be negative." };
  }
  return { ok: true, value: resistances.reduce((sum, r) => sum + r, 0) };
}

/**
 * Total resistance of resistors in parallel: 1/R_total = 1/R1 + 1/R2 + ... + 1/Rn.
 *
 * A resistor of 0 Ω in parallel short-circuits the combination, so the
 * total is exactly 0 Ω — this is handled explicitly rather than producing a
 * division error. Negative resistance values are rejected as physically
 * invalid for this calculator.
 */
export function parallelResistance(resistances: number[]): ValidationResult<number> {
  if (resistances.length === 0) {
    return { ok: false, error: "Provide at least one resistor value." };
  }
  for (const r of resistances) {
    if (r < 0) return { ok: false, error: "Resistance values cannot be negative." };
  }
  if (resistances.some((r) => r === 0)) {
    return { ok: true, value: 0 };
  }
  const reciprocalSum = resistances.reduce((sum, r) => sum + 1 / r, 0);
  return { ok: true, value: 1 / reciprocalSum };
}
