/// <reference types="google.maps" preserve="true" />

import type { HoverReports } from "../adapter-kit/hover-reports";
import type { Look } from "../adapter-kit/presentation-changes";
import type { Drawable } from "../drawable";
import type { Geometry, LatLng } from "../geometry";
import type { MountedMap } from "./mounted-map";
import type { SitePins } from "./site-pins";

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

/** What Google draws a circle, polyline, polygon or multipolygon with. */
export type GoogleShape = google.maps.Circle | google.maps.Polyline | google.maps.Polygon;

export interface PlacedShape extends Placed {
  readonly shape: GoogleShape;
  /**
   * What draws its stroke as a user sees it, while not the shape itself: the copy of its outline
   * over the other shapes (`lifted-outline.ts`), or a split line's part ahead, else its part
   * travelled (`line-parts.ts`).
   */
  seenStroke(): GoogleShape | undefined;
}

/** One location on the Google map. */
export type PlacedLocation = PlacedMarker | PlacedShape;

/** What placing needs besides the drawable: the map, the look now, and what markers share. */
export interface PlacingSite {
  readonly mounted: MountedMap;
  lookOf(id: string): Look;
  readonly hover: HoverReports;
  /** The default pins, in the colours the page set when the map opened. */
  readonly pins: SitePins;
  /** The next marker's place in the order added. */
  nextOrder(): number;
}

/** Puts one location on the map. */
export type Placer = (drawable: Drawable, site: PlacingSite) => PlacedLocation;

/** A placer for every geometry type, so a type left out fails to compile. */
export type Placers = Readonly<Record<Geometry["type"], Placer>>;
