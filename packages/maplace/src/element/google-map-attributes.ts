import {
  type ColorScheme,
  type CreatedMapOptions,
  checkColorScheme,
  mapOptionsCheck,
} from "../google/options";
import { child } from "../validate/fail";
import type { Assert } from "../validate/record";
import { givenAttribute, jsonOrRaw } from "./attribute-values";
import { MAP_ELEMENT } from "./element-error";
import { MAP_SETTING_ATTRIBUTES } from "./map-settings-watch";
import { VIEW_IN_MAP_OPTIONS } from "./view-attributes";

/** The map settings Google's provider reads; Google sets a colour scheme only on a new map. */
export const GOOGLE_MAP_SETTINGS = [
  MAP_SETTING_ATTRIBUTES.colorScheme,
  MAP_SETTING_ATTRIBUTES.mapOptions,
] as const;

/** The colour scheme and Google's map options for the map the element's provider creates. */
export interface CreatedMapSettings {
  readonly colorScheme: ColorScheme | undefined;
  readonly mapOptions: CreatedMapOptions | undefined;
}

const checkMapOptionsAttribute: Assert<CreatedMapOptions> = mapOptionsCheck(
  {
    mapId: "is its own attribute: map-id",
    colorScheme: "is its own attribute: color-scheme",
    ...VIEW_IN_MAP_OPTIONS,
  },
  "a JSON object",
);

/** `color-scheme` and `map-options` as `element` writes them; a bad value is misuse naming it. */
export function createdMapSettingsOf(element: Element): CreatedMapSettings {
  return { colorScheme: colorSchemeOf(element), mapOptions: mapOptionsOf(element) };
}

function colorSchemeOf(element: Element): ColorScheme | undefined {
  const name = MAP_SETTING_ATTRIBUTES.colorScheme;
  const value = givenAttribute(element, name);
  if (value === undefined) return undefined;
  checkColorScheme(value, child(MAP_ELEMENT, name));
  return value;
}

function mapOptionsOf(element: Element): CreatedMapOptions | undefined {
  const name = MAP_SETTING_ATTRIBUTES.mapOptions;
  const value = jsonOrRaw(givenAttribute(element, name));
  if (value === undefined) return undefined;
  checkMapOptionsAttribute(value, child(MAP_ELEMENT, name));
  return value;
}
