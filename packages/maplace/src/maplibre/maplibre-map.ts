import type { Maplace } from "../index";
import { createShortcutMap } from "../shortcut/map-shortcut";
import { createMapLibreAdapter } from "./create-adapter";
import {
  checkMapLibreMapOptions,
  MAPLIBRE_MAP_NAMES,
  type MapLibreMapOptions,
  splitMapLibreMapOptions,
} from "./maplibre-map-options";

export type { MapLibreMapList, MapLibreMapOptions } from "./maplibre-map-options";

/**
 * A store on a MapLibre map in one call: attached to `container` (an element or a selector), on
 * OpenFreeMap's tiles unless `mapStyle` names others, with its list when `list` asks for one.
 * `destroy()` takes the map and its list down.
 */
export function createMapLibreMap<Data = unknown>(
  container: HTMLElement | string,
  options: MapLibreMapOptions<Data> = {},
): Maplace<Data> {
  checkMapLibreMapOptions<Data>(options);
  const split = splitMapLibreMapOptions(options);
  return createShortcutMap({
    names: MAPLIBRE_MAP_NAMES,
    container,
    split,
    createAdapter: createMapLibreAdapter,
  });
}
