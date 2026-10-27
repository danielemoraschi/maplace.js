import type { LatLng } from "./geometry";
import { arcSpan } from "./longitude-arc";
import type { Bounds } from "./viewport";

/** A box on the map, its longitudes unwrapped: west < east, perhaps past ±180. */
export interface ViewBox {
  readonly south: number;
  readonly west: number;
  readonly north: number;
  readonly east: number;
}

export const FULL_TURN = 360;

/** `bounds` as a box, east past 180 when they cross the antimeridian. */
export function unwrapped(bounds: Bounds): ViewBox {
  return { ...bounds, east: bounds.west + arcSpan(bounds) };
}

/** Whether `bounds` cover any of the map: Google reports none for a map not yet laid out. */
export function hasArea(bounds: Bounds): boolean {
  return arcSpan(bounds) > 0 && bounds.north > bounds.south;
}

/** Whether `at`, or a world copy of it, is in `box`. */
export function isInBox({ lat, lng }: LatLng, box: ViewBox): boolean {
  if (lat < box.south || lat > box.north) return false;
  return firstCopyEastOf(box.west, lng) <= box.east;
}

/** The copy of longitude `lng` at or east of `west`, less than a turn on. */
export function firstCopyEastOf(west: number, lng: number): number {
  return west + ((((lng - west) % FULL_TURN) + FULL_TURN) % FULL_TURN);
}
