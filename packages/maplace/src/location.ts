import type { CircleGeometry, LatLng, PolygonGeometry, PolylineGeometry } from "./geometry";
import type { LineStyle, ShapeStyle } from "./style";

/**
 * What a popup or list entry shows. A string is always rendered as text, never parsed as HTML;
 * pass a Node (or a function returning one) for rich content, or set `html` with a sanitizer.
 */
export type Content<Data = unknown> = string | Node | Bivariant<[location: Location<Data>]>;

/** Selection and hover of one location, passed to `icon` and list `render` functions. */
export interface LocationState {
  readonly selected: boolean;
  readonly hovered: boolean;
}

/**
 * A custom marker: an image URL, an element, or a function building one per state. Functions
 * re-run only for markers whose state changed. DOM markers carry `data-selected` and
 * `data-hovered` while in that state, so `[data-selected]` in CSS styles them.
 */
export type Icon<Data = unknown> =
  | string
  | Node
  | Bivariant<[location: MarkerLocation<Data>, state: LocationState]>;

/**
 * A function checked like a method, so a typed `Location<Data>` still fits where a plain
 * `Location` is expected (the element's `locations`, your helpers). Only the store calls these,
 * each with the location it belongs to.
 */
type Bivariant<Args extends unknown[]> = { fn(...args: Args): Node }["fn"];

interface LocationBase<Data> {
  /** Stable identity: updates, selection and routes refer to locations by id. Must be unique. */
  readonly id: string;
  /** Plain text: list label and accessible name on the map. */
  readonly title?: string | undefined;
  /** Popup content. */
  readonly content?: Content<Data> | undefined;
  /** Untrusted HTML for the popup; rendered only through the `sanitize` option. */
  readonly html?: string | undefined;
  /** Grouping key for list headings and `setFilter`. */
  readonly group?: string | undefined;
  /** Hidden locations stay in the data but are not drawn, listed or selected. Default true. */
  readonly visible?: boolean | undefined;
  /** Lets the user drag a marker or reshape a shape; needs the `edit` capability. */
  readonly editable?: boolean | undefined;
  /** Your own fields, passed back to content, icon and render functions. */
  readonly data?: Data | undefined;
}

export interface MarkerLocation<Data = unknown> extends LocationBase<Data>, LatLng {
  /** Optional: a location without `type` is a marker. */
  readonly type?: "marker" | undefined;
  readonly icon?: Icon<Data> | undefined;
}

export interface CircleLocation<Data = unknown> extends LocationBase<Data>, CircleGeometry {
  readonly style?: ShapeStyle | undefined;
}

export interface PolylineLocation<Data = unknown> extends LocationBase<Data>, PolylineGeometry {
  readonly style?: LineStyle | undefined;
}

export interface PolygonLocation<Data = unknown> extends LocationBase<Data>, PolygonGeometry {
  readonly style?: ShapeStyle | undefined;
}

export type Location<Data = unknown> =
  | MarkerLocation<Data>
  | CircleLocation<Data>
  | PolylineLocation<Data>
  | PolygonLocation<Data>;
