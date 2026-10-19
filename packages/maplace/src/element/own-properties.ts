import type { MaplaceMapElement } from "./index";

/** The properties a page may set on `<maplace-map>` before the element is defined. */
const PAGE_PROPERTIES = [
  "locations",
  "route",
  "sanitize",
] as const satisfies readonly (keyof MaplaceMapElement)[];

/**
 * Properties a page set before the element was defined are own properties hiding the class's
 * setters: they go through the setters now.
 */
export function reapplyOwnProperties(element: MaplaceMapElement): void {
  const properties = element as unknown as Record<string, unknown>;
  for (const name of PAGE_PROPERTIES) {
    if (Object.getOwnPropertyDescriptor(element, name) === undefined) continue;
    const value = properties[name];
    delete properties[name];
    properties[name] = value;
  }
}
