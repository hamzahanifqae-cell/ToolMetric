import { useId, useMemo, useState } from "react";
import { percentageOf, whatPercentOf, percentageChange, roundForDisplay } from "@toolmetric/shared";
import { Field } from "../ui/Field.js";
import { inputClass, secondaryButtonClass } from "../ui/inputClasses.js";
import { ResultCard, ErrorBanner } from "../ui/ResultCard.js";

type Mode = "of" | "what-percent" | "change";

const MODES: { key: Mode; label: string }[] = [
  { key: "of", label: "X% of Y" },
  { key: "what-percent", label: "X is what % of Y?" },
  { key: "change", label: "Percentage change" },
];

export function PercentageCalculator() {
  const id = useId();
  const [mode, setMode] = useState<Mode>("of");
  const [x, setX] = useState("20");
  const [y, setY] = useState("150");

  const parsedX = Number(x);
  const parsedY = Number(y);
  const xInvalid = x !== "" && !Number.isFinite(parsedX);
  const yInvalid = y !== "" && !Number.isFinite(parsedY);

  const result = useMemo(() => {
    if (x === "" || y === "" || xInvalid || yInvalid) return null;

    if (mode === "of") {
      return { ok: true as const, text: `${roundForDisplay(percentageOf(parsedX, parsedY).result, 4)}` };
    }
    if (mode === "what-percent") {
      const r = whatPercentOf(parsedX, parsedY);
      if (!r.ok) return { ok: false as const, error: r.error };
      return { ok: true as const, text: `${roundForDisplay(r.value.percent, 4)}%` };
    }
    const r = percentageChange(parsedX, parsedY);
    if (!r.ok) return { ok: false as const, error: r.error };
    const sign = r.value.changePercent > 0 ? "+" : "";
    return {
      ok: true as const,
      text: `${sign}${roundForDisplay(r.value.changePercent, 4)}% (${r.value.direction.replace("-", " ")})`,
    };
  }, [mode, x, y, parsedX, parsedY, xInvalid, yInvalid]);

  const labels =
    mode === "of"
      ? { x: "X (percentage)", y: "Y (value)" }
      : mode === "what-percent"
        ? { x: "X (value)", y: "Y (value)" }
        : { x: "Original value", y: "New value" };

  return (
    <div className="flex flex-col gap-5">
      <div role="radiogroup" aria-label="Calculation mode" className="flex flex-wrap gap-2">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={labels.x} htmlFor={`${id}-x`} error={xInvalid ? "Enter a valid number." : undefined}>
          <input
            id={`${id}-x`}
            className={inputClass}
            type="number"
            inputMode="decimal"
            value={x}
            aria-invalid={xInvalid}
            onChange={(e) => setX(e.target.value)}
          />
        </Field>
        <Field label={labels.y} htmlFor={`${id}-y`} error={yInvalid ? "Enter a valid number." : undefined}>
          <input
            id={`${id}-y`}
            className={inputClass}
            type="number"
            inputMode="decimal"
            value={y}
            aria-invalid={yInvalid}
            onChange={(e) => setY(e.target.value)}
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={secondaryButtonClass} onClick={() => { setX("20"); setY("150"); setMode("of"); }}>
          Reset
        </button>
      </div>

      {result && !result.ok && <ErrorBanner message={result.error} />}
      {result && result.ok && (
        <ResultCard label="Result" copyText={result.text}>
          <p className="text-2xl font-bold">{result.text}</p>
        </ResultCard>
      )}
    </div>
  );
}
