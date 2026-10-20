import type { ValidationResult } from "../validation/number.js";
import { isLeapYear, parseIsoDate, wholeDaysBetween } from "./dateUtils.js";

export interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  /** Date (YYYY-MM-DD) of the next birthday on or after `asOf`. */
  nextBirthday: string;
  daysUntilNextBirthday: number;
  /**
   * True when the birth date is February 29 and this year's observed
   * anniversary was shifted to February 28 because the current year is
   * not a leap year.
   */
  leapDayAdjusted: boolean;
}

/**
 * Computes a person's age as of a given date (defaults handled by caller).
 *
 * Leap-day rule: a person born on February 29 is treated as having their
 * anniversary on February 28 in non-leap years, and reverts to February 29
 * in leap years. This is a documented convention (the same one most
 * civil/legal systems use) — not the only valid interpretation.
 */
export function calculateAge(
  birthDateIso: string,
  asOfIso: string
): ValidationResult<AgeResult> {
  const birthResult = parseIsoDate(birthDateIso);
  if (!birthResult.ok) return { ok: false, error: `Birth date: ${birthResult.error}` };

  const asOfResult = parseIsoDate(asOfIso);
  if (!asOfResult.ok) return { ok: false, error: `As-of date: ${asOfResult.error}` };

  const birth = birthResult.value;
  const asOf = asOfResult.value;

  if (birth.getTime() > asOf.getTime()) {
    return { ok: false, error: "Birth date must be on or before the as-of date." };
  }

  const birthYear = birth.getUTCFullYear();
  const birthMonth = birth.getUTCMonth();
  const birthDay = birth.getUTCDate();
  const isLeapBirthday = birthMonth === 1 && birthDay === 29;

  let years = asOf.getUTCFullYear() - birthYear;
  let months = asOf.getUTCMonth() - birthMonth;
  let days = asOf.getUTCDate() - birthDay;

  if (days < 0) {
    const daysInPrevMonth = new Date(
      Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), 0)
    ).getUTCDate();
    days += daysInPrevMonth;
    months -= 1;
  }
  if (months < 0) {
    months += 12;
    years -= 1;
  }

  const totalDays = wholeDaysBetween(birth, asOf);

  // Next birthday: anniversary in the current (or next) year, leap-day adjusted.
  const anniversaryDay = (year: number) =>
    isLeapBirthday && !isLeapYear(year) ? 28 : birthDay;

  let nextBirthdayYear = asOf.getUTCFullYear();
  let nextBirthday = new Date(
    Date.UTC(nextBirthdayYear, birthMonth, anniversaryDay(nextBirthdayYear))
  );
  if (nextBirthday.getTime() < asOf.getTime()) {
    nextBirthdayYear += 1;
    nextBirthday = new Date(
      Date.UTC(nextBirthdayYear, birthMonth, anniversaryDay(nextBirthdayYear))
    );
  }

  const leapDayAdjusted = isLeapBirthday && !isLeapYear(nextBirthdayYear);
  const daysUntilNextBirthday = wholeDaysBetween(asOf, nextBirthday);

  return {
    ok: true,
    value: {
      years,
      months,
      days,
      totalDays,
      nextBirthday: nextBirthday.toISOString().slice(0, 10),
      daysUntilNextBirthday,
      leapDayAdjusted,
    },
  };
}
