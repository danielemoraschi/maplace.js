import type { PolygonRings } from "../geometry";
import type {
  CircleLocation,
  Location,
  MarkerLocation,
  MultiPolygonLocation,
  PolygonLocation,
  PolylineLocation,
} from "../location";
import { child, type Field, item, mustBe, reject, root } from "./fail";
import { checkLatLng, LATITUDE, LONGITUDE, pathOf } from "./geometry";
import { OLD_LOCATION_FIELDS } from "./migration";
import { type Assert, recordOf } from "./record";
import { checkLineStyle, checkShapeStyle, shapeStyleChecks } from "./style";
import {
  arrayOf,
  type Check,
  checkBoolean,
  checkNonEmptyString,
  checkObject,
  checkOneOf,
  checkRenderable,
  checkString,
  checkTags,
  NON_NEGATIVE,
  numberIn,
  optional,
  POSITIVE,
} from "./values";
import { checkZoom } from "./viewport";

/** Where a location sits in its list, and the store's `sanitize` option (`html` needs one). */
export interface LocationContext {
  readonly index: number;
  readonly sanitize: unknown;
}

type LocationType = NonNullable<Location["type"]>;
/** The keys of every location type: `keyof` a union keeps only those they share. */
type CommonKey = keyof Location;
/** Checks for the fields only locations of type `T` have. */
type OwnChecks<T> = Readonly<Record<Exclude<keyof T, CommonKey>, Check>>;

/** Checked before the record (`id`, `type`) or yours (`data`). */
const UNCHECKED = ["id", "type", "data"] as const;

const COMMON_CHECKS = {
  title: optional(checkString),
  content: optional(checkRenderable),
  html: optional(checkString),
  group: optional(checkString),
  tags: optional(checkTags),
  searchText: optional(checkString),
  visible: optional(checkBoolean),
  listed: optional(checkBoolean),
  zoom: optional(checkZoom),
  editable: optional(checkBoolean),
} satisfies Readonly<Record<Exclude<CommonKey, (typeof UNCHECKED)[number]>, Check>>;

/** A polygon's rings, on their own or as one of a multipolygon's polygons. */
const RINGS_CHECKS = {
  path: pathOf(3),
  holes: optional(arrayOf("an array of rings", pathOf(3))),
} satisfies Readonly<Record<keyof PolygonRings, Check>>;

const checkRings: Check = recordOf<PolygonRings>({
  checks: RINGS_CHECKS,
  unknown: "is not in a multipolygon's polygon, which is a path and its holes",
});

/** A multipolygon's polygons: at least one, each a polygon's rings. */
function checkPolygons(value: unknown, field: Field): void {
  if (!Array.isArray(value)) mustBe(field, "an array of polygons", value);
  if (value.length === 0) reject(field, "must hold at least 1 polygon, got 0");
  for (const [index, rings] of value.entries()) checkRings(rings, item(field, index));
}

/** Each type's own fields; checks not wrapped in `optional` are required. */
const TYPE_CHECKS: {
  readonly marker: OwnChecks<MarkerLocation>;
  readonly circle: OwnChecks<CircleLocation>;
  readonly polyline: OwnChecks<PolylineLocation>;
  readonly polygon: OwnChecks<PolygonLocation>;
  readonly multipolygon: OwnChecks<MultiPolygonLocation>;
} = {
  marker: {
    lat: numberIn(LATITUDE),
    lng: numberIn(LONGITUDE),
    icon: optional(checkRenderable),
    weight: optional(numberIn(NON_NEGATIVE)),
  },
  circle: { center: checkLatLng, radius: numberIn(POSITIVE), ...shapeStyleChecks(checkShapeStyle) },
  polyline: {
    path: pathOf(2),
    curve: optional(numberIn({ min: -1, max: 1 })),
    geodesic: optional(checkBoolean),
    ...shapeStyleChecks(checkLineStyle),
  },
  polygon: { ...RINGS_CHECKS, ...shapeStyleChecks(checkShapeStyle) },
  multipolygon: { polygons: checkPolygons, ...shapeStyleChecks(checkShapeStyle) },
};

const TYPES = Object.keys(TYPE_CHECKS) as LocationType[];

const RECORD_BY_TYPE = Object.fromEntries(
  TYPES.map((type) => [type, locationRecord(type)]),
) as Readonly<Record<LocationType, Assert<Readonly<Record<string, unknown>>>>>;

/** Throws on the first problem: id, type, unknown fields, each field in order, popup content. */
export function validateLocation(
  value: unknown,
  context: LocationContext,
): asserts value is Location {
  const position = root(`locations[${context.index}]`);
  checkObject(value, position);
  checkNonEmptyString(value.id, child(position, "id"));
  const field = locationRoot(value.id);
  const type = value.type === undefined ? "marker" : value.type;
  checkOneOf(type, child(field, "type"), TYPES);
  const checkRecord: Check = RECORD_BY_TYPE[type];
  checkRecord(value, field);
  checkDrawnLine(value, field);
  refuseEditableMultiPolygon(value, field);
  checkPopupContent(value, field, context.sanitize);
}

/**
 * The fields of a value already known to be a location, by its type's own checks; popup content
 * aside. For locations the store changes itself, such as a geometry the map wrote back.
 */
export function checkLocationFields(location: Location): void {
  const checkRecord: Check = RECORD_BY_TYPE[location.type ?? "marker"];
  checkRecord(location, locationRoot(location.id));
}

export function locationRoot(id: string): Field {
  return root(`location ${JSON.stringify(id)}`, id);
}

function locationRecord(type: LocationType): Assert<Readonly<Record<string, unknown>>> {
  return recordOf<Readonly<Record<string, unknown>>, string>({
    checks: { ...TYPE_CHECKS[type], ...COMMON_CHECKS },
    unchecked: UNCHECKED,
    unknown: "is not a location field; put your own fields in data",
    remarks: { ...OLD_LOCATION_FIELDS, ...misplacedFields(type) },
  });
}

/** Remarks for the fields of the other types: "is a circle field, not a marker field". */
function misplacedFields(type: LocationType): Record<string, string> {
  const owners = new Map<string, LocationType[]>();
  for (const other of TYPES.filter((candidate) => candidate !== type)) {
    for (const key of Object.keys(TYPE_CHECKS[other])) {
      if (!(key in TYPE_CHECKS[type])) owners.set(key, [...(owners.get(key) ?? []), other]);
    }
  }
  return Object.fromEntries(
    [...owners].map(([key, types]) => [key, `is a ${types.join("/")} field, not a ${type} field`]),
  );
}

/**
 * A line bowed by `curve` or along great circles is drawn from points of its own, which an edit
 * would write back as its path: neither is editable, and they don't combine.
 */
function checkDrawnLine(value: Readonly<Record<string, unknown>>, field: Field): void {
  const drawnBy = value.geodesic ? "geodesic" : "curve";
  if (value.geodesic && value.curve)
    reject(child(field, "curve"), "cannot be set together with geodesic");
  if (value[drawnBy] && value.editable)
    reject(child(field, drawnBy), "cannot be set together with editable");
}

/** A multipolygon's polygons share one location: there is no single shape for an edit to change. */
function refuseEditableMultiPolygon(value: Readonly<Record<string, unknown>>, field: Field): void {
  if (value.type === "multipolygon" && value.editable === true) {
    reject(
      child(field, "editable"),
      "is not for a multipolygon: give one of its polygons a location of its own to edit it",
    );
  }
}

function checkPopupContent(
  value: Readonly<Record<string, unknown>>,
  field: Field,
  sanitize: unknown,
): void {
  if (value.html === undefined) return;
  const html = child(field, "html");
  if (value.content !== undefined) reject(html, "cannot be set together with content; use one");
  if (typeof sanitize !== "function") {
    reject(html, "needs the sanitize option", "missing-sanitizer");
  }
}
