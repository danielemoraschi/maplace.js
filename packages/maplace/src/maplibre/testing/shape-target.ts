import type { Geometry, LatLng } from "../../geometry";
import type { ShapeStyle } from "../../style";
import type { LocationFeature } from "../feature-set";
import { SHAPE_SOURCE } from "../layers";
import { STYLE_KEYS } from "../location-features";
import type { PlacedShape } from "../placed-location";
import { clickCanvas, leaveCanvas, moveOverCanvas } from "./pointer";
import type { ProbeTarget, TargetSite } from "./probe-target";

/**
 * A polyline or polygon as a user reaches it: on the canvas, at a point on its line or inside its
 * area. It reads the feature MapLibre was given, with its rings opened again, never through the
 * adapter's conversions, and the shape source still on the map, so a shape left after destroy
 * shows.
 */
export function shapeTarget(
  placed: PlacedShape,
  { map, features, stillPlaced }: TargetSite,
): ProbeTarget {
  const sourceOnMap = () => map.getSource(SHAPE_SOURCE) !== undefined;
  const feature = () =>
    sourceOnMap() ? features.shapes.featureOf(placed.drawable().id) : undefined;
  const shown = () => feature() !== undefined;
  const point = () => ({ at: pointOn(placed.drawable().geometry) });
  return {
    isMarker: false,
    onMap: () => (stillPlaced() && sourceOnMap()) || shown(),
    shown,
    read() {
      const drawn = feature();
      return {
        geometry: drawn ? geometryOf(drawn) : placed.drawable().geometry,
        title: undefined,
        visible: drawn !== undefined,
        icon: undefined,
        style: drawn ? styleOf(drawn) : {},
      };
    },
    stack: () => placed.rank(),
    click: () => clickCanvas(map, point()),
    pointerOver: () => moveOverCanvas(map, point()),
    pointerOut: () => leaveCanvas(map),
  };
}

/**
 * A point a user would point at: halfway along a polyline's first segment, or a tenth of the way
 * from a polygon's first corner to the middle of its bounds, inside it and clear of a hole there.
 */
function pointOn(geometry: Geometry): LatLng {
  if (geometry.type === "polyline") return between(geometry.path[0], geometry.path[1], 0.5);
  if (geometry.type === "polygon") return between(geometry.path[0], middleOf(geometry.path), 0.1);
  throw new Error(`the probe points at polylines and polygons, not a ${geometry.type}`);
}

function between(from: LatLng | undefined, to: LatLng | undefined, share: number): LatLng {
  if (from === undefined || to === undefined) throw new Error("a shape with too few points");
  return {
    lat: from.lat + (to.lat - from.lat) * share,
    lng: from.lng + (to.lng - from.lng) * share,
  };
}

function middleOf(path: readonly LatLng[]): LatLng {
  const lats = path.map(({ lat }) => lat);
  const lngs = path.map(({ lng }) => lng);
  return {
    lat: (Math.min(...lats) + Math.max(...lats)) / 2,
    lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
  };
}

/** The style fields the feature carries: only those set, so `{}` is the layers' defaults. */
function styleOf({ properties }: LocationFeature): ShapeStyle {
  return Object.fromEntries(
    STYLE_KEYS.flatMap((key) => (properties[key] === undefined ? [] : [[key, properties[key]]])),
  );
}

/** The feature's geometry in maplace's terms: GeoJSON rings opened again. */
function geometryOf({ geometry }: LocationFeature): Geometry {
  if (geometry.type === "LineString")
    return { type: "polyline", path: geometry.coordinates.map(latLngOf) };
  if (geometry.type !== "Polygon") throw new Error(`no shape is drawn as a ${geometry.type}`);
  const [path = [], ...holes] = geometry.coordinates.map((ring) => ring.slice(0, -1).map(latLngOf));
  return { type: "polygon", path, holes: holes.length > 0 ? holes : undefined };
}

function latLngOf([lng = Number.NaN, lat = Number.NaN]: GeoJSON.Position): LatLng {
  return { lat, lng };
}
