import type { Adapter } from "../adapter";
import { assembleMapLibreAdapter } from "./assemble";
import { createMapState } from "./map-state";
import { checkMapLibreOptions, type MapLibreAdapterOptions } from "./options";

/**
 * maplace's adapter for MapLibre GL JS, on OpenFreeMap's tiles unless `mapStyle` names others;
 * maplibre-gl is loaded when it mounts.
 */
export function createMapLibreAdapter(options: MapLibreAdapterOptions = {}): Adapter {
  checkMapLibreOptions(options);
  return assembleMapLibreAdapter(options, createMapState());
}
