/// <reference types="google.maps" />
import { frames } from "../frames";
import { DOUBLE_CLICK_WAIT_MS } from "../map-clicks";

/**
 * Google's next `idle` on `map`. Listen before what moves the map: one already idle, or a move
 * to where it is, gives no further `idle`, and this never resolves.
 */
export function idle(map: google.maps.Map): Promise<void> {
  return new Promise((resolve) => google.maps.event.addListenerOnce(map, "idle", () => resolve()));
}

/**
 * Long enough for a map to react to input it shouldn't have (a pan, a zoom, an autopan), so a
 * check that it didn't means something.
 */
export const QUIET_MS = 700;

/** Resolves after `ms` milliseconds. */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Resolves once a click on the map just made has been reported, or dropped as half a
 * double-click. Google dispatches a click after the input that made it, so the hold, which starts
 * there, is waited for from a couple of frames on, and a couple more after it: a check that no
 * click came means nothing if it runs before the hold ends.
 */
export async function clickHoldPassed(): Promise<void> {
  await frames(2);
  await wait(DOUBLE_CLICK_WAIT_MS);
  await frames(2);
}
