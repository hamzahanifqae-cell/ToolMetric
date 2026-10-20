import { useId, useMemo, useState } from "react";
import { calculateAge } from "@toolmetric/shared";
import { Field } from "../ui/Field.js";
import { inputClass, secondaryButtonClass } from "../ui/inputClasses.js";
import { ResultCard, ErrorBanner } from "../ui/ResultCard.js";

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function AgeCalculator() {
  const id = useId();
  const [birthDate, setBirthDate] = useState("1995-06-15");
  const [asOf, setAsOf] = useState(todayIso());

  const result = useMemo(() => calculateAge(birthDate, asOf), [birthDate, asOf]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Birth date" htmlFor={`${id}-birth`}>
          <input
            id={`${id}-birth`}
            className={inputClass}
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </Field>
        <Field label="As of date" htmlFor={`${id}-asof`} hint="Defaults to today; change it to calculate age on another date.">
          <input
            id={`${id}-asof`}
            className={inputClass}
            type="date"
            value={asOf}
            onChange={(e) => setAsOf(e.target.value)}
          />
        </Field>
      </div>

      <div>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={() => {
            setBirthDate("1995-06-15");
            setAsOf(todayIso());
          }}
        >
          Reset
        </button>
      </div>

      {!result.ok && <ErrorBanner message={result.error} />}
      {result.ok && (
        <ResultCard
          label="Age"
          copyText={`${result.value.years} years, ${result.value.months} months, ${result.value.days} days`}
        >
          <p className="text-2xl font-bold">
            {result.value.years} years, {result.value.months} months, {result.value.days} days
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm text-navy-700 sm:grid-cols-3">
            <div>
              <dt className="text-navy-500">Total days lived</dt>
              <dd className="font-semibold text-navy-900">{result.value.totalDays.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-navy-500">Next birthday</dt>
              <dd className="font-semibold text-navy-900">{result.value.nextBirthday}</dd>
            </div>
            <div>
              <dt className="text-navy-500">Days until next birthday</dt>
              <dd className="font-semibold text-navy-900">{result.value.daysUntilNextBirthday}</dd>
            </div>
          </dl>
          {result.value.leapDayAdjusted && (
            <p className="mt-3 text-sm text-navy-600">
              This birth date is February 29. Since the next anniversary falls in a non-leap year, it's shown as
              February 28 (see "Leap-day birthdays" below).
            </p>
          )}
        </ResultCard>
      )}
    </div>
  );
}
