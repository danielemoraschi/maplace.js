import { arcSpan } from "../../longitude-arc";
import type { Bounds } from "../../viewport";

/**
 * The suite's own expectations about boxes on the map, written apart from any adapter's code, so
 * a check can't pass by sharing an adapter's bug.
 */

/** The world's width in pixels at zoom 0: the contract's zoom scale. */
const WORLD_WIDTH_AT_ZOOM_0 = 256;
/** The closest a fit zooms in, from the RFC: stated here, apart from any adapter's own constant. */
export const FIT_MAX_ZOOM = 15;
/** Degrees two expected values may differ by: rounding, not a different answer. */
const TOLERANCE = 1e-6;

/** The degrees of longitude a map `width` pixels wide shows at `zoom`. */
export function lngSpanAt(zoom: number, width: number): number {
  return (360 * width) / (WORLD_WIDTH_AT_ZOOM_0 * 2 ** zoom);
}

/** A box's width in degrees; a box with west > east crosses ±180°. */
export function lngSpanOf(box: Bounds): number {
  return arcSpan(box);
}

/** Whether `outer` holds all of `inner`, either of them possibly crossing ±180°. */
export function boxContains(outer: Bounds, inner: Bounds): boolean {
  const holdsLatitudes =
    outer.south <= inner.south + TOLERANCE && outer.north >= inner.north - TOLERANCE;
  return holdsLatitudes && holdsLongitudes(outer, inner);
}

function holdsLongitudes(outer: Bounds, inner: Bounds): boolean {
  const outerSpan = lngSpanOf(outer);
  if (outerSpan >= 360 - TOLERANCE) return true;
  return eastwardFrom(outer.west, inner.west) + lngSpanOf(inner) <= outerSpan + TOLERANCE;
}

/** Degrees from `from` east to `to`, 0 to 360. */
function eastwardFrom(from: number, to: number): number {
  const degrees = (((to - from) % 360) + 360) % 360;
  return degrees > 360 - TOLERANCE ? 0 : degrees;
}
