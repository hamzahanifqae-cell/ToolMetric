/**
 * Validation result discriminated union used across all calculators and converters.
 * Callers must check `ok` before reading `value`/`error`.
 */
export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export interface NumberConstraints {
  /** Inclusive minimum. */
  min?: number;
  /** Inclusive maximum. */
  max?: number;
  /** Reject exactly zero. */
  disallowZero?: boolean;
  /** Reject negative numbers. */
  disallowNegative?: boolean;
  /** Human-readable field name used in error messages. */
  label?: string;
}

/**
 * Parses and validates a numeric input (string or number) against explicit
 * constraints. NaN and Infinity are always rejected — calculators must never
 * silently coerce invalid input to zero.
 */
export function parseFiniteNumber(
  raw: string | number | null | undefined,
  constraints: NumberConstraints = {}
): ValidationResult<number> {
  const label = constraints.label ?? "Value";

  if (raw === null || raw === undefined || raw === "") {
    return { ok: false, error: `${label} is required.` };
  }

  const value = typeof raw === "number" ? raw : Number(raw);

  if (Number.isNaN(value)) {
    return { ok: false, error: `${label} must be a valid number.` };
  }
  if (!Number.isFinite(value)) {
    return { ok: false, error: `${label} must be a finite number.` };
  }
  if (constraints.disallowZero && value === 0) {
    return { ok: false, error: `${label} cannot be zero.` };
  }
  if (constraints.disallowNegative && value < 0) {
    return { ok: false, error: `${label} cannot be negative.` };
  }
  if (constraints.min !== undefined && value < constraints.min) {
    return { ok: false, error: `${label} must be at least ${constraints.min}.` };
  }
  if (constraints.max !== undefined && value > constraints.max) {
    return { ok: false, error: `${label} must be at most ${constraints.max}.` };
  }

  return { ok: true, value };
}

/** Rounds a number for display only; internal math should use full precision. */
export function roundForDisplay(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
