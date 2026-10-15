import type { Location } from "../index";

/** The attributes a `<maplace-location>` reads; a change of any of them re-reads it. */
export const LOCATION_ATTRIBUTES = [
  "location-id",
  "lat",
  "lng",
  "title",
  "type",
  "group",
  "radius",
] as const;

/**
 * A location from an element's attributes: `lat` and `lng` are a marker's position or a circle's
 * centre. Values are passed on as written when they aren't numbers, so the store's own checks
 * name the field and the value.
 */
export function locationFromAttributes(element: Element, content?: () => Node): Location {
  const type = element.getAttribute("type") ?? undefined;
  const position = { lat: numberOrRaw(element, "lat"), lng: numberOrRaw(element, "lng") };
  const geometry =
    type === "circle"
      ? { type, center: position, radius: numberOrRaw(element, "radius") }
      : { type, ...position };
  return withoutUndefined({
    id: element.getAttribute("location-id") ?? undefined,
    title: element.getAttribute("title") ?? undefined,
    group: element.getAttribute("group") ?? undefined,
    content,
    ...geometry,
  }) as unknown as Location;
}

/** The attribute as a number, or as written when blank or not a number (`lat=""` is never 0). */
export function numberOrRaw(element: Element, name: string): number | string | undefined {
  const value = element.getAttribute(name);
  if (value === null) return undefined;
  const number = Number(value);
  return value.trim() === "" || !Number.isFinite(number) ? value : number;
}

function withoutUndefined(fields: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
}
