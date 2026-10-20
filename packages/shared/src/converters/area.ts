export const AREA_UNITS = {
  square_millimeter: { label: "Square millimeter", symbol: "mm²", squareMetersPerUnit: 0.000001 },
  square_centimeter: { label: "Square centimeter", symbol: "cm²", squareMetersPerUnit: 0.0001 },
  square_meter: { label: "Square meter", symbol: "m²", squareMetersPerUnit: 1 },
  hectare: { label: "Hectare", symbol: "ha", squareMetersPerUnit: 10000 },
  square_kilometer: { label: "Square kilometer", symbol: "km²", squareMetersPerUnit: 1000000 },
  square_foot: { label: "Square foot", symbol: "ft²", squareMetersPerUnit: 0.09290304 },
  square_yard: { label: "Square yard", symbol: "yd²", squareMetersPerUnit: 0.83612736 },
  acre: { label: "Acre", symbol: "ac", squareMetersPerUnit: 4046.8564224 },
  square_mile: { label: "Square mile", symbol: "mi²", squareMetersPerUnit: 2589988.110336 },
} as const;

export type AreaUnit = keyof typeof AREA_UNITS;

export function convertArea(value: number, from: AreaUnit, to: AreaUnit): number {
  const squareMeters = value * AREA_UNITS[from].squareMetersPerUnit;
  return squareMeters / AREA_UNITS[to].squareMetersPerUnit;
}
