import {
  type ColorScheme,
  type CreatedMapOptions,
  checkColorScheme,
  mapOptionsCheck,
} from "../google/options";
import { child, root } from "../validate/fail";
import type { Assert } from "../validate/record";
import { givenAttribute, jsonOrRaw } from "./attribute-values";
import { MAP_SETTING_ATTRIBUTES } from "./map-settings-watch";

/** The colour scheme and Google's map options for the map the element's provider creates. */
export interface CreatedMapSettings {
  readonly colorScheme: ColorScheme | undefined;
  readonly mapOptions: CreatedMapOptions | undefined;
}

const ELEMENT = root("<maplace-map>");

const checkMapOptionsAttribute: Assert<CreatedMapOptions> = mapOptionsCheck(
  {
    mapId: "is its own attribute: map-id",
    colorScheme: "is its own attribute: color-scheme",
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
  checkColorScheme(value, child(ELEMENT, name));
  return value;
}

function mapOptionsOf(element: Element): CreatedMapOptions | undefined {
  const name = MAP_SETTING_ATTRIBUTES.mapOptions;
  const value = jsonOrRaw(givenAttribute(element, name));
  if (value === undefined) return undefined;
  checkMapOptionsAttribute(value, child(ELEMENT, name));
  return value;
}
