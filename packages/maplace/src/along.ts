import type { LatLng } from "./geometry";
import { wrapLongitude } from "./longitude-arc";
import { latOf, MAX_LATITUDE, yOf } from "./mercator";
import { RADIANS_PER_DEGREE } from "./sphere";

type Path = readonly LatLng[];

/** A stretch of a path between two points. */
interface Segment {
  readonly from: LatLng;
  /** The change from its start to its end, longitude the short way. */
  readonly step: LatLng;
  readonly length: number;
}

/** A path's stretches, and their length together. */
interface Measured {
  readonly segments: readonly Segment[];
  readonly length: number;
}

/** A path split in two at a fraction: the part travelled, then the part ahead. */
interface Split {
  readonly travelled: Path;
  readonly ahead: Path;
}

/**
 * Each path's last split, kept: a line redrawn at the same progress (hovered, selected) keeps its
 * parts' paths, so nothing is sent again for them.
 */
const lastSplitOf = new WeakMap<Path, { readonly fraction: number; readonly split: Split }>();

/** Each path measured once: a slider moving a point along a line asks again and again. */
const measuredPaths = new WeakMap<Path, Measured>();

/** Where `fraction` falls on a path: in its segment `index`, `point`. */
interface Place {
  readonly index: number;
  readonly point: LatLng;
}

/**
 * The point `fraction` (0 to 1) of the way along `path`, by its length as `measure` takes it: the
 * point a popup anchors halfway along a line, and a page's marker moving along one.
 */
export function pointAtFraction(path: Path, fraction: number): LatLng {
  return placeAt(path, fraction).point;
}

/**
 * `path` split `fraction` of the way along: the part travelled, then the part ahead, each running
 * through the point between them, so together they draw the whole path.
 */
export function splitAtFraction(path: Path, fraction: number): Split {
  const last = lastSplitOf.get(path);
  if (last?.fraction === fraction) return last.split;
  const { index, point } = placeAt(path, fraction);
  const split = {
    travelled: [...path.slice(0, index + 1), point],
    ahead: [point, ...path.slice(index + 1)],
  };
  lastSplitOf.set(path, { fraction, split });
  return split;
}

function placeAt(path: Path, fraction: number): Place {
  const { segments, length } = measure(path);
  let remaining = length * fraction;
  for (const [index, segment] of segments.entries()) {
    if (remaining <= segment.length && segment.length > 0) {
      return { index, point: pointOn(segment, remaining / segment.length) };
    }
    remaining -= segment.length;
  }
  const last = Math.max(path.length - 1, 0);
  return { index: Math.max(last - 1, 0), point: path[last] ?? { lat: 0, lng: 0 } };
}

/**
 * Lengths in degrees, longitude scaled by the cosine of the latitude and taken the short way
 * across ±180: close enough for a point on a line as drawn, with no map projection needed.
 */
function measure(path: Path): Measured {
  const known = measuredPaths.get(path);
  if (known !== undefined) return known;
  const segments = path.slice(1).map((to, index) => segmentOf(path[index] as LatLng, to));
  const measured = { segments, length: segments.reduce((total, { length }) => total + length, 0) };
  measuredPaths.set(path, measured);
  return measured;
}

function segmentOf(from: LatLng, to: LatLng): Segment {
  const step = { lat: to.lat - from.lat, lng: wrapLongitude(to.lng - from.lng) };
  const scale = Math.cos(((from.lat + to.lat) / 2) * RADIANS_PER_DEGREE);
  return { from, step, length: Math.hypot(step.lat, step.lng * scale) };
}

/**
 * The point `fraction` of the way through a segment as the providers draw it: straight in Web
 * Mercator, so its latitude is placed through Mercator's y, and the point is on the line drawn;
 * past the plane's reach, near a pole, straight in degrees.
 */
function pointOn({ from, step }: Segment, fraction: number): LatLng {
  const to = from.lat + step.lat;
  return {
    lat: onMercator(from.lat, to)
      ? latitudeBetween(from.lat, to, fraction)
      : from.lat + step.lat * fraction,
    lng: wrapLongitude(from.lng + step.lng * fraction),
  };
}

/** Whether a segment between these latitudes is on Mercator's plane, which stops short of the poles. */
function onMercator(from: number, to: number): boolean {
  return Math.abs(from) <= MAX_LATITUDE && Math.abs(to) <= MAX_LATITUDE;
}

/** The latitude `fraction` of the way from `from` to `to`, straight in Web Mercator. */
function latitudeBetween(from: number, to: number, fraction: number): number {
  const fromY = yOf(from);
  return latOf(fromY + (yOf(to) - fromY) * fraction);
}
