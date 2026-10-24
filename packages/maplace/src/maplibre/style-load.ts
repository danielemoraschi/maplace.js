import type { Map as MapLibreMap } from "maplibre-gl";

/**
 * Runs `run` once the map's style document has loaded: now if it has, else on its next
 * `style.load`. Not `isStyleLoaded()`, which is false while any tile loads: a page's map panning
 * would keep a mount waiting.
 */
export function whenStyleLoaded(map: MapLibreMap, run: () => void): void {
  if (map.getStyle() === undefined) map.once("style.load", () => whenStyleLoaded(map, run));
  else run();
}

/** `whenStyleLoaded` as a promise, for the mount's race against failure and cancelling. */
export function styleLoaded(map: MapLibreMap): Promise<void> {
  return new Promise((resolve) => whenStyleLoaded(map, resolve));
}
