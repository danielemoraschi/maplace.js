import type { Location } from "../location";
import { child, describeValue, type Field, reject, root } from "../validate/fail";
import { checkNonEmptyString } from "../validate/values";
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

/** The id a public call names (`select`, `hover`): a non-empty string for a shown location. */
export function checkSelectableId(
  scope: Scope,
  { method, id }: { readonly method: "select" | "hover"; readonly id: string },
): void {
  const field = child(root(method, typeof id === "string" ? id : undefined), "id");
  checkNonEmptyString(id, field);
  checkSelectable(scope, id, field);
}
