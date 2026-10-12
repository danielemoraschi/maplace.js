/** A point on the map, in degrees: lat -90 to 90, lng -180 to 180. */
export interface LatLng {
  readonly lat: number;
  readonly lng: number;
}

export interface MarkerGeometry extends LatLng {
  readonly type: "marker";
}

export interface CircleGeometry {
  readonly type: "circle";
  readonly center: LatLng;
  /** Radius in metres. */
  readonly radius: number;
}

export interface PolylineGeometry {
  readonly type: "polyline";
  /** At least 2 points. */
  readonly path: readonly LatLng[];
}

export interface PolygonGeometry {
  readonly type: "polygon";
  /** Outer ring, at least 3 points. */
  readonly path: readonly LatLng[];
  /** Inner rings, at least 3 points each. */
  readonly holes?: readonly (readonly LatLng[])[] | undefined;
}

/** Where a location is; what a drag or edit changes. */
export type Geometry = MarkerGeometry | CircleGeometry | PolylineGeometry | PolygonGeometry;
