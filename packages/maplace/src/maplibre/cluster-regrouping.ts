import { flushAll } from "./feature-set";
import type { MapLibreState } from "./map-state";
import type { MapPart } from "./mounted-map";

/**
 * Regroups the markers each time the camera settles, and sends MapLibre what that folded and
 * unfolded: the feature sets are otherwise sent only after a diff or a presentation. Only a
 * regroup that changed a marker sends, so a map that doesn't cluster never sends from here, and a
 * move between a diff's chunks never sends half of it.
 */
export function clusterRegrouping(state: MapLibreState): MapPart {
  return {
    open({ map, clustering, onDestroy }) {
      const settled = () => {
        if (clustering.cameraSettled() && state.features) void flushAll(state.features);
      };
      map.on("moveend", settled);
      onDestroy(() => map.off("moveend", settled));
    },
  };
}
