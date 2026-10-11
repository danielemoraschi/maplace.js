/** A point on the map, in degrees. */
export interface LatLng {
  readonly lat: number;
  readonly lng: number;
}

/**
 * What a popup or list entry shows. A string is always rendered as text, never parsed as HTML;
 * pass a Node (or a function returning one) for rich content, or set `html` with a sanitizer.
 */
export type Content = string | Node | ((location: Location) => Node);

/** State passed to an `icon` function so the selected marker can look different. */
export interface IconState {
  readonly selected: boolean;
  readonly hovered: boolean;
}

/** A custom marker: an image URL, an element, or a function building one per state. */
export type Icon = string | Node | ((location: MarkerLocation, state: IconState) => Node);

interface LocationBase {
  /** Stable identity: updates, selection and routes refer to locations by id. Must be unique. */
  readonly id: string;
  /** Plain text: list label and accessible name on the map. */
  readonly title?: string;
  /** Popup content. */
  readonly content?: Content;
  /** Untrusted HTML for the popup; rendered only through the `sanitize` option. */
  readonly html?: string;
  /** Grouping key for list headings and `setFilter`. */
  readonly group?: string;
  /** Hidden locations stay in the data but are not drawn or listed. Default true. */
  readonly visible?: boolean;
}

export interface MarkerLocation extends LocationBase {
  readonly type?: "marker";
  readonly lat: number;
  readonly lng: number;
  readonly icon?: Icon;
  readonly draggable?: boolean;
}

export interface CircleLocation extends LocationBase {
  readonly type: "circle";
  readonly center: LatLng;
  /** Radius in metres. */
  readonly radius: number;
  readonly editable?: boolean;
}

export interface PolylineLocation extends LocationBase {
  readonly type: "polyline";
  readonly path: readonly LatLng[];
  readonly editable?: boolean;
}

export interface PolygonLocation extends LocationBase {
  readonly type: "polygon";
  /** Outer ring. */
  readonly path: readonly LatLng[];
  readonly holes?: readonly (readonly LatLng[])[];
  readonly editable?: boolean;
}

export type Location = MarkerLocation | CircleLocation | PolylineLocation | PolygonLocation;

export type LocationType = NonNullable<Location["type"]>;
