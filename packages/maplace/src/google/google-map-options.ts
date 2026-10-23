import {
  checkShortcutOptions,
  type MapList,
  type ShortcutNames,
  type ShortcutOptions,
  type SplitOptions,
} from "../shortcut/shortcut-options";
import type { MapsJsOptions } from "./maps-js-options";
import type { GoogleAdapterOptions } from "./options";

/** maplace's list on the map, in a corner, or in an element of the page. */
export type GoogleMapList<Data = unknown> = MapList<Data>;

/**
 * A store's options and a Google adapter's, and the list to show. The page's own `map` is left
 * out: a page drawing on its own map has the adapter in hand, so it takes the parts.
 */
export interface GoogleMapOptions<Data = unknown>
  extends ShortcutOptions<Data>,
    Omit<GoogleAdapterOptions, "map"> {}

/** The options `createGoogleMap` hands to `createGoogleAdapter`; the rest go to the store. */
type AdapterKey = "mapId" | "colorScheme" | "mapOptions" | keyof MapsJsOptions;

export const GOOGLE_MAP_NAMES: ShortcutNames = {
  shortcut: "createGoogleMap",
  adapterFactory: "createGoogleAdapter",
};

/** What `createGoogleMap` itself takes, before anything is made. */
export function checkGoogleMapOptions<Data = unknown>(
  options: unknown,
): asserts options is GoogleMapOptions<Data> {
  checkShortcutOptions<Data>(options, GOOGLE_MAP_NAMES);
}

/** The store's options, the adapter's and the list, each part refusing keys it doesn't know. */
export function splitGoogleMapOptions<Data>(
  options: GoogleMapOptions<Data>,
): SplitOptions<Data, Pick<GoogleAdapterOptions, AdapterKey>> {
  const {
    mapId,
    colorScheme,
    mapOptions,
    list,
    apiKey,
    version,
    language,
    region,
    nonce,
    ...storeOptions
  } = options;
  const adapterOptions = {
    mapId,
    colorScheme,
    mapOptions,
    apiKey,
    version,
    language,
    region,
    nonce,
  };
  return { storeOptions, adapterOptions, list };
}
