import type { LatLng } from "../geometry";
import { arcSpan, wrapLongitude } from "../longitude-arc";
import { latOf, yOf } from "../mercator";
import type { Bounds } from "../viewport";

/** The world is this many pixels wide at zoom 0, the contract's zoom scale. */
export const TILE_SIZE = 256;
/** The closest zoom `fitBox` gives: what a box with no size (one location) asks for. */
export const MAX_ZOOM = 21;

/** A map's size in CSS pixels. */
export interface MapSize {
  readonly width: number;
  readonly height: number;
}

/** A camera: where the map's centre is, and its zoom. */
export interface Camera {
  readonly center: LatLng;
  readonly zoom: number;
}

/** How a box is fitted: into a map of `size`, keeping `padding` pixels clear at each edge. */
export interface Fit {
  readonly size: MapSize;
  readonly padding: number;
}

/** The box a camera shows on a map of `size`; a view wider than the world spans -180 to 180. */
export function boundsAround({ center, zoom }: Camera, size: MapSize): Bounds {
  const scale = TILE_SIZE * 2 ** zoom;
  const halfWidth = ((size.width / 2) * 360) / scale;
  const middle = yOf(center.lat);
  const halfHeight = size.height / 2 / scale;
  const whole = halfWidth >= 180;
  return {
    south: latOf(middle + halfHeight),
    north: latOf(middle - halfHeight),
    west: whole ? -180 : wrapLongitude(center.lng - halfWidth),
    east: whole ? 180 : wrapLongitude(center.lng + halfWidth),
  };
}

/** The camera that shows all of `box`, at a whole zoom; a box with west > east crosses ±180°. */
export function fitBox(box: Bounds, { size, padding }: Fit): Camera {
  const span = arcSpan(box);
  const top = yOf(box.north);
  const bottom = yOf(box.south);
  const across = Math.log2((size.width - 2 * padding) / ((span / 360) * TILE_SIZE));
  const down = Math.log2((size.height - 2 * padding) / ((bottom - top) * TILE_SIZE));
  return {
    center: { lat: latOf((top + bottom) / 2), lng: wrapLongitude(box.west + span / 2) },
    zoom: clampedZoom(Math.floor(Math.min(across, down))),
  };
}

// A zero-size box asks for an infinite zoom; padding wider than the map, for a negative one; a
// map with no size (hidden), for none.
function clampedZoom(zoom: number): number {
  if (Number.isNaN(zoom)) return 0;
  return Math.max(0, Math.min(MAX_ZOOM, zoom));
}
