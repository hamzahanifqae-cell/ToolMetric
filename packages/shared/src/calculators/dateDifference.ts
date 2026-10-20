import type { ValidationResult } from "../validation/number.js";
import { parseIsoDate, wholeDaysBetween } from "./dateUtils.js";

export interface DateDifferenceResult {
  totalDays: number;
  weeks: number;
  remainderDays: number;
  years: number;
  months: number;
  days: number;
}

/**
 * Computes the difference between two dates.
 *
 * Inclusion rule: the difference is "exclusive" — the number of nights/days
 * elapsed between the two calendar dates (e.g. Jan 1 to Jan 2 is 1 day).
 * If you need an "inclusive" count (both endpoints counted, e.g. for a
 * number of nights booked vs. number of calendar days spanned), add 1 to
 * `totalDays` yourself; we keep the exclusive convention as the default
 * because it matches how most calendar-day-count tools define "difference."
 */
export function calculateDateDifference(
  fromIso: string,
  toIso: string
): ValidationResult<DateDifferenceResult> {
  const fromResult = parseIsoDate(fromIso);
  if (!fromResult.ok) return { ok: false, error: `Start date: ${fromResult.error}` };

  const toResult = parseIsoDate(toIso);
  if (!toResult.ok) return { ok: false, error: `End date: ${toResult.error}` };

  const earlier = fromResult.value.getTime() <= toResult.value.getTime() ? fromResult.value : toResult.value;
  const later = fromResult.value.getTime() <= toResult.value.getTime() ? toResult.value : fromResult.value;

  const totalDays = wholeDaysBetween(earlier, later);
  const weeks = Math.trunc(totalDays / 7);
  const remainderDays = totalDays % 7;

  let years = later.getUTCFullYear() - earlier.getUTCFullYear();
  let months = later.getUTCMonth() - earlier.getUTCMonth();
  let days = later.getUTCDate() - earlier.getUTCDate();

  if (days < 0) {
    const daysInPrevMonth = new Date(
      Date.UTC(later.getUTCFullYear(), later.getUTCMonth(), 0)
    ).getUTCDate();
    days += daysInPrevMonth;
    months -= 1;
  }
  if (months < 0) {
    months += 12;
    years -= 1;
  }

  return { ok: true, value: { totalDays, weeks, remainderDays, years, months, days } };
}
