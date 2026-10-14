/// <reference types="google.maps" />
import { frames } from "../frames";

/** Longer than Google has taken to draw a control (about 0.3 s on Maps JS 3.66). */
const MOST_FRAMES = 120;
/** Frames a control's box holds still before it counts as laid out. */
const STILL_FRAMES = 5;

/**
 * Resolves once every control in `map`'s corners is in the page. Google draws a control pushed
 * there on a later frame, about 0.3 s later (Maps JS 3.66), and takes it out at once on removal.
 */
export async function controlsPlaced(map: google.maps.Map): Promise<void> {
  for (let frame = 0; frame < MOST_FRAMES && !allConnected(map); frame++) await frames(1);
}

function allConnected(map: google.maps.Map): boolean {
  return map.controls.every((corner) => corner.getArray().every((control) => control.isConnected));
}

/** Waits until Google has positioned a control it placed: its box holds still for a few frames. */
export async function laidOut(element: HTMLElement): Promise<void> {
  const box = () => JSON.stringify(element.getBoundingClientRect());
  let last = "";
  for (let frame = 0, still = 0; frame < MOST_FRAMES && still < STILL_FRAMES; frame++) {
    const now = box();
    still = now === last ? still + 1 : 0;
    last = now;
    await frames(1);
  }
}
