import type { Location } from "../location";
import { locationById } from "../location-state";
import type { Snapshot } from "../store";
import { type Change, NO_CHANGE } from "./change";
import { editedLocation, type GeometryReport } from "./edited-location";

/**
 * Writes a drag or edit back: the location becomes a new object with the reported geometry, then
 * `locationChange` fires with it and the one it replaces. An id the store no longer has is a race
 * with a diff still being drawn: no change. A report the location can't take is the adapter's bug
 * and throws.
 */
export function changeGeometry<Data>(
  snapshot: Snapshot<Data>,
  { id, geometry }: GeometryReport,
): Change<Data> {
  const previous = locationById(snapshot.locations, id);
  if (previous === undefined) return NO_CHANGE;
  const location = editedLocation(previous, geometry);
  return {
    patch: { locations: replaced(snapshot.locations, { previous, location }) },
    events: [{ name: "locationChange", payload: { location, previous } }],
  };
}

/** The list with one location swapped in place: a copy at native speed, not a scan per item. */
function replaced<Data>(
  locations: readonly Location<Data>[],
  { previous, location }: { readonly previous: Location<Data>; readonly location: Location<Data> },
): readonly Location<Data>[] {
  const copy = locations.slice();
  copy[locations.indexOf(previous)] = location;
  return Object.freeze(copy);
}
