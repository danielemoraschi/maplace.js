import { pointAtFraction } from "./along";
import { drawnPath } from "./drawn-path";
import type { LatLng } from "./geometry";
import type { PolylineLocation } from "./location";
import type { RouteResult } from "./route";
import { child, type Field, reject, root } from "./validate/fail";
import { pathOf } from "./validate/geometry";
import { checkDrawnLine, TYPE_CHECKS } from "./validate/location-types";
import { checkNumber, checkObject, FRACTION } from "./validate/values";

const POINT_ALONG = root("pointAlong");
/** A route result's path, checked as a route answer's is. */
const checkRoutePath = pathOf(2);

/** What a polyline's drawn path is made from, each checked as a location's is. */
const DRAWN_LINE_FIELDS = ["path", "curve", "geodesic"] as const;

/**
 * The point `fraction` (0 to 1) of the way along `line` as it is drawn: a polyline location's
 * path (bowed or along great circles, as it sets), or a route result's. For a marker of your own
 * moving along a line, e.g. with a `progress`; the halfway point is where the line's popup points.
 */
export function pointAlong(line: PolylineLocation | RouteResult, fraction: number): LatLng {
  checkNumber(fraction, child(POINT_ALONG, "fraction"), FRACTION);
  return pointAtFraction(pathAlong(line, child(POINT_ALONG, "line")), fraction);
}

/** The path `line` is drawn along, checked by the checks a location or a route answer has. */
function pathAlong(line: unknown, field: Field): readonly LatLng[] {
  const expected = "a polyline location or a route result";
  checkObject(line, field, expected);
  if (line.type === "polyline") {
    for (const name of DRAWN_LINE_FIELDS)
      TYPE_CHECKS.polyline[name](line[name], child(field, name));
    checkDrawnLine(line, field);
    return drawnPath(line as unknown as PolylineLocation);
  }
  if (!Array.isArray(line.legs)) reject(field, `must be ${expected}`);
  // Only the path is read: a slider asking again and again doesn't check every step again.
  checkRoutePath(line.path, child(field, "path"));
  return line.path as LatLng[];
}
