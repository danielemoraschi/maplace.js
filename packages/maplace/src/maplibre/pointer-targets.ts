import type { MapGeoJSONFeature, Map as MapLibreMap, PointLike } from "maplibre-gl";
import { LOCATION_LAYERS, PIN_SOURCE } from "./layers";
import type { MapLibreState } from "./map-state";
import type { PlacedLocation } from "./placed-location";

/**
 * The location drawn in maplace's layers at `point`, as a user pointing there means it: of the
 * locations hit and shown now, a marker before any shape, then the one stacked in front by
 * maplace's own order (a small polygon's fill over a big one's outline, though MapLibre draws
 * every outline above every fill). A location hidden, removed or folded into a cluster since
 * MapLibre last drew is skipped: its feature may still be on screen for a frame.
 */
export function locationAt(state: MapLibreState, point: PointLike): string | undefined {
  const map = state.mounted?.map;
  if (map === undefined) return undefined;
  const layers = LOCATION_LAYERS.filter((id) => map.getLayer(id) !== undefined);
  const hit = map.queryRenderedFeatures(point, { layers });
  const shown = hit.flatMap((feature) => shownPlaced(state, feature));
  shown.sort(frontFirst);
  return shown[0]?.drawable().id;
}

function shownPlaced(state: MapLibreState, feature: MapGeoJSONFeature): PlacedLocation[] {
  const id = feature.properties.id;
  if (typeof id !== "string" || state.presented.hiddenIds.has(id)) return [];
  if (isPinTakenOff(state, feature, id)) return [];
  const placed = state.placed.get(id);
  return placed === undefined ? [] : [placed];
}

/** A pin MapLibre still draws though maplace took it off since: folded, or drawn in the DOM. */
function isPinTakenOff(state: MapLibreState, { source }: MapGeoJSONFeature, id: string): boolean {
  return source === PIN_SOURCE && state.features?.pins.featureOf(id) === undefined;
}

function frontFirst(a: PlacedLocation, b: PlacedLocation): number {
  return isMarker(b) - isMarker(a) || b.rank() - a.rank();
}

const isMarker = (placed: PlacedLocation) => Number(placed.geometryType === "marker");

/**
 * Whether a map event came from the map's canvas, not from something on the map (a DOM marker, a
 * popup, a control), which handles its own input, nor from a page's code firing one.
 */
export function isOnCanvas(
  { originalEvent }: { readonly originalEvent?: Event },
  canvas: HTMLCanvasElement,
): boolean {
  return originalEvent?.target === canvas;
}

/**
 * Whether `event` happened in the map's canvas container (the canvas or a marker on it), where
 * MapLibre hears it, read through any open shadow root.
 */
export function isInCanvasContainer(event: Event, map: MapLibreMap): boolean {
  return event.composedPath().includes(map.getCanvasContainer());
}
