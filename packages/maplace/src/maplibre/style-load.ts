import type { Map as MapLibreMap } from "maplibre-gl";

/**
 * Resolves once the map's style document has loaded, at once if it has. Not `isStyleLoaded()`,
 * which is false while any tile loads: a page's map panning would keep a mount waiting.
 */
export function styleLoaded(map: MapLibreMap): Promise<void> {
  if (map.getStyle() !== undefined) return Promise.resolve();
  return new Promise((resolve) => map.once("style.load", () => resolve()));
}
