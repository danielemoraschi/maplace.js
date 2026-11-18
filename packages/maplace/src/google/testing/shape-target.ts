/// <reference types="google.maps" />
import type { CircleGeometry, Geometry, LatLng } from "../../geometry";
import type { DrawnStyle, ShapeStyle } from "../../style";
import type { GoogleShape } from "../placed-location";
import { dashedStyleOf } from "./dashed-style";
import { polygonsByContainment } from "./polygons-by-containment";
import { type ProbeTarget, probedPoint } from "./probe-target";

type Path = google.maps.MVCArray<google.maps.LatLng>;

/**
 * A circle, polyline, polygon or multipolygon as a user reaches it. It reads Google's objects
 * itself, never the adapter's conversions, so it can't share their mistakes; an edit changes one
 * handle at a time, as Google's handles do, each firing its one event. A multipolygon of one
 * polygon reads as a polygon: Google's rings alone can't tell them apart. Its style is what a user
 * sees: the stroke of what draws it over the shape while something does (`seenStroke`: a lifted
 * outline's copy, a split line's part ahead, else its part travelled,
 * in that part's look: at progress 1, faded), else its own.
 */
export function shapeTarget(
  shape: GoogleShape,
  seenStroke: () => GoogleShape | undefined = () => undefined,
): ProbeTarget {
  const onMap = () => shape.getMap() != null;
  const shown = () => onMap() && shape.getVisible() !== false;
  const trigger = (name: string) => google.maps.event.trigger(shape, name, {});
  return {
    isMarker: false,
    onMap,
    shown,
    read: () => ({
      geometry: geometryOf(shape),
      title: undefined,
      visible: shown(),
      icon: undefined,
      style: seenStyleOf(shape, seenStroke()),
    }),
    stack: () => shape.get("zIndex") ?? 0,
    click: () => trigger("click"),
    pointerOver: () => trigger("mouseover"),
    pointerOut: () => trigger("mouseout"),
    drag(geometry) {
      if (shape.getEditable()) edit(shape, geometry);
    },
  };
}

/** Google's name for each style field, written out here rather than shared with the adapter. */
const GOOGLE_OPTION_OF: Readonly<Record<keyof ShapeStyle, string>> = {
  stroke: "strokeColor",
  strokeOpacity: "strokeOpacity",
  strokeWidth: "strokeWeight",
  fill: "fillColor",
  fillOpacity: "fillOpacity",
};

/**
 * Google's options back in maplace's names: only those set, so `{}` is Google's defaults; a
 * dashed or dotted line's dash and opacity from its icons.
 */
function styleOf(shape: GoogleShape): DrawnStyle {
  const options: DrawnStyle = Object.fromEntries(
    Object.entries(GOOGLE_OPTION_OF)
      .map(([name, option]) => [name, shape.get(option)])
      .filter(([, value]) => value !== undefined),
  );
  return { ...options, ...dashedStyleOf(shape) };
}

/** The shape's fill, and the stroke of its outline's copy while one is drawn over it. */
function seenStyleOf(shape: GoogleShape, copy: GoogleShape | undefined): DrawnStyle {
  if (copy === undefined) return styleOf(shape);
  const isStroke = ([name]: [string, unknown]) => name.startsWith("stroke");
  return Object.fromEntries([
    ...Object.entries(styleOf(shape)).filter((field) => !isStroke(field)),
    ...Object.entries(styleOf(copy)).filter(isStroke),
  ]);
}

function geometryOf(shape: GoogleShape): Geometry {
  if (shape instanceof google.maps.Circle) {
    return { type: "circle", center: probedPoint(shape.getCenter()), radius: shape.getRadius() };
  }
  const rings = ringsOf(shape).map((ring) => ring.getArray().map(probedPoint));
  if (shape instanceof google.maps.Polyline) return { type: "polyline", path: rings[0] ?? [] };
  const polygons = polygonsByContainment(rings);
  const [only] = polygons;
  if (only && polygons.length === 1) return { type: "polygon", ...only };
  return { type: "multipolygon", polygons };
}

function ringsOf(shape: google.maps.Polyline | google.maps.Polygon): Path[] {
  return shape instanceof google.maps.Polyline ? [shape.getPath()] : shape.getPaths().getArray();
}

function ringsIn(geometry: Geometry): readonly (readonly LatLng[])[] {
  if (geometry.type === "polyline") return [geometry.path];
  if (geometry.type === "polygon") return [geometry.path, ...(geometry.holes ?? [])];
  return [];
}

/** Moves each handle whose place differs from `geometry`; nothing for another type's geometry. */
function edit(shape: GoogleShape, geometry: Geometry): void {
  if (shape instanceof google.maps.Circle) {
    if (geometry.type === "circle") editCircle(shape, geometry);
  } else if (geometry.type === geometryOf(shape).type) {
    editRings(ringsOf(shape), ringsIn(geometry));
  }
}

function editCircle(circle: google.maps.Circle, geometry: CircleGeometry): void {
  const { lat, lng } = probedPoint(circle.getCenter());
  if (lat !== geometry.center.lat || lng !== geometry.center.lng) circle.setCenter(geometry.center);
  if (circle.getRadius() !== geometry.radius) circle.setRadius(geometry.radius);
}

/** Moves each point that differs, as a vertex handle would; handles can't add or drop rings. */
function editRings(rings: Path[], targets: readonly (readonly LatLng[])[]): void {
  rings.forEach((ring, index) => {
    const target = targets[index] ?? [];
    if (target.length !== ring.getLength()) throw new Error("the probe only moves points");
    target.forEach((point, at) => {
      const { lat, lng } = ring.getAt(at).toJSON();
      if (lat !== point.lat || lng !== point.lng) ring.setAt(at, new google.maps.LatLng(point));
    });
  });
}
