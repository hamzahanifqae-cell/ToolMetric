import type { ValidationResult } from "../validation/number.js";
import { isReservedHostname } from "./reservedHostnames.js";

const LOCAL_PART_CHARS = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
const DOMAIN_LABEL = /^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?$/;
const TLD_PATTERN = /^[A-Za-z]{2,24}$/;

function hasWhitespaceOrControlChars(value: string): boolean {
  if (/\s/.test(value)) return true;
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

/**
 * Validates that `rawEmail` is a syntactically well-formed, plausible
 * operator contact address: a single `@`, a valid local part and domain,
 * no whitespace or control characters anywhere, and not an obvious
 * documentation/placeholder domain (example.com, *.test, etc. — the same
 * reserved-hostname list used by `validateProductionUrl`).
 *
 * This is purely syntactic. It proves the string is shaped like an email
 * address — it does **not** prove the mailbox exists, is actually
 * monitored, or will accept mail. Deliverability/verification requires
 * actually sending to it, which this function deliberately does not do.
 *
 * Deliberately conservative about what counts as an "obvious placeholder":
 * it flags reserved documentation domains, not local-part heuristics
 * (e.g. a role address like `test@realcompany.com` is not rejected — only
 * the domain is checked, since local-part guessing risks false positives
 * on real addresses).
 */
export function validateOperatorEmail(rawEmail: string | undefined): ValidationResult<string> {
  if (!rawEmail || rawEmail.trim().length === 0) {
    return { ok: false, error: "PUBLIC_OPERATOR_EMAIL is not set." };
  }

  if (hasWhitespaceOrControlChars(rawEmail)) {
    return { ok: false, error: "PUBLIC_OPERATOR_EMAIL must not contain whitespace or control characters." };
  }

  const email = rawEmail;
  const atCount = (email.match(/@/g) ?? []).length;
  if (atCount !== 1) {
    return { ok: false, error: `PUBLIC_OPERATOR_EMAIL ("${email}") must contain exactly one "@".` };
  }

  const [localPart = "", domain = ""] = email.split("@");

  if (
    localPart.length === 0 ||
    localPart.length > 64 ||
    !LOCAL_PART_CHARS.test(localPart) ||
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    localPart.includes("..")
  ) {
    return { ok: false, error: `PUBLIC_OPERATOR_EMAIL ("${email}") has an invalid local part (before the "@").` };
  }

  if (domain.length === 0 || !domain.includes(".")) {
    return { ok: false, error: `PUBLIC_OPERATOR_EMAIL ("${email}") must have a domain with at least one dot.` };
  }

  const labels = domain.split(".");
  if (labels.some((label) => !DOMAIN_LABEL.test(label))) {
    return { ok: false, error: `PUBLIC_OPERATOR_EMAIL ("${email}") has an invalid domain.` };
  }

  const tld = labels[labels.length - 1] ?? "";
  if (!TLD_PATTERN.test(tld)) {
    return { ok: false, error: `PUBLIC_OPERATOR_EMAIL ("${email}") has an invalid top-level domain.` };
  }

  if (isReservedHostname(domain)) {
    return {
      ok: false,
      error: `PUBLIC_OPERATOR_EMAIL ("${email}") uses a reserved documentation/example domain, not a real contact address.`,
    };
  }

  return { ok: true, value: email };
}
