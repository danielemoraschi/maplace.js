import type { MapsScriptLoad } from "../google/maps-script";
import type { MapsScriptRequest } from "../google/maps-script-url";
import type { GoogleAdapterOptions } from "../google/options";
import { givenAttribute } from "./attribute-values";
import { createdMapSettingsOf } from "./google-map-attributes";

/** The attribute each Maps JS setting is read from. */
export const SCRIPT_ATTRIBUTES = {
  apiKey: "api-key",
  version: "version",
  language: "language",
  region: "region",
} as const satisfies Record<keyof MapsScriptRequest, string>;

/** The element's Google settings: the adapter's options, and the Maps JS it asks for. */
export interface GoogleSettings {
  readonly adapterOptions: GoogleAdapterOptions;
  readonly script: MapsScriptLoad;
}

/** The Google settings `element`'s attributes give; a bad value is misuse. */
export function googleSettingsOf(element: Element): GoogleSettings {
  const read = (name: string) => givenAttribute(element, name);
  return {
    adapterOptions: { mapId: read("map-id"), ...createdMapSettingsOf(element) },
    script: {
      apiKey: read(SCRIPT_ATTRIBUTES.apiKey),
      version: read(SCRIPT_ATTRIBUTES.version),
      language: read(SCRIPT_ATTRIBUTES.language),
      region: read(SCRIPT_ATTRIBUTES.region),
      nonce: read("nonce"),
    },
  };
}
