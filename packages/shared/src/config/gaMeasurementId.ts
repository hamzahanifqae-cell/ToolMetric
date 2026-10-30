import type { ValidationResult } from "../validation/number.js";

/** GA4 measurement IDs look like G-PSW1MY7HB4. */
const MEASUREMENT_ID = /^G-[A-Z0-9]{4,20}$/;

/**
 * Unset is valid: the site then loads no Analytics tag. A provided value
 * that is not a measurement ID is rejected so a typo cannot be printed
 * into the page as if tracking were working.
 */
export function parseGaMeasurementId(raw: string | undefined): ValidationResult<string | undefined> {
  if (raw === undefined) return { ok: true, value: undefined };
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { ok: true, value: undefined };

  const id = trimmed.toUpperCase();
  if (!MEASUREMENT_ID.test(id)) {
    return {
      ok: false,
      error:
        'must be the GA4 Measurement ID from Admin → Data streams, shaped like G-XXXXXXXXXX. It is not the Search Console token and not an AdSense publisher ID.',
    };
  }
  return { ok: true, value: id };
}
