import type { StyleField } from "../drawable";
import type { Location } from "../index";
import { booleanOrRaw, jsonOrRaw, numberOrRaw } from "./attribute-values";
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
  "tags",
  "search-text",
  "radius",
  "icon",
  "zoom",
  "listed",
  "editable",
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
    tags: tagsFrom(element),
    searchText: element.getAttribute("search-text") ?? undefined,
    zoom: numberOrRaw(element, "zoom"),
    listed: booleanOrRaw(element, "listed"),
    editable: booleanOrRaw(element, "editable"),
    content,
    icon: icon ?? element.getAttribute("icon") ?? undefined,
    ...geometry,
    ...stylesFromAttributes(element),
  }) as unknown as Location;
}

/** The `tags` attribute's words, as `class` holds its: a tag there can't hold a space. */
function tagsFrom(element: Element): string[] | undefined {
  return element.getAttribute("tags")?.split(/\s+/).filter(Boolean);
}

function stylesFromAttributes(element: Element): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(STYLE_ATTRIBUTES).map(([field, name]) => [
      field,
      jsonOrRaw(element.getAttribute(name)),
    ]),
  );
}

function withoutUndefined(fields: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
}
