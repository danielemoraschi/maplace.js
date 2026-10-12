import type { Location } from "../location";
import { describeValue, type Field, reject } from "../validate/fail";
import { isShown, locationById, type Scope } from "./lookup";

/** Throws `unknown-id` unless `id` names a location; returns it. */
export function checkKnownId<Data>(
  locations: readonly Location<Data>[],
  id: string,
  field: Field,
): Location<Data> {
  const location = locationById(locations, id);
  if (location === undefined) {
    reject(field, `must name a location, got ${describeValue(id)}`, "unknown-id");
  }
  return location;
}

/** Throws unless `id` names a location (`unknown-id`) that is shown (`invalid-input`). */
export function checkSelectable(scope: Scope, id: string, field: Field): void {
  const location = checkKnownId(scope.locations, id, field);
  if (!isShown(location, scope.filter)) {
    const problem = "names a hidden location (visible: false, or outside the filter)";
    reject(field, `${problem}, got ${describeValue(id)}`);
  }
}
