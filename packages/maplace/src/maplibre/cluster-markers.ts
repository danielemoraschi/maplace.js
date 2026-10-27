import { CLUSTER_STYLES } from "../adapter-kit/cluster-badge";
import { adoptStyles } from "../adopted-styles";
import type { ClusterGroup } from "./cluster-index";
import {
  type ClusterMarker,
  type ClusterPress,
  type ClusterSite,
  createClusterMarker,
} from "./cluster-marker";

/** The clusters drawn on the map. */
export interface ClusterMarkers {
  /** Draws exactly `groups`: a cluster still shown keeps its element, so its focus stays. */
  show(groups: readonly ClusterGroup[]): void;
  /** Takes every cluster off the map. */
  release(): void;
}

/**
 * The map's clusters, kept by cluster id, so a pan doesn't churn the DOM; an element taken off is
 * reused. The map's document gets the badges' styles.
 */
export function createClusterMarkers(site: ClusterSite, press: ClusterPress): ClusterMarkers {
  adoptStyles(site.map.getContainer().ownerDocument, CLUSTER_STYLES);
  let shown = new Map<number, ClusterMarker>();
  const spare: ClusterMarker[] = [];

  function takeOff(marker: ClusterMarker): void {
    marker.remove();
    spare.push(marker);
  }

  return {
    show(groups) {
      const staying = new Set(groups.map(({ id }) => id));
      for (const [id, marker] of shown) if (!staying.has(id)) takeOff(marker);
      const next = new Map<number, ClusterMarker>();
      for (const group of groups) {
        const marker = shown.get(group.id) ?? spare.pop() ?? createClusterMarker(site, press);
        marker.show(group);
        next.set(group.id, marker);
      }
      shown = next;
    },
    release() {
      for (const marker of shown.values()) takeOff(marker);
      shown = new Map();
    },
  };
}
