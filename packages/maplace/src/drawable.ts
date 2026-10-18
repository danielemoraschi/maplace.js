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
  /**
   * The location's style over the default, with no field set to undefined; line fields only for
   * polylines, none for markers.
   */
  readonly style: ShapeStyle | undefined;
  readonly editable: boolean;
  /**
   * Builds the popup content (sanitizing `html` on first call); undefined when there is none.
   * When `content` is a Node it returns that same Node, so content shown in two places at once
   * must be a function. A function `content` gets a new builder with every new location object.
   * Returns undefined when the page's function or sanitizer failed (already reported as an
   * `error` event): open no popup.
   */
  readonly renderContent: (() => Node | undefined) | undefined;
  /**
   * Builds the marker for a state; call it again only when the state changes. A builder may
   * return the node already shown (the React binding does): leave it in place, so its CSS
   * transitions run. An Element comes back with `data-selected` and `data-hovered` set for that
   * state. A Node `icon` is returned as that same Node, so one Node can't mark two locations; a
   * function `icon` gets a new builder with every new location object. Undefined: the
   * provider's default marker, which may be drawn without DOM (then no data attributes and no
   * marker focus; the list view is the keyboard path). Returns undefined when the page's
   * function failed (already reported as an `error` event): draw the provider's default marker.
   */
  readonly renderIcon: ((state: LocationState) => Node | undefined) | undefined;
}
