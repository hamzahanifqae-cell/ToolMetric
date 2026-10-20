import type { ValidationResult } from "../validation/number.js";

export interface EnergyCostResult {
  kilowattHours: number;
  estimatedCost: number;
}

/**
 * Energy consumption and estimated cost: kWh = (watts × hours) ÷ 1000;
 * cost = kWh × rate.
 *
 * The rate and currency are entered by the user — we do not assume or look
 * up a tariff. The resulting estimate excludes taxes, fixed/standing
 * charges, tiered or time-of-use pricing, and other tariff complexity
 * unless the user has folded those into the rate they entered themselves.
 */
export function calculateEnergyCost(
  watts: number,
  hours: number,
  ratePerKwh: number
): ValidationResult<EnergyCostResult> {
  if (watts < 0) return { ok: false, error: "Power (watts) cannot be negative." };
  if (hours < 0) return { ok: false, error: "Hours cannot be negative." };
  if (ratePerKwh < 0) return { ok: false, error: "Electricity rate cannot be negative." };

  const kilowattHours = (watts * hours) / 1000;
  const estimatedCost = kilowattHours * ratePerKwh;

  return { ok: true, value: { kilowattHours, estimatedCost } };
}
