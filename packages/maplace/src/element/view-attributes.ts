import type { LatLng, View } from "../index";
import { child, reject } from "../validate/fail";
import { checkView } from "../validate/viewport";
import { numberOrRaw, numberOrText } from "./attribute-values";
import { MAP_ELEMENT } from "./element-error";

/** The attributes of the map's first view, given together. */
export const VIEW_ATTRIBUTES = ["center", "zoom"] as const;

/**
 * What `map-options` says of a centre or zoom given in it, 0.2's `set_center` too, on either
 * provider.
 */
export const VIEW_IN_MAP_OPTIONS = {
  center: "is its own attribute: center",
  zoom: "is its own attribute: zoom",
  set_center: "is its own attribute: center",
} as const;

const CENTER = child(MAP_ELEMENT, "center");

/**
 * `center` ("lat,lng") and `zoom` as the store's first view, checked with the store's check;
 * `undefined` when neither is given. One alone, or a bad value, is misuse naming it.
 */
export function firstViewOf(host: Element): View | undefined {
  const center = host.getAttribute("center");
  const zoom = numberOrRaw(host, "zoom");
  if (center === null && zoom === undefined) return undefined;
  if (center === null) reject(CENTER, "is missing: give both");
  if (zoom === undefined) reject(child(MAP_ELEMENT, "zoom"), "is missing: give both");
  const view = { kind: "center", center: latLngOf(center), zoom };
  checkView(view, MAP_ELEMENT);
  return view;
}

/** Two numbers either side of a comma, for the store's check to check as a point. */
function latLngOf(text: string): Record<keyof LatLng, unknown> {
  const numbers = text.split(",").map(numberOrText);
  if (numbers.length !== 2 || numbers.some((part) => typeof part === "string")) {
    reject(CENTER, 'must be "lat,lng", two numbers');
  }
  return { lat: numbers[0], lng: numbers[1] };
}
