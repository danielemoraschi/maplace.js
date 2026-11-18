import type { Drawable } from "../drawable";
import type { Geometry, LatLng, MarkerGeometry, PolygonRings } from "../geometry";
import type { ShapeStyle } from "../style";
import { circleRing } from "./circle-sphere";
import { nearestLongitude } from "./conversions";
import type { LocationFeature, LocationProperties } from "./feature-set";
import { SHAPE_DEFAULTS } from "./line-paint";

/** The style fields a shape's feature carries, read by the shape layers' paint. */
export const STYLE_KEYS = Object.keys(SHAPE_DEFAULTS) as (keyof typeof SHAPE_DEFAULTS)[];

/** How a default marker is drawn: where it stacks, and whether it is in front. */
export interface PinDrawing {
  readonly rank: number;
  readonly front: boolean;
}

/**
 * A default marker's feature: its point, where it stacks, and for a heat marker its weight, and
 * `front` while it is drawn as a pin in front of the heat.
 */
export function pinFeature(drawable: Drawable, { rank, front }: PinDrawing): LocationFeature {
  const { lat, lng } = drawable.geometry as MarkerGeometry;
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [lng, lat] },
    properties: {
      id: drawable.id,
      rank,
      ...(drawable.heatWeight === undefined ? {} : { heat: drawable.heatWeight, front }),
    },
  };
}

/**
 * How a shape is drawn in its state: its style (the fields it sets, the layers' defaults for the
 * rest), where it stacks, and where its outline stacks: its front rank while hovered or selected
 * (`frontRank`), else its rank.
 */
export interface ShapeDrawing {
  readonly style: ShapeStyle | undefined;
  readonly rank: number;
  readonly strokeRank: number;
}

/** A shape's feature (a circle, polyline, polygon or multipolygon): its geometry, drawn so. */
export function shapeFeature(drawable: Drawable, drawing: ShapeDrawing): LocationFeature {
  return {
    type: "Feature",
    geometry: shapeGeometryOf(drawable.geometry),
    properties: shapeProperties(drawable, drawing),
  };
}

/** What a shape's feature carries besides its geometry: what changes with its state. */
export function shapeProperties(
  { id }: Drawable,
  { style, rank, strokeRank }: ShapeDrawing,
): LocationProperties {
  return { id, rank, strokeRank, ...definedFields(style) };
}

function shapeGeometryOf(geometry: Geometry): GeoJSON.Geometry {
  switch (geometry.type) {
    case "polyline":
      return lineGeometryOf(geometry.path);
    case "polygon":
      return { type: "Polygon", coordinates: polygonCoordinates(geometry) };
    case "multipolygon":
      return { type: "MultiPolygon", coordinates: geometry.polygons.map(polygonCoordinates) };
    case "circle":
      return { type: "Polygon", coordinates: [circleRing(geometry)] };
    default:
      throw new Error(`a ${geometry.type} isn't drawn as a shape feature on MapLibre`);
  }
}

/** A line through `path`, run on across ±180 as Google draws it. */
export function lineGeometryOf(path: readonly LatLng[]): GeoJSON.LineString {
  return { type: "LineString", coordinates: continuousFrom(startOf(path), path) };
}

/** A polygon's rings as GeoJSON's, each run on from its outline's first point across ±180. */
function polygonCoordinates({ path, holes = [] }: PolygonRings): GeoJSON.Position[][] {
  const start = startOf(path);
  return [path, ...holes].map((ring) => closedRing(continuousFrom(start, ring)));
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

function startOf(path: readonly LatLng[]): number {
  return path[0]?.lng ?? 0;
}

/** GeoJSON's rings end where they start; maplace's paths don't repeat the first point. */
function closedRing(ring: GeoJSON.Position[]): GeoJSON.Position[] {
  const first = ring[0];
  return first === undefined ? ring : [...ring, first];
}

/** The style fields `style` sets, for a feature's properties: the layers' defaults for the rest. */
export function definedFields(style: ShapeStyle | undefined): ShapeStyle {
  if (style === undefined) return {};
  return Object.fromEntries(
    STYLE_KEYS.flatMap((key) => (style[key] === undefined ? [] : [[key, style[key]]])),
  );
}
