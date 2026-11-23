import type { Map as MapLibreMap } from "maplibre-gl";
import { isShown } from "./corner-measure";

/** The class of MapLibre's attribution control. */
export const ATTRIBUTION_CLASS = "maplibregl-ctrl-attrib";

/**
 * How far up from the map's bottom MapLibre's attribution reaches while it shows open (a compact
 * one until the first drag, at any width): none while it is hidden (no credit yet), folded to its
 * button, or off the map.
 */
export function attributionInset(map: MapLibreMap): number {
  const container = map.getContainer();
  const attribution = attributionOf(map);
  if (attribution === null || !isShown(attribution) || isFolded(attribution)) return 0;
  const reach = container.getBoundingClientRect().bottom - attribution.getBoundingClientRect().top;
  return Math.max(0, reach);
}

/**
 * Calls `changed` whenever the attribution changes size: its credit arriving after the first
 * render, or folding. Returns how to stop.
 */
export function watchAttribution(map: MapLibreMap, changed: () => void): () => void {
  const attribution = attributionOf(map);
  if (attribution === null) return () => {};
  const observer = new ResizeObserver(() => changed());
  observer.observe(attribution);
  return () => observer.disconnect();
}

function attributionOf(map: MapLibreMap): Element | null {
  return map.getContainer().querySelector(`.${ATTRIBUTION_CLASS}`);
}

/** A compact attribution showing only its button. */
function isFolded(attribution: Element): boolean {
  const { classList } = attribution;
  return classList.contains("maplibregl-compact") && !classList.contains("maplibregl-compact-show");
}
