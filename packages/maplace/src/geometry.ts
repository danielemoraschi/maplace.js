/** A point on the map, in degrees. */
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
  readonly path: readonly LatLng[];
}

export interface PolygonGeometry {
  readonly type: "polygon";
  /** Outer ring. */
  readonly path: readonly LatLng[];
  readonly holes?: readonly (readonly LatLng[])[] | undefined;
}

/** Where a location is; what a drag or edit changes. */
export type Geometry = MarkerGeometry | CircleGeometry | PolylineGeometry | PolygonGeometry;
