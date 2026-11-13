import type { LatLng } from "./geometry";
import { RADIANS_PER_DEGREE } from "./sphere";

/** A segment as drawn: how many points it takes, and where it is at `t`, 0 to 1. */
export interface SegmentPath {
  readonly steps: number;
  readonly at: (t: number) => LatLng;
}

/** Under this sine of their angle, two points are the same or opposite: no circle of their own. */
const NO_SINGLE_CIRCLE = 1e-9;

/**
 * The great circle from `from` to `to`, the shortest way on the earth, a step a degree of arc, so
 * a short segment costs a point or two; undefined where no single circle joins them, the same or
 * opposite points.
 */
export function greatCircleSegment(from: LatLng, to: LatLng): SegmentPath | undefined {
  const [ax, ay, az] = unitVector(from);
  const [bx, by, bz] = unitVector(to);
  const sine = Math.hypot(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx);
  if (sine < NO_SINGLE_CIRCLE) return undefined;
  const angle = Math.atan2(sine, ax * bx + ay * by + az * bz);
  const at = (t: number): LatLng => {
    const fromShare = Math.sin((1 - t) * angle) / sine;
    const toShare = Math.sin(t * angle) / sine;
    const x = fromShare * ax + toShare * bx;
    const y = fromShare * ay + toShare * by;
    const z = fromShare * az + toShare * bz;
    // atan2 rather than asin: rounding can put z a hair past 1. At a pole, any longitude is it.
    return {
      lat: Math.atan2(z, Math.hypot(x, y)) / RADIANS_PER_DEGREE,
      lng: Math.atan2(y, x) / RADIANS_PER_DEGREE,
    };
  };
  return { steps: Math.ceil(angle / RADIANS_PER_DEGREE), at };
}

function unitVector({ lat, lng }: LatLng): [number, number, number] {
  const phi = lat * RADIANS_PER_DEGREE;
  const lambda = lng * RADIANS_PER_DEGREE;
  return [Math.cos(phi) * Math.cos(lambda), Math.cos(phi) * Math.sin(lambda), Math.sin(phi)];
}
