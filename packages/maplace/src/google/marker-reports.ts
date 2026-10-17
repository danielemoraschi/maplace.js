/// <reference types="google.maps" preserve="true" />
import { latLngOf } from "./lat-lng";
import type { PlacedMarker, PlacingSite } from "./placed-location";

type Marker = PlacedMarker["marker"];

/**
 * Reports one marker's clicks, drags, and the pointer or keyboard focus on it, while the map is
 * live. Google fires `gmp-dragend` once, on release, so a drag reports once. The listeners are on
 * the marker's own element and go with it, so none need taking down.
 */
export function reportMarkerInput(
  marker: Marker,
  id: string,
  { mounted, hover }: PlacingSite,
): void {
  marker.addEventListener("gmp-click", () => mounted.live()?.reportSelectionChange(id));
  marker.addEventListener("gmp-dragend", () => {
    const dropped = marker.position;
    if (dropped) mounted.live()?.reportLocationChange(id, { type: "marker", ...latLngOf(dropped) });
  });
  marker.addEventListener("pointerenter", () => hover.enter("pointer", id));
  marker.addEventListener("pointerleave", () => hover.leave("pointer", id));
  // A click focuses the marker as well; only keyboard focus points at it.
  marker.addEventListener("focusin", () => {
    if (marker.matches(":focus-visible")) hover.enter("focus", id);
  });
  marker.addEventListener("focusout", () => hover.leave("focus", id));
}
