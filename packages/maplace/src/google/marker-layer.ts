/// <reference types="google.maps" preserve="true" />

import type { Look } from "../adapter-kit/presentation-changes";
import { MaplaceError } from "../errors";
import type { GoogleLibraries } from "./libraries";

type Marker = google.maps.marker.AdvancedMarkerElement;

/** Where markers go on the map: each on it, or into clusters; chosen once, when the map opens. */
export interface MarkerLayer {
  /** Puts the marker where its look says: from its first look on, and at each change of it. */
  place(marker: Marker, look: Look): void;
  /** The marker was given a new position. */
  moved(marker: Marker): void;
  remove(marker: Marker): void;
  /** Shows what changed since the last flush: once a diff is drawn, or a presentation given. */
  flush(): void;
  /** Lets go of every marker, once the map's parts have removed theirs. */
  release(): void;
}

export type MarkerLayerFactory = (map: google.maps.Map, libraries: GoogleLibraries) => MarkerLayer;

/**
 * Each marker on the map itself. A hidden one stays on it, out of sight: Google re-indexes its
 * clickable markers on every one taken off the map, which costs about 7 ms with 1,000 on it and
 * 130 ms with 4,000 (Maps JS 3.66), while `hidden` is free.
 */
export const directMarkers: MarkerLayerFactory = (map) => ({
  place(marker, { visible }) {
    if (marker.hidden === visible) marker.hidden = !visible;
    if (marker.map !== map) marker.map = map;
  },
  moved() {},
  remove(marker) {
    marker.map = null;
  },
  flush() {},
  release() {},
});

/** The layer a store's `cluster` asks for: the clustered one, and its clusterer, loaded only then. */
export async function loadMarkerLayer(cluster: boolean): Promise<MarkerLayerFactory> {
  if (!cluster) return directMarkers;
  const { clusteredMarkers } = await import("./clustered-markers").catch((cause: unknown) => {
    // A build without clustering gives its own reason.
    if (cause instanceof MaplaceError) throw cause;
    throw new MaplaceError("provider-load-failed", "attach: maplace's clustering failed to load", {
      cause,
    });
  });
  return clusteredMarkers;
}
