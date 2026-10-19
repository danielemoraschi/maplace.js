import type { Location } from "../location";
import { isSelectable, locationById, type Scope } from "../location-state";

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

/**
 * An id that is set but names no shown location: unknown, hidden or filtered out. In a report from
 * the map, it is a race with a diff still being drawn.
 */
export function isUnselectableId(scope: Scope, id: string | undefined): boolean {
  return id !== undefined && !isSelectable(scope, id);
}
