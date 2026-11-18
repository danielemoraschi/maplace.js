import type { PolygonRings } from "../geometry";
import type {
  CircleLocation,
  Location,
  MarkerLocation,
  MultiPolygonLocation,
  PolygonLocation,
  PolylineLocation,
} from "../location";
import { child, type Field, item, mustBe, reject } from "./fail";
import { checkLatLng, LATITUDE, LONGITUDE, pathOf } from "./geometry";
import { recordOf } from "./record";
import { checkLineStyle, checkShapeStyle, shapeStyleChecks } from "./style";
import {
  arrayOf,
  type Check,
  checkBoolean,
  checkRenderable,
  FRACTION,
  NON_NEGATIVE,
  numberIn,
  optional,
  POSITIVE,
} from "./values";

/** The keys of every location type: `keyof` a union keeps only those they share. */
export type CommonKey = keyof Location;
/** Checks for the fields only locations of type `T` have. */
type OwnChecks<T> = Readonly<Record<Exclude<keyof T, CommonKey>, Check>>;

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

/** A shape's styles, each checked by `check`, and whether the page marks it active. */
function shapeStateChecks(check: Check) {
  return { ...shapeStyleChecks(check), active: optional(checkBoolean) };
}

/** Each location type's own fields; checks not wrapped in `optional` are required. */
export const TYPE_CHECKS: {
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
  circle: {
    center: checkLatLng,
    radius: numberIn(POSITIVE),
    ...shapeStateChecks(checkShapeStyle),
  },
  polyline: {
    path: pathOf(2),
    curve: optional(numberIn({ min: -1, max: 1 })),
    geodesic: optional(checkBoolean),
    progress: optional(numberIn(FRACTION)),
    travelledStyle: optional(checkLineStyle),
    ...shapeStateChecks(checkLineStyle),
  },
  polygon: { ...RINGS_CHECKS, ...shapeStateChecks(checkShapeStyle) },
  multipolygon: { polygons: checkPolygons, ...shapeStateChecks(checkShapeStyle) },
};

/**
 * A line bowed by `curve` or along great circles is drawn from points of its own, which an edit
 * would write back as its path: neither is editable, and they don't combine.
 */
export function checkDrawnLine(value: Readonly<Record<string, unknown>>, field: Field): void {
  const drawnBy = value.geodesic ? "geodesic" : "curve";
  if (value.geodesic && value.curve)
    reject(child(field, "curve"), "cannot be set together with geodesic");
  if (value[drawnBy] && value.editable)
    reject(child(field, drawnBy), "cannot be set together with editable");
}

/** A multipolygon's polygons share one location: there is no single shape for an edit to change. */
export function refuseEditableMultiPolygon(
  value: Readonly<Record<string, unknown>>,
  field: Field,
): void {
  if (value.type === "multipolygon" && value.editable === true) {
    reject(
      child(field, "editable"),
      "is not for a multipolygon: give one of its polygons a location of its own to edit it",
    );
  }
}

/** A line split at its progress has no one path for an edit to change. */
export function refuseEditableProgress(
  value: Readonly<Record<string, unknown>>,
  field: Field,
): void {
  if (value.progress !== undefined && value.editable === true) {
    reject(child(field, "progress"), "cannot be set together with editable");
  }
}
