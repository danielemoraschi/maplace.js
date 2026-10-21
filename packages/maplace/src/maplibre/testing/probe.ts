import type { Map as MapLibreMap } from "maplibre-gl";
import { DOUBLE_CLICK_WAIT_MS } from "../../adapter-kit/click-gesture";
import { POPUP_HEADING_CLASS } from "../../adapter-kit/popup-content";
import { frontFirst, type MapProbe } from "../../testing/map-probe";
import { createMapState, type MapLibreState } from "../map-state";
import type { PlacedLocation } from "../placed-location";
import { type MapWatch, wait, watchMap } from "./map-settle";
import { markerTarget } from "./marker-target";
import type { ProbeTarget } from "./probe-target";
import { recordSentFeatures, type SentFeatures } from "./sent-features";
import { shapeTarget } from "./shape-target";

/**
 * A map state for one adapter, and a probe that sees and drives its map through what MapLibre
 * has. The state remembers every location placed in it, the map it opened and what that map's
 * sources were sent, so the probe still finds them after the adapter lets go: a location left on
 * a map after destroy shows.
 */
export function probedMapState(): { state: MapLibreState; probe: MapProbe } {
  const state = createMapState();
  const placed = new Map<string, PlacedLocation>();
  let map: MapLibreMap | undefined;
  let sent: SentFeatures | undefined;
  let watch: MapWatch | undefined;
  const place = state.placed.set.bind(state.placed);
  state.placed.set = (id, location) => {
    placed.set(id, location);
    return place(id, location);
  };
  let mounted = state.mounted;
  Object.defineProperty(state, "mounted", {
    get: () => mounted,
    set(next: MapLibreState["mounted"]) {
      mounted = next;
      watch?.stop();
      watch = next && watchMap(next.map);
      // Recorded from before the adapter's parts open; once it lets the map go, its sources still
      // are, so a send after destroy shows, and the map's `getSource` is the map's own again.
      sent?.stop();
      if (next === undefined) return;
      map = next.map;
      sent = recordSentFeatures(next.map);
    },
  });
  const targetOf = (id: string): ProbeTarget | undefined => {
    const location = placed.get(id);
    if (location === undefined || map === undefined || sent === undefined) return undefined;
    const on = { map, sent, stillPlaced: () => state.placed.get(id) === location };
    return location.geometryType === "marker"
      ? markerTarget(location, on)
      : shapeTarget(location, on);
  };
  return {
    state,
    probe: createMapLibreProbe(state, {
      targetOf,
      ids: () => [...placed.keys()],
      map: () => map,
      watch: () => watch,
    }),
  };
}

interface ProbeSources {
  targetOf(id: string): ProbeTarget | undefined;
  ids(): readonly string[];
  map(): MapLibreMap | undefined;
  watch(): MapWatch | undefined;
}

function createMapLibreProbe(state: MapLibreState, sources: ProbeSources): MapProbe {
  let pointedAt: ProbeTarget | undefined;
  let clickHeld: Promise<void> = Promise.resolve();
  const onMap = (id: string) => {
    const target = sources.targetOf(id);
    return target?.onMap() ? target : undefined;
  };
  const reachable = (id: string) => {
    const target = onMap(id);
    return target?.shown() ? target : undefined;
  };

  return {
    location: (id) => onMap(id)?.read(),
    locationIds: () => sources.ids().filter((id) => onMap(id)),
    stackOrder: () =>
      frontFirst(
        sources.ids().flatMap((id) => {
          const target = reachable(id);
          return target ? [{ id, isMarker: target.isMarker, stack: target.stack() }] : [];
        }),
      ),
    shownPopup() {
      const popup = state.popup;
      const element = popup?.window.popup.getElement();
      if (popup === undefined || !popup.window.popup.isOpen() || element === undefined) {
        return undefined;
      }
      const heading = element.querySelector(`.${POPUP_HEADING_CLASS}`)?.textContent ?? undefined;
      return { id: popup.id, element: popup.element, heading };
    },
    click: (id) => reachable(id)?.click(),
    clickMap(at) {
      const map = sources.map();
      if (map === undefined) return;
      // The exact point, as a click there on the canvas: through it, it would come back rounded.
      const originalEvent = new MouseEvent("click", { detail: 1 });
      Object.defineProperty(originalEvent, "target", { value: map.getCanvas() });
      map.fire("click", { lngLat: at, point: map.project([at.lng, at.lat]), originalEvent });
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
    drag() {},
    closePopup() {
      const element = state.popup?.window.popup.getElement();
      element?.querySelector<HTMLElement>(".maplibregl-popup-close-button")?.click();
    },
    async settle() {
      await clickHeld;
      await sources.watch()?.settled();
      // A popup's content is reported in a microtask after it shows.
      await wait(0);
    },
  };
}
