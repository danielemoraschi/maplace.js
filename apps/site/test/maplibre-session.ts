import { AS_SHIPPED, builtSiteSession, type SiteSession } from "./site-session.ts";

/** How long a map on MapLibre may take to draw on the local style, on a busy machine. */
export const ON_MAPLIBRE = { timeout: 20_000 };

/** How long one section's three versions may take on MapLibre, one after another. */
export const SECTION_MS = 60_000;

/**
 * The site as it ships, with both providers (built with a key, never a real one, and a map ID,
 * as `siteBuiltBeforeTests` builds it), its visitors answered OpenFreeMap's styles from the
 * machine (`openFreeMap: "local"`) unless a test says otherwise, so nothing leaves the machine.
 */
export function siteOnMapLibreBeforeTests(): SiteSession {
  return builtSiteSession(AS_SHIPPED, { openFreeMap: "local" });
}
