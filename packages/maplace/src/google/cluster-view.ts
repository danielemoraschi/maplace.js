import { clusterBoxAround, holdsView, WORLD_BOX } from "../adapter-kit/cluster-box";
import { hasArea, unwrapped, type ViewBox } from "../view-box";
import type { Bounds } from "../viewport";

/** A box as supercluster takes it: west, south, east, north; east may be past 180. */
export type Bbox = [number, number, number, number];

/** What Google clusters before it has a view: the whole world. */
export const WHOLE_WORLD = bboxOf(WORLD_BOX);

/**
 * The box Google clusters: `bounds` and half a view around them, as on MapLibre
 * (`clusterBoxAround`), so markers off screen stay off the map and a short pan brings nothing in
 * late. Bounds with no area, as Google reports for a map not yet laid out, are the whole world.
 * supercluster wraps the longitudes, clamps the poles and splits a box across the antimeridian.
 */
export function paddedView(bounds: Bounds): Bbox {
  return bboxOf(hasArea(bounds) ? clusterBoxAround(unwrapped(bounds)) : WORLD_BOX);
}

/** Whether `bbox` is the whole world, which supercluster takes for any box a turn wide. */
export function isWholeWorld([west, , east]: Bbox): boolean {
  return east - west >= 360;
}

/** Whether `bounds` lie inside `bbox`, either way round the world. */
export function isInside(bounds: Bounds, [west, south, east, north]: Bbox): boolean {
  return holdsView({ south, west, north, east }, unwrapped(bounds));
}

function bboxOf({ west, south, east, north }: ViewBox): Bbox {
  return [west, south, east, north];
}
