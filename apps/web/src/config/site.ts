import { validateProductionUrl, validateOperatorEmail, parseGoogleSiteVerification } from "@toolmetric/shared";

/**
 * Centralized, typed public operator/launch configuration. `PUBLIC_SITE_URL`
 * must be real before a release build will even complete — see
 * `launchBlockers`. Publishing an operator name/email is optional and
 * entirely the site owner's choice: unset is a valid, supported state (the
 * About/Contact copy says so plainly rather than inventing a placeholder),
 * not something this build enforces or nags about. A *provided* email is
 * still validated, though — a typo is a bug, not a privacy choice.
 */

const DEV_FALLBACK_SITE_URL = "http://localhost:4321";

function readEnv(key: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

const urlCheck = validateProductionUrl(readEnv("PUBLIC_SITE_URL"));
const rawOperatorEmail = readEnv("PUBLIC_OPERATOR_EMAIL");
const emailCheck = rawOperatorEmail ? validateOperatorEmail(rawOperatorEmail) : undefined;
const verificationCheck = parseGoogleSiteVerification(readEnv("PUBLIC_GOOGLE_SITE_VERIFICATION"));

export const siteConfig = {
  name: readEnv("PUBLIC_SITE_NAME") ?? "ToolMetric",

  /**
   * Real, validated production HTTPS URL when available; otherwise the
   * local dev fallback. This never silently accepts an invalid value
   * (localhost, an example domain, plain HTTP, a malformed URL) as if it
   * were production-ready — see `usingFallbackUrl` / `siteUrlError`.
   */
  url: urlCheck.ok ? urlCheck.value : DEV_FALLBACK_SITE_URL,

  /** True whenever PUBLIC_SITE_URL is missing or fails production validation. */
  usingFallbackUrl: !urlCheck.ok,
  siteUrlError: urlCheck.ok ? undefined : urlCheck.error,

  operatorName: readEnv("PUBLIC_OPERATOR_NAME"),

  /**
   * Set only when PUBLIC_OPERATOR_EMAIL is both provided and passes syntax
   * validation — an invalid address is never published as if it were real
   * (e.g. as a mailto: link). Unset is a normal, supported state (no
   * error); `operatorEmailError` is only set when a value was provided but
   * rejected. Validation is syntactic only: it does not confirm the
   * mailbox exists or receives mail.
   */
  operatorEmail: emailCheck?.ok ? emailCheck.value : undefined,
  operatorEmailError: emailCheck && !emailCheck.ok ? emailCheck.error : undefined,

  /**
   * Explicit, intentional indexing policy — independent of the URL safety
   * net above. Lets a real staging deployment (a genuine HTTPS domain that
   * just isn't the final public one yet) opt out of indexing on purpose,
   * rather than relying solely on the fallback-URL heuristic to guess it.
   * Defaults to indexable so the real production site is never
   * accidentally blocked by omission.
   */
  robotsPolicy: (readEnv("PUBLIC_ROBOTS_POLICY") === "noindex" ? "noindex" : "index") as "index" | "noindex",

  adsenseEnabled: readEnv("PUBLIC_ADSENSE_ENABLED") === "true",
  adsenseClientId: readEnv("PUBLIC_ADSENSE_CLIENT_ID"),

  /**
   * Public Search Console HTML-tag token. Present in the homepage `<head>`
   * only when the value parses. This is not a secret and not an API key.
   */
  googleSiteVerification: verificationCheck.ok ? verificationCheck.value : undefined,
} as const;

/**
 * Base URL the browser prepends to API requests (e.g. `/api/image/process`).
 * Empty by default — the normal same-origin setup, where a dev proxy or
 * production reverse proxy forwards `/api/*` on the site's own origin to
 * the Fastify service, and no CORS is needed. Set PUBLIC_API_BASE_URL to an
 * absolute origin (e.g. "https://api.example.com") only if the API is
 * genuinely deployed on a different origin than the site itself — that
 * requires the API's CORS_ORIGIN to be configured to allow it.
 */
export const apiBaseUrl = readEnv("PUBLIC_API_BASE_URL") ?? "";

/** True only when the site is actually safe to let search engines index. */
export const allowIndexing = !siteConfig.usingFallbackUrl && siteConfig.robotsPolicy === "index";

/** Missing/invalid configuration that blocks a real release. Operator identity is intentionally not here — see the module doc comment above. */
export const launchBlockers: string[] = [
  siteConfig.usingFallbackUrl
    ? `PUBLIC_SITE_URL is not production-ready: ${siteConfig.siteUrlError} Canonical URLs, the sitemap, and structured data all depend on this being a real HTTPS domain.`
    : undefined,
  siteConfig.operatorEmailError ? `PUBLIC_OPERATOR_EMAIL is not valid: ${siteConfig.operatorEmailError}` : undefined,
  verificationCheck.ok ? undefined : `PUBLIC_GOOGLE_SITE_VERIFICATION ${verificationCheck.error}`,
].filter((v): v is string => Boolean(v));

/**
 * Advisory, non-blocking configuration notes — distinct from
 * `launchBlockers` because none of these should ever prevent an otherwise
 * valid release (a missing AdSense ID, or a deliberately undisclosed
 * operator identity, are both supported, intentional states).
 */
export const launchAdvisories: string[] = [
  !siteConfig.operatorName && !siteConfig.operatorEmail
    ? "No public operator name/email is configured — About and Contact-related copy will say so rather than publish a placeholder. This is fine if that's intentional."
    : undefined,
  siteConfig.adsenseEnabled && !siteConfig.adsenseClientId
    ? "PUBLIC_ADSENSE_ENABLED is true but PUBLIC_ADSENSE_CLIENT_ID is not set, so the ad slot component will still render nothing."
    : undefined,
  siteConfig.robotsPolicy === "noindex"
    ? "PUBLIC_ROBOTS_POLICY is set to \"noindex\" — this deployment will not be indexed. Remove it for the final public launch."
    : undefined,
].filter((v): v is string => Boolean(v));
