/// <reference types="google.maps" preserve="true" />
import { MarkerClusterer, MarkerClustererEvents } from "@googlemaps/markerclusterer";
import { CLUSTER_STYLES } from "../adapter-kit/cluster-badge";
import { type Placement, placementOf } from "../adapter-kit/placement";
import { adoptStyles } from "../adopted-styles";
import { type ClusterMarkers, createClusterMarkers } from "./cluster-markers";
import { ClusteringAlgorithm } from "./clustering-algorithm";
import type { MarkerLayerFactory } from "./marker-layer";

type Marker = google.maps.marker.AdvancedMarkerElement;

/**
 * Google's clusterer, given the markers to cluster at once: its own `addMarker` and
 * `removeMarker` search its list for each marker, which adds up over thousands. Its cluster
 * markers are `clusterMarkers`' to keep and take off.
 */
class Clusterer extends MarkerClusterer {
  constructor(
    map: google.maps.Map,
    algorithm: ClusteringAlgorithm,
    // Set once `super` returns: Google adds the clusterer to the map, and renders, only later.
    private readonly clusterMarkers: ClusterMarkers,
  ) {
    // Not undefined, which takes the clusterer's own click: each cluster listens for its own.
    super({ map, algorithm, renderer: clusterMarkers, onClusterClick: null as never });
  }

  /** Clusters exactly these markers from the next render on. */
  cluster(markers: Marker[]): void {
    this.markers = markers;
  }

  /** Whether its last render drew `marker` on its own, a cluster of one. */
  drewAlone(marker: Marker): boolean {
    return this.clusters.some(({ markers }) => markers.length === 1 && markers[0] === marker);
  }

  protected override renderClusters(): void {
    super.renderClusters();
    // Left here, a cluster's marker would be taken off by the clusterer's next render, a frame
    // later, kept or not: `clusterMarkers` takes off those it no longer draws.
    for (const cluster of this.clusters) if (cluster.markers.length !== 1) delete cluster.marker;
    this.clusterMarkers.endRender();
  }
}

/**
 * Markers clustered by Google's MarkerClusterer, which counts every marker it holds, shown or
 * not: so a hidden marker leaves it, and the selected one leaves it to stand on the map alone
 * (`placementOf`). The clusterer is given its markers and renders at most once per diff or
 * presentation, when what it clusters changed (`flush`), and on Google's `idle` once the view
 * moved out of what it clustered or changed zoom: only the view and half a view around it are
 * clustered and on the map (M35). A render takes off the map a marker it last drew on its own and
 * no longer clusters, so the one standing alone is put back after each, the clusterer's own on
 * `idle` too. Cluster markers are kept while a cluster stays where it was (`ClusterMarkers`, M36),
 * and the map's document gets their badges' styles.
 */
export const clusteredMarkers: MarkerLayerFactory = (map, libraries) => {
  adoptStyles(map.getDiv().ownerDocument, CLUSTER_STYLES);
  const algorithm = new ClusteringAlgorithm({});
  const clusterMarkers = createClusterMarkers(libraries);
  const clusterer = new Clusterer(map, algorithm, clusterMarkers);
  const placements = new Map<Marker, Placement>();
  const toCluster = new Set<Marker>();
  let alone: Marker | undefined;
  /** The marker last standing alone: off the map after the next render if in none of its. */
  let wasAlone: Marker | undefined;
  let changed = false;
  const rendered = clusterer.addListener(MarkerClustererEvents.CLUSTERING_END, () => {
    putOnMap(alone, map);
    // The clusterer takes off only markers it drew: one it never drew, now out of the view it
    // clusters, would stay on the map.
    if (wasAlone && wasAlone !== alone && !clusterer.drewAlone(wasAlone)) putOnMap(wasAlone, null);
    wasAlone = undefined;
  });

  /** `marker` stands alone; one standing there before, whatever order they come in, goes. */
  function standAlone(marker: Marker): void {
    if (alone !== undefined && alone !== marker) wasAlone = alone;
    alone = marker;
  }

  function leave(marker: Marker): void {
    changed = toCluster.delete(marker) || changed;
    if (alone === marker) {
      alone = undefined;
      wasAlone = marker;
    }
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
      else standAlone(marker);
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
      clusterMarkers.release();
    },
  };
};

function putOnMap(marker: Marker | undefined, map: google.maps.Map | null): void {
  if (marker && marker.map !== map) marker.map = map;
}
