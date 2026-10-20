import { useId, useMemo, useState } from "react";
import { calculateDateDifference } from "@toolmetric/shared";
import { Field } from "../ui/Field.js";
import { inputClass, secondaryButtonClass } from "../ui/inputClasses.js";
import { ResultCard, ErrorBanner } from "../ui/ResultCard.js";

export function DateDifferenceCalculator() {
  const id = useId();
  const [from, setFrom] = useState("2024-01-01");
  const [to, setTo] = useState("2024-12-31");

  const result = useMemo(() => calculateDateDifference(from, to), [from, to]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date" htmlFor={`${id}-from`}>
          <input id={`${id}-from`} className={inputClass} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="End date" htmlFor={`${id}-to`}>
          <input id={`${id}-to`} className={inputClass} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
      </div>

      <div>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={() => {
            setFrom("2024-01-01");
            setTo("2024-12-31");
          }}
        >
          Reset
        </button>
      </div>

      {!result.ok && <ErrorBanner message={result.error} />}
      {result.ok && (
        <ResultCard label="Difference" copyText={`${result.value.totalDays} days`}>
          <p className="text-2xl font-bold">{result.value.totalDays.toLocaleString()} days</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm text-navy-700 sm:grid-cols-4">
            <div>
              <dt className="text-navy-500">Weeks</dt>
              <dd className="font-semibold text-navy-900">
                {result.value.weeks} wk {result.value.remainderDays} d
              </dd>
            </div>
            <div>
              <dt className="text-navy-500">Years</dt>
              <dd className="font-semibold text-navy-900">{result.value.years}</dd>
            </div>
            <div>
              <dt className="text-navy-500">Months</dt>
              <dd className="font-semibold text-navy-900">{result.value.months}</dd>
            </div>
            <div>
              <dt className="text-navy-500">Days</dt>
              <dd className="font-semibold text-navy-900">{result.value.days}</dd>
            </div>
          </dl>
        </ResultCard>
      )}
    </div>
  );
}
