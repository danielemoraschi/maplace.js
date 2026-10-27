import type { Location } from "../location";
import { hasArea, isInBox, unwrapped, type ViewBox } from "../view-box";
import type { Viewport } from "../viewport";
import type { ListedTest } from "./model";

/** What a list with `scope` is switched to: "All" its locations, or "This area", the map's view. */
export type AreaMode = "all" | "area";

/**
 * The view a list with `scope` lists the locations of once the map reports `viewport`, or none
 * to list them all. In "This area", each new view, and `scope` itself through a resize, which
 * keeps the centre and zoom (the list's own height changing the map's is one, so a list under
 * the map can't loop); none in "All", and without a laid-out view (not attached, not laid out,
 * reopened) until one comes.
 */
export function scopeIn(
  mode: AreaMode,
  scope: Viewport | undefined,
  viewport: Viewport | undefined,
): Viewport | undefined {
  if (mode === "all" || !isLaidOut(viewport)) return undefined;
  return scope !== undefined && sameCamera(scope, viewport) ? scope : viewport;
}

/** What a list scoped to `scope` keeps: the locations with a point in it; with none, all. */
export function inViewOf(scope: Viewport | undefined): ListedTest | undefined {
  if (scope === undefined) return undefined;
  const box = unwrapped(scope.bounds);
  return (location) => isLocationInBox(location, box);
}

function isLaidOut(viewport: Viewport | undefined): viewport is Viewport {
  return viewport !== undefined && hasArea(viewport.bounds);
}

function sameCamera(a: Viewport, b: Viewport): boolean {
  return a.zoom === b.zoom && a.center.lat === b.center.lat && a.center.lng === b.center.lng;
}

/** A marker by its point, a circle by its centre, a line or polygon by any point of its path. */
function isLocationInBox(location: Location, box: ViewBox): boolean {
  switch (location.type) {
    case undefined:
    case "marker":
      return isInBox(location, box);
    case "circle":
      return isInBox(location.center, box);
    case "polyline":
    case "polygon":
      return location.path.some((point) => isInBox(point, box));
  }
}
