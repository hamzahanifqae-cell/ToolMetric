import type { ValidationResult } from "../validation/number.js";

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses a "YYYY-MM-DD" date string into a UTC-anchored timestamp (midnight
 * UTC). Dates are intentionally handled as calendar dates with no time-of-day
 * or local timezone component, so results are identical regardless of the
 * browser's or server's timezone — this avoids off-by-one-day bugs that
 * occur when a local-timezone `Date` constructor is used near midnight.
 */
export function parseIsoDate(raw: string): ValidationResult<Date> {
  const match = ISO_DATE_RE.exec(raw.trim());
  if (!match) {
    return { ok: false, error: "Date must be in YYYY-MM-DD format." };
  }
  const [, yearStr, monthStr, dayStr] = match as unknown as [string, string, string, string];
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const date = new Date(Date.UTC(year, month - 1, day));
  const isValidCalendarDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  if (!isValidCalendarDate) {
    return { ok: false, error: "That date does not exist on the calendar." };
  }

  return { ok: true, value: date };
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Whole days between two UTC-anchored dates (end - start). Can be negative. */
export function wholeDaysBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
}
