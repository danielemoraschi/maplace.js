/// <reference types="google.maps" />
import type { LatLng } from "../../geometry";
import type { MapProbe } from "../../testing/map-probe";
import { createMapState, type GoogleMapState } from "../map-state";
import type { PlacedMarker } from "../placed-location";

type Marker = PlacedMarker["marker"];

/**
 * A map state for one adapter, and a probe that sees and drives its map through Google's own
 * objects. The state remembers every marker placed in it and the map it opened, so the probe
 * still finds them after the adapter lets go: a marker left on a map after destroy shows.
 */
export function probedMapState(): { state: GoogleMapState; probe: MapProbe } {
  const state = createMapState();
  const markers = new Map<string, Marker>();
  let map: google.maps.Map | undefined;
  const place = state.placed.set.bind(state.placed);
  state.placed.set = (id, placed) => {
    markers.set(id, placed.marker);
    return place(id, placed);
  };
  let mounted = state.mounted;
  Object.defineProperty(state, "mounted", {
    get: () => mounted,
    set(next: GoogleMapState["mounted"]) {
      mounted = next;
      map = next?.map ?? map;
    },
  });
  return { state, probe: createGoogleProbe(markers, () => map) };
}

/** A user can reach only a marker on a map and not hidden; Google adds it to the page later. */
function createGoogleProbe(
  markers: Map<string, Marker>,
  map: () => google.maps.Map | undefined,
): MapProbe {
  let pointedAt: Marker | undefined;
  const onMap = (id: string) => {
    const marker = markers.get(id);
    return marker?.map ? marker : undefined;
  };
  const shown = (marker: Marker) => marker.map != null && !marker.hidden;
  const reachable = (id: string) => {
    const marker = onMap(id);
    return marker && shown(marker) ? marker : undefined;
  };
  const dispatch = (marker: Marker | undefined, type: string) =>
    marker?.dispatchEvent(new Event(type));

  return {
    location(id) {
      const marker = onMap(id);
      if (marker === undefined) return undefined;
      const { lat, lng } = latLngOf(marker.position);
      return {
        geometry: { type: "marker", lat, lng },
        title: marker.title || undefined,
        visible: shown(marker),
        icon: marker.firstChild ?? undefined,
      };
    },
    locationIds: () => [...markers.keys()].filter((id) => onMap(id)),
    stackOrder: () =>
      [...markers]
        .filter(([, marker]) => shown(marker))
        .sort(([, a], [, b]) => (b.zIndex ?? 0) - (a.zIndex ?? 0))
        .map(([id]) => id),
    shownPopup: () => undefined,
    click: (id) => dispatch(reachable(id), "gmp-click"),
    clickMap() {
      // Google's own click handler reads the event, so it needs one.
      const clicked = map();
      if (clicked) google.maps.event.trigger(clicked, "click", {});
    },
    pointerOver(id) {
      pointedAt = reachable(id);
      dispatch(pointedAt, "pointerenter");
    },
    pointerOut() {
      dispatch(pointedAt, "pointerleave");
      pointedAt = undefined;
    },
    drag: () => {},
    closePopup: () => {},
    settle: () => Promise.resolve(),
  };
}

function latLngOf(position: Marker["position"]): LatLng {
  if (position == null) return { lat: Number.NaN, lng: Number.NaN };
  if (position instanceof google.maps.LatLng) return position.toJSON();
  return { lat: position.lat, lng: position.lng };
}
