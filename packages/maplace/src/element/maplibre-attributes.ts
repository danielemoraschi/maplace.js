import type { MapOptions } from "maplibre-gl";
import type { MapLibreAdapterOptions } from "../maplibre/index";
import { child, mustBe } from "../validate/fail";
import { GOOGLE_NAMES_ON_MAPLIBRE } from "../validate/google-map-option-names";
import type { Assert } from "../validate/record";
import { refusedKeysCheck } from "../validate/refused-keys";
import { givenAttribute, jsonOrRaw } from "./attribute-values";
import { MAP_ELEMENT } from "./element-error";
import { MAP_SETTING_ATTRIBUTES } from "./map-settings-watch";
import { VIEW_IN_MAP_OPTIONS } from "./view-attributes";

/** The map settings MapLibre's provider reads; `color-scheme` isn't one: the style sets the colours. */
export const MAPLIBRE_MAP_SETTINGS = [
  MAP_SETTING_ATTRIBUTES.mapStyle,
  MAP_SETTING_ATTRIBUTES.mapOptions,
] as const;

type MapLibreStyle = NonNullable<MapLibreAdapterOptions["mapStyle"]>;
type MapLibreMapOptionsAttribute = NonNullable<MapLibreAdapterOptions["mapOptions"]>;

/** MapLibre's map options maplace sets itself, which `map-options` therefore leaves out. */
type SetByMaplace = Exclude<keyof MapOptions, keyof MapLibreMapOptionsAttribute>;

/** Why `map-options` refuses each key maplace sets itself, and Google's names for MapLibre's. */
export const REFUSED_IN_MAP_OPTIONS = {
  container: "is the map's own element, which maplace makes",
  style: "is its own attribute: map-style",
  ...VIEW_IN_MAP_OPTIONS,
  bounds: "is set by the store's view",
  ...GOOGLE_NAMES_ON_MAPLIBRE,
} as const satisfies Record<SetByMaplace, string>;

const UNPARSED_JSON = /^\s*[[{]/;

/** An absolute style URL's host and port, no user info; a backslash ends a host as a slash does. */
const STYLE_URL_HOST = /^https?:\/\/(?:[^/\\?#]*@)?([^/\\?#@]+)(?=[/\\?#]|$)/i;

const checkMapOptionsAttribute: Assert<MapLibreMapOptionsAttribute> = refusedKeysCheck(
  REFUSED_IN_MAP_OPTIONS,
  "a JSON object",
);

/** `map-style` and `map-options` as `element` writes them; a bad value is misuse naming it. */
export function mapLibreSettingsOf(element: Element): MapLibreAdapterOptions {
  return { mapStyle: mapStyleOf(element), mapOptions: mapOptionsOf(element) };
}

/**
 * Whom a map on `element` loads from: OpenFreeMap by default (a word, as `map-source.ts` is
 * reached only through MapLibre's entry), or a style URL's host. A relative URL, another scheme
 * or a style object has no one host to name; a bad value stays misuse when the map opens.
 */
export function mapStyleHostOf(element: Element): string | undefined {
  const style = jsonOrRaw(givenAttribute(element, MAP_SETTING_ATTRIBUTES.mapStyle));
  if (style === undefined) return "OpenFreeMap";
  return typeof style === "string" ? STYLE_URL_HOST.exec(style)?.[1] : undefined;
}

function mapStyleOf(element: Element): MapLibreStyle | undefined {
  const name = MAP_SETTING_ATTRIBUTES.mapStyle;
  const value = jsonOrRaw(givenAttribute(element, name));
  if (value === undefined || isStyle(value)) return value;
  return mustBe(child(MAP_ELEMENT, name), "a style URL or a JSON style object", value);
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
  checkMapOptionsAttribute(value, child(MAP_ELEMENT, name));
  return value;
}
