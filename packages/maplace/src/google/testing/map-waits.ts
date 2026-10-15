/// <reference types="google.maps" />

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
