import { RADIANS_PER_DEGREE } from "../adapter-kit/anchor";
import { EARTH_RADIUS } from "../adapter-kit/shape-area";
import type { CircleGeometry, LatLng } from "../geometry";
import { wrappedLongitude } from "./conversions";

/**
 * The sides of the polygon a circle is drawn as. An edge sags r·(1 − cos(π/128)) inside the
 * circle, 0.03% of its radius: a few metres on a ring of kilometres, unseen at any zoom showing it.
 */
export const CIRCLE_SEGMENTS = 128;

type Ring = GeoJSON.Position[];

/**
 * The ring a circle is drawn as on the sphere, closed as GeoJSON's are: its longitudes run on
 * from its centre's, past ±180 where it crosses, so MapLibre draws it in one piece.
 */
export function circleRing(circle: CircleGeometry): Ring {
  const { center, radius } = circle;
  const ring = Array.from({ length: CIRCLE_SEGMENTS }, (_, index) =>
    offsetPosition(center, radius, (index * 360) / CIRCLE_SEGMENTS),
  );
  const pole = poleWithin(circle);
  const drawn = pole === undefined ? ring : overPole(ring, circle, pole);
  return [...drawn, ...drawn.slice(0, 1)];
}

type Pole = 90 | -90;

/**
 * The latitude of the pole within `circle`; none when it is round neither, or round both (wider
 * than a hemisphere).
 */
function poleWithin({ center, radius }: CircleGeometry): Pole | undefined {
  const arc = radius / EARTH_RADIUS;
  const lat = center.lat * RADIANS_PER_DEGREE;
  const roundNorth = arc > Math.PI / 2 - lat;
  const roundSouth = arc > Math.PI / 2 + lat;
  if (roundNorth === roundSouth) return undefined;
  return roundNorth ? 90 : -90;
}

/**
 * A ring round a pole goes once round the world, its longitudes jumping 360° where it passes the
 * pole, 180° from its centre's: there it runs on to that meridian, over the pole (the map's edge,
 * where MapLibre clamps it) and back from the meridian's other side, so the circle is filled up to
 * the edge it covers.
 */
function overPole(ring: Ring, { center, radius }: CircleGeometry, pole: Pole): Ring {
  const [, past = pole] = offsetPosition(center, radius, pole > 0 ? 0 : 180);
  const jump = ring.findIndex(
    ([lng = 0], index) => Math.abs(lng - (ring[index - 1]?.[0] ?? lng)) > 180,
  );
  const at = jump === -1 ? ring.length : jump;
  const meridianBeside = ([lng = 0]: GeoJSON.Position = []) =>
    center.lng + 180 * Math.sign(lng - center.lng);
  const from = meridianBeside(ring[at - 1]);
  const to = meridianBeside(ring[at % ring.length]);
  const over = [
    [from, past],
    [from, pole],
    [to, pole],
    [to, past],
  ];
  return [...ring.slice(0, at), ...over, ...ring.slice(at)];
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

/**
 * The destination on the sphere, as `[lng, lat]`, its longitude within 180° of `from`'s. The
 * longitude's step has cos(lat) divided out of both its terms, so it holds at a pole, where they
 * would both be nought and the ring round it collapse.
 */
function offsetPosition(from: LatLng, metres: number, bearing: number): GeoJSON.Position {
  const angle = metres / EARTH_RADIUS;
  const heading = bearing * RADIANS_PER_DEGREE;
  const lat1 = from.lat * RADIANS_PER_DEGREE;
  const sinLat2 =
    Math.sin(lat1) * Math.cos(angle) + Math.cos(lat1) * Math.sin(angle) * Math.cos(heading);
  const lat2 = Math.asin(sinLat2);
  const lngStep = Math.atan2(
    Math.sin(heading) * Math.sin(angle),
    Math.cos(lat1) * Math.cos(angle) - Math.sin(lat1) * Math.sin(angle) * Math.cos(heading),
  );
  return [from.lng + lngStep / RADIANS_PER_DEGREE, lat2 / RADIANS_PER_DEGREE];
}
