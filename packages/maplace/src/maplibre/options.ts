import type { Map as MapLibreMap, MapOptions, StyleSpecification } from "maplibre-gl";
import { CONTROL_POSITIONS, type ControlPosition } from "../adapter";
import { child, type Field, mustBe, reject, root } from "../validate/fail";
import { GOOGLE_NAMES_ON_MAPLIBRE } from "../validate/google-map-option-names";
import { type Assert, recordOf } from "../validate/record";
import { refusedKeysCheck, ZERO_TWO_MAP_OPTIONS } from "../validate/refused-keys";
import {
  checkNonBlankString,
  checkNonEmptyString,
  isElement,
  members,
  oneOf,
  optional,
} from "../validate/values";

/** MapLibre's map options maplace sets elsewhere: kept out of `mapOptions`, by type and by check. */
type SetElsewhere = "container" | "style" | "center" | "zoom" | "bounds";

export interface MapLibreAdapterOptions {
  /**
   * The map's style: a style URL, or a style object. Left out, a map maplace creates draws
   * OpenFreeMap's `bright` style (free, no key, OpenStreetMap data).
   */
  readonly mapStyle?: string | StyleSpecification | undefined;
  /**
   * Draw on the page's own map instead of creating one: maplace never moves it in the page or
   * removes it, and the store's view still sets its camera. Its own style applies.
   */
  readonly map?: MapLibreMap | undefined;
  /**
   * Extra options for a map maplace creates; refused with the page's own `map`. Its `minZoom`
   * and `maxZoom` are MapLibre's, one below maplace's zoom.
   */
  readonly mapOptions?: Omit<MapOptions, SetElsewhere> | undefined;
  /**
   * The earth as a globe, with a toggle on the map to flatten it and back: `true` for the toggle
   * top-left, named "Globe". MapLibre's globe turns flat by itself once zoomed in past a city.
   * Refused with the page's own `map`, which keeps its own projection.
   */
  readonly globe?: true | MapLibreGlobe | undefined;
}

/** The globe's toggle: its corner (default top-left) and its words (default "Globe"). */
export interface MapLibreGlobe {
  readonly position?: ControlPosition | undefined;
  readonly label?: string | undefined;
}

/** What `mapOptions` takes: MapLibre's map options without those maplace sets elsewhere. */
type CreatedMapOptions = NonNullable<MapLibreAdapterOptions["mapOptions"]>;

/** Why map options leave out the keys maplace itself sets. */
const SET_BY_MAPLACE: Readonly<Record<SetElsewhere, string>> = {
  container: "is the element the store attaches the map to",
  style: "is its own option: createMapLibreAdapter({ mapStyle })",
  center: "is set by the store's view",
  zoom: "is set by the store's view",
  bounds: "is set by the store's view",
};

/** Checks map options for a map maplace creates: an object, none of `SetElsewhere`, nor Google's. */
const checkCreatedMapOptions: Assert<CreatedMapOptions> = refusedKeysCheck(
  { ...SET_BY_MAPLACE, ...GOOGLE_NAMES_ON_MAPLIBRE, ...ZERO_TWO_MAP_OPTIONS },
  "an object",
);

export function checkMapLibreOptions(value: unknown): asserts value is MapLibreAdapterOptions {
  const field = child(root("createMapLibreAdapter"), "options");
  checkOptionFields(value, field);
  if (value.map !== undefined) refuseCreatedMapOptions(value, field);
}

/** A style URL that isn't empty, or a style object. */
function checkMapStyle(value: unknown, field: Field): void {
  if (typeof value === "string") checkNonEmptyString(value, field);
  else if (typeof value !== "object" || value === null) {
    mustBe(field, "a style URL or a style object", value);
  }
}

/** Duck-typed, so checking never loads maplibre-gl: a map whose container is an element. */
function checkPageMap(value: unknown, field: Field): void {
  if (!isPageMap(value)) mustBe(field, "a MapLibre map (maplibregl.Map)", value);
}

function isPageMap(value: unknown): boolean {
  if (typeof value !== "object" || value === null || !("getContainer" in value)) return false;
  return typeof value.getContainer === "function" && isElement(value.getContainer());
}

const checkGlobeOptions: Assert<MapLibreGlobe> = recordOf<MapLibreGlobe>({
  checks: {
    position: optional(oneOf(members(CONTROL_POSITIONS))),
    label: optional(checkNonBlankString),
  },
  unknown: "is not a globe option",
  expected: "true or an object",
});

const checkOptionFields: Assert<MapLibreAdapterOptions> = recordOf<MapLibreAdapterOptions>({
  checks: {
    mapStyle: optional(checkMapStyle),
    map: optional(checkPageMap),
    mapOptions: optional(checkCreatedMapOptions),
    globe: optional((value, field) => value === true || checkGlobeOptions(value, field)),
  },
  unknown: "is not a MapLibre adapter option",
  remarks: {
    style: "is not an option: the map's style is mapStyle",
    maplibre: "is not an option: MapLibre's map options go in mapOptions",
  },
  expected: "an object of MapLibre adapter options",
});

/** The page's own map keeps the style, options and projection the page gave it. */
function refuseCreatedMapOptions(options: MapLibreAdapterOptions, field: Field): void {
  for (const key of ["mapStyle", "mapOptions", "globe"] as const) {
    if (options[key] === undefined) continue;
    const instead =
      key === "globe"
        ? "your own map keeps its projection (setProjection)"
        : "set it on your own map";
    reject(child(field, key), `is for a map maplace creates: ${instead}`);
  }
}
