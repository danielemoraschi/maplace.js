/// <reference types="google.maps" preserve="true" />
import type {
  CircleGeometry,
  Geometry,
  LatLng,
  MultiPolygonGeometry,
  PolygonGeometry,
  PolygonRings,
  PolylineGeometry,
} from "../geometry";
import { latLngOf } from "./lat-lng";
import type { GoogleShape } from "./placed-location";

type Path = google.maps.MVCArray<google.maps.LatLng>;

/** A circle's centre before one is set, which never shows: the kind always sets one. */
const NO_POINT = { lat: Number.NaN, lng: Number.NaN };

/**
 * How Google draws one type of shape: its object, and its geometry in maplace's terms. A kind that
 * is never edited has no `read` or `watch`: what it showed stands.
 */
export interface ShapeKind<G extends Geometry = Geometry, S extends GoogleShape = GoogleShape> {
  create(maps: google.maps.MapsLibrary): S;
  show(shape: S, geometry: G): void;
  read?(shape: S): G;
  /** Calls `edited` on each event a user's edit fires; returns what stops watching. */
  watch?(shape: S, edited: () => void): () => void;
}

export const CIRCLE: ShapeKind<CircleGeometry, google.maps.Circle> = {
  create: (maps) => new maps.Circle(),
  show(circle, { center, radius }) {
    circle.setCenter(center);
    circle.setRadius(radius);
  },
  read: (circle) => ({
    type: "circle",
    center: latLngOf(circle.getCenter() ?? NO_POINT),
    radius: circle.getRadius(),
  }),
  watch: (circle, edited) =>
    removeAll(["center_changed", "radius_changed"].map((name) => circle.addListener(name, edited))),
};

export const POLYLINE: ShapeKind<PolylineGeometry, google.maps.Polyline> = {
  create: (maps) => new maps.Polyline(),
  show: (line, { path }) => line.setPath([...path]),
  read: (line) => ({ type: "polyline", path: ringOf(line.getPath()) }),
  watch: (line, edited) => watchRings([line.getPath()], edited),
};

/** The outer ring first, then the holes, as Google keeps them. */
export const POLYGON: ShapeKind<PolygonGeometry, google.maps.Polygon> = {
  create: (maps) => new maps.Polygon(),
  show: (polygon, rings) => polygon.setPaths(ringsToShow(rings)),
  read(polygon) {
    const [path = [], ...holes] = polygon.getPaths().getArray().map(ringOf);
    return { type: "polygon", path, holes: holes.length > 0 ? holes : undefined };
  },
  watch: (polygon, edited) => watchRings(polygon.getPaths().getArray(), edited),
};

/**
 * Every polygon's rings in one Google polygon, which fills disjoint outlines as separate areas,
 * so a multipolygon is hovered, clicked and styled as one shape. Never editable, so never read
 * back.
 */
export const MULTIPOLYGON: ShapeKind<MultiPolygonGeometry, google.maps.Polygon> = {
  create: (maps) => new maps.Polygon(),
  show: (polygon, { polygons }) => polygon.setPaths(polygons.flatMap(ringsToShow)),
};

export type ShapeType = Exclude<Geometry["type"], "marker">;

/** A polygon's rings as Google takes them: the outline first, then its holes. */
function ringsToShow({ path, holes = [] }: PolygonRings): LatLng[][] {
  return [path, ...holes].map((ring) => [...ring]);
}

/** A vertex handle's drag, a midpoint's drag and an undo each fire one of these, on release. */
function watchRings(rings: readonly Path[], edited: () => void): () => void {
  const events = ["set_at", "insert_at", "remove_at"];
  return removeAll(rings.flatMap((ring) => events.map((name) => ring.addListener(name, edited))));
}

function removeAll(listeners: readonly google.maps.MapsEventListener[]): () => void {
  return () => {
    for (const listener of listeners) listener.remove();
  };
}

function ringOf(path: Path): LatLng[] {
  return path.getArray().map(latLngOf);
}
