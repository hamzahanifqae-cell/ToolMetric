import type { ValidationResult } from "../validation/number.js";

/**
 * Search Console HTML-tag tokens are public (they are printed in the
 * homepage `<head>`). Accept the bare token, or the full tag / DNS value
 * Google shows, so a copy-paste of either form works.
 */
const TOKEN = /^[A-Za-z0-9+/_=-]{8,128}$/;

function extractToken(raw: string): string {
  const fromTag = raw.match(/content\s*=\s*["']([^"']+)["']/i);
  if (fromTag?.[1]) return fromTag[1].trim();

  const fromDns = raw.match(/google-site-verification\s*=\s*(\S+)/i);
  if (fromDns?.[1]) return fromDns[1].trim();

  return raw.trim();
}

/**
 * Unset is valid: verification is optional, and a DNS-verified Domain
 * property does not need this value. A provided value that is not a token
 * is rejected so a typo cannot ship as if the site were verified.
 */
export function parseGoogleSiteVerification(raw: string | undefined): ValidationResult<string | undefined> {
  if (raw === undefined) return { ok: true, value: undefined };
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { ok: true, value: undefined };

  const token = extractToken(trimmed);
  if (!TOKEN.test(token)) {
    return {
      ok: false,
      error:
        'must be the token from Google Search Console\'s HTML tag (letters, numbers, and - _ + / =), or the full <meta name="google-site-verification" content="..."> tag. It is not an API key.',
    };
  }
  return { ok: true, value: token };
}
