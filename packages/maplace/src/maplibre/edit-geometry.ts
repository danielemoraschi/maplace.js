import type { CircleGeometry, Geometry, LatLng } from "../geometry";
import { metresBetween, pointAtBearing } from "./circle-sphere";
import { nearestLongitude } from "./location-features";

/**
 * What one edit handle moves. `ring` 0 is a polyline's path or a polygon's outline, `ring` k its
 * hole k − 1; a midpoint's `index` is its segment's first point, a polygon's last segment closing
 * its ring.
 */
export type HandleRole =
  | { readonly kind: "vertex"; readonly ring: number; readonly index: number }
  | { readonly kind: "midpoint"; readonly ring: number; readonly index: number }
  | { readonly kind: "center" }
  | { readonly kind: "radius"; readonly bearing: number };

/** Where one handle sits, and what it moves. */
export interface HandlePlace {
  readonly role: HandleRole;
  readonly at: LatLng;
}

/** The bearings of a circle's radius handles: north, east, south and west, as Google's. */
const RADIUS_BEARINGS = [0, 90, 180, 270];

/** A radius read from a handle is kept to the millimetre: the sphere's float error never shows. */
const MILLIMETRES_PER_METRE = 1000;

type Ring = readonly LatLng[];

/**
 * The handles a user drags to edit `geometry`, as Google draws them: a circle's centre and four
 * radius handles; a handle on each point of a path or ring, then one halfway along each segment.
 * None for a marker, which is dragged itself.
 */
export function handlePlacesOf(geometry: Geometry): HandlePlace[] {
  if (geometry.type === "marker") return [];
  if (geometry.type === "circle") return circleHandles(geometry);
  const closed = geometry.type === "polygon";
  const rings = ringsOf(geometry);
  const vertices = rings.flatMap((ring, r) =>
    ring.map((at, index): HandlePlace => ({ role: { kind: "vertex", ring: r, index }, at })),
  );
  const midpoints = rings.flatMap((ring, r) =>
    segmentsOf(ring, closed).map(
      ([from, to], index): HandlePlace => ({
        role: { kind: "midpoint", ring: r, index },
        at: midpointOf(from, to),
      }),
    ),
  );
  return [...vertices, ...midpoints];
}

/** Whether two roles name the same handle. */
export function sameRole(a: HandleRole, b: HandleRole): boolean {
  switch (a.kind) {
    case "center":
      return b.kind === "center";
    case "radius":
      return b.kind === "radius" && a.bearing === b.bearing;
    default:
      return b.kind === a.kind && a.ring === b.ring && a.index === b.index;
  }
}

/** `geometry` after the handle `role` is dragged to `to`; `geometry` itself is never changed. */
export function editedBy(geometry: Geometry, role: HandleRole, to: LatLng): Geometry {
  switch (role.kind) {
    case "center":
      return { ...circleOf(geometry, role), center: to };
    case "radius": {
      const circle = circleOf(geometry, role);
      return { ...circle, radius: radiusTo(circle.center, to) };
    }
    case "vertex":
      return withRing(geometry, role, (ring) => replaced(ring, role.index, to));
    case "midpoint":
      return withRing(geometry, role, (ring) => inserted(ring, role.index + 1, to));
  }
}

function circleHandles({ center, radius }: CircleGeometry): HandlePlace[] {
  return [
    { role: { kind: "center" }, at: center },
    ...RADIUS_BEARINGS.map(
      (bearing): HandlePlace => ({
        role: { kind: "radius", bearing },
        at: pointAtBearing(center, radius, bearing),
      }),
    ),
  ];
}

function radiusTo(center: LatLng, point: LatLng): number {
  return Math.round(metresBetween(center, point) * MILLIMETRES_PER_METRE) / MILLIMETRES_PER_METRE;
}

/** Halfway in latitude, and halfway the short way in longitude, across ±180 too. */
function midpointOf(from: LatLng, to: LatLng): LatLng {
  const lng = (from.lng + nearestLongitude(to.lng, from.lng)) / 2;
  return { lat: (from.lat + to.lat) / 2, lng: nearestLongitude(lng, 0) };
}

/** Each segment of `ring` as its two ends; a closed ring's last runs back to its first point. */
function segmentsOf(ring: Ring, closed: boolean): [LatLng, LatLng][] {
  const count = closed ? ring.length : ring.length - 1;
  return ring.slice(0, count).map((from, index) => [from, ring[(index + 1) % ring.length] ?? from]);
}

/** A path's or polygon's rings, its outline first; none for a marker or circle. */
export function ringsOf(geometry: Geometry): Ring[] {
  if (geometry.type === "polyline") return [geometry.path];
  if (geometry.type === "polygon") return [geometry.path, ...(geometry.holes ?? [])];
  return [];
}

function circleOf(geometry: Geometry, role: HandleRole): CircleGeometry {
  if (geometry.type !== "circle") throw unfitHandle(geometry, role);
  return geometry;
}

/** `geometry` with its ring `role.ring` changed by `change`. */
function withRing(
  geometry: Geometry,
  role: Extract<HandleRole, { ring: number }>,
  change: (ring: Ring) => LatLng[],
): Geometry {
  const rings = ringsOf(geometry);
  if (geometry.type === "marker" || geometry.type === "circle" || rings[role.ring] === undefined) {
    throw unfitHandle(geometry, role);
  }
  const [path = [], ...holes] = rings.map((ring, index) =>
    index === role.ring ? change(ring) : ring,
  );
  if (geometry.type === "polyline" || geometry.holes === undefined) return { ...geometry, path };
  return { ...geometry, path, holes };
}

function replaced(ring: Ring, index: number, point: LatLng): LatLng[] {
  return ring.map((each, at) => (at === index ? point : each));
}

function inserted(ring: Ring, index: number, point: LatLng): LatLng[] {
  return [...ring.slice(0, index), point, ...ring.slice(index)];
}

function unfitHandle(geometry: Geometry, role: HandleRole): Error {
  return new Error(`a ${role.kind} handle doesn't move a ${geometry.type}`);
}
