import {
  googleMapWith,
  type createGoogleMap as realCreateGoogleMap,
} from "../../google/google-map";
import type { FakeAdapters } from "../fake/adapters";

/**
 * `maplace/google` on the fake adapter, as the example runners mock it: every adapter it makes,
 * `createGoogleMap`'s too, is among `adapters.made`.
 */
export function fakeGoogleEntry({ createAdapter }: FakeAdapters) {
  const createGoogleMap: typeof realCreateGoogleMap = (container, options) =>
    googleMapWith(createAdapter, container, options);
  return { createGoogleAdapter: createAdapter, createGoogleMap };
}
