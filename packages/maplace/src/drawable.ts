import type { Geometry } from "./geometry";
import type { IconState } from "./location";
import type { ShapeStyle } from "./style";

/**
 * A location as an adapter draws it, resolved by the store: default style applied, `html`
 * sanitized, user callbacks bound. An unchanged location keeps its Drawable, and `geometry` and
 * `style` keep their reference while unchanged, so adapters compare them with `===`.
 */
export interface Drawable {
  readonly id: string;
  readonly geometry: Geometry;
  /** Accessible name on the map. */
  readonly title: string | undefined;
  /** The location's style over the default; line fields only for polylines, none for markers. */
  readonly style: ShapeStyle | undefined;
  /** Markers may be dragged, shapes reshaped. */
  readonly editable: boolean;
  /** Builds the popup content; undefined when the location has none. */
  readonly renderContent: (() => Node) | undefined;
  /** Builds the marker for a state; undefined for the provider's default marker. */
  readonly renderIcon: ((state: IconState) => Node) | undefined;
}
