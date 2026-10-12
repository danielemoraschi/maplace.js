import type { Location } from "../location";
import { child, mustBe, reject, root } from "./fail";
import { locationRoot, validateLocation } from "./location";

/** The method being called, for messages, and the store's `sanitize` option. */
export interface LocationsContext {
  readonly caller: string;
  readonly sanitize: unknown;
}

/** Throws on the first bad location, in list order; ids must be unique across the list. */
export function validateLocations(
  value: unknown,
  context: LocationsContext,
): asserts value is readonly Location[] {
  if (!Array.isArray(value)) {
    mustBe(child(root(context.caller), "locations"), "an array", value);
  }
  const firstIndexById = new Map<string, number>();
  for (const [index, location] of value.entries()) {
    validateLocation(location, { index, sanitize: context.sanitize });
    checkUnique(location.id, index, firstIndexById);
  }
}

function checkUnique(id: string, index: number, firstIndexById: Map<string, number>): void {
  const first = firstIndexById.get(id);
  if (first !== undefined) {
    reject(child(locationRoot(id), "id"), `is already used by locations[${first}]`, "duplicate-id");
  }
  firstIndexById.set(id, index);
}
