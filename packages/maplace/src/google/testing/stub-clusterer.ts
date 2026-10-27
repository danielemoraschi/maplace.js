/// <reference types="google.maps" />
import { vi } from "vitest";
import type { ClusterMarkers } from "../cluster-markers";

type Marker = google.maps.marker.AdvancedMarkerElement;

/** The clusterer's events maplace listens to, as the package names them. */
export const MarkerClustererEvents = { CLUSTERING_END: "clusteringend" } as const;

/** Google's clustering algorithm as far as maplace uses it: the markers it last read. */
export class SuperClusterViewportAlgorithm {
  protected markers: Marker[] = [];

  constructor(readonly options: object) {}

  /** Reads `markers` as a render would. */
  read(markers: Marker[]): void {
    this.markers = [...markers];
  }

  /** The markers whose positions it holds. */
  positionsRead(): readonly Marker[] {
    return this.markers;
  }
}

/** Every clusterer made since the test file loaded, the latest last. */
export const clusterersMade: MarkerClusterer[] = [];

/**
 * Google's MarkerClusterer as far as maplace uses it: the markers it holds, each render (which
 * ends with `clusteringend`, as Google's does) and the map it is on. Stands in for the package
 * through `vi.mock("@googlemaps/markerclusterer", () => import("./testing/stub-clusterer"))`.
 */
export class MarkerClusterer {
  protected markers: Marker[] = [];
  /** The clusters its last render drew: as a test sets them, none by default. */
  clusters: { readonly markers: readonly Marker[]; marker?: Marker }[] = [];
  readonly #ended = new Set<() => void>();
  readonly render = vi.fn(() => {
    this.options.algorithm?.read(this.markers);
    this.renderClusters();
    for (const ended of this.#ended) ended();
  });
  readonly setMap = vi.fn();

  constructor(
    readonly options: {
      readonly onClusterClick?: unknown;
      readonly algorithm?: SuperClusterViewportAlgorithm;
      readonly renderer?: ClusterMarkers;
    },
  ) {
    clusterersMade.push(this);
  }

  /** The markers it clusters. */
  held(): readonly Marker[] {
    return this.markers;
  }

  /** Draws its clusters, as Google's does in a render that changed them. */
  protected renderClusters(): void {
    // Nothing to draw: the stub's clusters are as a test sets them.
  }

  addListener(_name: string, listener: () => void): google.maps.MapsEventListener {
    this.#ended.add(listener);
    return { remove: () => this.#ended.delete(listener) };
  }
}
