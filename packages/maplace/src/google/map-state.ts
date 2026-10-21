/// <reference types="google.maps" preserve="true" />
import type { PresentationState } from "../adapter";
import type { SessionPopup } from "../adapter-kit/popup-window";
import { NOTHING_PRESENTED } from "../adapter-kit/presentation-changes";
import type { MountedMap } from "./mounted-map";
import type { PlacedLocation } from "./placed-location";
import type { GooglePopupWindow } from "./popup-window";

/** The popup open on the map, as the probe reads it. */
type ShownGooglePopup = SessionPopup<GooglePopupWindow>;

/** What the adapter has on the map, shared with its probe; each part adds what it draws. */
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
