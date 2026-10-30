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

/** What is shown: locations in any of the `groups` and with all of the `tags`, each when given. */
export interface LocationFilter {
  readonly groups?: readonly string[] | undefined;
  readonly tags?: readonly string[] | undefined;
}

/** What `setFilter` takes: a list of groups, a filter, or undefined to show everything. */
export type FilterRequest = readonly string[] | LocationFilter | undefined;

/** Drawn and selectable: not `visible: false`, and with a filter, what it asks for. */
export function isShown(location: Location, filter: LocationFilter | undefined): boolean {
  if (location.visible === false) return false;
  return (
    filter === undefined || (inGroups(location, filter.groups) && hasTags(location, filter.tags))
  );
}

function inGroups({ group }: Location, groups: LocationFilter["groups"]): boolean {
  return groups === undefined || (group !== undefined && groups.includes(group));
}

function hasTags(location: Location, tags: LocationFilter["tags"]): boolean {
  return tags === undefined || tags.every((tag) => location.tags?.includes(tag));
}

/** In the list views: shown, and not `listed: false`. */
export function isListed(location: Location, filter: LocationFilter | undefined): boolean {
  return location.listed !== false && isShown(location, filter);
}

/** What decides whether a location is shown: the locations and the filter over them. */
export interface FilteredLocations {
  readonly locations: readonly Location[];
  readonly filter: LocationFilter | undefined;
}

/** Known and shown: an id a map report, or a selection, may name. Lists must be frozen. */
export function isSelectable(filtered: FilteredLocations, id: string): boolean {
  const location = locationById(filtered.locations, id);
  return location !== undefined && isShown(location, filtered.filter);
}
