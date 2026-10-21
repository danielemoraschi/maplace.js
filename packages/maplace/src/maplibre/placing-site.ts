import { createHoverReports } from "../adapter-kit/hover-reports";
import { lookIn } from "../adapter-kit/presentation-changes";
import { createOrderCounter } from "../adapter-kit/stacking";
import type { FeatureSets } from "./feature-set";
import { createFrontPins } from "./front-pins";
import type { MapLibreState } from "./map-state";
import type { MountedMapLibre } from "./mounted-map";
import type { PlacingSite } from "./placed-location";

/**
 * Where locations are placed on an open map: the look the state's presentation gives them now,
 * the features they are drawn as, and the hover and stacking order they share.
 */
export function createPlacingSite(
  mounted: MountedMapLibre,
  state: MapLibreState,
  features: FeatureSets,
): PlacingSite {
  return {
    mounted,
    features,
    lookOf: (id) => lookIn(state.presented, id),
    hover: createHoverReports(mounted.live),
    frontPins: createFrontPins(mounted),
    nextOrder: createOrderCounter(),
  };
}
