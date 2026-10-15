import type { MapsScriptLoad } from "../google/maps-script";
import type { MapsScriptRequest } from "../google/maps-script-url";
import { elementMisuse } from "./element-error";

/** The attribute each Maps JS setting is read from. */
export const SCRIPT_ATTRIBUTES = {
  key: "api-key",
  version: "version",
  language: "language",
  region: "region",
} as const satisfies Record<keyof MapsScriptRequest, string>;

/** The element's Google settings: its map ID, and the Maps JS it asks for. */
export interface GoogleSettings {
  readonly mapId: string;
  readonly script: MapsScriptLoad;
}

/** The Google settings `element`'s attributes give; a missing `map-id` is misuse. */
export function googleSettingsOf(element: Element): GoogleSettings {
  const mapId = element.getAttribute("map-id");
  if (!mapId) {
    throw elementMisuse(
      `map-id is required ("DEMO_MAP_ID", Google's demo map ID, for development)`,
      {
        field: "map-id",
      },
    );
  }
  // An attribute left empty is not given: an empty api-key would load Maps JS with no key.
  const read = (name: string) => element.getAttribute(name) || undefined;
  return {
    mapId,
    script: {
      key: read(SCRIPT_ATTRIBUTES.key),
      version: read(SCRIPT_ATTRIBUTES.version),
      language: read(SCRIPT_ATTRIBUTES.language),
      region: read(SCRIPT_ATTRIBUTES.region),
      nonce: read("nonce"),
    },
  };
}
