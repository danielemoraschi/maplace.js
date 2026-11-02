import type { MapMouseEvent } from "maplibre-gl";
import type { Adapter, Capability } from "../adapter";
import { createMapFailureNotice, PAGE_MAP_FAILURES } from "../adapter-kit/map-failure";
import { createCamera } from "./camera";
import { clusterRegrouping } from "./cluster-regrouping";
import { createControls } from "./controls";
import { createDrawing } from "./drawing";
import { layerHover } from "./layer-hover";
import { mapClicks } from "./map-clicks";
import { mapSourceFor } from "./map-source";
import type { MapLibreState } from "./map-state";
import { markerStacking } from "./marker-stacking";
import { createMapLifecycle } from "./mount";
import type { MapLibreAdapterOptions } from "./options";
import { createMapLibreOriginDot } from "./origin-dot";
import { PLACERS } from "./placers";
import { locationAt } from "./pointer-targets";
import { createPopup } from "./popup";
import { createPresenting } from "./presenting";
import { viewportReports } from "./viewport-reports";

/**
 * What the adapter draws beyond the contract's core. A capability is declared only once the
 * adapter draws it: circles, clustering and editing; routes never, MapLibre has no routing.
 */
const CAPABILITIES: readonly Capability[] = ["circle", "cluster", "edit"];

/**
 * One MapLibre adapter from its parts, drawing into `state`, which its test probe reads too. The
 * drawing opens first: it adds the layers the rest point into. The popup and camera follow what
 * is drawn and presented, so each syncs after what it follows; `apply` resolves once MapLibre has
 * rendered the diff.
 */
export function assembleMapLibreAdapter(
  options: MapLibreAdapterOptions,
  state: MapLibreState,
): Adapter {
  const drawing = createDrawing(state, PLACERS);
  const present = createPresenting(state);
  const popup = createPopup(state);
  const originDot = createMapLibreOriginDot(state);
  const camera = createCamera(state, drawing);
  const controls = createControls();
  const pointedAt = (event: MapMouseEvent) => locationAt(state, event.point);
  const parts = [
    drawing.part,
    clusterRegrouping(state),
    markerStacking,
    mapClicks(pointedAt),
    layerHover(pointedAt, drawing.hover),
    viewportReports,
    camera.part,
    popup.part,
    controls.part,
    originDot.part,
  ];
  const failures = options.map ? PAGE_MAP_FAILURES : createMapFailureNotice();
  const lifecycle = createMapLifecycle({
    source: mapSourceFor(options),
    state,
    parts,
    reportFatal: failures.reportFatal,
  });
  const followers = [camera, popup];
  const afterDrawing = () => {
    for (const follower of followers) follower.sync();
  };
  return {
    capabilities: new Set(CAPABILITIES),
    pageMapElement: options.map?.getContainer(),
    apply: (diff) => drawing.apply(diff).then(afterDrawing).then(drawing.rendered),
    present(next) {
      present(next);
      popup.sync();
      originDot.sync();
    },
    setView: camera.setView,
    // Routes aren't a capability: the store never asks for one, and clears none.
    setRoute() {},
    mountControl: controls.mountControl,
    mount: failures.mounting(lifecycle.mount),
    destroy() {
      lifecycle.destroy();
      controls.release();
      failures.clear();
    },
  };
}
