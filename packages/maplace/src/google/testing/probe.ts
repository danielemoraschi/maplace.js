/// <reference types="google.maps" />
import { frontFirst, type MapProbe } from "../../testing/map-probe";
import { createMapState, type GoogleMapState } from "../map-state";
import type { PlacedLocation } from "../placed-location";
import { markerTarget } from "./marker-target";
import type { ProbeTarget } from "./probe-target";
import { shapeTarget } from "./shape-target";

/**
 * A map state for one adapter, and a probe that sees and drives its map through Google's own
 * objects. The state remembers every location placed in it and the map it opened, so the probe
 * still finds them after the adapter lets go: a location left on a map after destroy shows.
 */
export function probedMapState(): { state: GoogleMapState; probe: MapProbe } {
  const state = createMapState();
  const targets = new Map<string, ProbeTarget>();
  let map: google.maps.Map | undefined;
  const place = state.placed.set.bind(state.placed);
  state.placed.set = (id, placed) => {
    targets.set(id, targetOf(placed));
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
  return { state, probe: createGoogleProbe(targets, () => map) };
}

function targetOf(placed: PlacedLocation): ProbeTarget {
  return "marker" in placed ? markerTarget(placed.marker) : shapeTarget(placed.shape);
}

/** A user can reach only a location on a map and not hidden; Google adds it to the page later. */
function createGoogleProbe(
  targets: Map<string, ProbeTarget>,
  map: () => google.maps.Map | undefined,
): MapProbe {
  let pointedAt: ProbeTarget | undefined;
  const onMap = (id: string) => {
    const target = targets.get(id);
    return target?.onMap() ? target : undefined;
  };
  const reachable = (id: string) => {
    const target = onMap(id);
    return target?.shown() ? target : undefined;
  };

  return {
    location: (id) => onMap(id)?.read(),
    locationIds: () => [...targets.keys()].filter((id) => onMap(id)),
    stackOrder: () =>
      frontFirst(
        [...targets]
          .filter(([, target]) => target.shown())
          .map(([id, target]) => ({ id, isMarker: target.isMarker, stack: target.stack() })),
      ),
    shownPopup: () => undefined,
    click: (id) => reachable(id)?.click(),
    clickMap() {
      // Google's own click handler reads the event, so it needs one.
      const clicked = map();
      if (clicked) google.maps.event.trigger(clicked, "click", {});
    },
    pointerOver(id) {
      pointedAt = reachable(id);
      pointedAt?.pointerOver();
    },
    pointerOut() {
      pointedAt?.pointerOut();
      pointedAt = undefined;
    },
    drag: (id, geometry) => reachable(id)?.drag(geometry),
    closePopup: () => {},
    settle: () => Promise.resolve(),
  };
}
