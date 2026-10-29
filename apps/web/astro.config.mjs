import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { validateProductionUrl, validateOperatorEmail, parseGoogleSiteVerification } from "@toolmetric/shared";

// Astro does not populate process.env from .env before evaluating this file
// (it only does that later, for import.meta.env, via Vite) — so without
// this, a value set only in apps/web/.env would be invisible here even
// though the rest of the app (via import.meta.env in src/config/site.ts)
// and the launch-check script (via --env-file-if-exists) both see it. Load
// it explicitly so all three read configuration the same way.
try {
  process.loadEnvFile(fileURLToPath(new URL(".env", import.meta.url)));
} catch (err) {
  if (err.code !== "ENOENT") throw err;
}

const DEV_FALLBACK_SITE_URL = "http://localhost:4321";

const isBuildCommand = process.argv.includes("build");
// Explicit, separately-named escape hatch for a non-release build: produces
// a real static site (useful to preview dist/ output, or for a deploy that
// genuinely doesn't need correct canonical URLs/sitemap) without requiring
// real domain/operator configuration. Set via `npm run build:local`, never
// the default — the standard `npm run build` / `astro build` always
// enforces the checks below.
const allowLocalBuild = process.env.TOOLMETRIC_ALLOW_LOCAL_BUILD === "true";

const urlCheck = validateProductionUrl(process.env.PUBLIC_SITE_URL);

// Operator name/email are optional — publishing an operator identity is the
// site owner's choice, not something this build enforces. If one *is*
// provided, though, it's still validated: a typo'd/malformed value is a
// real bug, not a privacy choice, so that still blocks.
const rawOperatorEmail = process.env.PUBLIC_OPERATOR_EMAIL?.trim();
const emailCheck = rawOperatorEmail ? validateOperatorEmail(rawOperatorEmail) : undefined;
const verificationCheck = parseGoogleSiteVerification(process.env.PUBLIC_GOOGLE_SITE_VERIFICATION);

if (isBuildCommand && !allowLocalBuild) {
  const problems = [];
  if (!urlCheck.ok) problems.push(`PUBLIC_SITE_URL: ${urlCheck.error}`);
  if (emailCheck && !emailCheck.ok) problems.push(`PUBLIC_OPERATOR_EMAIL: ${emailCheck.error}`);
  if (!verificationCheck.ok) problems.push(`PUBLIC_GOOGLE_SITE_VERIFICATION: ${verificationCheck.error}`);

  if (problems.length > 0) {
    console.error("\n[toolmetric] Release build blocked — required configuration is missing or invalid:\n");
    for (const problem of problems) console.error(`  - ${problem}`);
    console.error(
      "\n[toolmetric] This build does NOT silently fall back to localhost for a release. Fix the environment " +
        "above (see apps/web/.env.example), or run `npm run build:local` for a non-release build that uses the " +
        "localhost fallback instead — that build is not suitable for a public deployment.\n"
    );
    // Advertising configuration is never checked here — a missing AdSense
    // client ID must never block an otherwise valid, ad-free release.
    process.exit(1);
  }
}

// Only reached in dev, in a passing release build, or with the explicit
// local-build bypass — so this fallback is never silently used for a real
// release; the check above already failed the process first.
const siteUrl = urlCheck.ok ? urlCheck.value : DEV_FALLBACK_SITE_URL;

// In development, requests to /api/* are proxied same-origin to the Fastify
// service so the browser never needs a separate origin/CORS setup. In
// production, configure your reverse proxy to do the same (see README).
const apiProxyTarget = process.env.API_PROXY_TARGET || "http://localhost:8787";

export default defineConfig({
  site: siteUrl,
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.endsWith("/404") && !page.endsWith("/404/"),
      serialize(item) {
        const path = new URL(item.url).pathname.replace(/\/$/, "") || "/";
        if (path === "/") return { ...item, changefreq: "weekly", priority: 1 };
        if (path === "/about" || path === "/privacy" || path === "/terms") {
          return { ...item, changefreq: "yearly", priority: 0.3 };
        }
        const segments = path.split("/").filter(Boolean);
        if (segments[0] === "tools" && segments.length >= 3) {
          return { ...item, changefreq: "monthly", priority: 0.8 };
        }
        if (segments[0] === "tools") return { ...item, changefreq: "weekly", priority: 0.7 };
        return { ...item, changefreq: "monthly", priority: 0.5 };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  },
});
