import {
  googleMapWith,
  type createGoogleMap as realCreateGoogleMap,
} from "../../google/google-map";
import { createFakeAdapter, type FakeAdapter } from "../fake-adapter";

/**
 * `maplace/google` on the fake adapter, as the example runners mock it: each adapter made is
 * pushed to `made`, `createGoogleMap`'s too.
 */
export function fakeGoogleEntry(made: FakeAdapter[]) {
  const createGoogleAdapter = () => {
    const adapter = createFakeAdapter();
    made.push(adapter);
    return adapter;
  };
  const createGoogleMap: typeof realCreateGoogleMap = (container, options) =>
    googleMapWith(createGoogleAdapter, container, options);
  return { createGoogleAdapter, createGoogleMap };
}
