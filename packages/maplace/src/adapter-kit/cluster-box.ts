import type { LatLng } from "../geometry";

/** A box on the map, its longitudes unwrapped: west < east, perhaps past ±180. */
export interface ViewBox {
  readonly south: number;
  readonly west: number;
  readonly north: number;
  readonly east: number;
}

/**
 * How much of the view's size is added on each side: the clusters just off the view are on the
 * page already when a pan starts, and a short pan brings none in late.
 */
const VIEW_PADDING = 0.5;

const FULL_TURN = 360;

export const WORLD_BOX: ViewBox = { south: -90, west: -180, north: 90, east: 180 };

/**
 * The box every provider keeps its clusters for: `view` and half of it on each side, in unwrapped
 * longitudes; the world when that spans it.
 */
export function clusterBoxAround(view: ViewBox): ViewBox {
  const [south, north] = padded(view.south, view.north);
  const [west, east] = padded(view.west, view.east);
  if (east - west >= FULL_TURN) return WORLD_BOX;
  return { south: Math.max(south, -90), west, north: Math.min(north, 90), east };
}

function padded(low: number, high: number): readonly [number, number] {
  const padding = (high - low) * VIEW_PADDING;
  return [low - padding, high + padding];
}

/** Whether `at`, or a world copy of it, is in `box`. */
export function isInBox({ lat, lng }: LatLng, box: ViewBox): boolean {
  if (lat < box.south || lat > box.north) return false;
  return firstCopyEastOf(box.west, lng) <= box.east;
}

/** Whether all of `view`, or a world copy of it, is in `box`. */
export function holdsView(box: ViewBox, view: ViewBox): boolean {
  if (box.east - box.west >= FULL_TURN) return true;
  if (view.south < box.south || view.north > box.north) return false;
  return firstCopyEastOf(box.west, view.west) + (view.east - view.west) <= box.east;
}

/** The copy of longitude `lng` at or east of `west`, less than a turn on. */
function firstCopyEastOf(west: number, lng: number): number {
  return west + ((((lng - west) % FULL_TURN) + FULL_TURN) % FULL_TURN);
}
