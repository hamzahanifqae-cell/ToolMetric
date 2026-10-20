import { MASS_UNITS, convertMass, type MassUnit } from "@toolmetric/shared";
import { UnitConverter, type UnitOption } from "./UnitConverter.js";

const units: UnitOption[] = Object.entries(MASS_UNITS).map(([key, u]) => ({
  key,
  label: u.label,
  symbol: u.symbol,
}));

export function MassConverter() {
  return (
    <UnitConverter
      units={units}
      defaultFrom="kilogram"
      defaultTo="pound"
      convert={(value, from, to) => ({ ok: true, value: convertMass(value, from as MassUnit, to as MassUnit) })}
    />
  );
}
