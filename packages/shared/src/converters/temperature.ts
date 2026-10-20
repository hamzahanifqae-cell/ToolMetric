import type { ValidationResult } from "../validation/number.js";

export const TEMPERATURE_UNITS = {
  celsius: { label: "Celsius", symbol: "°C" },
  fahrenheit: { label: "Fahrenheit", symbol: "°F" },
  kelvin: { label: "Kelvin", symbol: "K" },
} as const;

export type TemperatureUnit = keyof typeof TEMPERATURE_UNITS;

const ABSOLUTE_ZERO_C = -273.15;

function toCelsius(value: number, from: TemperatureUnit): number {
  switch (from) {
    case "celsius":
      return value;
    case "fahrenheit":
      return ((value - 32) * 5) / 9;
    case "kelvin":
      return value - 273.15;
  }
}

function fromCelsius(celsius: number, to: TemperatureUnit): number {
  switch (to) {
    case "celsius":
      return celsius;
    case "fahrenheit":
      return (celsius * 9) / 5 + 32;
    case "kelvin":
      return celsius + 273.15;
  }
}

/**
 * Converts a temperature value between Celsius, Fahrenheit, and Kelvin.
 * Negative values are valid for Celsius and Fahrenheit. Kelvin cannot go
 * below absolute zero (0 K = -273.15 °C), so inputs that would imply a
 * sub-absolute-zero temperature are rejected rather than silently computed.
 */
export function convertTemperature(
  value: number,
  from: TemperatureUnit,
  to: TemperatureUnit
): ValidationResult<number> {
  const celsius = toCelsius(value, from);
  if (celsius < ABSOLUTE_ZERO_C - 1e-9) {
    return {
      ok: false,
      error: "That value is below absolute zero (-273.15 °C / -459.67 °F / 0 K) and is not physically possible.",
    };
  }
  return { ok: true, value: fromCelsius(celsius, to) };
}
