/// <reference types="google.maps" />
import { expect } from "vitest";
import { DOUBLE_CLICK_WAIT_MS } from "../../adapter-kit/click-gesture";
import { frames } from "../frames";
import type { GoogleMapState } from "../map-state";

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

/** The marker Google drew for `id`, once it is on the page and has a size. */
export async function drawnMarker(state: GoogleMapState, id: string): Promise<HTMLElement> {
  const marker = () => {
    const placed = state.placed.get(id);
    return placed && "marker" in placed ? placed.marker : undefined;
  };
  await expect.poll(() => (marker()?.getBoundingClientRect().width ?? 0) > 0).toBe(true);
  return marker() as HTMLElement;
}

/**
 * Resolves once `map`'s camera stays where it is for `QUIET_MS`: after a panel Google drew late,
 * the fit that keeps clear of it (N32) has landed.
 */
export async function cameraAtRest(map: google.maps.Map, timeoutMs = 15_000): Promise<void> {
  const where = () => JSON.stringify([map.getCenter()?.toJSON(), map.getZoom()]);
  const deadline = performance.now() + timeoutMs;
  for (let before = where(); performance.now() < deadline; ) {
    await wait(QUIET_MS);
    const now = where();
    if (now === before) return;
    before = now;
  }
  throw new Error(`the camera never came to rest within ${timeoutMs} ms, last at ${where()}`);
}
