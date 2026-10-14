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
  return { state, probe: createGoogleProbe({ state, targets, map: () => map }) };
}

function targetOf(placed: PlacedLocation): ProbeTarget {
  return "marker" in placed ? markerTarget(placed.marker) : shapeTarget(placed.shape);
}

/** What the probe reads: the adapter's state, a target per location placed, and the map opened. */
interface ProbeSources {
  readonly state: GoogleMapState;
  readonly targets: Map<string, ProbeTarget>;
  readonly map: () => google.maps.Map | undefined;
}

/** A user can reach only a location on a map and not hidden; Google adds it to the page later. */
function createGoogleProbe({ state, targets, map }: ProbeSources): MapProbe {
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
    shownPopup() {
      const popup = state.popup;
      return popup?.infoWindow.isOpen ? { id: popup.id, element: popup.element } : undefined;
    },
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
    closePopup() {
      // As a click on its close button: Google closes the window, then says the user did.
      const infoWindow = state.popup?.infoWindow;
      infoWindow?.close();
      if (infoWindow) google.maps.event.trigger(infoWindow, "closeclick");
    },
    async settle() {
      const popup = state.popup;
      if (popup === undefined || popup.shown) return;
      // The adapter's own listener came first, so the open is reported by the time this runs.
      await new Promise((resolve) =>
        google.maps.event.addListenerOnce(popup.infoWindow, "domready", resolve),
      );
    },
  };
}
