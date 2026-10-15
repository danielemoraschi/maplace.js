/// <reference types="google.maps" />
import type { Cluster, Renderer } from "@googlemaps/markerclusterer";
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
        title: `Cluster of ${cluster.count} locations`,
        gmpClickable: true,
        zIndex: CLUSTER_RANK,
      });
      shown.append(countBadge(cluster.count));
      shown.addEventListener("gmp-click", () => zoomInto(cluster, map));
      return shown;
    },
  };
}

function zoomInto(cluster: Cluster, map: google.maps.Map): void {
  const { bounds } = cluster;
  if (bounds) map.fitBounds(bounds);
}

/** The number of locations, in a round badge. */
function countBadge(count: number): HTMLElement {
  const badge = document.createElement("div");
  badge.textContent = String(count);
  Object.assign(badge.style, {
    minWidth: "32px",
    height: "32px",
    padding: "0 6px",
    boxSizing: "border-box",
    borderRadius: "16px",
    border: "2px solid #fff",
    background: "#1a73e8",
    color: "#fff",
    font: "600 13px/28px system-ui, sans-serif",
    textAlign: "center",
  });
  return badge;
}
