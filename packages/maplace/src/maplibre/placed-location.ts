import type { Marker } from "maplibre-gl";
import type { HoverReports } from "../adapter-kit/hover-reports";
import type { Look } from "../adapter-kit/presentation-changes";
import type { Drawable } from "../drawable";
import type { Geometry, LatLng } from "../geometry";
import type { FeatureSets } from "./feature-set";
import type { FrontPins } from "./front-pins";
import type { MountedMapLibre } from "./mounted-map";

/** Where a location's popup points: a point, and how far above it the popup's tip sits. */
export interface PopupPlace {
  readonly at: LatLng;
  /** The height of what is drawn there, in pixels: a marker's, 0 for a shape. */
  readonly lift: number;
}

interface Placed {
  /** The drawable it shows now. */
  drawable(): Drawable;
  popupPlace(): PopupPlace;
  /** Where it stacks among its kind, higher in front. */
  rank(): number;
  /** Redraws only what the new drawable changed; its type is the same (the contract's rule). */
  update(drawable: Drawable): void;
  present(look: Look): void;
  remove(): void;
}

export interface PlacedMarker extends Placed {
  readonly geometryType: "marker";
  /** The DOM marker showing the page's icon; undefined while it is a pin in the pin layer. */
  domMarker(): Marker | undefined;
  /** Drawn in the DOM, above the canvas: its icon, or its pin while selected or hovered. */
  isInDom(): boolean;
}

export interface PlacedShape extends Placed {
  readonly geometryType: Exclude<Geometry["type"], "marker">;
}

/** One location on the MapLibre map. */
export type PlacedLocation = PlacedMarker | PlacedShape;

/** What placing needs besides the drawable: the map, the look now, and what markers share. */
export interface PlacingSite {
  readonly mounted: MountedMapLibre;
  readonly features: FeatureSets;
  lookOf(id: string): Look;
  /** The one hover the map reports, whether a pin, a DOM marker or a shape is pointed at. */
  readonly hover: HoverReports;
  /** The selected and hovered pins, drawn again in front of the rest. */
  readonly frontPins: FrontPins;
  /** The next location's place in the order added. */
  nextOrder(): number;
}

/** Puts one location on the map. */
export type Placer = (drawable: Drawable, site: PlacingSite) => PlacedLocation;

/** A placer for every geometry type maplace draws on MapLibre so far: circles come with M2. */
export type Placers = Readonly<Record<Exclude<Geometry["type"], "circle">, Placer>>;
