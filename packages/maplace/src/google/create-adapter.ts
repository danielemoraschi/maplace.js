/// <reference types="google.maps" preserve="true" />
import type { Adapter } from "../adapter";
import { assembleGoogleAdapter } from "./assemble";
import { createMapState } from "./map-state";
import { mapsJsOptionConflict } from "./maps-js-options";
import { addedMapsLoading, pageMapsLoading } from "./maps-loading";
import type { MapsScriptLoad } from "./maps-script";
import { mountAfter } from "./mount-after";
import { checkGoogleOptions, type GoogleAdapterOptions } from "./options";

/**
 * A map provider on Google Maps. It imports the libraries it needs through
 * `google.maps.importLibrary`: from the Maps JS the page loaded (Google's bootstrap or
 * js-api-loader), or, given `apiKey`, from the Maps JS it adds itself as the map mounts.
 */
export function createGoogleAdapter(options: GoogleAdapterOptions = {}): Adapter {
  checkGoogleOptions(options);
  const adapter = assembleGoogleAdapter(options, createMapState());
  if (options.apiKey === undefined) return adapter;
  return mountAfter(adapter, ({ container }) =>
    pageOrAddedMapsJs(options, container.ownerDocument),
  );
}

/** The page's Maps JS if it has one, compared with `script`; otherwise Maps JS added for it. */
function pageOrAddedMapsJs(script: MapsScriptLoad, document: Document): Promise<void> {
  const onPage = pageMapsLoading(script, document, mapsJsOptionConflict);
  return onPage ?? addedMapsLoading(script, document);
}
