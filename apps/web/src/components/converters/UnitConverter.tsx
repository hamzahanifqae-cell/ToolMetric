import { useId, useMemo, useState } from "react";
import type { ValidationResult } from "@toolmetric/shared";
import { Field } from "../ui/Field.js";
import { inputClass, selectClass, secondaryButtonClass } from "../ui/inputClasses.js";
import { ResultCard, ErrorBanner } from "../ui/ResultCard.js";

export interface UnitOption {
  key: string;
  label: string;
  symbol: string;
}

interface UnitConverterProps {
  units: UnitOption[];
  convert: (value: number, from: string, to: string) => ValidationResult<number>;
  defaultFrom: string;
  defaultTo: string;
  defaultValue?: string;
  decimals?: number;
}

export function UnitConverter({ units, convert, defaultFrom, defaultTo, defaultValue = "1", decimals = 6 }: UnitConverterProps) {
  const id = useId();
  const [value, setValue] = useState(defaultValue);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  const numericValue = Number(value);
  const invalid = value !== "" && !Number.isFinite(numericValue);

  const result = useMemo(() => {
    if (value === "" || invalid) return null;
    return convert(numericValue, from, to);
  }, [value, from, to, invalid, numericValue, convert]);

  const toUnit = units.find((u) => u.key === to);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <Field label="Value" htmlFor={`${id}-value`} error={invalid ? "Enter a valid number." : undefined}>
          <input
            id={`${id}-value`}
            className={inputClass}
            type="number"
            inputMode="decimal"
            value={value}
            aria-invalid={invalid}
            onChange={(e) => setValue(e.target.value)}
          />
        </Field>

        <Field label="From" htmlFor={`${id}-from`}>
          <select id={`${id}-from`} className={selectClass} value={from} onChange={(e) => setFrom(e.target.value)}>
            {units.map((u) => (
              <option key={u.key} value={u.key}>
                {u.label} ({u.symbol})
              </option>
            ))}
          </select>
        </Field>

        <Field label="To" htmlFor={`${id}-to`}>
          <select id={`${id}-to`} className={selectClass} value={to} onChange={(e) => setTo(e.target.value)}>
            {units.map((u) => (
              <option key={u.key} value={u.key}>
                {u.label} ({u.symbol})
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
        >
          Swap units
        </button>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={() => {
            setValue(defaultValue);
            setFrom(defaultFrom);
            setTo(defaultTo);
          }}
        >
          Reset
        </button>
      </div>

      {result && !result.ok && <ErrorBanner message={result.error} />}
      {result && result.ok && (
        <ResultCard label="Result" copyText={`${result.value}`}>
          <p className="text-2xl font-bold">
            {Number(result.value.toFixed(decimals))} {toUnit?.symbol}
          </p>
        </ResultCard>
      )}
    </div>
  );
}
