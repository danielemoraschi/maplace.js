import { pointAtFraction } from "./along";
import { drawnPath } from "./drawn-path";
import type { Geometry, LatLng, MultiPolygonGeometry, PolygonRings } from "./geometry";
import type { Location } from "./location";
import { arcSpan, narrowestArc, wrapLongitude } from "./longitude-arc";
import { ringArea } from "./sphere";

type Path = readonly LatLng[];

/**
 * The point a location's popup points at, on every map alike: a marker's point, a circle's
 * centre, the centre of a polygon's bounds (crossing ±180 as fit-all does), of a multipolygon's
 * largest polygon, and the point halfway along a polyline as drawn, which is always on the line,
 * a curved or geodesic one's too.
 */
export function anchorOf(where: Geometry | Location): LatLng {
  switch (where.type) {
    case undefined:
    case "marker":
      return { lat: where.lat, lng: where.lng };
    case "circle":
      return where.center;
    case "polygon":
      return centreOfBounds(where.path);
    case "multipolygon":
      return centreOfBounds(largestPolygon(where).path);
    case "polyline":
      return pointAtFraction(drawnPath(where), 0.5);
  }
}

/** Each multipolygon's largest polygon, by the list it was found in: a new list measures again. */
const largestOf = new WeakMap<readonly PolygonRings[], PolygonRings>();

/**
 * Where a multipolygon is shown, selected or pointed at: its largest polygon, so France is France
 * and not the ocean between it and French Guiana. The first of equals; each area measured once.
 */
export function largestPolygon({ polygons }: MultiPolygonGeometry): PolygonRings {
  const known = largestOf.get(polygons);
  if (known !== undefined) return known;
  let largest = polygons[0] as PolygonRings;
  let largestArea = -1;
  for (const polygon of polygons) {
    const area = ringArea(polygon.path);
    if (area > largestArea) [largest, largestArea] = [polygon, area];
  }
  largestOf.set(polygons, largest);
  return largest;
}

/** One pass over the points: a path can be long enough to overflow a spread. */
function centreOfBounds(path: Path): LatLng {
  let south = 90;
  let north = -90;
  const longitudes: number[] = [];
  for (const { lat, lng } of path) {
    south = Math.min(south, lat);
    north = Math.max(north, lat);
    longitudes.push(lng);
  }
  const arc = narrowestArc(longitudes);
  return { lat: (south + north) / 2, lng: wrapLongitude(arc.west + arcSpan(arc) / 2) };
}
