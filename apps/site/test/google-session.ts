import { DEMO_MAP_ID } from "../../../packages/maplace/src/google/demo-map-id.ts";
import { MAPS_TEST_ORIGIN } from "../../../packages/maplace/src/google/testing/maps-origin.ts";
import { builtSiteSession, type SiteSession } from "./site-session.ts";

/** How long a map on Google may take to draw, on a busy machine and a slow network. */
export const ON_GOOGLE = { timeout: 30_000 };

/** How long one section's three versions may take on Google, one after another. */
export const SECTION_MS = 120_000;

/**
 * The site built with the tests' Maps key, on Google's demo map ID, and visited at the one origin
 * the key allows: its pages are answered from wherever the site is served, so no port is taken
 * (the dev server may hold that one), and Google is reached.
 */
export function siteOnGoogleBeforeTests(key: string): SiteSession {
  return builtSiteSession(
    { SITE_MAPS_KEY: key, SITE_MAPS_MAP_ID: DEMO_MAP_ID },
    { google: "reached", seenAt: MAPS_TEST_ORIGIN },
  );
}
