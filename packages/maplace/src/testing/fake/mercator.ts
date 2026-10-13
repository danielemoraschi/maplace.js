import type { LatLng } from "../../geometry";
import type { Bounds } from "../../viewport";
import type { MapSize } from "../map-probe";

/** The world is this many pixels wide at zoom 0, the contract's zoom scale. */
export const TILE_SIZE = 256;
/** How far a fit zooms in on a box with no size (one location). */
export const MAX_ZOOM = 21;
/** Web Mercator stops here; providers clamp latitudes to it. */
const MAX_LATITUDE = 85.051_128_78;

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
    west: whole ? -180 : wrapped(center.lng - halfWidth),
    east: whole ? 180 : wrapped(center.lng + halfWidth),
  };
}

/** The camera that shows all of `box`, at a whole zoom; a box with west > east crosses ±180°. */
export function fitBox(box: Bounds, { size, padding }: Fit): Camera {
  const span = box.west > box.east ? box.east + 360 - box.west : box.east - box.west;
  const top = yOf(box.north);
  const bottom = yOf(box.south);
  const across = Math.log2((size.width - 2 * padding) / ((span / 360) * TILE_SIZE));
  const down = Math.log2((size.height - 2 * padding) / ((bottom - top) * TILE_SIZE));
  return {
    center: { lat: latOf((top + bottom) / 2), lng: wrapped(box.west + span / 2) },
    zoom: clampedZoom(Math.floor(Math.min(across, down))),
  };
}

/** A longitude brought into -180..180. */
export function wrapped(lng: number): number {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

/** A latitude as a fraction of the world's height from the top, 0 to 1. */
function yOf(lat: number): number {
  const clamped = Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, lat));
  const sin = Math.sin((clamped * Math.PI) / 180);
  return 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI);
}

function latOf(y: number): number {
  const clamped = Math.max(0, Math.min(1, y));
  return (Math.atan(Math.sinh(Math.PI * (1 - 2 * clamped))) * 180) / Math.PI;
}

// A zero-size box asks for an infinite zoom; padding wider than the map, for a negative one.
function clampedZoom(zoom: number): number {
  if (Number.isNaN(zoom)) return 0;
  return Math.max(0, Math.min(MAX_ZOOM, zoom));
}
