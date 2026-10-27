/// <reference types="google.maps" preserve="true" />
import type { Cluster, Renderer } from "@googlemaps/markerclusterer";
import { type ClusterMarker, createClusterMarker } from "./cluster-marker";
import type { GoogleLibraries } from "./libraries";

/**
 * Google's cluster markers, kept from one render to the next while a cluster stays where it was
 * with as many locations, as MapLibre keeps its by id: a pan past what was clustered draws only
 * the clusters it brings in, and a focused one keeps its focus.
 */
export interface ClusterMarkers extends Renderer {
  /** The render is over: those it didn't draw come off the map a frame later, as the clusterer's. */
  endRender(): void;
  /** Takes every cluster marker off the map. */
  release(): void;
}

/**
 * The renderer keeping them, by count and place: supercluster puts a cluster at the same point at
 * the same zoom whatever the box it is asked for, and the clusterer asks for the box around the
 * view.
 */
export function createClusterMarkers(libraries: GoogleLibraries): ClusterMarkers {
  let shown = new Map<string, ClusterMarker>();
  let drawing = new Map<string, ClusterMarker>();

  return {
    render(cluster, _stats, map) {
      let key = keyOf(cluster);
      // Two clusters alike in one render each keep a marker of their own.
      while (drawing.has(key)) key += "'";
      const kept = shown.get(key) ?? createClusterMarker(libraries, cluster, map);
      kept.cluster = cluster;
      drawing.set(key, kept);
      return kept.element;
    },
    endRender() {
      const leaving: ClusterMarker[] = [];
      for (const [key, kept] of shown) if (!drawing.has(key)) leaving.push(kept);
      shown = drawing;
      drawing = new Map();
      if (leaving.length > 0) requestAnimationFrame(() => takeOff(leaving));
    },
    release() {
      takeOff(shown.values());
      shown = new Map();
    },
  };
}

/** How many locations, and where: `markers.length`, not `count`, which filters them on each read. */
function keyOf({ markers, position }: Cluster): string {
  return `${markers.length}@${position.toUrlValue()}`;
}

function takeOff(markers: Iterable<ClusterMarker>): void {
  for (const { element } of markers) element.map = null;
}
