import { createHoverReports } from "../adapter-kit/hover-reports";
import { pinLooksOf } from "../adapter-kit/pin-looks";
import { lookIn } from "../adapter-kit/presentation-changes";
import { createOrderCounter } from "../adapter-kit/stacking";
import type { GoogleMapState } from "./map-state";
import type { MountedMap } from "./mounted-map";
import type { PlacingSite } from "./placed-location";

/**
 * Where locations are placed on an open map: the look the state's presentation gives them now,
 * and the hover, stacking order and default pins its markers share.
 */
export function createPlacingSite(mounted: MountedMap, state: GoogleMapState): PlacingSite {
  return {
    mounted,
    lookOf: (id) => lookIn(state.presented, id),
    hover: createHoverReports(mounted.live),
    pinLooks: pinLooksOf(mounted.map.getDiv()),
    nextOrder: createOrderCounter(),
  };
}
