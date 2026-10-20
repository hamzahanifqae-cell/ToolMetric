import { useId, useMemo, useState } from "react";
import { calculatePower, parseFiniteNumber, roundForDisplay, type PowerMode } from "@toolmetric/shared";
import { Field } from "../ui/Field.js";
import { inputClass, secondaryButtonClass } from "../ui/inputClasses.js";
import { ResultCard, ErrorBanner } from "../ui/ResultCard.js";

const MODES: { key: PowerMode; label: string }[] = [
  { key: "dc", label: "DC" },
  { key: "single-phase-ac", label: "Single-phase AC" },
  { key: "three-phase-ac", label: "Three-phase AC (balanced)" },
];

export function PowerCalculator() {
  const id = useId();
  const [mode, setMode] = useState<PowerMode>("dc");
  const [voltage, setVoltage] = useState("230");
  const [current, setCurrent] = useState("10");
  const [powerFactor, setPowerFactor] = useState("0.9");

  const voltageLabel = mode === "three-phase-ac" ? "Line-to-line voltage (V)" : "Voltage (V)";
  const currentLabel = mode === "three-phase-ac" ? "Line current (A)" : "Current (A)";

  const result = useMemo(() => {
    const vCheck = parseFiniteNumber(voltage, { label: "Voltage", disallowNegative: true });
    if (!vCheck.ok) return vCheck;
    const iCheck = parseFiniteNumber(current, { label: "Current", disallowNegative: true });
    if (!iCheck.ok) return iCheck;

    let pf: number | undefined;
    if (mode !== "dc") {
      const pfCheck = parseFiniteNumber(powerFactor, { label: "Power factor" });
      if (!pfCheck.ok) return pfCheck;
      pf = pfCheck.value;
    }

    return calculatePower({ mode, voltage: vCheck.value, current: iCheck.value, powerFactor: pf });
  }, [mode, voltage, current, powerFactor]);

  return (
    <div className="flex flex-col gap-5">
      <div role="radiogroup" aria-label="Circuit type" className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            role="radio"
            aria-checked={mode === m.key}
            onClick={() => setMode(m.key)}
            className={
              mode === m.key
                ? "rounded-full bg-teal-700 px-3.5 py-1.5 text-sm font-semibold text-white"
                : "rounded-full border border-sand-300 px-3.5 py-1.5 text-sm font-medium text-navy-700 hover:bg-sand-100"
            }
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode !== "dc" && (
        <p className="text-sm text-navy-600">
          Voltage and current are assumed to be RMS values, the standard convention for AC power calculations.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={voltageLabel} htmlFor={`${id}-v`}>
          <input id={`${id}-v`} className={inputClass} type="number" inputMode="decimal" value={voltage} onChange={(e) => setVoltage(e.target.value)} />
        </Field>
        <Field label={currentLabel} htmlFor={`${id}-i`}>
          <input id={`${id}-i`} className={inputClass} type="number" inputMode="decimal" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        {mode !== "dc" && (
          <Field label="Power factor" htmlFor={`${id}-pf`} hint="0 < PF ≤ 1">
            <input
              id={`${id}-pf`}
              className={inputClass}
              type="number"
              inputMode="decimal"
              step="0.01"
              value={powerFactor}
              onChange={(e) => setPowerFactor(e.target.value)}
            />
          </Field>
        )}
      </div>

      <div>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={() => {
            setVoltage("230");
            setCurrent("10");
            setPowerFactor("0.9");
          }}
        >
          Reset
        </button>
      </div>

      {!result.ok && <ErrorBanner message={result.error} />}
      {result.ok && (
        <ResultCard label="Real power" copyText={`${roundForDisplay(result.value.watts, 4)} W`}>
          <p className="text-2xl font-bold">{roundForDisplay(result.value.watts, 4)} W</p>
          <p className="mt-1 text-sm text-navy-600">{roundForDisplay(result.value.watts / 1000, 4)} kW</p>
        </ResultCard>
      )}
    </div>
  );
}
