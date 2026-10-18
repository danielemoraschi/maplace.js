import type { StyleField } from "../drawable";
import type { Location } from "../index";
import type { LocationTemplates } from "./location-templates";

/**
 * A shape's styles and the attributes holding each, as JSON. Not `style` for the rest style:
 * that is HTML's inline CSS.
 */
const STYLE_ATTRIBUTES = {
  style: "shape-style",
  selectedStyle: "selected-style",
  hoveredStyle: "hovered-style",
} as const satisfies Record<StyleField, string>;

/** The attributes a `<maplace-location>` reads; a change of any of them re-reads it. */
export const LOCATION_ATTRIBUTES = [
  "location-id",
  "lat",
  "lng",
  "title",
  "type",
  "group",
  "radius",
  "icon",
  ...Object.values(STYLE_ATTRIBUTES),
] as const;

/** No popup content and no icon from templates. */
const NO_TEMPLATES: LocationTemplates = { content: undefined, icon: undefined };

/**
 * A location from an element's attributes and its templates: `lat` and `lng` are a marker's
 * position or a circle's centre, and the `icon` attribute an image URL, which an icon template
 * stands in for; a shape's styles are JSON. Values are passed on as written when they aren't
 * numbers or JSON, so the store's own checks name the field and the value.
 */
export function locationFromAttributes(
  element: Element,
  { content, icon }: LocationTemplates = NO_TEMPLATES,
): Location {
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
    icon: icon ?? element.getAttribute("icon") ?? undefined,
    ...geometry,
    ...stylesFromAttributes(element),
  }) as unknown as Location;
}

/** The attribute as a number, or as written when blank or not a number (`lat=""` is never 0). */
export function numberOrRaw(element: Element, name: string): number | string | undefined {
  const value = element.getAttribute(name);
  if (value === null) return undefined;
  const number = Number(value);
  return value.trim() === "" || !Number.isFinite(number) ? value : number;
}

/** The attribute parsed as JSON, or as written when it isn't JSON. */
function jsonOrRaw(element: Element, name: string): unknown {
  const value = element.getAttribute(name);
  if (value === null) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function stylesFromAttributes(element: Element): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(STYLE_ATTRIBUTES).map(([field, name]) => [field, jsonOrRaw(element, name)]),
  );
}

function withoutUndefined(fields: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
}
