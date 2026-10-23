import { addedMapsLoading, pageMapsLoading } from "../google/maps-loading";
import type { MapsScriptLoad } from "../google/maps-script";
import type { MapsSetting } from "../google/maps-script-url";
import { elementMisuse } from "./element-error";
import { SCRIPT_ATTRIBUTES } from "./google-attributes";

/**
 * Maps JS for `script`, once per page however many maps: the page's, whoever loaded it, is
 * shared, and a map asking it for another key, version, language or region is misuse. Without
 * Maps JS on the page, `api-key` is needed to add it.
 */
export function mapsLoadingFor(script: MapsScriptLoad, document: Document): Promise<void> {
  const onPage = pageMapsLoading(script, document, mapsJsAttributeConflict);
  if (onPage !== undefined) return onPage;
  // Google never reports a missing key: the map would draw with Google's warning, and no error.
  if (script.apiKey === undefined) {
    throw elementMisuse("api-key is required to load Google Maps", {
      field: SCRIPT_ATTRIBUTES.apiKey,
    });
  }
  return addedMapsLoading(script, document);
}

function mapsJsAttributeConflict(setting: MapsSetting) {
  const attribute = SCRIPT_ATTRIBUTES[setting];
  return elementMisuse(
    `Google Maps is loaded on this page with another ${attribute}: every map shares one`,
    { field: attribute },
  );
}
