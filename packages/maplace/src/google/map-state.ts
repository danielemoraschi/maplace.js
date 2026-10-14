import type { PresentationState } from "../adapter";
import { NOTHING_PRESENTED } from "../adapter-kit/presentation-changes";
import type { MountedMap } from "./mounted-map";
import type { PlacedLocation } from "./placed-location";

/** What the adapter has on the map, shared with its probe; each row adds what it draws. */
export interface GoogleMapState {
  /** The open map: undefined before mount and once destroyed. */
  mounted: MountedMap | undefined;
  /** Each location on the map, by id. */
  readonly placed: Map<string, PlacedLocation>;
  /** The store's last presentation, which locations placed later take. */
  presented: PresentationState;
}

export function createMapState(): GoogleMapState {
  return { mounted: undefined, placed: new Map(), presented: NOTHING_PRESENTED };
}
