import { definedFields } from "../defined-fields";
import type { StyleField } from "../drawable";
import type { Location } from "../index";
import { child, mustBe } from "../validate/fail";
import { locationRoot } from "../validate/location";
import { booleanOrRaw, jsonOrRaw, numberOrRaw, wordsOf } from "./attribute-values";
import type { LocationTemplates } from "./location-templates";

/**
 * A shape's styles and the attributes holding each, as JSON. Not `style` for the rest style:
 * that is HTML's inline CSS.
 */
const STYLE_ATTRIBUTES = {
  style: "shape-style",
  selectedStyle: "selected-style",
  hoveredStyle: "hovered-style",
  activeStyle: "active-style",
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
  "weight",
  "listed",
  "editable",
  "active",
  ...Object.values(STYLE_ATTRIBUTES),
] as const;

/** No popup content and no icon from templates. */
const NO_TEMPLATES: LocationTemplates = { content: undefined, icon: undefined };

/**
 * A location from an element's attributes and its templates: `lat` and `lng` are a marker's
 * position or a circle's centre, `group` a name or a JSON path, and the `icon` attribute an image URL, which an icon template
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
  return definedFields({
    id: element.getAttribute("location-id") ?? undefined,
    title: element.getAttribute("title") ?? undefined,
    group: groupFrom(element),
    tags: tagsFrom(element),
    searchText: element.getAttribute("search-text") ?? undefined,
    zoom: numberOrRaw(element, "zoom"),
    weight: numberOrRaw(element, "weight"),
    listed: booleanOrRaw(element, "listed"),
    editable: booleanOrRaw(element, "editable"),
    active: booleanOrRaw(element, "active"),
    content,
    icon: icon ?? element.getAttribute("icon") ?? undefined,
    ...geometry,
    ...stylesFromAttributes(element),
  }) as unknown as Location;
}

/** Whether a `group` attribute's text is read as a path, written as JSON: it starts with `[`. */
function isWrittenAsPath(group: string): boolean {
  return group.trimStart().startsWith("[");
}

/**
 * The `group` attribute: one name, or a path when it starts with `[`, as JSON
 * (`group='["Europe","Italy"]'`); such a value that isn't a JSON list is misuse, never a name.
 */
function groupFrom(element: Element): unknown {
  const group = element.getAttribute("group");
  if (group === null || !isWrittenAsPath(group)) return group ?? undefined;
  const path = jsonOrRaw(group);
  if (Array.isArray(path)) return path;
  const field = child(locationRoot(element.getAttribute("location-id") ?? ""), "group");
  return mustBe(field, 'a name, or a JSON path such as ["Europe","Italy"]', group);
}

/** The `tags` attribute's words, as `class` holds its: a tag there can't hold a space. */
function tagsFrom(element: Element): string[] | undefined {
  const tags = element.getAttribute("tags");
  return tags === null ? undefined : wordsOf(tags);
}

function stylesFromAttributes(element: Element): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(STYLE_ATTRIBUTES).map(([field, name]) => [
      field,
      jsonOrRaw(element.getAttribute(name)),
    ]),
  );
}
