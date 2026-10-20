import type { Geometry, LatLng } from "../geometry";
import { arcSpan, narrowestArc, wrapLongitude } from "../longitude-arc";

type Path = readonly LatLng[];

export const RADIANS_PER_DEGREE = Math.PI / 180;

/**
 * The point a location's popup points at, on every map alike: a marker's point, a circle's
 * centre, the centre of a polygon's bounds (crossing ±180 as fit-all does), and the point
 * halfway along a polyline, which is always on the line.
 */
export function anchorOf(geometry: Geometry): LatLng {
  switch (geometry.type) {
    case "marker":
      return { lat: geometry.lat, lng: geometry.lng };
    case "circle":
      return geometry.center;
    case "polygon":
      return centreOfBounds(geometry.path);
    case "polyline":
      return halfwayAlong(geometry.path);
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
