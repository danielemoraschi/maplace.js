import { RADIANS_PER_DEGREE } from "../adapter-kit/anchor";
import { EARTH_RADIUS } from "../adapter-kit/shape-area";
import type { CircleGeometry, LatLng } from "../geometry";
import { wrappedLongitude } from "./conversions";

/**
 * The sides of the polygon a circle is drawn as. An edge sags r·(1 − cos(π/128)) inside the
 * circle, 0.03% of its radius: a few metres on a ring of kilometres, unseen at any zoom showing it.
 */
export const CIRCLE_SEGMENTS = 128;

/**
 * The ring a circle is drawn as on the sphere, closed as GeoJSON's are: its longitudes run on
 * from its centre's, past ±180 where it crosses, so MapLibre draws it in one piece.
 */
export function circleRing({ center, radius }: CircleGeometry): GeoJSON.Position[] {
  const ring = Array.from({ length: CIRCLE_SEGMENTS }, (_, index) =>
    offsetPosition(center, radius, (index * 360) / CIRCLE_SEGMENTS),
  );
  return [...ring, ...ring.slice(0, 1)];
}

/** The point `metres` from `from` heading `bearing` degrees clockwise from north. */
export function pointAtBearing(from: LatLng, metres: number, bearing: number): LatLng {
  const [lng = Number.NaN, lat = Number.NaN] = offsetPosition(from, metres, bearing);
  return { lat, lng: wrappedLongitude(lng) };
}

/** The distance between two points on the sphere (haversine), the short way across ±180. */
export function metresBetween(a: LatLng, b: LatLng): number {
  const lat1 = a.lat * RADIANS_PER_DEGREE;
  const lat2 = b.lat * RADIANS_PER_DEGREE;
  const halfLat = (lat2 - lat1) / 2;
  const halfLng = ((b.lng - a.lng) * RADIANS_PER_DEGREE) / 2;
  const h = Math.sin(halfLat) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(halfLng) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(Math.min(1, h)));
}

/** The destination on the sphere, as `[lng, lat]`, its longitude within 180° of `from`'s. */
function offsetPosition(from: LatLng, metres: number, bearing: number): GeoJSON.Position {
  const angle = metres / EARTH_RADIUS;
  const heading = bearing * RADIANS_PER_DEGREE;
  const lat1 = from.lat * RADIANS_PER_DEGREE;
  const sinLat2 =
    Math.sin(lat1) * Math.cos(angle) + Math.cos(lat1) * Math.sin(angle) * Math.cos(heading);
  const lat2 = Math.asin(sinLat2);
  const lngStep = Math.atan2(
    Math.sin(heading) * Math.sin(angle) * Math.cos(lat1),
    Math.cos(angle) - Math.sin(lat1) * sinLat2,
  );
  return [from.lng + lngStep / RADIANS_PER_DEGREE, lat2 / RADIANS_PER_DEGREE];
}
