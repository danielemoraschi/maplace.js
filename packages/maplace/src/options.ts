import { inAnyGroup, type LocationGroup } from "./group-path";
import { type Icon, isMarkerLocation, type Location, type MarkerLocation } from "./location";
import type { PopupOptions } from "./popup";
import type { ShapeStyle } from "./style";
import type { View } from "./viewport";

/** Where a heatmap gives way to its dots, when `heatmap` doesn't say: about a region. */
export const DEFAULT_HEATMAP_MAX_ZOOM = 9;

/**
 * The zooms a heatmap's `maxZoom` may take. Its fade starts 2 zooms below it, which on MapLibre's
 * scale (one below maplace's) must stay at 0 or above; MapLibre's zooms end at 24.
 */
export const HEATMAP_ZOOMS = { min: 3, max: 25 } as const;

/**
 * Markers drawn as a heatmap, weighted by their `weight`: those in `groups` (one or more), or every
 * marker when `groups` is left out. Below `maxZoom` (default 9, zooms as in `Viewport`, 3 to 25)
 * they are heat; over the 2 zooms before it the heat fades into a dot per marker, sized by its
 * weight, which a click selects. The selected or hovered one is drawn as a pin over them. Other
 * markers stay pins. A marker in the heat can't have an `icon` or be `editable`, and draws no
 * `markerIcon`. Needs the `heatmap` capability; not with `cluster`.
 */
export interface HeatmapOptions {
  /** A group here takes its subgroups, as in `setFilter`. */
  readonly groups?: readonly LocationGroup[] | undefined;
  readonly maxZoom?: number | undefined;
}

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
  /** Default style of every shape; a location's `style` overrides it. */
  readonly style?: ShapeStyle | undefined;
  /** Drawn over `style` while a shape is selected; a location's `selectedStyle` overrides it. */
  readonly selectedStyle?: ShapeStyle | undefined;
  /**
   * Drawn over `style` while a shape is hovered and not selected; a location's `hoveredStyle`
   * overrides it.
   */
  readonly hoveredStyle?: ShapeStyle | undefined;
  /**
   * Drawn over `style` while a shape is active (its `active`), neither hovered nor selected; a
   * location's `activeStyle` overrides it.
   */
  readonly activeStyle?: ShapeStyle | undefined;
  /**
   * The icon of every marker without its own: a URL, a Node (copied for each marker) or a
   * function of the location and its state; a location's `icon` overrides it.
   */
  readonly markerIcon?: Icon<Data> | undefined;
  /** Cluster markers; needs the `cluster` capability. */
  readonly cluster?: boolean | undefined;
  /** Draws markers, by group, as a heatmap when zoomed out; not with `cluster`. */
  readonly heatmap?: HeatmapOptions | undefined;
  readonly view?: View | undefined;
  /** The link a keyboard skips the map by. Default "Skip the map". */
  readonly skipMapLabel?: string | undefined;
  /** Said before a selected location's name, as "Selected: Rome". Default "Selected". */
  readonly selectedLabel?: string | undefined;
}

/**
 * Whether `location` is drawn as heat: a marker in the heatmap's groups, or any marker when it
 * leaves `groups` out. The one rule, for the checks and the drawables alike.
 */
export function isHeatMarker(
  location: Location,
  heatmap: HeatmapOptions | undefined,
): location is MarkerLocation {
  if (heatmap === undefined || !isMarkerLocation(location)) return false;
  const { groups } = heatmap;
  return groups === undefined || inAnyGroup(location.group, groups);
}
