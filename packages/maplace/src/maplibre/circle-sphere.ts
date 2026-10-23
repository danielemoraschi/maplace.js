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
 * from its centre's, past ±180 where it crosses, so MapLibre draws it in one piece; over a pole
 * for one round a pole, over both for one round both.
 */
export function circleRing(circle: CircleGeometry): Ring {
  const { center, radius } = circle;
  const ring = Array.from({ length: CIRCLE_SEGMENTS }, (_, index) =>
    offsetPosition(center, radius, (index * 360) / CIRCLE_SEGMENTS),
  );
  // From the last jump back, so the indexes of the earlier ones hold.
  const drawn = jumpsOf(ring).reduceRight((on, at) => overPoleAt(on, at, circle), ring);
  return [...drawn, ...drawn.slice(0, 1)];
}

type Pole = 90 | -90;

const longitudeOf = ([lng = 0]: GeoJSON.Position = []) => lng;

/**
 * Where the ring's longitude jumps over 180°: each index `at` (the ring's length for the wrap back
 * to its first point) whose point is a world away from the one before. Longitudes stay within 180°
 * of the centre's, so the ring jumps only where it goes round a pole.
 */
function jumpsOf(ring: Ring): number[] {
  return ring
    .map((_, index) => index + 1)
    .filter(
      (at) => Math.abs(longitudeOf(ring[at % ring.length]) - longitudeOf(ring[at - 1])) > 180,
    );
}

/**
 * The pole the jump at `at` goes round: the south for one in the ring's middle half (bearings near
 * 180), else the north (near 0, at the ring's ends). `at` counts the segments' points alone.
 */
function poleOfJump(at: number): Pole {
  const middle = at > CIRCLE_SEGMENTS / 4 && at <= (3 * CIRCLE_SEGMENTS) / 4;
  return middle ? -90 : 90;
}

/**
 * A ring round a pole goes once round the world, its longitudes jumping 360° at `at`, where it
 * passes the pole, 180° from its centre's: there it runs on to that meridian, over the pole (the
 * map's edge, where MapLibre clamps it) and back from the meridian's other side, so the circle is
 * filled up to the edge it covers.
 */
function overPoleAt(ring: Ring, at: number, { center, radius }: CircleGeometry): Ring {
  const pole = poleOfJump(at);
  const [, past = pole] = offsetPosition(center, radius, pole > 0 ? 0 : 180);
  const meridianBeside = (position?: GeoJSON.Position) =>
    center.lng + 180 * Math.sign(longitudeOf(position) - center.lng);
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
