#!/usr/bin/env node
// Gates a real release: checks the same configuration the site itself
// reads, reports exactly what's missing or invalid, and exits non-zero if
// any of it is release-blocking. Intended to run in CI/CD immediately
// before a production deploy, e.g.:
//
//   npm run launch-check && npm run build && <deploy>
//
// Env vars are read from whatever the process already has (CI secrets,
// shell exports, etc). To check a local `.env` file instead, run:
//
//   node --env-file-if-exists=.env scripts/launch-check.mjs
import { validateProductionUrl, validateOperatorEmail, parseGoogleSiteVerification, parseGaMeasurementId } from "@toolmetric/shared";

function readEnv(key) {
  const value = process.env[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

const urlCheck = validateProductionUrl(readEnv("PUBLIC_SITE_URL"));
const operatorName = readEnv("PUBLIC_OPERATOR_NAME");
const rawOperatorEmail = readEnv("PUBLIC_OPERATOR_EMAIL");
// Operator identity is optional and the site owner's choice — not a
// blocker. A *provided* email is still validated: a typo is a bug, not a
// privacy choice.
const emailCheck = rawOperatorEmail ? validateOperatorEmail(rawOperatorEmail) : undefined;
const robotsPolicy = readEnv("PUBLIC_ROBOTS_POLICY");
const adsenseEnabled = readEnv("PUBLIC_ADSENSE_ENABLED") === "true";
const adsenseClientId = readEnv("PUBLIC_ADSENSE_CLIENT_ID");
const verificationCheck = parseGoogleSiteVerification(readEnv("PUBLIC_GOOGLE_SITE_VERIFICATION"));
const gaCheck = parseGaMeasurementId(readEnv("PUBLIC_GA_MEASUREMENT_ID"));

const blockers = [];
if (!urlCheck.ok) blockers.push(`PUBLIC_SITE_URL: ${urlCheck.error}`);
if (emailCheck && !emailCheck.ok) blockers.push(`PUBLIC_OPERATOR_EMAIL: ${emailCheck.error}`);
if (!verificationCheck.ok) blockers.push(`PUBLIC_GOOGLE_SITE_VERIFICATION: ${verificationCheck.error}`);
if (!gaCheck.ok) blockers.push(`PUBLIC_GA_MEASUREMENT_ID: ${gaCheck.error}`);

const advisories = [];
if (!operatorName && !rawOperatorEmail) {
  advisories.push(
    "No public operator name/email is configured — About/Contact-related copy will say so rather than publish a placeholder. Fine if that's intentional."
  );
}
if (robotsPolicy === "noindex") {
  advisories.push('PUBLIC_ROBOTS_POLICY=noindex — this build will tell search engines not to index it. Remove this for the final public launch.');
}
if (adsenseEnabled && !adsenseClientId) {
  advisories.push("PUBLIC_ADSENSE_ENABLED=true but PUBLIC_ADSENSE_CLIENT_ID is not set — the ad slot will still render nothing.");
} else if (!adsenseEnabled) {
  advisories.push("Advertising is disabled. That's expected for an ad-free release; see README before enabling it.");
}
if (gaCheck.ok && !gaCheck.value) {
  advisories.push(
    "PUBLIC_GA_MEASUREMENT_ID is not set, so visits are not sent to Google Analytics. Create a GA4 property and set the measurement ID before expecting traffic reports."
  );
}
if (verificationCheck.ok && !verificationCheck.value) {
  advisories.push(
    "PUBLIC_GOOGLE_SITE_VERIFICATION is not set. HTML-tag verification in Google Search Console will not succeed until you paste the token. Skip this if you verify the domain with a DNS TXT record instead."
  );
}

console.log("ToolMetric launch check");
console.log("========================\n");

if (blockers.length === 0) {
  console.log("No release blockers found.\n");
} else {
  console.log(`${blockers.length} release blocker(s) — these must be fixed before a public launch:\n`);
  for (const b of blockers) console.log(`  - ${b}`);
  console.log("");
}

if (advisories.length > 0) {
  console.log("Advisories (non-blocking — these do not fail this check):\n");
  for (const a of advisories) console.log(`  - ${a}`);
  console.log("");
}

console.log("Note: this check only covers engineering/launch configuration.");
console.log("PUBLIC_SITE_URL and PUBLIC_OPERATOR_EMAIL are checked for valid syntax only — this does not confirm");
console.log("domain ownership, DNS resolution, HTTPS availability, or that the mailbox receives mail.");
console.log("It does not check legal review status or AdSense account setup — see README.\n");

if (blockers.length > 0) {
  process.exitCode = 1;
}
