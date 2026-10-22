import {
  mapLibreMapWith,
  type createMapLibreMap as realCreateMapLibreMap,
} from "../../maplibre/maplibre-map";
import type { FakeAdapters } from "../fake/adapters";

/**
 * `maplace/maplibre` on the fake adapter, as the example runners mock it: every adapter it makes,
 * `createMapLibreMap`'s too, is among `adapters.made`.
 */
export function fakeMapLibreEntry({ createAdapter }: FakeAdapters) {
  const createMapLibreMap: typeof realCreateMapLibreMap = (container, options) =>
    mapLibreMapWith(createAdapter, container, options);
  return { createMapLibreAdapter: createAdapter, createMapLibreMap };
}
