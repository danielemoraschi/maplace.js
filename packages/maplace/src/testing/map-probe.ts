import type { Geometry } from "../geometry";

/** A map's size in CSS pixels. */
export interface MapSize {
  readonly width: number;
  readonly height: number;
}

/** The size conformance maps are drawn at. */
export const MAP_SIZE: MapSize = { width: 512, height: 512 };

/** What a map has for one location. */
export interface LocationOnMap {
  readonly geometry: Geometry;
  readonly title: string | undefined;
  readonly visible: boolean;
  /** The marker the page's icon built; undefined: the provider's default marker, or a shape. */
  readonly icon: Node | undefined;
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
  shownPopup(): ShownPopup | undefined;
  click(id: string): void;
  clickMap(): void;
  pointerOver(id: string): void;
  pointerOut(): void;
  /** Moves or reshapes a location; a no-op where the map doesn't let it be dragged. */
  drag(id: string, geometry: Geometry): void;
  closePopup(): void;
  /**
   * Lets the map finish what it started by itself (a camera move, a popup opening, a route) and
   * report it. Resolves at once when nothing is pending: a real map fires no idle event then.
   */
  settle(): Promise<void>;
}
