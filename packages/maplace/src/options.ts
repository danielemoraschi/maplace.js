import type { Location } from "./location";
import type { PopupOptions } from "./popup";
import type { ShapeStyle } from "./style";
import type { View } from "./viewport";

/**
 * The initial view is `view` when given, else the `selectedId` location, else all locations
 * fitted with 40px padding.
 */
export interface MaplaceOptions<Data = unknown> {
  readonly locations?: readonly Location<Data>[] | undefined;
  /** Initially selected location; an unknown id throws. */
  readonly selectedId?: string | undefined;
  /** Required before any location uses `html`; return safe HTML. */
  readonly sanitize?: ((html: string) => string) | undefined;
  readonly popup?: PopupOptions | undefined;
  /** Default style of circles, polylines and polygons; a location's `style` overrides it. */
  readonly style?: ShapeStyle | undefined;
  /** Drawn over `style` while a shape is selected; a location's `selectedStyle` overrides it. */
  readonly selectedStyle?: ShapeStyle | undefined;
  /**
   * Drawn over `style` while a shape is hovered and not selected; a location's `hoveredStyle`
   * overrides it.
   */
  readonly hoveredStyle?: ShapeStyle | undefined;
  /** Cluster markers; needs the `cluster` capability. */
  readonly cluster?: boolean | undefined;
  readonly view?: View | undefined;
}
