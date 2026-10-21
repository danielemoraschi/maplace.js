import type { PresentationState } from "../adapter";
import type { SessionPopup } from "../adapter-kit/popup-window";
import { NOTHING_PRESENTED } from "../adapter-kit/presentation-changes";
import type { FeatureSets } from "./feature-set";
import type { MountedMapLibre } from "./mounted-map";
import type { PlacedLocation } from "./placed-location";
import type { MapLibrePopupWindow } from "./popup-window";

/** The popup open on the map, as the probe reads it. */
type ShownMapLibrePopup = SessionPopup<MapLibrePopupWindow>;

/** What the adapter has on the map, shared with its probe; each part adds what it draws. */
export interface MapLibreState {
  /** The open map: undefined before mount and once destroyed. */
  mounted: MountedMapLibre | undefined;
  /** Each location on the map, by id. */
  readonly placed: Map<string, PlacedLocation>;
  /** The store's last presentation, which locations placed later take. */
  presented: PresentationState;
  /** What maplace sends MapLibre, once the map is open. */
  features: FeatureSets | undefined;
  popup: ShownMapLibrePopup | undefined;
}

export function createMapState(): MapLibreState {
  return {
    mounted: undefined,
    placed: new Map(),
    presented: NOTHING_PRESENTED,
    features: undefined,
    popup: undefined,
  };
}
