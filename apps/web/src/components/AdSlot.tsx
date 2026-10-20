import { siteConfig } from "../config/site.js";

interface AdSlotProps {
  /** Reserved layout slot height in pixels, used to avoid layout shift once a real ad is enabled. */
  reserveHeight?: number;
}

/**
 * Reusable ad placement. Renders nothing while advertising is disabled or
 * unconfigured — which is the default and current state of this site.
 * Enabling this requires: (1) a real AdSense client ID, (2) reviewing
 * current Google publisher policies, and (3) a verified consent setup.
 * See the README's AdSense section before changing `adsenseEnabled`.
 */
export function AdSlot({ reserveHeight }: AdSlotProps) {
  if (!siteConfig.adsenseEnabled || !siteConfig.adsenseClientId) {
    return null;
  }

  // Intentionally unimplemented: no ad network script is loaded anywhere in
  // this codebase. This branch is a placeholder for a future, deliberate
  // integration — it must never render a live ad request on its own.
  return <div style={{ minHeight: reserveHeight }} data-ad-slot-placeholder="true" />;
}
