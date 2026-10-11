import type { Geometry } from "./geometry";
import type { LocationState } from "./location";
import type { ShapeStyle } from "./style";

/**
 * A location as an adapter draws it, resolved by the store: default style applied, user
 * callbacks bound. Each field keeps its reference while its inputs are shallowly unchanged (same
 * scalars, same `path`, `center`, `style`, `icon` and `content` references), so adapters compare
 * fields with `===` and redo only what changed.
 */
export interface Drawable {
  readonly id: string;
  readonly geometry: Geometry;
  /** Accessible name on the map. */
  readonly title: string | undefined;
  /** The location's style over the default; line fields only for polylines, none for markers. */
  readonly style: ShapeStyle | undefined;
  readonly editable: boolean;
  /**
   * Builds the popup content (sanitizing `html` on first call); undefined when there is none.
   * When `content` is a Node it returns that same Node, so content shown in two places at once
   * must be a function.
   */
  readonly renderContent: (() => Node) | undefined;
  /**
   * Builds the marker for a state; call it again only when the state changes. Undefined: the
   * provider's default marker, which an adapter may draw without DOM (e.g. a GPU layer).
   */
  readonly renderIcon: ((state: LocationState) => Node) | undefined;
}
