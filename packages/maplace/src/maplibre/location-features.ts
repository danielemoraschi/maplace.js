import type { Drawable } from "../drawable";
import type { Geometry, LatLng, MarkerGeometry } from "../geometry";
import type { ShapeStyle } from "../style";
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
 * A polyline's or polygon's feature: its geometry, its style in its state (the fields it sets,
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
      return { type: "LineString", coordinates: geometry.path.map(positionOf) };
    case "polygon":
      return {
        type: "Polygon",
        coordinates: [geometry.path, ...(geometry.holes ?? [])].map(closedRing),
      };
    default:
      throw new Error(`a ${geometry.type} isn't drawn as a shape feature on MapLibre`);
  }
}

/** GeoJSON's rings end where they start; maplace's paths don't repeat the first point. */
function closedRing(path: readonly LatLng[]): GeoJSON.Position[] {
  const ring = path.map(positionOf);
  const first = ring[0];
  return first === undefined ? ring : [...ring, first];
}

function positionOf({ lat, lng }: LatLng): GeoJSON.Position {
  return [lng, lat];
}

function definedFields(style: ShapeStyle | undefined): ShapeStyle {
  if (style === undefined) return {};
  return Object.fromEntries(
    STYLE_KEYS.flatMap((key) => (style[key] === undefined ? [] : [[key, style[key]]])),
  );
}
