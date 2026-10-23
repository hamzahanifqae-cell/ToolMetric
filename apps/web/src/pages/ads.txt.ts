import type { APIRoute } from "astro";
import { siteConfig } from "../config/site.js";

/**
 * Only emitted once AdSense is actually enabled and a client ID is
 * configured — otherwise there's nothing to authorize and the route
 * 404s, same as before ads.txt existed.
 */
export const GET: APIRoute = () => {
  if (!siteConfig.adsenseEnabled || !siteConfig.adsenseClientId) {
    return new Response("Not found", { status: 404 });
  }

  const pubId = siteConfig.adsenseClientId.replace(/^ca-/, "");
  const body = `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`;

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
