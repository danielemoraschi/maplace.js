import { splitAtFraction } from "../along";
import { definedFields } from "../defined-fields";
import type { Drawable } from "../drawable";
import type { LatLng, PolylineGeometry } from "../geometry";
import type { LineStyle } from "../style";

/** How much of a line's opacity its travelled part keeps, when its travelled style sets none. */
const TRAVELLED_OPACITY = 0.4;

/** One part of a split line: where it runs, and its style. */
export interface LinePart {
  readonly path: readonly LatLng[];
  readonly style: LineStyle | undefined;
}

/** A line split at its progress: the part travelled and the part ahead, each drawn if it has a length. */
export interface LineParts {
  readonly travelled: LinePart | undefined;
  readonly ahead: LinePart | undefined;
}

/** How a split line is drawn: its look, how far it is travelled, and its travelled part's style. */
export interface SplitLook {
  readonly style: LineStyle | undefined;
  readonly progress: number;
  readonly travelledStyle: LineStyle | undefined;
}

/** A polyline drawable with a progress: a line split at its progress. */
type SplitLine = { readonly geometry: PolylineGeometry; readonly progress: number };

/** Whether a shape is a line split at its progress: a polyline with a `progress`. */
export function isSplitLine<T extends Pick<Drawable, "geometry" | "progress">>(
  drawable: T,
): drawable is T & SplitLine {
  return drawable.geometry.type === "polyline" && drawable.progress !== undefined;
}

/**
 * A polyline's parts at its progress, in its look `style` (`lineParts`); none for a line without
 * a progress, or any other shape.
 */
export function drawableParts(
  drawable: Pick<Drawable, "geometry" | "progress" | "travelledStyle">,
  style: LineStyle | undefined,
  restOpacity: number,
): LineParts | undefined {
  if (!isSplitLine(drawable)) return undefined;
  const { geometry, progress, travelledStyle } = drawable;
  return lineParts(geometry.path, { style, progress, travelledStyle }, restOpacity);
}

/**
 * `path` split at its progress (0 to 1): the part ahead in the line's look, and the part travelled
 * in that look at 40% of its opacity (of `restOpacity`, the provider's own, where the look sets
 * none) with the travelled style over it. A part with no length is left out.
 */
export function lineParts(
  path: readonly LatLng[],
  { style, progress, travelledStyle }: SplitLook,
  restOpacity: number,
): LineParts {
  const { travelled, ahead } = splitAtFraction(path, progress);
  const faded = (style?.strokeOpacity ?? restOpacity) * TRAVELLED_OPACITY;
  const travelledLook = { ...style, strokeOpacity: faded, ...definedFields(travelledStyle) };
  return {
    travelled: progress > 0 ? { path: travelled, style: travelledLook } : undefined,
    ahead: progress < 1 ? { path: ahead, style } : undefined,
  };
}
