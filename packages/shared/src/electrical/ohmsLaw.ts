import type { ValidationResult } from "../validation/number.js";

export interface OhmsLawInputs {
  voltage?: number;
  current?: number;
  resistance?: number;
}

export interface OhmsLawResult {
  voltage: number;
  current: number;
  resistance: number;
  power: number;
  solvedFor: "voltage" | "current" | "resistance";
}

/**
 * Ohm's law (V = I × R) for DC and resistive circuits only. This does not
 * apply to AC circuits with reactance (inductors/capacitors), where
 * impedance (Z) — not plain resistance — relates voltage and current, and Z
 * is a complex quantity with both magnitude and phase. Use this tool only
 * for DC or purely resistive loads.
 *
 * Exactly two of {voltage, current, resistance} must be provided; the third
 * is solved for.
 */
export function calculateOhmsLaw(inputs: OhmsLawInputs): ValidationResult<OhmsLawResult> {
  const provided = (["voltage", "current", "resistance"] as const).filter(
    (key) => inputs[key] !== undefined
  );

  if (provided.length !== 2) {
    return { ok: false, error: "Provide exactly two of voltage, current, and resistance." };
  }

  const { voltage, current, resistance } = inputs;

  if (voltage !== undefined && current !== undefined) {
    if (current === 0) {
      return { ok: false, error: "Current cannot be zero when solving for resistance (division by zero)." };
    }
    const r = voltage / current;
    return {
      ok: true,
      value: { voltage, current, resistance: r, power: voltage * current, solvedFor: "resistance" },
    };
  }

  if (voltage !== undefined && resistance !== undefined) {
    if (resistance === 0) {
      return { ok: false, error: "Resistance of 0 Ω implies infinite current and is not a valid resistive load for this calculation." };
    }
    if (resistance < 0) {
      return { ok: false, error: "Resistance cannot be negative." };
    }
    const i = voltage / resistance;
    return {
      ok: true,
      value: { voltage, current: i, resistance, power: voltage * i, solvedFor: "current" },
    };
  }

  // current and resistance provided
  if (resistance! < 0) {
    return { ok: false, error: "Resistance cannot be negative." };
  }
  const v = current! * resistance!;
  return {
    ok: true,
    value: { voltage: v, current: current!, resistance: resistance!, power: v * current!, solvedFor: "voltage" },
  };
}
