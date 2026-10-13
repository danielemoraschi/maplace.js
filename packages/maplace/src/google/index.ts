import type { Adapter } from "../adapter";
import { assembleGoogleAdapter } from "./assemble";
import { createMapState } from "./map-state";
import { checkGoogleOptions, type GoogleAdapterOptions } from "./options";

export type { GoogleAdapterOptions } from "./options";

/**
 * A map provider on Google Maps. Expects the page to have loaded Maps JS (Google's bootstrap or
 * js-api-loader): it imports the libraries it needs through `google.maps.importLibrary`.
 */
export function createGoogleAdapter(options: GoogleAdapterOptions): Adapter {
  checkGoogleOptions(options);
  return assembleGoogleAdapter(options, createMapState());
}
