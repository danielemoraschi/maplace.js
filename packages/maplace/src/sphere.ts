import type { LatLng } from "./geometry";

/** The earth's mean radius, in metres. */
export const EARTH_RADIUS = 6_371_008.8;

export const RADIANS_PER_DEGREE = Math.PI / 180;

/** The distance between two points on the sphere (haversine), the short way across ±180. */
export function metresBetween(a: LatLng, b: LatLng): number {
  const lat1 = a.lat * RADIANS_PER_DEGREE;
  const lat2 = b.lat * RADIANS_PER_DEGREE;
  const halfLat = (lat2 - lat1) / 2;
  const halfLng = ((b.lng - a.lng) * RADIANS_PER_DEGREE) / 2;
  const h = Math.sin(halfLat) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(halfLng) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(Math.min(1, h)));
}
