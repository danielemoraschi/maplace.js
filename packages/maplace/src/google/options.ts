/// <reference types="google.maps" preserve="true" />
import { child, type Field, mustBe, reject, root } from "../validate/fail";
import { type Assert, recordOf } from "../validate/record";
import { refusedKeysCheck } from "../validate/refused-keys";
import { checkNonEmptyString, checkOneOf, isElement, optional } from "../validate/values";
import {
  MAPS_JS_CHECKS,
  MAPS_JS_OPTION_NAMES,
  type MapsJsOptions,
  refuseMapsJsWithoutKey,
} from "./maps-js-options";

/** Google's map options maplace sets elsewhere: kept out of `mapOptions`, by type and by check. */
type SetElsewhere = "mapId" | "colorScheme" | "center" | "zoom" | "styles";

export interface GoogleAdapterOptions extends MapsJsOptions {
  /**
   * The map ID Advanced Markers need, and Cloud styling hangs on. Left out, a map maplace creates
   * uses Google's `DEMO_MAP_ID`, for development, and warns once in the console.
   */
  readonly mapId?: string | undefined;
  /** For a map maplace creates; the page's own `map` keeps its own. */
  readonly colorScheme?: "light" | "dark" | "follow-system" | undefined;
  /**
   * Draw on the page's own map instead of creating one: maplace never moves it in the page or
   * removes it, and the store's view still sets its camera. Its own map ID applies.
   */
  readonly map?: google.maps.Map | undefined;
  /** Extra options for a map maplace creates; refused with the page's own `map`. */
  readonly mapOptions?: Omit<google.maps.MapOptions, SetElsewhere> | undefined;
}

export type ColorScheme = NonNullable<GoogleAdapterOptions["colorScheme"]>;

/** What `mapOptions` takes: Google's map options without those maplace sets elsewhere. */
export type CreatedMapOptions = NonNullable<GoogleAdapterOptions["mapOptions"]>;

/** Where the caller takes a map ID and a colour scheme instead of map options, as told the page. */
type OwnSettingRemarks = Readonly<Record<"mapId" | "colorScheme", string>>;

/** maplace's colour scheme names, as Google spells them. */
export const GOOGLE_COLOR_SCHEMES: Readonly<Record<ColorScheme, google.maps.ColorSchemeString>> = {
  light: "LIGHT",
  dark: "DARK",
  "follow-system": "FOLLOW_SYSTEM",
};

const COLOR_SCHEMES = Object.keys(GOOGLE_COLOR_SCHEMES) as ColorScheme[];

export const checkColorScheme: Assert<ColorScheme> = (value, field) =>
  checkOneOf(value, field, COLOR_SCHEMES);

/** Why map options leave out the keys maplace itself sets, whoever gives them. */
const SET_BY_MAPLACE = {
  center: "is set by the store's view",
  zoom: "is set by the store's view",
  styles: "is not offered: style the map in Cloud Console, through its map ID",
} as const satisfies Record<Exclude<SetElsewhere, keyof OwnSettingRemarks>, string>;

/** Checks map options for a map maplace creates: an object (`expected`), none of `SetElsewhere`. */
export function mapOptionsCheck(
  own: OwnSettingRemarks,
  expected = "an object",
): Assert<CreatedMapOptions> {
  const remarks: Readonly<Record<SetElsewhere, string>> = { ...SET_BY_MAPLACE, ...own };
  return refusedKeysCheck(remarks, expected);
}

const ADAPTER_OWN_SETTINGS: OwnSettingRemarks = {
  mapId: "is its own option: createGoogleAdapter({ mapId })",
  colorScheme: "is its own option: createGoogleAdapter({ colorScheme })",
};

export function checkGoogleOptions(value: unknown): asserts value is GoogleAdapterOptions {
  const field = child(root("createGoogleAdapter"), "options");
  checkOptionFields(value, field);
  if (value.map !== undefined) refuseCreatedMapOptions(value, field);
  refuseMapsJsWithoutKey(value, field);
}

/**
 * Duck-typed, so checking never reads the `google` global: a map whose element is an element, or
 * that has none because Google disabled it (it refused the key), which its load then reports.
 */
function checkPageMap(value: unknown, field: Field): void {
  if (!isPageMap(value)) mustBe(field, "a Google map (google.maps.Map)", value);
}

function isPageMap(value: unknown): boolean {
  if (typeof value !== "object" || value === null || !("getDiv" in value)) return false;
  if (typeof value.getDiv !== "function") return false;
  const element: unknown = value.getDiv();
  return element === undefined || isElement(element);
}

const checkOptionFields: Assert<GoogleAdapterOptions> = recordOf<GoogleAdapterOptions>({
  checks: {
    mapId: optional(checkNonEmptyString),
    colorScheme: optional(checkColorScheme),
    map: optional(checkPageMap),
    mapOptions: optional(mapOptionsCheck(ADAPTER_OWN_SETTINGS)),
    ...MAPS_JS_CHECKS,
  },
  unknown: "is not a Google adapter option",
  remarks: { google: "is not an option: Google's map options go in mapOptions" },
  expected: "an object of Google adapter options",
});

/**
 * For a map maplace creates, each group with why: the page's own map has its own options and
 * colour scheme, and its page loaded Maps JS.
 */
const CREATED_MAP_ONLY: readonly (readonly [readonly (keyof GoogleAdapterOptions)[], string])[] = [
  [["mapOptions", "colorScheme"], "is for a map maplace creates: set it on your own map"],
  [MAPS_JS_OPTION_NAMES, "is for a map maplace creates: your map's page loaded Maps JS"],
];

/** The page's own map keeps the options and colour scheme the page gave it, and its Maps JS. */
function refuseCreatedMapOptions(options: GoogleAdapterOptions, field: Field): void {
  for (const [keys, remark] of CREATED_MAP_ONLY) {
    for (const key of keys) if (options[key] !== undefined) reject(child(field, key), remark);
  }
}
