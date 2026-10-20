import type { ValidationResult } from "../validation/number.js";
import { isReservedHostname } from "./reservedHostnames.js";

const IPV4_PATTERN = /^\d{1,3}(\.\d{1,3}){3}$/;

/**
 * True for any IP-literal host — IPv4 dotted-quad or bracketed IPv6
 * (`[::1]`, `[2001:db8::1]`, etc). ToolMetric's production URL must be a
 * registered domain name, so *every* IP literal is rejected here, not just
 * loopback/private/link-local ranges — there is no category of IP address
 * that's an acceptable `PUBLIC_SITE_URL`.
 */
function isIpLiteral(hostname: string): boolean {
  return hostname.startsWith("[") || IPV4_PATTERN.test(hostname);
}

/**
 * Validates that `rawUrl` is a real, production-ready HTTPS site URL.
 * Checked, in order: well-formed; HTTPS (not HTTP); no embedded
 * credentials, query string, or fragment; root path only (no base path);
 * not an IP literal of any kind (loopback, private, link-local, or public —
 * this project uses a domain name); not a reserved documentation/example
 * hostname or subdomain of one; and the hostname has at least one dot (a
 * real registered domain, not a single bare label).
 *
 * This is purely syntactic. It proves the string is a well-formed,
 * plausible production URL — it does **not** prove you own the domain,
 * that DNS actually resolves it, or that HTTPS is actually served there.
 * Those require real infrastructure checks outside this function.
 *
 * Deliberately strict — meant only to gate a *release* build, never local
 * development (which has its own separate, explicit localhost fallback
 * that never runs through this check).
 */
export function validateProductionUrl(rawUrl: string | undefined): ValidationResult<string> {
  if (!rawUrl || rawUrl.trim().length === 0) {
    return { ok: false, error: "PUBLIC_SITE_URL is not set." };
  }

  const trimmed = rawUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: `PUBLIC_SITE_URL ("${trimmed}") is not a valid URL.` };
  }

  if (parsed.protocol !== "https:") {
    return {
      ok: false,
      error: `PUBLIC_SITE_URL must use HTTPS for a production release (got "${parsed.protocol}").`,
    };
  }

  if (parsed.username || parsed.password) {
    return {
      ok: false,
      error: `PUBLIC_SITE_URL ("${trimmed}") must not contain embedded credentials.`,
    };
  }

  if (parsed.search) {
    return { ok: false, error: `PUBLIC_SITE_URL ("${trimmed}") must not contain a query string.` };
  }

  if (parsed.hash) {
    return { ok: false, error: `PUBLIC_SITE_URL ("${trimmed}") must not contain a fragment.` };
  }

  if (parsed.pathname !== "/") {
    return {
      ok: false,
      error: `PUBLIC_SITE_URL ("${trimmed}") must point at the site root — base paths (e.g. "${parsed.pathname}") are not supported.`,
    };
  }

  if (isIpLiteral(parsed.hostname)) {
    return {
      ok: false,
      error: `PUBLIC_SITE_URL ("${trimmed}") must be a registered domain name, not an IP address.`,
    };
  }

  if (isReservedHostname(parsed.hostname)) {
    return {
      ok: false,
      error: `PUBLIC_SITE_URL ("${trimmed}") uses a reserved documentation/example/local hostname, not a real production domain.`,
    };
  }

  if (!parsed.hostname.includes(".")) {
    return {
      ok: false,
      error: `PUBLIC_SITE_URL ("${trimmed}") does not look like a real registered domain.`,
    };
  }

  // parsed.origin is already protocol + host with no trailing slash,
  // credentials, query, or fragment — the canonical normalized form, built
  // from the parser's own serialization rather than string surgery on the
  // original input.
  return { ok: true, value: parsed.origin };
}
