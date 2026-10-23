import type { MaplaceError } from "../errors";
import { canImportLibraries } from "./libraries";
import { addMapsScript, type MapsScriptLoad, mapsReadyFrom, pageMapsScript } from "./maps-script";
import {
  conflictingSetting,
  type MapsScriptRequest,
  type MapsSetting,
  requestIn,
} from "./maps-script-url";

/**
 * Maps JS already on the page, or on its way: the page's tag, whoever added it, or a loader with
 * no tag of its own (Google's inline bootstrap, js-api-loader), taken as it is. Undefined when
 * nothing on the page loads it. A tag asked for another key, version, language or region than it
 * loaded with throws `conflictError`'s error: every map on a page shares one Maps JS. `nonce`
 * is each map's own to set, so it is never compared.
 */
export function pageMapsLoading(
  request: MapsScriptRequest,
  document: Document,
  conflictError: (setting: MapsSetting) => MaplaceError,
): Promise<void> | undefined {
  const loaded = pageMapsScript(document);
  if (loaded !== null) {
    const setting = conflictingSetting(request, requestIn(loaded.src));
    if (setting !== undefined) throw conflictError(setting);
    return mapsReadyFrom(loaded);
  }
  return canImportLibraries() ? Promise.resolve() : undefined;
}

/** Adds Maps JS for `script` to the page, resolving once it can import libraries. */
export function addedMapsLoading(script: MapsScriptLoad, document: Document): Promise<void> {
  return mapsReadyFrom(addMapsScript(script, document));
}
