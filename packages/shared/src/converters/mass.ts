/**
 * Mass / weight converter. Internally these are mass units (kilograms as
 * the base); colloquially called "weight" in everyday usage, which is why
 * the tool is labelled "Mass / weight" rather than just "Mass."
 */
export const MASS_UNITS = {
  milligram: { label: "Milligram", symbol: "mg", kilogramsPerUnit: 0.000001 },
  gram: { label: "Gram", symbol: "g", kilogramsPerUnit: 0.001 },
  kilogram: { label: "Kilogram", symbol: "kg", kilogramsPerUnit: 1 },
  tonne: { label: "Metric tonne", symbol: "t", kilogramsPerUnit: 1000 },
  ounce: { label: "Ounce", symbol: "oz", kilogramsPerUnit: 0.028349523125 },
  pound: { label: "Pound", symbol: "lb", kilogramsPerUnit: 0.45359237 },
  stone: { label: "Stone", symbol: "st", kilogramsPerUnit: 6.35029318 },
} as const;

export type MassUnit = keyof typeof MASS_UNITS;

export function convertMass(value: number, from: MassUnit, to: MassUnit): number {
  const kilograms = value * MASS_UNITS[from].kilogramsPerUnit;
  return kilograms / MASS_UNITS[to].kilogramsPerUnit;
}
