/// <reference types="google.maps" preserve="true" />
import type { PresentationState } from "../adapter";
import { NOTHING_PRESENTED } from "../adapter-kit/presentation-changes";
import type { MountedMap } from "./mounted-map";
import type { PlacedLocation } from "./placed-location";

/** The popup open on the map, as the probe reads it. */
export interface ShownGooglePopup {
  readonly id: string;
  /** What holds the content, given to `popupOpen`. */
  readonly element: HTMLElement;
  readonly infoWindow: google.maps.InfoWindow;
  /** Its content was reported in the DOM; until then, Google's `domready` is still to come. */
  readonly shown: boolean;
}

/** What the adapter has on the map, shared with its probe; each row adds what it draws. */
export interface GoogleMapState {
  /** The open map: undefined before mount and once destroyed. */
  mounted: MountedMap | undefined;
  /** Each location on the map, by id. */
  readonly placed: Map<string, PlacedLocation>;
  /** The store's last presentation, which locations placed later take. */
  presented: PresentationState;
  popup: ShownGooglePopup | undefined;
  /** Settles once the route asked for is shown, failed or dropped; undefined before any. */
  routeSettling: Promise<void> | undefined;
}

export function createMapState(): GoogleMapState {
  return {
    mounted: undefined,
    placed: new Map(),
    presented: NOTHING_PRESENTED,
    popup: undefined,
    routeSettling: undefined,
  };
}
