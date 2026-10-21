import type { Map as MapLibreMap } from "maplibre-gl";
import type { Viewport } from "../viewport";
import { boundsOf, fromMapLibreZoom, wrappedLatLng } from "./conversions";
import { mapSizeOf } from "./map-size";
import type { MapPart } from "./mounted-map";

/**
 * Reports what the map shows each time it settles, as Google's `idle` does: a move marks the view
 * moved (MapLibre ends a jump or a fit before the call that made it returns), and the next `idle`
 * reports it, once, never while the map has no size. The view it opens at is reported at once
 * when the map is already still (a page's map drawn before the adapter came fires no `idle`).
 */
export const viewportReports: MapPart = {
  open(mounted) {
    const { map } = mounted;
    let moved = true;
    const report = () => {
      const viewport = viewportOf(map);
      if (viewport === undefined) return;
      moved = false;
      mounted.live()?.reportViewportChange(viewport);
    };
    const markMoved = () => {
      moved = true;
    };
    const settled = () => {
      if (moved) report();
    };
    map.on("moveend", markMoved);
    map.on("idle", settled);
    mounted.onDestroy(() => {
      map.off("moveend", markMoved);
      map.off("idle", settled);
    });
    if (!map.isMoving()) report();
  },
};

/** What the map shows, in maplace's zoom and bounds; undefined while it has no size. */
function viewportOf(map: MapLibreMap): Viewport | undefined {
  if (mapSizeOf(map) === undefined) return undefined;
  return {
    center: wrappedLatLng(map.getCenter()),
    zoom: fromMapLibreZoom(map.getZoom()),
    bounds: boundsOf(map.getBounds()),
  };
}
