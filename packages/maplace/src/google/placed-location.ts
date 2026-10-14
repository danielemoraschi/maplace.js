/// <reference types="google.maps" />
import type { Drawable } from "../drawable";
import type { Geometry, LatLng } from "../geometry";
import type { LocationState } from "../location";
import type { HoverReports } from "./hover";
import type { MountedMap } from "./mounted-map";

/** How the store's presentation shows one location. */
export interface Look {
  readonly state: LocationState;
  readonly visible: boolean;
}

/** Where a location's popup points: at a marker, which it follows, or at a point. */
export type PopupPlace =
  | { readonly anchor: google.maps.marker.AdvancedMarkerElement }
  | { readonly position: LatLng };

interface Placed {
  /** The drawable it shows now. */
  drawable(): Drawable;
  popupPlace(): PopupPlace;
  /** Redraws only what the new drawable changed; its type is the same (the contract's rule). */
  update(drawable: Drawable): void;
  present(look: Look): void;
  remove(): void;
}

export interface PlacedMarker extends Placed {
  readonly marker: google.maps.marker.AdvancedMarkerElement;
}

/** What Google draws a circle, polyline or polygon with. */
export type GoogleShape = google.maps.Circle | google.maps.Polyline | google.maps.Polygon;

export interface PlacedShape extends Placed {
  readonly shape: GoogleShape;
}

/** One location on the Google map. */
export type PlacedLocation = PlacedMarker | PlacedShape;

/** What placing needs besides the drawable: the map, the look now, and what markers share. */
export interface PlacingSite {
  readonly mounted: MountedMap;
  lookOf(id: string): Look;
  readonly hover: HoverReports;
  /** The next marker's place in the order added. */
  nextOrder(): number;
}

/** Puts one location on the map. */
export type Placer = (drawable: Drawable, site: PlacingSite) => PlacedLocation;

/** A placer for every geometry type, so a type left out fails to compile. */
export type Placers = Readonly<Record<Geometry["type"], Placer>>;
