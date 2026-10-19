import { type Field, mustBe, reject } from "./fail";
import { isElement } from "./values";

/**
 * `attach`'s container: an element, duck-typed so one from another realm (an iframe) passes, or a
 * selector the page's document matches.
 */
export function containerOf(value: unknown, field: Field): HTMLElement {
  if (typeof value === "string") return elementMatching(value, field);
  if (!isElement(value)) mustBe(field, "an HTMLElement or a selector", value);
  return value;
}

/** The element `selector` matches in the page's document; a miss or a bad selector is misuse. */
function elementMatching(selector: string, field: Field): HTMLElement {
  const quoted = JSON.stringify(selector);
  let element: Element | null | undefined;
  try {
    element = globalThis.document?.querySelector(selector);
  } catch (error) {
    if (!isSelectorError(error)) throw error;
    reject(field, `${quoted} is not a valid selector`);
  }
  if (!isElement(element)) reject(field, `${quoted} matches no element`);
  return element;
}

/**
 * What `querySelector` throws for a selector that doesn't parse: a `DOMException`, its only one
 * (named `SyntaxError` in browsers; happy-dom leaves the name out).
 */
function isSelectorError(error: unknown): boolean {
  return typeof DOMException === "function" && error instanceof DOMException;
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
