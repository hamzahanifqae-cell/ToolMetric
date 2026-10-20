import { useId, useMemo, useState } from "react";
import { calculateOhmsLaw, roundForDisplay } from "@toolmetric/shared";
import { Field } from "../ui/Field.js";
import { inputClass, secondaryButtonClass } from "../ui/inputClasses.js";
import { ResultCard, ErrorBanner } from "../ui/ResultCard.js";

export function OhmsLawCalculator() {
  const id = useId();
  const [voltage, setVoltage] = useState("12");
  const [current, setCurrent] = useState("2");
  const [resistance, setResistance] = useState("");

  const values = { voltage, current, resistance };
  const filled = Object.values(values).filter((v) => v !== "").length;

  const result = useMemo(() => {
    if (filled !== 2) return null;
    const parsed: Record<string, number | undefined> = {};
    for (const [key, raw] of Object.entries(values)) {
      if (raw === "") continue;
      const num = Number(raw);
      if (!Number.isFinite(num)) return { ok: false as const, error: "Enter valid numbers." };
      parsed[key] = num;
    }
    return calculateOhmsLaw(parsed);
  }, [filled, voltage, current, resistance]);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-navy-600">
        Fill in exactly two fields — voltage, current, or resistance — and leave the third blank. It will be
        calculated automatically. This tool applies to DC and purely resistive circuits.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Voltage (V)" htmlFor={`${id}-v`}>
          <input id={`${id}-v`} className={inputClass} type="number" inputMode="decimal" value={voltage} onChange={(e) => setVoltage(e.target.value)} />
        </Field>
        <Field label="Current (A)" htmlFor={`${id}-i`}>
          <input id={`${id}-i`} className={inputClass} type="number" inputMode="decimal" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <Field label="Resistance (Ω)" htmlFor={`${id}-r`}>
          <input id={`${id}-r`} className={inputClass} type="number" inputMode="decimal" value={resistance} onChange={(e) => setResistance(e.target.value)} />
        </Field>
      </div>

      <div>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={() => {
            setVoltage("12");
            setCurrent("2");
            setResistance("");
          }}
        >
          Reset
        </button>
      </div>

      {filled !== 2 && <p className="text-sm text-navy-500">Enter exactly two values to see the result.</p>}
      {result && !result.ok && <ErrorBanner message={result.error} />}
      {result && result.ok && (
        <ResultCard
          label={`Solved for ${result.value.solvedFor}`}
          copyText={`V=${roundForDisplay(result.value.voltage, 4)}V, I=${roundForDisplay(result.value.current, 4)}A, R=${roundForDisplay(result.value.resistance, 4)}Ω, P=${roundForDisplay(result.value.power, 4)}W`}
        >
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-navy-500">Voltage</dt>
              <dd className="text-lg font-bold text-navy-900">{roundForDisplay(result.value.voltage, 4)} V</dd>
            </div>
            <div>
              <dt className="text-navy-500">Current</dt>
              <dd className="text-lg font-bold text-navy-900">{roundForDisplay(result.value.current, 4)} A</dd>
            </div>
            <div>
              <dt className="text-navy-500">Resistance</dt>
              <dd className="text-lg font-bold text-navy-900">{roundForDisplay(result.value.resistance, 4)} Ω</dd>
            </div>
            <div>
              <dt className="text-navy-500">Power</dt>
              <dd className="text-lg font-bold text-navy-900">{roundForDisplay(result.value.power, 4)} W</dd>
            </div>
          </dl>
        </ResultCard>
      )}
    </div>
  );
}
