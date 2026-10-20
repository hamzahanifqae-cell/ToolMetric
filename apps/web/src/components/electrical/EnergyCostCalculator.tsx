import { useId, useMemo, useState } from "react";
import { calculateEnergyCost, parseFiniteNumber, roundForDisplay } from "@toolmetric/shared";
import { Field } from "../ui/Field.js";
import { inputClass, secondaryButtonClass } from "../ui/inputClasses.js";
import { ResultCard, ErrorBanner } from "../ui/ResultCard.js";

export function EnergyCostCalculator() {
  const id = useId();
  const [watts, setWatts] = useState("1500");
  const [hours, setHours] = useState("4");
  const [rate, setRate] = useState("0.15");
  const [currency, setCurrency] = useState("$");

  const result = useMemo(() => {
    const wCheck = parseFiniteNumber(watts, { label: "Power (watts)", disallowNegative: true });
    if (!wCheck.ok) return wCheck;
    const hCheck = parseFiniteNumber(hours, { label: "Hours", disallowNegative: true });
    if (!hCheck.ok) return hCheck;
    const rCheck = parseFiniteNumber(rate, { label: "Electricity rate", disallowNegative: true });
    if (!rCheck.ok) return rCheck;
    return calculateEnergyCost(wCheck.value, hCheck.value, rCheck.value);
  }, [watts, hours, rate]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Power (watts)" htmlFor={`${id}-w`}>
          <input id={`${id}-w`} className={inputClass} type="number" inputMode="decimal" value={watts} onChange={(e) => setWatts(e.target.value)} />
        </Field>
        <Field label="Usage time (hours)" htmlFor={`${id}-h`}>
          <input id={`${id}-h`} className={inputClass} type="number" inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} />
        </Field>
        <Field label="Electricity rate (per kWh)" htmlFor={`${id}-rate`}>
          <input id={`${id}-rate`} className={inputClass} type="number" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
        <Field label="Currency symbol" htmlFor={`${id}-currency`} hint="For display only; enter your own rate above.">
          <input id={`${id}-currency`} className={inputClass} type="text" maxLength={5} value={currency} onChange={(e) => setCurrency(e.target.value)} />
        </Field>
      </div>

      <div>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={() => {
            setWatts("1500");
            setHours("4");
            setRate("0.15");
            setCurrency("$");
          }}
        >
          Reset
        </button>
      </div>

      {!result.ok && <ErrorBanner message={result.error} />}
      {result.ok && (
        <ResultCard
          label="Estimated cost"
          copyText={`${roundForDisplay(result.value.kilowattHours, 4)} kWh — ${currency}${roundForDisplay(result.value.estimatedCost, 2)}`}
        >
          <p className="text-2xl font-bold">
            {currency}
            {roundForDisplay(result.value.estimatedCost, 2)}
          </p>
          <p className="mt-1 text-sm text-navy-600">{roundForDisplay(result.value.kilowattHours, 4)} kWh consumed</p>
          <p className="mt-2 text-xs text-navy-500">Excludes taxes, fixed charges, and tariff complexity unless folded into your entered rate.</p>
        </ResultCard>
      )}
    </div>
  );
}
