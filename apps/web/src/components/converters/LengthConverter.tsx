import { LENGTH_UNITS, convertLength, type LengthUnit } from "@toolmetric/shared";
import { UnitConverter, type UnitOption } from "./UnitConverter.js";

const units: UnitOption[] = Object.entries(LENGTH_UNITS).map(([key, u]) => ({
  key,
  label: u.label,
  symbol: u.symbol,
}));

export function LengthConverter() {
  return (
    <UnitConverter
      units={units}
      defaultFrom="meter"
      defaultTo="foot"
      convert={(value, from, to) => ({ ok: true, value: convertLength(value, from as LengthUnit, to as LengthUnit) })}
    />
  );
}
