/// <reference types="google.maps" preserve="true" />
import { child, type Field, mustBe, reject, root } from "../validate/fail";
import { type Assert, recordOf } from "../validate/record";
import {
  checkNonEmptyString,
  checkObject,
  checkOneOf,
  isElement,
  optional,
} from "../validate/values";

/** Google's map options maplace sets elsewhere: kept out of `mapOptions`, by type and by check. */
type SetElsewhere = "mapId" | "colorScheme" | "center" | "zoom" | "styles";

export interface GoogleAdapterOptions {
  /**
   * Required for Advanced Markers; `DEMO_MAP_ID` works for development. Styling lives in Cloud
   * Console.
   */
  readonly mapId: string;
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
  const refused = Object.entries(remarks);
  return (value, field) => {
    checkObject(value, field, expected);
    for (const [key, remark] of refused) {
      if (key in value) reject(child(field, key), remark);
    }
  };
}

const ADAPTER_OWN_SETTINGS: OwnSettingRemarks = {
  mapId: "is its own option: createGoogleAdapter({ mapId })",
  colorScheme: "is its own option: createGoogleAdapter({ colorScheme })",
};

export function checkGoogleOptions(value: unknown): asserts value is GoogleAdapterOptions {
  const field = child(root("createGoogleAdapter"), "options");
  checkOptionFields(value, field);
  if (value.map !== undefined) refuseCreatedMapOptions(value, field);
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
    mapId: checkNonEmptyString,
    colorScheme: optional(checkColorScheme),
    map: optional(checkPageMap),
    mapOptions: optional(mapOptionsCheck(ADAPTER_OWN_SETTINGS)),
  },
  unknown: "is not a Google adapter option",
  remarks: { google: "is not an option: Google's map options go in mapOptions" },
  expected: "an object with a mapId",
});

/** The page's own map keeps the options and colour scheme the page gave it. */
function refuseCreatedMapOptions(options: GoogleAdapterOptions, field: Field): void {
  for (const key of ["mapOptions", "colorScheme"] as const) {
    if (options[key] !== undefined) {
      reject(child(field, key), "is for a map maplace creates: set it on your own map");
    }
  }
}
