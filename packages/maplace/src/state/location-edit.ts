import { geometryOf } from "../diff/geometry";
import { locationById } from "../location-state";
import type { Snapshot } from "../store";
import { type Change, NO_CHANGE } from "./change";
import { editedLocation, type GeometryReport } from "./edited-location";

/**
 * A user's drag or reshape under way, as the map reports it: `locationEdit` with the location the
 * store holds and the geometry so far, which the store doesn't keep (the change on release writes
 * it back). An id the store no longer has is a race: no change. A report the location can't take
 * throws, as for a write-back.
 */
export function locationEdited<Data>(
  snapshot: Snapshot<Data>,
  { id, geometry }: GeometryReport,
): Change<Data> {
  const location = locationById(snapshot.locations, id);
  if (location === undefined) return NO_CHANGE;
  const checked = Object.freeze(geometryOf(editedLocation(location, geometry)));
  return {
    patch: {},
    events: [{ name: "locationEdit", payload: { location, geometry: checked } }],
  };
}
