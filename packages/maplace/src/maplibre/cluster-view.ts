import type { Map as MapLibreMap } from "maplibre-gl";
import { clusterBoxAround } from "../adapter-kit/cluster-box";
import type { ViewBox } from "../view-box";
import { fromMapLibreZoom } from "./conversions";

/** The zoom clusters are grouped at: maplace's, rounded, as Google's clusterer rounds it. */
export function clusterZoomOf(map: Pick<MapLibreMap, "getZoom">): number {
  return Math.round(fromMapLibreZoom(map.getZoom()));
}

/** `clusterBoxAround` the map's view, in MapLibre's unwrapped longitudes. */
export function clusterBoxOf(map: Pick<MapLibreMap, "getBounds">): ViewBox {
  const bounds = map.getBounds();
  return clusterBoxAround({
    south: bounds.getSouth(),
    west: bounds.getWest(),
    north: bounds.getNorth(),
    east: bounds.getEast(),
  });
}
