import type { MapsScriptLoad } from "../google/maps-script";
import type { MapsScriptRequest } from "../google/maps-script-url";
import type { GoogleAdapterOptions } from "../google/options";
import { givenAttribute } from "./attribute-values";
import { elementMisuse } from "./element-error";
import { createdMapSettingsOf } from "./google-map-attributes";

/** The attribute each Maps JS setting is read from. */
export const SCRIPT_ATTRIBUTES = {
  key: "api-key",
  version: "version",
  language: "language",
  region: "region",
} as const satisfies Record<keyof MapsScriptRequest, string>;

/** The element's Google settings: the adapter's options, and the Maps JS it asks for. */
export interface GoogleSettings {
  readonly adapterOptions: GoogleAdapterOptions;
  readonly script: MapsScriptLoad;
}

/** The Google settings `element`'s attributes give; a missing `map-id` or a bad value is misuse. */
export function googleSettingsOf(element: Element): GoogleSettings {
  const mapId = requiredMapId(element);
  const read = (name: string) => givenAttribute(element, name);
  return {
    adapterOptions: { mapId, ...createdMapSettingsOf(element) },
    script: {
      key: read(SCRIPT_ATTRIBUTES.key),
      version: read(SCRIPT_ATTRIBUTES.version),
      language: read(SCRIPT_ATTRIBUTES.language),
      region: read(SCRIPT_ATTRIBUTES.region),
      nonce: read("nonce"),
    },
  };
}

function requiredMapId(element: Element): string {
  const mapId = givenAttribute(element, "map-id");
  if (mapId !== undefined) return mapId;
  throw elementMisuse(`map-id is required ("DEMO_MAP_ID", Google's demo map ID, for development)`, {
    field: "map-id",
  });
}
