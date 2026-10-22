import type { Map as MapLibreMap } from "maplibre-gl";
import { clusterLabel, countBadge } from "../adapter-kit/cluster-badge";
import { CLUSTER_RANK } from "../adapter-kit/stacking";
import type { ClusterGroup } from "./cluster-index";
import { lngLatOf } from "./conversions";
import { pressableElement } from "./dom-marker";
import type { MapLibre } from "./library";

/** What pressing a cluster does: zooms into it, as the user's move. */
export type ClusterPress = (group: ClusterGroup, event: Event) => void;

/** The map clusters are drawn on, and MapLibre's `Marker` they are drawn with. */
export interface ClusterSite {
  readonly map: MapLibreMap;
  readonly maplibre: MapLibre;
}

/** One cluster on the map: maplace's element, in the DOM over the canvas. */
export interface ClusterMarker {
  /** Shows `group`: its place, count and label; again, it only moves and recounts. */
  show(group: ClusterGroup): void;
  remove(): void;
}

/**
 * A cluster's marker: the count in a round badge, its bottom middle on the cluster's point as
 * Google's advanced marker sits, a button named "Cluster of N locations", reached with Tab,
 * stacked above every location in the order added, pressed by a click, Enter or Space. Its click
 * is its own: the map never sees it.
 */
export function createClusterMarker(
  { map, maplibre }: ClusterSite,
  press: ClusterPress,
): ClusterMarker {
  const document = map.getContainer().ownerDocument;
  let shown: ClusterGroup | undefined;
  const element = pressableElement(document, CLUSTER_RANK, (event) => {
    if (shown) press(shown, event);
  });
  const badge = countBadge(document, 0);
  element.append(badge);
  const marker = new maplibre.Marker({ element, anchor: "bottom" });

  return {
    show(group) {
      if (shown?.count !== group.count) {
        element.setAttribute("aria-label", clusterLabel(group.count));
        badge.textContent = String(group.count);
      }
      marker.setLngLat(lngLatOf(group.at));
      if (shown === undefined) marker.addTo(map);
      shown = group;
    },
    remove() {
      marker.remove();
      shown = undefined;
    },
  };
}
