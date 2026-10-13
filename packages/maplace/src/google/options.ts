/// <reference types="google.maps" />
import { child, type Field, mustBe, reject, root } from "../validate/fail";
import { type Assert, recordOf } from "../validate/record";
import { checkNonEmptyString, checkObject, isElement, oneOf, optional } from "../validate/values";

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

type ColorScheme = NonNullable<GoogleAdapterOptions["colorScheme"]>;

/** maplace's colour scheme names, as Google spells them. */
export const GOOGLE_COLOR_SCHEMES: Readonly<Record<ColorScheme, google.maps.ColorSchemeString>> = {
  light: "LIGHT",
  dark: "DARK",
  "follow-system": "FOLLOW_SYSTEM",
};

export function checkGoogleOptions(value: unknown): asserts value is GoogleAdapterOptions {
  const field = child(root("createGoogleAdapter"), "options");
  checkOptionFields(value, field);
  if (value.map !== undefined) refuseCreatedMapOptions(value, field);
}

/** Why each `SetElsewhere` key is refused in `mapOptions`; complete, so type and check agree. */
const SET_ELSEWHERE: Readonly<Record<SetElsewhere, string>> = {
  center: "is set by the store's view",
  zoom: "is set by the store's view",
  mapId: "is its own option: createGoogleAdapter({ mapId })",
  colorScheme: "is its own option: createGoogleAdapter({ colorScheme })",
  styles: "is not offered: style the map in Cloud Console, through its map ID",
};

function checkMapOptions(value: unknown, field: Field): void {
  checkObject(value, field);
  for (const [key, remark] of Object.entries(SET_ELSEWHERE)) {
    if (key in value) reject(child(field, key), remark);
  }
}

/** Duck-typed, so checking never reads the `google` global: a map whose element is an element. */
function checkPageMap(value: unknown, field: Field): void {
  if (!isPageMap(value)) mustBe(field, "a Google map (google.maps.Map)", value);
}

function isPageMap(value: unknown): boolean {
  if (typeof value !== "object" || value === null || !("getDiv" in value)) return false;
  return typeof value.getDiv === "function" && isElement(value.getDiv());
}

const checkOptionFields: Assert<GoogleAdapterOptions> = recordOf<GoogleAdapterOptions>({
  checks: {
    mapId: checkNonEmptyString,
    colorScheme: optional(oneOf(Object.keys(GOOGLE_COLOR_SCHEMES))),
    map: optional(checkPageMap),
    mapOptions: optional(checkMapOptions),
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
