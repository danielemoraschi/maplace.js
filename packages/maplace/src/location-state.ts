import type { Location, LocationState } from "./location";
import { locationById } from "./location-index";

// A location's state from selection and hover, whether it is shown at all, listed and selectable:
// the data rules the store, the views and the bindings share.

/** Which location is selected and which hovered: what a location's state follows. */
export interface SelectionAndHover {
  readonly selectedId: string | undefined;
  readonly hoveredId: string | undefined;
}

export function stateIn(state: SelectionAndHover, id: string): LocationState {
  return { selected: id === state.selectedId, hovered: id === state.hoveredId };
}

export function sameState(a: LocationState, b: LocationState): boolean {
  return a.selected === b.selected && a.hovered === b.hovered;
}

/** The ids whose selection or hover differs between two states, once each: they repaint. */
export function changedIds(previous: SelectionAndHover, next: SelectionAndHover): string[] {
  const ids = [previous.selectedId, previous.hoveredId, next.selectedId, next.hoveredId];
  return [...new Set(ids)].filter(
    (id): id is string => id !== undefined && !sameState(stateIn(previous, id), stateIn(next, id)),
  );
}

/** Drawn and selectable: not `visible: false`, and with a filter, in one of its groups. */
export function isShown(location: Location, filter: readonly string[] | undefined): boolean {
  if (location.visible === false) return false;
  return filter === undefined || (location.group !== undefined && filter.includes(location.group));
}

/** In the list views: shown, and not `listed: false`. */
export function isListed(location: Location, filter: readonly string[] | undefined): boolean {
  return location.listed !== false && isShown(location, filter);
}

/** What decides whether a location is shown: the locations and the filter over them. */
export interface Scope {
  readonly locations: readonly Location[];
  readonly filter: readonly string[] | undefined;
}

/** Known and shown: an id a map report, or a selection, may name. Lists must be frozen. */
export function isSelectable(scope: Scope, id: string): boolean {
  const location = locationById(scope.locations, id);
  return location !== undefined && isShown(location, scope.filter);
}
