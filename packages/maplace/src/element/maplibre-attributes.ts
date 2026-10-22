import type { MapOptions } from "maplibre-gl";
import type { MapLibreAdapterOptions } from "../maplibre/index";
import { child, mustBe, reject, root } from "../validate/fail";
import type { Assert } from "../validate/record";
import { checkObject } from "../validate/values";
import { givenAttribute, jsonOrRaw } from "./attribute-values";
import { MAP_SETTING_ATTRIBUTES } from "./map-settings-watch";

type MapLibreStyle = NonNullable<MapLibreAdapterOptions["mapStyle"]>;
type MapLibreMapOptionsAttribute = NonNullable<MapLibreAdapterOptions["mapOptions"]>;

/** MapLibre's map options maplace sets itself, which `map-options` therefore leaves out. */
type SetByMaplace = Exclude<keyof MapOptions, keyof MapLibreMapOptionsAttribute>;

/** Why `map-options` refuses each key maplace sets itself. */
export const REFUSED_IN_MAP_OPTIONS = {
  container: "is the map's own element, which maplace makes",
  style: "is its own attribute: map-style",
  center: "is set by the store's view",
  zoom: "is set by the store's view",
  bounds: "is set by the store's view",
} as const satisfies Record<SetByMaplace, string>;

const REFUSED = Object.entries(REFUSED_IN_MAP_OPTIONS);

const ELEMENT = root("<maplace-map>");

const UNPARSED_JSON = /^\s*[[{]/;

const checkMapOptionsAttribute: Assert<MapLibreMapOptionsAttribute> = (value, field) => {
  checkObject(value, field, "a JSON object");
  for (const [key, remark] of REFUSED) {
    if (key in value) reject(child(field, key), remark);
  }
};

/** `map-style` and `map-options` as `element` writes them; a bad value is misuse naming it. */
export function mapLibreSettingsOf(element: Element): MapLibreAdapterOptions {
  return { mapStyle: mapStyleOf(element), mapOptions: mapOptionsOf(element) };
}

function mapStyleOf(element: Element): MapLibreStyle | undefined {
  const name = MAP_SETTING_ATTRIBUTES.mapStyle;
  const value = jsonOrRaw(givenAttribute(element, name));
  if (value === undefined || isStyle(value)) return value;
  return mustBe(child(ELEMENT, name), "a style URL or a JSON style object", value);
}

function isStyle(value: unknown): value is MapLibreStyle {
  if (typeof value === "string") return isStyleUrl(value);
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Not blank, nor a JSON object or array that failed to parse and was left as written. */
function isStyleUrl(written: string): boolean {
  return written.trim() !== "" && !UNPARSED_JSON.test(written);
}

function mapOptionsOf(element: Element): MapLibreMapOptionsAttribute | undefined {
  const name = MAP_SETTING_ATTRIBUTES.mapOptions;
  const value = jsonOrRaw(givenAttribute(element, name));
  if (value === undefined) return undefined;
  checkMapOptionsAttribute(value, child(ELEMENT, name));
  return value;
}
