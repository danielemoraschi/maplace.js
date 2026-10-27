/// <reference types="google.maps" />
import type { ClusterMarkers } from "../cluster-markers";

/** A cluster as markerclusterer gives one to its renderer. */
type Cluster = Parameters<ClusterMarkers["render"]>[0];

/** A position as markerclusterer gives a cluster's: a `LatLng`, as far as maplace reads one. */
function latLng(lat: number, lng: number): google.maps.LatLng {
  return {
    lat: () => lat,
    lng: () => lng,
    toUrlValue: () => `${lat},${lng}`,
  } as google.maps.LatLng;
}

/** A cluster of `count` locations at `lat`, `lng`, zooming into `bounds`. */
export function clusterOf(
  count: number,
  [lat, lng]: readonly [number, number],
  bounds?: google.maps.LatLngBoundsLiteral,
): Cluster {
  const markers = Array.from({ length: count }, () => ({}));
  return { count, markers, position: latLng(lat, lng), bounds } as unknown as Cluster;
}
