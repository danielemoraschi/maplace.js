import {
  checkShortcutOptions,
  type MapList,
  optionsField,
  type ShortcutNames,
  type ShortcutOptions,
  type SplitOptions,
} from "../shortcut/shortcut-options";
import { child, reject } from "../validate/fail";
import type { MapLibreAdapterOptions } from "./options";

/** maplace's list on the map, in a corner, or in an element of the page. */
export type MapLibreMapList<Data = unknown> = MapList<Data>;

/**
 * A store's options and a MapLibre adapter's, and the list to show. The page's own `map` is left
 * out: a page drawing on its own map has the adapter in hand, so it takes the parts.
 */
export interface MapLibreMapOptions<Data = unknown>
  extends ShortcutOptions<Data>,
    Omit<MapLibreAdapterOptions, "map"> {}

/** The options `createMapLibreMap` hands to `createMapLibreAdapter`; the rest go to the store. */
type AdapterKey = "mapStyle" | "mapOptions";

export const MAPLIBRE_MAP_NAMES: ShortcutNames = {
  shortcut: "createMapLibreMap",
  adapterFactory: "createMapLibreAdapter",
};

/**
 * What `createMapLibreMap` itself takes, before anything is made. A style URL as `style` is told
 * where it goes: the store's `style` is the default shape style.
 */
export function checkMapLibreMapOptions<Data = unknown>(
  options: unknown,
): asserts options is MapLibreMapOptions<Data> {
  checkShortcutOptions<Data>(options, MAPLIBRE_MAP_NAMES);
  if (typeof (options as { style?: unknown }).style === "string") {
    const field = child(optionsField(MAPLIBRE_MAP_NAMES), "style");
    reject(field, "is the shapes' default style: the map's style URL is mapStyle");
  }
}

/** The store's options, the adapter's and the list, each part refusing keys it doesn't know. */
export function splitMapLibreMapOptions<Data>(
  options: MapLibreMapOptions<Data>,
): SplitOptions<Data, Pick<MapLibreAdapterOptions, AdapterKey>> {
  const { mapStyle, mapOptions, list, ...storeOptions } = options;
  return { storeOptions, adapterOptions: { mapStyle, mapOptions }, list };
}
