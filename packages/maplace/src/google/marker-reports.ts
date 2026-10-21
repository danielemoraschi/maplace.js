/// <reference types="google.maps" preserve="true" />
import { editReportsFor } from "../adapter-kit/edit-reports";
import { reportElementHover } from "../adapter-kit/hover-reports";
import type { Geometry } from "../geometry";
import { latLngOf } from "./lat-lng";
import { reportLocationClick } from "./map-clicks";
import type { PlacedMarker, PlacingSite } from "./placed-location";

type Marker = PlacedMarker["marker"];

/**
 * Reports one marker's clicks, drags, and the pointer or keyboard focus on it, while the map is
 * live. Google fires `gmp-drag` as the marker moves and `gmp-dragend` once, on release, so a drag
 * reports its edits as it goes and its change once. The listeners are on the marker's own element
 * and go with it, so none need taking down.
 */
export function reportMarkerInput(
  marker: Marker,
  id: string,
  { mounted, hover }: PlacingSite,
): void {
  marker.addEventListener("gmp-click", () => reportLocationClick(mounted, id));
  const edits = editReportsFor(id, mounted.live);
  marker.addEventListener("gmp-drag", () => reportDragged(marker, edits.moving));
  marker.addEventListener("gmp-dragend", () => reportDragged(marker, edits.ended));
  reportElementHover(marker, id, hover);
}

/** Where the marker is, to `report`; nothing while Google gives it no position. */
function reportDragged(marker: Marker, report: (geometry: Geometry) => void): void {
  const { position } = marker;
  if (position) report({ type: "marker", ...latLngOf(position) });
}
