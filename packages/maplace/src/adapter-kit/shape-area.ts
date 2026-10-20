import type { Geometry, LatLng } from "../geometry";
import { wrapLongitude } from "../longitude-arc";
import { RADIANS_PER_DEGREE } from "./anchor";

/** The earth's mean radius, in metres. */
const EARTH_RADIUS = 6_371_008.8;

/**
 * How much of the map `geometry` covers within its outline, in square metres: a polygon's holes
 * count, as a shape inside one lies within its outline; none for a line or a marker.
 */
export function areaOf(geometry: Geometry): number {
  if (geometry.type === "circle") return Math.PI * geometry.radius ** 2;
  return geometry.type === "polygon" ? ringArea(geometry.path) : 0;
}

/**
 * The area inside `ring` on a sphere (Chamberlain and Duquette's formula), either way round,
 * each edge the short way across ±180, as the map draws it.
 */
function ringArea(ring: readonly LatLng[]): number {
  let sum = 0;
  ring.forEach((point, index) => {
    const before = ring.at(index - 1) ?? point;
    const after = ring[(index + 1) % ring.length] ?? point;
    sum += wrapLongitude(after.lng - before.lng) * Math.sin(point.lat * RADIANS_PER_DEGREE);
  });
  return (Math.abs(sum) * RADIANS_PER_DEGREE * EARTH_RADIUS ** 2) / 2;
}
