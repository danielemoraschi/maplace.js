import { geometryTypeOf, withGeometry } from "../diff/geometry";
import type { Geometry } from "../geometry";
import type { Location } from "../location";
import { locationById } from "../location-state";
import type { Snapshot } from "../store";
import { child, reject } from "../validate/fail";
import { checkLocationFields, locationRoot } from "../validate/location";
import { type Change, NO_CHANGE } from "./change";

/** What the map reports after a drag or an edit ends. */
export interface GeometryReport {
  readonly id: string;
  readonly geometry: Geometry;
}

/**
 * Writes a drag or edit back: the location becomes a new object with the reported geometry, then
 * `change` fires with it and the one it replaces. An id the store no longer has is a race with a
 * diff still being drawn: no change. A report the location can't take is the adapter's bug and
 * throws.
 */
export function changeGeometry<Data>(
  snapshot: Snapshot<Data>,
  { id, geometry }: GeometryReport,
): Change<Data> {
  const previous = locationById(snapshot.locations, id);
  if (previous === undefined) return NO_CHANGE;
  checkWriteBack(previous, geometry);
  const location = withGeometry(previous, geometry);
  checkLocationFields(location);
  return {
    patch: { locations: replaced(snapshot.locations, { previous, location }) },
    events: [{ name: "change", payload: { location, previous } }],
  };
}

function checkWriteBack(location: Location, geometry: Geometry): void {
  if (location.editable !== true) {
    const problem = "is not true, so the map can't change its geometry";
    reject(child(locationRoot(location.id), "editable"), problem);
  }
  const type = geometryTypeOf(location);
  if (geometry.type !== type) {
    const problem = `is ${type}, got a ${geometry.type} geometry`;
    reject(child(locationRoot(location.id), "type"), problem);
  }
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
