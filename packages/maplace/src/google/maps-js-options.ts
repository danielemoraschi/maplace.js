import { MaplaceError } from "../errors";
import { child, type Field, reject } from "../validate/fail";
import { type Check, checkNonEmptyString, optional } from "../validate/values";
import type { MapsScriptLoad } from "./maps-script";
import type { MapsSetting } from "./maps-script-url";

/**
 * Maps JS's settings as a Google adapter takes them, as the element's attributes give them
 * (`api-key` is `apiKey`): given a key, maplace adds Maps JS to the page itself when the map
 * mounts. Google fixes them once per page.
 */
export type MapsJsOptions = MapsScriptLoad;

const checkSetting = optional(checkNonEmptyString);

/** Each setting's check, for the adapter's own record of option checks: one per setting. */
export const MAPS_JS_CHECKS = {
  apiKey: checkSetting,
  version: checkSetting,
  language: checkSetting,
  region: checkSetting,
  nonce: checkSetting,
} as const satisfies Record<keyof MapsJsOptions, Check>;

/** Every setting, as the adapter's options name them. */
export const MAPS_JS_OPTION_NAMES = Object.keys(MAPS_JS_CHECKS) as (keyof MapsJsOptions)[];

/**
 * Refuses a setting maplace would never use: one given without `apiKey`, as maplace adds Maps JS
 * only with a key.
 */
export function refuseMapsJsWithoutKey(options: MapsJsOptions, field: Field): void {
  if (options.apiKey !== undefined) return;
  const given = MAPS_JS_OPTION_NAMES.find((key) => options[key] !== undefined);
  if (given !== undefined) {
    reject(child(field, given), "is for the Maps JS maplace adds: give apiKey too");
  }
}

/**
 * The page's Maps JS was loaded with another `setting`: found as the map mounts, so a load failure
 * (as a page map without a map ID is), naming the option.
 */
export function mapsJsOptionConflict(setting: MapsSetting): MaplaceError {
  return new MaplaceError(
    "provider-load-failed",
    `createGoogleAdapter: Google Maps is loaded on this page with another ${setting}: every map ` +
      `shares one, so give each the same ${setting}, or leave it out to take the page's`,
    { field: setting },
  );
}
