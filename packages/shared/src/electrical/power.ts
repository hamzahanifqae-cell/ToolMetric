import type { ValidationResult } from "../validation/number.js";

export type PowerMode = "dc" | "single-phase-ac" | "three-phase-ac";

export interface PowerInputs {
  mode: PowerMode;
  /** DC: voltage (V). Single-phase AC: RMS voltage (V). Three-phase AC: line-to-line RMS voltage (V). */
  voltage: number;
  /** DC: current (A). Single-phase AC: RMS current (A). Three-phase AC: line RMS current (A). */
  current: number;
  /** Required for single-phase-ac and three-phase-ac. Must satisfy 0 < PF ≤ 1. */
  powerFactor?: number;
}

export interface PowerResult {
  /** Real (active) power in watts. */
  watts: number;
  mode: PowerMode;
}

const SQRT_3 = Math.sqrt(3);

/**
 * Computes real (active) electrical power.
 *
 * - DC: P = V × I
 * - Single-phase AC: P = V_rms × I_rms × PF
 * - Balanced three-phase AC: P = √3 × V_line-to-line × I_line × PF
 *
 * AC voltage and current inputs are assumed to be RMS values, which is the
 * standard convention for AC power calculations (not peak or peak-to-peak).
 * For three-phase mode, voltage must be the line-to-line voltage and current
 * the line current — not per-phase (line-to-neutral) values.
 */
export function calculatePower(inputs: PowerInputs): ValidationResult<PowerResult> {
  const { mode, voltage, current, powerFactor } = inputs;

  if (voltage < 0 || current < 0) {
    return { ok: false, error: "Voltage and current must be zero or positive." };
  }

  if (mode === "dc") {
    return { ok: true, value: { watts: voltage * current, mode } };
  }

  if (powerFactor === undefined) {
    return { ok: false, error: "Power factor is required for AC calculations." };
  }
  if (powerFactor <= 0 || powerFactor > 1) {
    return { ok: false, error: "Power factor must satisfy 0 < PF ≤ 1." };
  }

  if (mode === "single-phase-ac") {
    return { ok: true, value: { watts: voltage * current * powerFactor, mode } };
  }

  // three-phase-ac
  return { ok: true, value: { watts: SQRT_3 * voltage * current * powerFactor, mode } };
}
