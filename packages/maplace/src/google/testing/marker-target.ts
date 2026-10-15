/// <reference types="google.maps" />
import type { LatLng } from "../../geometry";
import type { PlacedMarker } from "../placed-location";
import type { ProbeTarget } from "./probe-target";

type Marker = PlacedMarker["marker"];

/**
 * An advanced marker as a user reaches it: its element's events, as Google dispatches them. It is
 * on the map while drawn there or held for it (`onMap`: in a cluster too), and shown when drawn
 * as itself.
 */
export function markerTarget(marker: Marker, onMap: () => boolean): ProbeTarget {
  const shown = () => marker.map != null && !marker.hidden;
  const dispatch = (type: string) => marker.dispatchEvent(new Event(type));
  return {
    isMarker: true,
    onMap,
    shown,
    read: () => ({
      geometry: { type: "marker", ...latLngOf(marker.position) },
      title: marker.title || undefined,
      visible: shown(),
      icon: marker.firstChild ?? undefined,
    }),
    stack: () => marker.zIndex ?? 0,
    click: () => dispatch("gmp-click"),
    pointerOver: () => dispatch("pointerenter"),
    pointerOut: () => dispatch("pointerleave"),
    drag(geometry) {
      if (!marker.gmpDraggable || geometry.type !== "marker") return;
      marker.position = { lat: geometry.lat, lng: geometry.lng };
      dispatch("gmp-dragend");
    },
  };
}

function latLngOf(position: Marker["position"]): LatLng {
  if (position == null) return { lat: Number.NaN, lng: Number.NaN };
  if (position instanceof google.maps.LatLng) return position.toJSON();
  return { lat: position.lat, lng: position.lng };
}
