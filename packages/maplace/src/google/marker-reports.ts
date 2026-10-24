/// <reference types="google.maps" preserve="true" />
import { reportElementHover } from "../adapter-kit/hover-reports";
import { reportLocationClick } from "./map-clicks";
import type { PlacedMarker, PlacingSite } from "./placed-location";

type Marker = PlacedMarker["marker"];

/**
 * Reports one marker's clicks, and the pointer or keyboard focus on it, while the map is live.
 * The listeners are on the marker's own element and go with it, so none need taking down.
 */
export function reportMarkerInput(
  marker: Marker,
  id: string,
  { mounted, hover }: PlacingSite,
): void {
  marker.addEventListener("gmp-click", () => reportLocationClick(mounted, id));
  reportElementHover(marker, id, hover);
}
