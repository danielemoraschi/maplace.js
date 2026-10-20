/** Google's public map ID for development: advanced markers work on it, Cloud styling doesn't. */
export const DEMO_MAP_ID = "DEMO_MAP_ID";

const DEMO_MAP_ID_WARNING =
  "maplace: no map ID, so Google's DEMO_MAP_ID, for development only: " +
  "set map-id (mapId) for production";

let warned = false;

/** Tells the page, once however many maps it makes, that a map is on the demo map ID. */
export function warnOfDemoMapIdOnce(): void {
  if (warned) return;
  warned = true;
  console.warn(DEMO_MAP_ID_WARNING);
}
