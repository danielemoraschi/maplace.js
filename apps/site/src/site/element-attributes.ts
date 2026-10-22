import { LIST_ATTRIBUTES } from "../../../../packages/maplace/src/element/element-list.ts";
import { SCRIPT_ATTRIBUTES } from "../../../../packages/maplace/src/element/google-attributes.ts";
import { MAP_SETTING_ATTRIBUTES } from "../../../../packages/maplace/src/element/map-settings-watch.ts";

/**
 * The attributes the element reads by a literal name, kept in no list of its own:
 * element-attributes.test.ts finds each in the element's source, so a rename fails there.
 */
const MAP_READS = ["provider", "cluster", "hold", "selected-id"] as const;
const GOOGLE_PROVIDER_READS = ["map-id", "nonce"] as const;

export const ATTRIBUTES_READ_BY_NAME: readonly string[] = [...MAP_READS, ...GOOGLE_PROVIDER_READS];

/** The attributes `<maplace-map>` reads itself, whatever its provider. */
export const MAP_ATTRIBUTES: readonly string[] = [...LIST_ATTRIBUTES, ...MAP_READS];

/** The attributes the element's Google provider reads, when the map opens. */
export const GOOGLE_PROVIDER_ATTRIBUTES: readonly string[] = [
  ...GOOGLE_PROVIDER_READS,
  MAP_SETTING_ATTRIBUTES.colorScheme,
  MAP_SETTING_ATTRIBUTES.mapOptions,
  ...Object.values(SCRIPT_ATTRIBUTES),
];
