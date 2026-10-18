import type { MapSize } from "../adapter-kit/web-mercator";
import type { Geometry, LatLng } from "../geometry";
import type { ShapeStyle } from "../style";

/** The size conformance maps are drawn at. */
export const MAP_SIZE: MapSize = { width: 512, height: 512 };

/** What a map has for one location. */
export interface LocationOnMap {
  readonly geometry: Geometry;
  readonly title: string | undefined;
  readonly visible: boolean;
  /** The marker the page's icon built; undefined: the provider's default marker, or a shape. */
  readonly icon: Node | undefined;
  /**
   * The style a shape is drawn with, in maplace's names, its state's look included (`{}`: the
   * provider's defaults); undefined for a marker.
   */
  readonly style: ShapeStyle | undefined;
}

/** The popup a map shows, and the element its content sits in. */
export interface ShownPopup {
  readonly id: string;
  readonly element: HTMLElement;
}

/**
 * Sees and drives one provider's map without its types: the only per-provider code the
 * conformance suite needs. Queries never report or change the map; actions are a user's and
 * report at once, as provider event handlers do.
 */
export interface MapProbe {
  location(id: string): LocationOnMap | undefined;
  locationIds(): readonly string[];
  /** The shown locations, front first: markers, then shapes, which every map draws below them. */
  stackOrder(): readonly string[];
  shownPopup(): ShownPopup | undefined;
  click(id: string): void;
  /** Clicks the map itself at `at`, away from every location. */
  clickMap(at: LatLng): void;
  pointerOver(id: string): void;
  pointerOut(): void;
  /**
   * Moves or reshapes a location as a user would, one handle at a time; a no-op where the map
   * doesn't let it be edited.
   */
  drag(id: string, geometry: Geometry): void;
  closePopup(): void;
  /**
   * Lets the map finish what it started by itself (a camera move, a popup opening, a route, a
   * click on the map held until it can't be half of a double-click) and report it. Resolves at
   * once when nothing is pending: a real map fires no idle event then.
   */
  settle(): Promise<void>;
}

/** A shown location as `stackOrder` ranks it. */
export interface StackedLocation {
  readonly id: string;
  readonly isMarker: boolean;
  /** Higher in front, among locations of its own layer. */
  readonly stack: number;
}

/** `stackOrder`'s rule for every map: markers above shapes, each front first by its stack. */
export function frontFirst(locations: readonly StackedLocation[]): string[] {
  return [...locations]
    .sort((a, b) => Number(b.isMarker) - Number(a.isMarker) || b.stack - a.stack)
    .map(({ id }) => id);
}
