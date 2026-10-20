/** All factors are "meters per unit", from NIST Handbook 44 / SI definitions. */
export const LENGTH_UNITS = {
  millimeter: { label: "Millimeter", symbol: "mm", metersPerUnit: 0.001 },
  centimeter: { label: "Centimeter", symbol: "cm", metersPerUnit: 0.01 },
  meter: { label: "Meter", symbol: "m", metersPerUnit: 1 },
  kilometer: { label: "Kilometer", symbol: "km", metersPerUnit: 1000 },
  inch: { label: "Inch", symbol: "in", metersPerUnit: 0.0254 },
  foot: { label: "Foot", symbol: "ft", metersPerUnit: 0.3048 },
  yard: { label: "Yard", symbol: "yd", metersPerUnit: 0.9144 },
  mile: { label: "Mile", symbol: "mi", metersPerUnit: 1609.344 },
} as const;

export type LengthUnit = keyof typeof LENGTH_UNITS;

export function convertLength(value: number, from: LengthUnit, to: LengthUnit): number {
  const meters = value * LENGTH_UNITS[from].metersPerUnit;
  return meters / LENGTH_UNITS[to].metersPerUnit;
}
