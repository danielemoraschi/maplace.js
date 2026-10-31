/// <reference types="google.maps" preserve="true" />
import { hasSize, sizeOf } from "../adapter-kit/map-size";
import type { MapSize } from "../adapter-kit/web-mercator";
import { frames } from "./frames";
import { watchSize } from "./size-watch";

/** How long Google's root keeps its nudged width: Google's observer needs two frames to hear it. */
const NUDGE_FRAMES = 2;

/**
 * Calls `onResized` after each change of the map's size, once Google has taken it in, until the
 * returned function stops it. Measured on Maps JS 3.66: Google hears of a size after our
 * observer, so the call waits a frame; and a map hidden and then shown again usually keeps the
 * hidden size for good (bounds with no area, nothing drawn or reported), whatever the camera
 * does, until its root's size changes: so showing it nudges that root, Google's own element,
 * never the page's, and calls back once Google has measured it.
 */
export function watchMapResizes(map: google.maps.Map, onResized: () => void): () => void {
  const element = map.getDiv();
  let hidden = !hasSize(sizeOf(element));
  let stopped = false;
  /** The nudge in progress: a map shown again during it shares it, so the root is restored once. */
  let nudging: Promise<void> | undefined;
  /** The wait before the next call: resizes during it (a panel sliding open) share one call. */
  let due: Promise<void> | undefined;
  /** What to wait for before Google has taken in `size`: a frame, or the nudge of a map shown again. */
  function googleTakesIn(size: MapSize): Promise<void> {
    const shownAgain = hidden && hasSize(size);
    hidden = !hasSize(size);
    if (shownAgain) {
      nudging ??= remeasure(element).finally(() => {
        nudging = undefined;
      });
    }
    return nudging ?? frames(1);
  }

  const stopWatching = watchSize(element, (size) => {
    const settled = googleTakesIn(size);
    if (due !== undefined && settled !== nudging) return;
    due = settled;
    void settled.then(() => {
      if (due === settled) due = undefined;
      if (!stopped) onResized();
    });
  });
  return () => {
    stopped = true;
    stopWatching();
  };
}

/** Makes Google measure the map again: its root's width changes for a moment, then is restored. */
async function remeasure(element: HTMLElement): Promise<void> {
  // Past what the store's `attach` puts first in a container, on a page's own map too.
  const root = element.querySelector(":scope > :not(a,[aria-live])");
  if (!(root instanceof HTMLElement)) return frames(1);
  const width = root.style.width;
  root.style.width = "99.9%";
  await frames(NUDGE_FRAMES);
  root.style.width = width;
  await frames(1);
}
