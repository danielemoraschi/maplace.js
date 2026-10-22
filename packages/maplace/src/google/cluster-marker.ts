/// <reference types="google.maps" preserve="true" />
import type { Cluster, Renderer } from "@googlemaps/markerclusterer";
import { clusterLabel, countBadge } from "../adapter-kit/cluster-badge";
import { CLUSTER_RANK } from "../adapter-kit/stacking";
import type { GoogleLibraries } from "./libraries";

/**
 * maplace's clusters: an advanced marker each, clickable and titled for screen readers, reached
 * with Tab, that zooms into its locations. Measured on Maps JS 3.66: the clusterer's default
 * renderer makes markers that can't be clicked, and it listens with Google's deprecated
 * `addListener`, so each cluster listens for its own `gmp-click`.
 */
export function clusterRenderer({ marker }: GoogleLibraries): Renderer {
  return {
    render(cluster, _stats, map) {
      const shown = new marker.AdvancedMarkerElement({
        position: cluster.position,
        title: clusterLabel(cluster.count),
        gmpClickable: true,
        zIndex: CLUSTER_RANK,
      });
      shown.append(countBadge(document, cluster.count));
      shown.addEventListener("gmp-click", () => zoomInto(cluster, map));
      return shown;
    },
  };
}

function zoomInto(cluster: Cluster, map: google.maps.Map): void {
  const { bounds } = cluster;
  if (bounds) map.fitBounds(bounds);
}
