/// <reference types="google.maps" />
import { frames } from "../frames";
import { TILES_TIMEOUT_MS } from "./store-on-google";

/** Frames a control's box holds still, on the page, before it counts as settled. */
const STILL_FRAMES = 5;

/**
 * Resolves once every control in `map`'s corners is in the page; at once for a map with no box,
 * where Google draws no corner. Fails past `TILES_TIMEOUT_MS`.
 *
 * Google draws a control pushed to a corner late, its own controls with it: just after the map's
 * next `tilesloaded`, 0.3 to 2.2 s after the push under the test runner (Maps JS 3.66, measured
 * frame by frame). It takes a control out at once on removal, so only adding is waited for.
 */
export async function controlsPlaced(map: google.maps.Map): Promise<void> {
  if (!isOnPage(map.getDiv())) return;
  const deadline = performance.now() + TILES_TIMEOUT_MS;
  while (!allConnected(map)) {
    if (performance.now() > deadline) {
      throw new Error(`Google drew the map's controls not within ${TILES_TIMEOUT_MS} ms`);
    }
    await frames(1);
  }
}

function allConnected(map: google.maps.Map): boolean {
  return map.controls.every((corner) => corner.getArray().every((control) => control.isConnected));
}

/**
 * Waits until a control that shows is drawn and positioned on the map: on the page, its box the
 * same for a few frames, since Google moves a control once more after drawing it. A box off the page is empty and still too, so frames off the page count
 * for nothing; a hidden control never settles. Fails, saying what it saw, past `timeoutMs`.
 */
export async function settledOnMap(
  element: HTMLElement,
  timeoutMs = TILES_TIMEOUT_MS,
): Promise<void> {
  const deadline = performance.now() + timeoutMs;
  let last = "";
  let still = 0;
  while (still < STILL_FRAMES) {
    if (performance.now() > deadline) throw neverSettled(last, timeoutMs);
    const box = isOnPage(element) ? JSON.stringify(element.getBoundingClientRect()) : "";
    still = box !== "" && box === last ? still + 1 : 0;
    last = box;
    await frames(1);
  }
}

/** Whether `element` has a box on the page: not detached, not hidden. */
function isOnPage(element: HTMLElement): boolean {
  return element.getClientRects().length > 0;
}

function neverSettled(lastBox: string, timeoutMs: number): Error {
  const seen = lastBox === "" ? "not on the page" : `still moving, last at ${lastBox}`;
  return new Error(`the control never settled on the map within ${timeoutMs} ms: ${seen}`);
}
