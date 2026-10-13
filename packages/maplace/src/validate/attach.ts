import { type Field, mustBe } from "./fail";
import { isElement } from "./values";

/** `attach`'s container: duck-typed, so an element from another realm (an iframe) passes. */
export function checkContainer(value: unknown, field: Field): asserts value is HTMLElement {
  if (!isElement(value)) mustBe(field, "an HTMLElement", value);
}

/**
 * `attach`'s adapter, as far as the store relies on it before mounting. Plain-JS callers (a
 * provider factory that returned nothing) get a `MaplaceError`, not a `TypeError`.
 */
export function checkAdapter(value: unknown, field: Field): void {
  const isAdapter =
    typeof value === "object" &&
    value !== null &&
    "capabilities" in value &&
    typeof value.capabilities === "object" &&
    value.capabilities !== null &&
    "has" in value.capabilities &&
    "mount" in value &&
    typeof value.mount === "function";
  if (!isAdapter) mustBe(field, "an adapter (capabilities and mount)", value);
}
