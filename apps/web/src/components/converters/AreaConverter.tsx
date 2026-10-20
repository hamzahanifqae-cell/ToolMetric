import { AREA_UNITS, convertArea, type AreaUnit } from "@toolmetric/shared";
import { UnitConverter, type UnitOption } from "./UnitConverter.js";

const units: UnitOption[] = Object.entries(AREA_UNITS).map(([key, u]) => ({
  key,
  label: u.label,
  symbol: u.symbol,
}));

export function AreaConverter() {
  return (
    <UnitConverter
      units={units}
      defaultFrom="square_meter"
      defaultTo="square_foot"
      convert={(value, from, to) => ({ ok: true, value: convertArea(value, from as AreaUnit, to as AreaUnit) })}
    />
  );
}
