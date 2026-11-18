import { samePoint } from "../../adapter-kit/same-geometry";
import { anchorOf } from "../../anchor";
import type { CircleGeometry, Geometry, LatLng, PolygonRings } from "../../geometry";
import type { DrawnStyle } from "../../style";
import { pointAtBearing } from "../circle-sphere";
import { wrappedLongitude } from "../conversions";
import { type HandleRole, ringsOf, sameRole } from "../edit-geometry";
import type { LocationFeature } from "../feature-set";
import { SHAPE_SOURCE } from "../layers";
import { featureStyleFields, shapeKeys } from "../location-features";
import type { PlacedShape } from "../placed-location";
import { clickCanvas, leaveCanvas, moveOverCanvas } from "./pointer";
import type { ProbeTarget, TargetSite } from "./probe-target";

/**
 * A circle, polyline, polygon or multipolygon as a user reaches it: on the canvas, at a point on
 * its line or inside its area, and by its edit handles. It reads the feature as the shape source on the map
 * was sent it, with its rings opened again, never through the adapter's conversions, so a shape
 * left after destroy shows.
 */
export function shapeTarget(
  placed: PlacedShape,
  { map, sent, stillPlaced }: TargetSite,
): ProbeTarget {
  const sourceOnMap = () => map.getSource(SHAPE_SOURCE) !== undefined;
  const feature = () => sent.featureOf(SHAPE_SOURCE, shapeKeys(placed.drawable().id).own);
  const shown = () => feature() !== undefined;
  const point = () => ({ at: pointOn(placed.drawable().geometry) });
  return {
    isMarker: false,
    onMap: () => (stillPlaced() && sourceOnMap()) || shown(),
    shown,
    read() {
      const drawn = feature();
      return {
        geometry: drawn ? geometryOf(drawn, placed) : placed.drawable().geometry,
        title: undefined,
        visible: drawn !== undefined,
        icon: undefined,
        style: drawn ? styleOf(drawn) : {},
      };
    },
    stack: () => feature()?.properties.rank ?? 0,
    click: () => clickCanvas(map, point()),
    pointerOver: () => moveOverCanvas(map, point()),
    pointerOut: () => leaveCanvas(map),
    drag: (geometry) => dragHandles(placed, geometry),
  };
}

const EAST_BEARING = 90;

/**
 * Drags the shape's handles until it is `geometry`, one handle at a time, as a user would: a
 * circle by its centre, then its east radius handle; a path or ring by each point that moved.
 * Nothing where it has no handles. Handles are found again after each drag: a drop replaces them.
 */
function dragHandles(placed: PlacedShape, geometry: Geometry): void {
  const now = placed.drawable().geometry;
  if (placed.editHandles().length === 0 || geometry.type !== now.type) return;
  if (geometry.type === "circle" && now.type === "circle") {
    if (!samePoint(geometry.center, now.center))
      dragHandle(placed, { kind: "center" }, geometry.center);
    if (geometry.radius !== now.radius) {
      const east = pointAtBearing(geometry.center, geometry.radius, EAST_BEARING);
      dragHandle(placed, { kind: "radius", bearing: EAST_BEARING }, east);
    }
    return;
  }
  const from = ringsOf(now);
  ringsOf(geometry).forEach((ring, ringIndex) => {
    const before = from[ringIndex];
    if (ring.length !== before?.length) throw new Error("the probe only moves points");
    ring.forEach((point, index) => {
      if (!samePoint(point, before[index] ?? point))
        dragHandle(placed, { kind: "vertex", ring: ringIndex, index }, point);
    });
  });
}

/** Puts the handle `role` names at `to`, and lets MapLibre's drag events tell the adapter. */
function dragHandle(placed: PlacedShape, role: HandleRole, to: LatLng): void {
  holdHandle(placed, role, to).drop();
}

/** Drags the handle `role` names to `to` and holds it there, a drag not let go until `drop`. */
export function holdHandle(placed: PlacedShape, role: HandleRole, to: LatLng) {
  const handle = placed.editHandles().find((each) => sameRole(each.role, role));
  if (handle === undefined) throw new Error(`no ${role.kind} handle to drag`);
  handle.marker.setLngLat([to.lng, to.lat]);
  handle.marker.fire("dragstart");
  handle.marker.fire("drag");
  return { drop: () => handle.marker.fire("dragend") };
}

/**
 * A point a user would point at: a circle's centre, halfway along a polyline as drawn (bowed or
 * geodesic too), or a tenth of the way from a polygon's first corner to the middle of its bounds,
 * inside it and clear of a hole there; a multipolygon's first polygon.
 */
function pointOn(geometry: Geometry): LatLng {
  if (geometry.type === "circle") return geometry.center;
  if (geometry.type === "polyline") return anchorOf(geometry);
  if (geometry.type === "polygon") return insideOf(geometry.path);
  if (geometry.type === "multipolygon") return insideOf(geometry.polygons[0]?.path ?? []);
  throw new Error(`the probe points at shapes, not a ${geometry.type}`);
}

/** A tenth of the way from an outline's first corner to the middle of its bounds. */
function insideOf(path: readonly LatLng[]): LatLng {
  return between(path[0], middleOf(path), 0.1);
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
function styleOf({ properties }: LocationFeature): DrawnStyle {
  return featureStyleFields(properties);
}

/**
 * The feature's geometry in maplace's terms: GeoJSON rings opened again, a circle read from the
 * ring it was drawn as.
 */
function geometryOf({ geometry }: LocationFeature, placed: PlacedShape): Geometry {
  if (geometry.type === "LineString")
    return { type: "polyline", path: geometry.coordinates.map(latLngOf) };
  if (geometry.type === "MultiPolygon")
    return { type: "multipolygon", polygons: geometry.coordinates.map(openRings) };
  if (geometry.type !== "Polygon") throw new Error(`no shape is drawn as a ${geometry.type}`);
  const rings = openRings(geometry.coordinates);
  const shown = placed.drawable().geometry;
  // A ring round a pole runs over it, by points at ±90° that are not on the circle.
  if (shown.type === "circle") return circleDrawn(rings.path.filter(offPole), shown);
  return { type: "polygon", ...rings };
}

/** GeoJSON's rings of one polygon, opened again: maplace's paths don't repeat the first point. */
function openRings(coordinates: GeoJSON.Position[][]): PolygonRings {
  const [path = [], ...holes] = coordinates.map((ring) => ring.slice(0, -1).map(latLngOf));
  return { path, holes: holes.length > 0 ? holes : undefined };
}

const offPole = ({ lat }: LatLng) => Math.abs(lat) !== 90;

/** How far a drawn circle's points may be from its radius, as a share of it. */
const RING_TOLERANCE = 1e-6;

/**
 * The circle a ring draws: `expected` when every point is its radius from its centre, else the
 * ring's own middle and mean distance, which a check comparing it to `expected` fails on.
 */
function circleDrawn(ring: readonly LatLng[], expected: CircleGeometry): CircleGeometry {
  const fits = (center: LatLng, radius: number) =>
    ring.every(
      (point) => Math.abs(probedMetresBetween(center, point) - radius) <= radius * RING_TOLERANCE,
    );
  if (ring.length > 0 && fits(expected.center, expected.radius)) return expected;
  const center = middleOf(ring);
  const distances = ring.map((point) => probedMetresBetween(center, point));
  const radius = distances.reduce((sum, metres) => sum + metres, 0) / distances.length;
  return { type: "circle", center, radius };
}

/** The earth's mean radius, the probe's own: it never measures through the adapter. */
const PROBE_EARTH_RADIUS = 6_371_008.8;

/** The haversine distance, the probe's own. */
function probedMetresBetween(a: LatLng, b: LatLng): number {
  const radians = Math.PI / 180;
  const halfLat = ((b.lat - a.lat) * radians) / 2;
  const halfLng = ((b.lng - a.lng) * radians) / 2;
  const h =
    Math.sin(halfLat) ** 2 +
    Math.cos(a.lat * radians) * Math.cos(b.lat * radians) * Math.sin(halfLng) ** 2;
  return 2 * PROBE_EARTH_RADIUS * Math.asin(Math.sqrt(Math.min(1, h)));
}

/** A position MapLibre was sent, as maplace's: its longitude in −180..180, 180 kept east. */
function latLngOf([lng = Number.NaN, lat = Number.NaN]: GeoJSON.Position): LatLng {
  return { lat, lng: wrappedLongitude(lng) };
}
