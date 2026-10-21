import type { Adapter } from "../adapter";
import type { Maplace } from "../index";
import { createShortcutMap } from "../shortcut/map-shortcut";
import { createGoogleAdapter } from "./create-adapter";
import {
  checkGoogleMapOptions,
  GOOGLE_MAP_NAMES,
  type GoogleMapOptions,
  splitGoogleMapOptions,
} from "./google-map-options";
import type { GoogleAdapterOptions } from "./options";

export type { GoogleMapList, GoogleMapOptions } from "./google-map-options";

type AdapterFactory = (options: GoogleAdapterOptions) => Adapter;

/**
 * A store on a Google map in one call, as 0.2's `new Maplace(options).Load()`: attached to
 * `container` (an element or a selector), with its list when `list` asks for one. `destroy()`
 * takes the map and its list down.
 */
export function createGoogleMap<Data = unknown>(
  container: HTMLElement | string,
  options: GoogleMapOptions<Data> = {},
): Maplace<Data> {
  return googleMapWith(createGoogleAdapter, container, options);
}

/**
 * `createGoogleMap` on the adapter `createAdapter` makes. Exported for the example runners, which
 * run the examples on the fake adapter; never from the entry.
 */
export function googleMapWith<Data>(
  createAdapter: AdapterFactory,
  container: HTMLElement | string,
  options: GoogleMapOptions<Data> = {},
): Maplace<Data> {
  checkGoogleMapOptions<Data>(options);
  const split = splitGoogleMapOptions(options);
  return createShortcutMap({ names: GOOGLE_MAP_NAMES, container, split, createAdapter });
}
