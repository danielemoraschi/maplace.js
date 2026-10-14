import type { CircleGeometry } from "../geometry";
import type { Location } from "../location";
import { narrowestArc, wrapLongitude } from "../longitude-arc";
import type { Bounds } from "../viewport";

const EARTH_RADIUS_METRES = 6_371_008.8;
const DEGREES_PER_RADIAN = 180 / Math.PI;

/** What the locations reach so far; a circle over a pole reaches every longitude. */
interface Extent {
  south: number;
  north: number;
  readonly longitudes: number[];
  everyLongitude: boolean;
}

/**
 * The smallest box around these locations, crossing ±180 when that is narrower (then `west`
 * is greater than `east`); undefined when there are none. One pass, no per-point objects: it
 * runs on every fit-all, with thousands of locations.
 */
export function boundsAround(locations: readonly Location[]): Bounds | undefined {
  const extent: Extent = { south: 90, north: -90, longitudes: [], everyLongitude: false };
  for (const location of locations) include(extent, location);
  if (extent.longitudes.length === 0) return undefined;
  const { west, east } = extent.everyLongitude
    ? { west: -180, east: 180 }
    : narrowestArc(extent.longitudes);
  return Object.freeze({ south: extent.south, west, north: extent.north, east });
}

function include(extent: Extent, location: Location): void {
  switch (location.type) {
    case undefined:
    case "marker":
      includePoint(extent, location.lat, location.lng);
      break;
    case "circle":
      includeCircle(extent, location);
      break;
    default:
      for (const point of location.path) includePoint(extent, point.lat, point.lng);
  }
}

function includePoint(extent: Extent, lat: number, lng: number): void {
  extent.south = Math.min(extent.south, lat);
  extent.north = Math.max(extent.north, lat);
  extent.longitudes.push(lng);
}

/** On a sphere: degrees of latitude are even, degrees of longitude shrink towards the poles. */
function includeCircle(extent: Extent, { center, radius }: CircleGeometry): void {
  const latitudeSpan = (radius / EARTH_RADIUS_METRES) * DEGREES_PER_RADIAN;
  const south = center.lat - latitudeSpan;
  const north = center.lat + latitudeSpan;
  const longitudeSpan = latitudeSpan / Math.cos(center.lat / DEGREES_PER_RADIAN);
  includePoint(extent, Math.max(south, -90), wrapLongitude(center.lng - longitudeSpan));
  includePoint(extent, Math.min(north, 90), wrapLongitude(center.lng + longitudeSpan));
  if (south <= -90 || north >= 90 || longitudeSpan >= 180) extent.everyLongitude = true;
}
