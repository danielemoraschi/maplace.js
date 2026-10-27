import type { Location } from "../location";
import { locationById } from "../location-index";
import { type FilteredLocations, isShown } from "../location-state";
import { child, describeValue, type Field, reject, root } from "../validate/fail";
import { checkNonEmptyString } from "../validate/values";

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
export function checkSelectable(filtered: FilteredLocations, id: string, field: Field): void {
  const location = checkKnownId(filtered.locations, id, field);
  if (!isShown(location, filtered.filter)) {
    const problem = "names a hidden location (visible: false, or outside the filter)";
    reject(field, `${problem}, got ${describeValue(id)}`);
  }
}

/** The id a public call names (`select`, `hover`): a non-empty string for a shown location. */
export function checkSelectableId(
  filtered: FilteredLocations,
  { method, id }: { readonly method: "select" | "hover"; readonly id: string },
): void {
  const field = child(root(method, typeof id === "string" ? id : undefined), "id");
  checkNonEmptyString(id, field);
  checkSelectable(filtered, id, field);
}
