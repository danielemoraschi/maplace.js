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
  /** Untrusted HTML for the popup, instead of `content`; rendered only through the `sanitize` option. */
  readonly html?: string | undefined;
  /** Grouping key for list headings and `setFilter`: one per location. */
  readonly group?: string | undefined;
  /** What `setFilter` also filters on, as many as it has: "parking", "open-late". */
  readonly tags?: readonly string[] | undefined;
  /**
   * The zoom selecting it shows it at, centred where its popup points (a shape too, instead of
   * being fitted); a select's own `zoom` wins. Zooms as in `Viewport`.
   */
  readonly zoom?: number | undefined;
  /** Hidden locations stay in the data but are not drawn, listed or selected. Default true. */
  readonly visible?: boolean | undefined;
  /**
   * `false` leaves it out of every list view; the map still draws it, and it is selected there.
   * Default true.
   */
  readonly listed?: boolean | undefined;
  /** Lets the user drag a marker or reshape a shape; needs the `edit` capability. */
  readonly editable?: boolean | undefined;
  /** Your own fields, passed back to content, icon and render functions. Any other field throws. */
  readonly data?: Data | undefined;
}

export interface MarkerLocation<Data = unknown> extends LocationBase<Data>, LatLng {
  /** Optional: a location without `type` is a marker. */
  readonly type?: "marker" | undefined;
  readonly icon?: Icon<Data> | undefined;
}

/**
 * A shape's styles. In a state it is drawn as maplace's look for that state, then `style`, then
 * the state's own style; selected wins over hovered.
 */
interface StyledShape<Style extends LineStyle> {
  /** Over the store's `style`. */
  readonly style?: Style | undefined;
  /** Drawn over `style` while selected; over the store's `selectedStyle`. */
  readonly selectedStyle?: Style | undefined;
  /** Drawn over `style` while hovered and not selected; over the store's `hoveredStyle`. */
  readonly hoveredStyle?: Style | undefined;
}

export interface CircleLocation<Data = unknown>
  extends LocationBase<Data>,
    CircleGeometry,
    StyledShape<ShapeStyle> {}

export interface PolylineLocation<Data = unknown>
  extends LocationBase<Data>,
    PolylineGeometry,
    StyledShape<LineStyle> {}

export interface PolygonLocation<Data = unknown>
  extends LocationBase<Data>,
    PolygonGeometry,
    StyledShape<ShapeStyle> {}

export type Location<Data = unknown> =
  | MarkerLocation<Data>
  | CircleLocation<Data>
  | PolylineLocation<Data>
  | PolygonLocation<Data>;
