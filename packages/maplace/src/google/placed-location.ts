/// <reference types="google.maps" />
import type { Drawable } from "../drawable";
import type { Geometry } from "../geometry";
import type { LocationState } from "../location";
import type { HoverReports } from "./hover";
import type { MountedMap } from "./mounted-map";

/** How the store's presentation shows one location. */
export interface Look {
  readonly state: LocationState;
  readonly visible: boolean;
}

interface Placed {
  /** Redraws only what the new drawable changed; its type is the same (the contract's rule). */
  update(drawable: Drawable): void;
  present(look: Look): void;
  remove(): void;
}

export interface PlacedMarker extends Placed {
  readonly marker: google.maps.marker.AdvancedMarkerElement;
}

/** One location on the Google map; shapes join with G3. */
export type PlacedLocation = PlacedMarker;

/** What placing needs besides the drawable: the map, the look now, and what markers share. */
export interface PlacingSite {
  readonly mounted: MountedMap;
  lookOf(id: string): Look;
  readonly hover: HoverReports;
  /** The next marker's place in the order added. */
  nextOrder(): number;
}

/** Puts one location on the map; undefined when its type isn't drawn yet. */
export type Placer = (drawable: Drawable, site: PlacingSite) => PlacedLocation | undefined;

/** A placer for every geometry type, so a type left out fails to compile. */
export type Placers = Readonly<Record<Geometry["type"], Placer>>;
