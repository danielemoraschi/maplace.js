import type { Location } from "../location";
import type { Snapshot } from "../store";

/** What decides whether a location is shown: the locations and the filter. */
export type Scope = Pick<Snapshot<unknown>, "locations" | "filter">;

// Snapshot location lists are frozen (`frozenList`), so an index built once per list stays right.
const INDEXES = new WeakMap<readonly Location[], ReadonlyMap<string, Location>>();

export function locationById<Data>(
  locations: readonly Location<Data>[],
  id: string,
): Location<Data> | undefined {
  return (indexById(locations) as ReadonlyMap<string, Location<Data>>).get(id);
}

/** Whether `value` is one of these locations, the same object under its own id. */
export function isHeld(locations: readonly Location[], value: unknown): boolean {
  if (typeof value !== "object" || value === null || !("id" in value)) return false;
  return typeof value.id === "string" && locationById(locations, value.id) === value;
}

/**
 * A frozen copy: a list the caller changes in place later can't alter the snapshot, and frozen
 * lists are what the id lookup caches by.
 */
export function frozenList<Data>(locations: readonly Location<Data>[]): readonly Location<Data>[] {
  return Object.freeze([...locations]);
}

/** Known and shown: an id a map report, or a selection, may name. */
function isSelectable(scope: Scope, id: string): boolean {
  const location = locationById(scope.locations, id);
  return location !== undefined && isShown(location, scope.filter);
}

/**
 * An id that is set but names no shown location. In a report from the map, it is a race with a
 * diff still being drawn.
 */
export function isHiddenId(scope: Scope, id: string | undefined): boolean {
  return id !== undefined && !isSelectable(scope, id);
}

/** Drawn, listed and selectable: not `visible: false`, and with a filter, in one of its groups. */
export function isShown(location: Location, filter: readonly string[] | undefined): boolean {
  if (location.visible === false) return false;
  return filter === undefined || (location.group !== undefined && filter.includes(location.group));
}

function indexById(locations: readonly Location[]): ReadonlyMap<string, Location> {
  let index = INDEXES.get(locations);
  if (index === undefined) {
    index = new Map(locations.map((location) => [location.id, location]));
    INDEXES.set(locations, index);
  }
  return index;
}
