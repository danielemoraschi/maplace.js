/// <reference types="google.maps" preserve="true" />
import {
  MarkerClusterer,
  MarkerClustererEvents,
  SuperClusterAlgorithm,
} from "@googlemaps/markerclusterer";
import { type Placement, placementOf } from "../adapter-kit/placement";
import { clusterRenderer } from "./cluster-marker";
import type { MarkerLayerFactory } from "./marker-layer";

type Marker = google.maps.marker.AdvancedMarkerElement;

/**
 * Google's clusterer, given the markers to cluster at once: its own `addMarker` and
 * `removeMarker` search its list for each marker, which adds up over thousands.
 */
class Clusterer extends MarkerClusterer {
  /** Clusters exactly these markers from the next render on. */
  cluster(markers: Marker[]): void {
    this.markers = markers;
  }
}

/** Google's clustering, which reads the markers' positions again only when its list changes. */
class ClusteringAlgorithm extends SuperClusterAlgorithm {
  /** A marker moved: the next render reads every position again. */
  forgetPositions(): void {
    this.markers = [];
  }
}

/**
 * Markers clustered by Google's MarkerClusterer, which counts every marker it holds, shown or
 * not: so a hidden marker leaves it, and the selected one leaves it to stand on the map alone
 * (`placementOf`). The clusterer is given its markers and renders at most once per diff or
 * presentation, when what it clusters changed (`flush`): measured on Maps JS 3.66 with 4,000,
 * one render takes 66–76 ms. A render takes off
 * the map a marker it last drew on its own and no longer clusters, so the one standing alone is
 * put back after each, the clusterer's own on `idle` too.
 */
export const clusteredMarkers: MarkerLayerFactory = (map, libraries) => {
  const algorithm = new ClusteringAlgorithm({});
  const clusterer = new Clusterer({
    map,
    algorithm,
    renderer: clusterRenderer(libraries),
    // Not undefined, which takes the clusterer's own click: each cluster listens for its own.
    onClusterClick: null as never,
  });
  const placements = new Map<Marker, Placement>();
  const toCluster = new Set<Marker>();
  let alone: Marker | undefined;
  let changed = false;
  const putBackAlone = () => putOnMap(alone, map);
  const rendered = clusterer.addListener(MarkerClustererEvents.CLUSTERING_END, putBackAlone);

  function leave(marker: Marker): void {
    changed = toCluster.delete(marker) || changed;
    if (alone === marker) alone = undefined;
  }

  return {
    place(marker, { visible, state }) {
      const placement = placementOf(visible, state);
      if (placements.get(marker) === placement) return;
      placements.set(marker, placement);
      leave(marker);
      if (placement === "hidden") {
        putOnMap(marker, null);
        return;
      }
      // Either way a render follows: the one standing alone goes on the map after it.
      if (placement === "clustered") toCluster.add(marker);
      else alone = marker;
      changed = true;
    },
    moved(marker) {
      if (!toCluster.has(marker)) return;
      algorithm.forgetPositions();
      changed = true;
    },
    remove(marker) {
      placements.delete(marker);
      leave(marker);
      putOnMap(marker, null);
    },
    flush() {
      if (!changed) return;
      changed = false;
      clusterer.cluster([...toCluster]);
      clusterer.render();
    },
    release() {
      rendered.remove();
      clusterer.cluster([]);
      clusterer.setMap(null);
    },
  };
};

function putOnMap(marker: Marker | undefined, map: google.maps.Map | null): void {
  if (marker && marker.map !== map) marker.map = map;
}
