/// <reference types="google.maps" />
import type { Viewport } from "../viewport";
import { latLngOf } from "./lat-lng";
import type { MapPart } from "./mounted-map";

/**
 * Reports what the map shows each time it settles (Google's `idle`): after the store's moves and
 * the user's, and the view it opens at (at once on a page's map already drawn), so a page whose
 * map has nothing to fit still learns it.
 * Google's zoom and bounds are already the contract's: 256-px tiles, west > east across ±180°.
 */
export const viewportReports: MapPart = {
  open(mounted) {
    const { map } = mounted;
    const report = () => {
      const viewport = viewportOf(map);
      if (viewport) mounted.live()?.reportViewport(viewport);
    };
    const listener = map.addListener("idle", report);
    mounted.onDestroy(() => listener.remove());
    // A page's own map drawn before the adapter came has had its first `idle` already.
    report();
  },
};

/** What the map shows; undefined until Google has drawn it. */
function viewportOf(map: google.maps.Map): Viewport | undefined {
  const center = map.getCenter();
  const zoom = map.getZoom();
  const bounds = map.getBounds();
  if (center === undefined || zoom === undefined || bounds === undefined) return undefined;
  return { center: latLngOf(center), zoom, bounds: bounds.toJSON() };
}
