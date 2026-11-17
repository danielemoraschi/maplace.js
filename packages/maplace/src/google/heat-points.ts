import type { PresentationState } from "../adapter";
import { relativeHeat } from "../adapter-kit/heat-look";
import type { Drawable } from "../drawable";
import type { LatLng, MarkerGeometry } from "../geometry";
import type { HeatPixel } from "./heat-canvas";

/** A heat marker as the canvas draws it: where it is, and its weight against the heaviest. */
export interface HeatPoint {
  readonly at: LatLng;
  readonly weight: number;
}

/** The heat markers shown now (not hidden), each weighed against `heaviest`. */
export function heatPointsOf(
  placed: Iterable<{ drawable(): Drawable }>,
  { hiddenIds }: PresentationState,
  heaviest: number,
): HeatPoint[] {
  const points: HeatPoint[] = [];
  for (const location of placed) {
    const { id, heatWeight, geometry } = location.drawable();
    if (heatWeight === undefined || hiddenIds.has(id)) continue;
    const { lat, lng } = geometry as MarkerGeometry;
    points.push({ at: { lat, lng }, weight: relativeHeat(heatWeight, heaviest) });
  }
  return points;
}

/** Whether two lists of points draw the same heat: each where it was, weighing what it did. */
export function samePoints(before: readonly HeatPoint[], after: readonly HeatPoint[]): boolean {
  return (
    before.length === after.length &&
    before.every(({ at, weight }, index) => {
      const other = after[index];
      return other?.weight === weight && other.at.lat === at.lat && other.at.lng === at.lng;
    })
  );
}

/** The canvas the heat is drawn on, in the overlay pane's pixels: where it is, and how wide. */
export interface HeatFrame {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  /** The width of one copy of the world at the zoom shown. */
  readonly worldWidth: number;
}

/**
 * A point projected into the pane, as the canvas draws it, added to `into`: once per copy of the
 * world the canvas shows any of, so a point across the antimeridian is never left out; none above
 * or below it.
 */
export function pixelCopies(
  { x, y }: { readonly x: number; readonly y: number },
  weight: number,
  { left, top, width, height, radius, worldWidth }: HeatFrame,
  into: HeatPixel[],
): void {
  const atY = y - top;
  if (atY < -radius || atY > height + radius) return;
  const atX = x - left;
  // The last copy whose disc ends left of the canvas: the copies after it are drawn, in turn.
  const offLeft = atX - worldWidth * Math.ceil((atX + radius) / worldWidth);
  for (let at = offLeft + worldWidth; at < width + radius; at += worldWidth) {
    into.push({ x: at, y: atY, weight });
  }
}
