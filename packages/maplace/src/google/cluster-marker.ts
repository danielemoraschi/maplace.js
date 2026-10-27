/// <reference types="google.maps" preserve="true" />
import type { Cluster } from "@googlemaps/markerclusterer";
import { clusterLabel, countBadge } from "../adapter-kit/cluster-badge";
import { CLUSTER_RANK } from "../adapter-kit/stacking";
import type { GoogleLibraries } from "./libraries";

/** One cluster's marker on the map, zooming into `cluster`, the one last drawn there. */
export interface ClusterMarker {
  readonly element: google.maps.marker.AdvancedMarkerElement;
  cluster: Cluster;
}

/**
 * A maplace cluster: an advanced marker, clickable and titled for screen readers, reached with
 * Tab, that zooms into its locations. Measured on Maps JS 3.66: the clusterer's default renderer
 * makes markers that can't be clicked, and it listens with Google's deprecated `addListener`, so
 * each cluster listens for its own `gmp-click`.
 */
export function createClusterMarker(
  { marker }: GoogleLibraries,
  cluster: Cluster,
  map: google.maps.Map,
): ClusterMarker {
  const element = new marker.AdvancedMarkerElement({
    position: cluster.position,
    title: clusterLabel(cluster.count),
    gmpClickable: true,
    zIndex: CLUSTER_RANK,
  });
  element.append(countBadge(map.getDiv().ownerDocument, cluster.count));
  const clusterMarker: ClusterMarker = { element, cluster };
  element.addEventListener("gmp-click", () => zoomInto(clusterMarker.cluster, map));
  return clusterMarker;
}

function zoomInto(cluster: Cluster, map: google.maps.Map): void {
  const { bounds } = cluster;
  if (bounds) map.fitBounds(bounds);
}
