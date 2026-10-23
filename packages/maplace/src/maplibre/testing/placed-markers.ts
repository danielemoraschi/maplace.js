import type { Marker } from "maplibre-gl";
import type { MapLibreState } from "../map-state";
import type { PlacedMarker } from "../placed-location";

/** The marker `id` placed on the map: one that is a shape, or not placed, fails. */
export function placedMarker(state: MapLibreState, id: string): PlacedMarker {
  const placed = state.placed.get(id);
  if (placed?.geometryType !== "marker") throw new Error(`${id} is no marker`);
  return placed;
}

/** `id`'s marker drawn in the DOM: one drawn as a pin in the layer fails. */
export function domMarkerOf(state: MapLibreState, id: string): Marker {
  const marker = placedMarker(state, id).domMarker();
  if (marker === undefined) throw new Error(`${id} is no DOM marker`);
  return marker;
}
