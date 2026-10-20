import { TEMPERATURE_UNITS, convertTemperature, type TemperatureUnit } from "@toolmetric/shared";
import { UnitConverter, type UnitOption } from "./UnitConverter.js";

const units: UnitOption[] = Object.entries(TEMPERATURE_UNITS).map(([key, u]) => ({
  key,
  label: u.label,
  symbol: u.symbol,
}));

export function TemperatureConverter() {
  return (
    <UnitConverter
      units={units}
      defaultFrom="celsius"
      defaultTo="fahrenheit"
      defaultValue="20"
      decimals={2}
      convert={(value, from, to) => convertTemperature(value, from as TemperatureUnit, to as TemperatureUnit)}
    />
  );
}
