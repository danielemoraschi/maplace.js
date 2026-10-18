import type {
  CircleLocation,
  Location,
  MarkerLocation,
  PolygonLocation,
  PolylineLocation,
} from "../location";
import { child, type Field, reject, root } from "./fail";
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
type CommonKey = keyof MarkerLocation &
  keyof CircleLocation &
  keyof PolylineLocation &
  keyof PolygonLocation;
/** Checks for the fields only locations of type `T` have. */
type OwnChecks<T> = Readonly<Record<Exclude<keyof T, CommonKey>, Check>>;

/** Checked before the record (`id`, `type`) or yours (`data`). */
const UNCHECKED = ["id", "type", "data"] as const;

const COMMON_CHECKS = {
  title: optional(checkString),
  content: optional(checkRenderable),
  html: optional(checkString),
  group: optional(checkString),
  visible: optional(checkBoolean),
  listed: optional(checkBoolean),
  zoom: optional(checkZoom),
  editable: optional(checkBoolean),
} satisfies Readonly<Record<Exclude<CommonKey, (typeof UNCHECKED)[number]>, Check>>;

/** Each type's own fields; checks not wrapped in `optional` are required. */
const TYPE_CHECKS: {
  readonly marker: OwnChecks<MarkerLocation>;
  readonly circle: OwnChecks<CircleLocation>;
  readonly polyline: OwnChecks<PolylineLocation>;
  readonly polygon: OwnChecks<PolygonLocation>;
} = {
  marker: { lat: numberIn(LATITUDE), lng: numberIn(LONGITUDE), icon: optional(checkRenderable) },
  circle: { center: checkLatLng, radius: numberIn(POSITIVE), ...shapeStyleChecks(checkShapeStyle) },
  polyline: { path: pathOf(2), ...shapeStyleChecks(checkLineStyle) },
  polygon: {
    path: pathOf(3),
    holes: optional(arrayOf("an array of rings", pathOf(3))),
    ...shapeStyleChecks(checkShapeStyle),
  },
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
