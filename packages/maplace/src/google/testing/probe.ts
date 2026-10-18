/// <reference types="google.maps" />
import { frontFirst, type MapProbe } from "../../testing/map-probe";
import { DOUBLE_CLICK_WAIT_MS } from "../map-clicks";
import { createMapState, type GoogleMapState } from "../map-state";
import type { PlacedLocation } from "../placed-location";
import { type CameraWatch, watchCamera } from "./camera-watch";
import { controlsPlaced } from "./controls-placed";
import { wait } from "./map-waits";
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
  let camera: CameraWatch | undefined;
  const place = state.placed.set.bind(state.placed);
  state.placed.set = (id, placed) => {
    targets.set(
      id,
      targetOf(placed, () => state.placed.get(id) === placed),
    );
    return place(id, placed);
  };
  let mounted = state.mounted;
  Object.defineProperty(state, "mounted", {
    get: () => mounted,
    set(next: GoogleMapState["mounted"]) {
      mounted = next;
      map = next?.map ?? map;
      // Watched from before the adapter's parts open, and no longer once it lets the map go.
      camera?.stop();
      camera = next && watchCamera(next.map);
    },
  });
  const sources = { state, targets, map: () => map, camera: () => camera };
  return { state, probe: createGoogleProbe(sources) };
}

/**
 * A marker is on the map while drawn there, or while the adapter still has it placed (in a
 * cluster, out of sight, it isn't drawn), so one left on a map after destroy shows.
 */
function targetOf(placed: PlacedLocation, stillPlaced: () => boolean): ProbeTarget {
  if (!("marker" in placed)) return shapeTarget(placed.shape);
  const { marker } = placed;
  return markerTarget(marker, () => stillPlaced() || marker.map != null);
}

/**
 * What the probe reads: the adapter's state, a target per location placed, the map opened, and
 * its camera while the adapter has it.
 */
interface ProbeSources {
  readonly state: GoogleMapState;
  readonly targets: Map<string, ProbeTarget>;
  readonly map: () => google.maps.Map | undefined;
  readonly camera: () => CameraWatch | undefined;
}

/** A user can reach only a location on a map and not hidden; Google adds it to the page later. */
function createGoogleProbe({ state, targets, map, camera }: ProbeSources): MapProbe {
  let pointedAt: ProbeTarget | undefined;
  let clickHeld: Promise<void> = Promise.resolve();
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
    clickMap(at) {
      const clicked = map();
      if (clicked === undefined) return;
      // Google's click handlers read where from the event's `latLng`.
      google.maps.event.trigger(clicked, "click", { latLng: new google.maps.LatLng(at) });
      // Set after the map's own hold, with the same delay, so it ends after the map reports.
      clickHeld = wait(DOUBLE_CLICK_WAIT_MS);
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
      await clickHeld;
      await state.routeSettling;
      await camera()?.settled();
      const drawnOn = map();
      if (drawnOn) await controlsPlaced(drawnOn);
      const popup = state.popup;
      if (popup === undefined || popup.shown) return;
      // The adapter's own listener came first, so the open is reported by the time this runs.
      await new Promise((resolve) =>
        google.maps.event.addListenerOnce(popup.infoWindow, "domready", resolve),
      );
    },
  };
}
