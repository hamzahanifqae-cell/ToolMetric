import type { APIRoute } from "astro";
import { siteConfig, allowIndexing } from "../config/site.js";

/**
 * Indexing is disabled whenever either (a) the production URL safety net
 * trips — PUBLIC_SITE_URL is missing or invalid, so a misconfigured
 * deployment never gets crawled under the wrong URL — or (b)
 * PUBLIC_ROBOTS_POLICY is explicitly set to "noindex" for an intentional
 * staging deployment. A real, correctly-configured production release
 * satisfies neither condition and is indexed normally; the API service's
 * own endpoints are excluded regardless, since they're never meant to be
 * crawled (and produce no persistent, indexable output URLs to begin with).
 */
export const GET: APIRoute = () => {
  const body = allowIndexing
    ? `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${new URL("/sitemap-index.xml", siteConfig.url).toString()}\n`
    : `User-agent: *\nDisallow: /\n`;

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
