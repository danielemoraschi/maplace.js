import { drawnPath } from "./drawn-path";
import type { Geometry, LatLng } from "./geometry";
import type { Location } from "./location";
import { arcSpan, narrowestArc, wrapLongitude } from "./longitude-arc";
import { RADIANS_PER_DEGREE } from "./sphere";

type Path = readonly LatLng[];

/**
 * The point a location's popup points at, on every map alike: a marker's point, a circle's
 * centre, the centre of a polygon's bounds (crossing ±180 as fit-all does), and the point
 * halfway along a polyline as drawn, which is always on the line, a curved or geodesic one's too.
 */
export function anchorOf(where: Geometry | Location): LatLng {
  switch (where.type) {
    case undefined:
    case "marker":
      return { lat: where.lat, lng: where.lng };
    case "circle":
      return where.center;
    case "polygon":
      return centreOfBounds(where.path);
    case "polyline":
      return halfwayAlong(drawnPath(where));
  }
}

/** One pass over the points: a path can be long enough to overflow a spread. */
function centreOfBounds(path: Path): LatLng {
  let south = 90;
  let north = -90;
  const longitudes: number[] = [];
  for (const { lat, lng } of path) {
    south = Math.min(south, lat);
    north = Math.max(north, lat);
    longitudes.push(lng);
  }
  const arc = narrowestArc(longitudes);
  return { lat: (south + north) / 2, lng: wrapLongitude(arc.west + arcSpan(arc) / 2) };
}

/**
 * Lengths in degrees, longitude scaled by the cosine of the latitude and taken the short way
 * across ±180: close enough for where a popup points, with no map projection needed.
 */
function halfwayAlong(path: Path): LatLng {
  const segments = path.slice(1).map((to, index) => segment(path[index] as LatLng, to));
  let remaining = segments.reduce((total, { length }) => total + length, 0) / 2;
  for (const { from, step, length } of segments) {
    if (remaining <= length && length > 0) return pointAlong(from, step, remaining / length);
    remaining -= length;
  }
  return path[0] ?? { lat: 0, lng: 0 };
}

interface Segment {
  readonly from: LatLng;
  /** The change from its start to its end, longitude the short way. */
  readonly step: LatLng;
  readonly length: number;
}

function segment(from: LatLng, to: LatLng): Segment {
  const step = { lat: to.lat - from.lat, lng: wrapLongitude(to.lng - from.lng) };
  const scale = Math.cos(((from.lat + to.lat) / 2) * RADIANS_PER_DEGREE);
  return { from, step, length: Math.hypot(step.lat, step.lng * scale) };
}

function pointAlong(from: LatLng, step: LatLng, fraction: number): LatLng {
  return {
    lat: from.lat + step.lat * fraction,
    lng: wrapLongitude(from.lng + step.lng * fraction),
  };
}
