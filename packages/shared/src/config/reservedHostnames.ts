/**
 * Hostnames/TLDs reserved for documentation and testing (RFC 2606): the
 * TLDs .test, .example, .invalid, .localhost, and the second-level domains
 * example.com/.net/.org (plus .edu, a long-standing IANA documentation
 * domain outside RFC 2606). Subdomains of any of these are reserved too —
 * `foo.example.com` is just as much a placeholder as `example.com` itself.
 *
 * Shared between the production-URL validator and the operator-email
 * validator, so "what counts as an obvious placeholder domain" can't drift
 * between the two.
 */
const RESERVED_TLDS = ["test", "example", "invalid", "localhost"];
const RESERVED_DOMAINS = ["example.com", "example.net", "example.org", "example.edu"];

function isExactOrSubdomainOf(hostname: string, suffix: string): boolean {
  return hostname === suffix || hostname.endsWith(`.${suffix}`);
}

export function isReservedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (RESERVED_DOMAINS.some((domain) => isExactOrSubdomainOf(normalized, domain))) return true;
  if (RESERVED_TLDS.some((tld) => isExactOrSubdomainOf(normalized, tld))) return true;
  return false;
}
