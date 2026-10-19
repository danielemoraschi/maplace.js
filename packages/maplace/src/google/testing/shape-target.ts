/// <reference types="google.maps" />
import type { CircleGeometry, Geometry, LatLng } from "../../geometry";
import type { ShapeStyle } from "../../style";
import type { GoogleShape } from "../placed-location";
import { type ProbeTarget, probedPoint } from "./probe-target";

type Path = google.maps.MVCArray<google.maps.LatLng>;

/**
 * A circle, polyline or polygon as a user reaches it. It reads Google's objects itself, never
 * the adapter's conversions, so it can't share their mistakes; an edit changes one handle at a
 * time, as Google's handles do, each firing its one event.
 */
export function shapeTarget(shape: GoogleShape): ProbeTarget {
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
      style: styleOf(shape),
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

/** Google's options back in maplace's names: only those set, so `{}` is Google's defaults. */
function styleOf(shape: GoogleShape): ShapeStyle {
  return Object.fromEntries(
    Object.entries(GOOGLE_OPTION_OF)
      .map(([name, option]) => [name, shape.get(option)])
      .filter(([, value]) => value !== undefined),
  );
}

function geometryOf(shape: GoogleShape): Geometry {
  if (shape instanceof google.maps.Circle) {
    return { type: "circle", center: probedPoint(shape.getCenter()), radius: shape.getRadius() };
  }
  const [path = [], ...holes] = ringsOf(shape).map((ring) => ring.getArray().map(probedPoint));
  if (shape instanceof google.maps.Polyline) return { type: "polyline", path };
  return { type: "polygon", path, holes: holes.length > 0 ? holes : undefined };
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
