import { builtSiteSession, SITE_MAP_ID, type SiteSession } from "./site-session.ts";

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
  const site = builtSiteSession({
    SITE_MAPS_KEY: "not-a-real-key",
    SITE_MAPS_MAP_ID: SITE_MAP_ID,
  });
  return {
    get url() {
      return site.url;
    },
    get dir() {
      return site.dir;
    },
    visitor: (options) => site.visitor({ openFreeMap: "local", ...options }),
  };
}
