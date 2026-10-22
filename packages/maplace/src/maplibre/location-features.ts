import type { Drawable } from "../drawable";
import type { Geometry, LatLng, MarkerGeometry } from "../geometry";
import type { ShapeStyle } from "../style";
import { circleRing } from "./circle-sphere";
import type { LocationFeature, LocationProperties } from "./feature-set";
import { SHAPE_DEFAULTS } from "./layers";

/** The style fields a shape's feature carries, read by the shape layers' paint. */
export const STYLE_KEYS = Object.keys(SHAPE_DEFAULTS) as (keyof typeof SHAPE_DEFAULTS)[];

/** A default marker's feature: its point, and where it stacks. */
export function pinFeature(drawable: Drawable, rank: number): LocationFeature {
  const { lat, lng } = drawable.geometry as MarkerGeometry;
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [lng, lat] },
    properties: { id: drawable.id, rank },
  };
}

/**
 * A shape's feature (a circle, polyline or polygon): its geometry, its style in its state (the fields it sets,
 * the layers' defaults for the rest) and where it stacks.
 */
export function shapeFeature(
  drawable: Drawable,
  style: ShapeStyle | undefined,
  rank: number,
): LocationFeature {
  return {
    type: "Feature",
    geometry: shapeGeometryOf(drawable.geometry),
    properties: shapeProperties(drawable, style, rank),
  };
}

/** What a shape's feature carries besides its geometry: what changes with its state. */
export function shapeProperties(
  drawable: Drawable,
  style: ShapeStyle | undefined,
  rank: number,
): LocationProperties {
  return { id: drawable.id, rank, ...definedFields(style) };
}

function shapeGeometryOf(geometry: Geometry): GeoJSON.Geometry {
  switch (geometry.type) {
    case "polyline":
      return {
        type: "LineString",
        coordinates: continuousFrom(startOf(geometry.path), geometry.path),
      };
    case "polygon": {
      const start = startOf(geometry.path);
      return {
        type: "Polygon",
        coordinates: [geometry.path, ...(geometry.holes ?? [])].map((ring) =>
          closedRing(continuousFrom(start, ring)),
        ),
      };
    }
    case "circle":
      return { type: "Polygon", coordinates: [circleRing(geometry)] };
    default:
      throw new Error(`a ${geometry.type} isn't drawn as a shape feature on MapLibre`);
  }
}

/**
 * `path` as positions, each longitude taken the short way from the one before (from `start` for
 * the first): a shape across ±180 runs on past it, as Google draws it, not round the world.
 */
function continuousFrom(start: number, path: readonly LatLng[]): GeoJSON.Position[] {
  let previous = start;
  return path.map(({ lat, lng }) => {
    previous = nearestLongitude(lng, previous);
    return [previous, lat];
  });
}

/**
 * The copy of `lng` within 180° of `of`: `nearestLongitude(lng, 0)` is `lng` in −180..180. It is
 * `lng` itself unless that copy is another world's, so a longitude that needs no turn is kept
 * exact, where a modulo would add float error (0.6 read back as 0.6000000000000227).
 */
export function nearestLongitude(lng: number, of: number): number {
  const worlds = Math.round((of - lng) / 360);
  return worlds === 0 ? lng : lng + 360 * worlds;
}

function startOf(path: readonly LatLng[]): number {
  return path[0]?.lng ?? 0;
}

/** GeoJSON's rings end where they start; maplace's paths don't repeat the first point. */
function closedRing(ring: GeoJSON.Position[]): GeoJSON.Position[] {
  const first = ring[0];
  return first === undefined ? ring : [...ring, first];
}

function definedFields(style: ShapeStyle | undefined): ShapeStyle {
  if (style === undefined) return {};
  return Object.fromEntries(
    STYLE_KEYS.flatMap((key) => (style[key] === undefined ? [] : [[key, style[key]]])),
  );
}
