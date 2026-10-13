import type { PresentationState } from "../../adapter";
import type { Drawable } from "../../drawable";
import type { Geometry, LatLng } from "../../geometry";
import type { LocationState } from "../../location";
import { NOTHING_PRESENTED } from "../contract-values";

/** One location as the fake map shows it; its state and visibility follow `presented`. */
export interface MapEntry {
  drawable: Drawable;
  /** Where it is shown: the drawable's geometry, or where a drag left it. */
  geometry: Geometry;
  icon: Node | undefined;
}

/** What is on the fake map: read by drawing, popups, the camera and the probe. */
export interface MapState {
  readonly entries: Map<string, MapEntry>;
  presented: PresentationState;
}

export function createMapState(): MapState {
  return { entries: new Map(), presented: NOTHING_PRESENTED };
}

/** The state `presented` gives one location. */
export function stateIn(presented: PresentationState, id: string): LocationState {
  return { selected: id === presented.selectedId, hovered: id === presented.hoveredId };
}

export function isVisible(map: MapState, id: string): boolean {
  return !map.presented.hiddenIds.has(id);
}

/** A shown location, or undefined when it isn't drawn or is hidden. */
export function shownEntry(map: MapState, id: string): MapEntry | undefined {
  return isVisible(map, id) ? map.entries.get(id) : undefined;
}

/** Where a location is pinned: a marker's point, a circle's centre, a path's first point. */
export function anchorOf(geometry: Geometry): LatLng {
  switch (geometry.type) {
    case "marker":
      return { lat: geometry.lat, lng: geometry.lng };
    case "circle":
      return geometry.center;
    default:
      return geometry.path[0] ?? { lat: 0, lng: 0 };
  }
}
