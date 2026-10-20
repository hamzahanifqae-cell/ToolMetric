import { useId, useMemo, useState } from "react";
import { calculateDiscount, parseFiniteNumber, roundForDisplay } from "@toolmetric/shared";
import { Field } from "../ui/Field.js";
import { inputClass, secondaryButtonClass } from "../ui/inputClasses.js";
import { ResultCard, ErrorBanner } from "../ui/ResultCard.js";

export function DiscountCalculator() {
  const id = useId();
  const [price, setPrice] = useState("80");
  const [discount, setDiscount] = useState("25");

  const result = useMemo(() => {
    const priceCheck = parseFiniteNumber(price, { label: "Original price", disallowNegative: true });
    if (!priceCheck.ok) return priceCheck;
    const discountCheck = parseFiniteNumber(discount, { label: "Discount percentage", min: 0, max: 100 });
    if (!discountCheck.ok) return discountCheck;
    return { ok: true as const, value: calculateDiscount(priceCheck.value, discountCheck.value) };
  }, [price, discount]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Original price" htmlFor={`${id}-price`}>
          <input id={`${id}-price`} className={inputClass} type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field label="Discount (%)" htmlFor={`${id}-discount`} hint="0 to 100">
          <input
            id={`${id}-discount`}
            className={inputClass}
            type="number"
            inputMode="decimal"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </Field>
      </div>

      <div>
        <button type="button" className={secondaryButtonClass} onClick={() => { setPrice("80"); setDiscount("25"); }}>
          Reset
        </button>
      </div>

      {!result.ok && <ErrorBanner message={result.error} />}
      {result.ok && (
        <ResultCard label="Final price" copyText={roundForDisplay(result.value.finalPrice, 2).toString()}>
          <p className="text-2xl font-bold">{roundForDisplay(result.value.finalPrice, 2)}</p>
          <p className="mt-2 text-sm text-navy-600">
            You save {roundForDisplay(result.value.discountAmount, 2)} ({roundForDisplay(result.value.savingsPercent, 2)}%).
          </p>
        </ResultCard>
      )}
    </div>
  );
}
