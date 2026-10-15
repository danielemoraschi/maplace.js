import { canImportLibraries } from "../google/libraries";
import {
  addMapsScript,
  type MapsScriptLoad,
  mapsReadyFrom,
  pageMapsScript,
} from "../google/maps-script";
import { conflictingSetting, requestIn } from "../google/maps-script-url";
import { elementMisuse } from "./element-error";
import { SCRIPT_ATTRIBUTES } from "./google-attributes";

/**
 * Maps JS for `script`, once per page however many maps: the page's tag, whoever added it, is
 * shared, and a map asking it for another key, version, language or region is misuse. A page that
 * loaded Maps JS with no tag of its own (Google's inline bootstrap, js-api-loader) is taken as it
 * is. `nonce` is the page's to set on each map, so it is never compared.
 */
export function mapsLoadingFor(script: MapsScriptLoad, document: Document): Promise<void> {
  const loaded = pageMapsScript(document);
  if (loaded !== null) {
    checkSameMaps(script, loaded);
    return mapsReadyFrom(loaded);
  }
  if (canImportLibraries()) return Promise.resolve();
  // Google never reports a missing key: the map would draw with Google's warning, and no error.
  if (script.key === undefined) {
    throw elementMisuse("api-key is required to load Google Maps", {
      field: SCRIPT_ATTRIBUTES.key,
    });
  }
  return mapsReadyFrom(addMapsScript(script, document));
}

function checkSameMaps(script: MapsScriptLoad, loaded: HTMLScriptElement): void {
  const setting = conflictingSetting(script, requestIn(loaded.src));
  if (setting === undefined) return;
  const attribute = SCRIPT_ATTRIBUTES[setting];
  throw elementMisuse(
    `Google Maps is loaded on this page with another ${attribute}: every map shares one`,
    { field: attribute },
  );
}
