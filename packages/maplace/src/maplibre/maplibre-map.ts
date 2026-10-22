import type { Adapter } from "../adapter";
import type { Maplace } from "../index";
import { createShortcutMap } from "../shortcut/map-shortcut";
import { createMapLibreAdapter } from "./create-adapter";
import {
  checkMapLibreMapOptions,
  MAPLIBRE_MAP_NAMES,
  type MapLibreMapOptions,
  splitMapLibreMapOptions,
} from "./maplibre-map-options";
import type { MapLibreAdapterOptions } from "./options";

export type { MapLibreMapList, MapLibreMapOptions } from "./maplibre-map-options";

type AdapterFactory = (options: MapLibreAdapterOptions) => Adapter;

/**
 * A store on a MapLibre map in one call: attached to `container` (an element or a selector), on
 * OpenFreeMap's tiles unless `mapStyle` names others, with its list when `list` asks for one.
 * `destroy()` takes the map and its list down.
 */
export function createMapLibreMap<Data = unknown>(
  container: HTMLElement | string,
  options: MapLibreMapOptions<Data> = {},
): Maplace<Data> {
  return mapLibreMapWith(createMapLibreAdapter, container, options);
}

/**
 * `createMapLibreMap` on the adapter `createAdapter` makes. Exported for the example runners, which
 * run the examples on the fake adapter; never from the entry.
 */
export function mapLibreMapWith<Data>(
  createAdapter: AdapterFactory,
  container: HTMLElement | string,
  options: MapLibreMapOptions<Data> = {},
): Maplace<Data> {
  checkMapLibreMapOptions<Data>(options);
  const split = splitMapLibreMapOptions(options);
  return createShortcutMap({ names: MAPLIBRE_MAP_NAMES, container, split, createAdapter });
}
