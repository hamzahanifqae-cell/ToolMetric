import { useId, useMemo, useState } from "react";
import { seriesResistance, parallelResistance, roundForDisplay } from "@toolmetric/shared";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "../ui/inputClasses.js";
import { ResultCard, ErrorBanner } from "../ui/ResultCard.js";

type Mode = "series" | "parallel";

export function ResistanceCalculator() {
  const id = useId();
  const [mode, setMode] = useState<Mode>("parallel");
  const [resistors, setResistors] = useState<string[]>(["100", "220"]);

  const result = useMemo(() => {
    const parsed: number[] = [];
    for (const raw of resistors) {
      if (raw === "") continue;
      const num = Number(raw);
      if (!Number.isFinite(num)) return { ok: false as const, error: "Enter valid numbers for every resistor." };
      parsed.push(num);
    }
    if (parsed.length === 0) return { ok: false as const, error: "Enter at least one resistor value." };
    return mode === "series" ? seriesResistance(parsed) : parallelResistance(parsed);
  }, [mode, resistors]);

  return (
    <div className="flex flex-col gap-5">
      <div role="radiogroup" aria-label="Combination type" className="flex flex-wrap gap-2">
        {(["series", "parallel"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={
              mode === m
                ? "rounded-full bg-teal-700 px-3.5 py-1.5 text-sm font-semibold capitalize text-white"
                : "rounded-full border border-sand-300 px-3.5 py-1.5 text-sm font-medium capitalize text-navy-700 hover:bg-sand-100"
            }
          >
            {m}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {resistors.map((value, index) => (
          <div key={index} className="flex items-center gap-2">
            <label htmlFor={`${id}-r${index}`} className="w-16 text-sm font-medium text-navy-800">
              R{index + 1} (Ω)
            </label>
            <input
              id={`${id}-r${index}`}
              className={inputClass}
              type="number"
              inputMode="decimal"
              value={value}
              onChange={(e) =>
                setResistors((prev) => prev.map((v, i) => (i === index ? e.target.value : v)))
              }
            />
            {resistors.length > 1 && (
              <button
                type="button"
                aria-label={`Remove resistor ${index + 1}`}
                className="rounded-md border border-sand-300 px-2.5 py-2 text-sm text-navy-600 hover:bg-sand-100"
                onClick={() => setResistors((prev) => prev.filter((_, i) => i !== index))}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={primaryButtonClass}
          onClick={() => setResistors((prev) => [...prev, ""])}
        >
          Add resistor
        </button>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={() => {
            setResistors(["100", "220"]);
            setMode("parallel");
          }}
        >
          Reset
        </button>
      </div>

      {!result.ok && <ErrorBanner message={result.error} />}
      {result.ok && (
        <ResultCard label={`Total resistance (${mode})`} copyText={`${roundForDisplay(result.value, 4)} Ω`}>
          <p className="text-2xl font-bold">{roundForDisplay(result.value, 4)} Ω</p>
        </ResultCard>
      )}
    </div>
  );
}
