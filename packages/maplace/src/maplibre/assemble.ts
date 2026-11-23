import type { MapMouseEvent } from "maplibre-gl";
import type { Adapter, Capability } from "../adapter";
import { createMapFailureNotice, PAGE_MAP_FAILURES } from "../adapter-kit/map-failure";
import { createCamera } from "./camera";
import { clusterRegrouping } from "./cluster-regrouping";
import { createControls } from "./controls";
import { createDrawing } from "./drawing";
import { globePart } from "./globe";
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
import { createMapLibreRouting } from "./routing";
import { viewportReports } from "./viewport-reports";

/**
 * What the adapter draws beyond the contract's core. A capability is declared only once the
 * adapter draws it: circles, clustering, editing and heatmaps; routes only through the page's own
 * routing (`computeRoute`), MapLibre having none.
 */
const CAPABILITIES: readonly Capability[] = [
  "circle",
  "cluster",
  "edit",
  "heatmap",
  "multipolygon",
];

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
  const controls = createControls(camera.panelsSettled);
  const pointedAt = (event: MapMouseEvent) => locationAt(state, event.point);
  const routing =
    options.computeRoute && createMapLibreRouting(state, drawing, options.computeRoute);
  const parts = [
    // The globe first: setting the projection loads every source again, and the first view is
    // fitted on the projection the map opens in.
    ...(options.globe ? [globePart(options.globe, controls.mountControl)] : []),
    drawing.part,
    clusterRegrouping(state),
    markerStacking,
    mapClicks(pointedAt),
    layerHover(pointedAt, drawing.hover),
    viewportReports,
    // The controls before the camera: panels mounted before the map opens are placed when the first
    // view is fitted, clear of them.
    controls.part,
    camera.part,
    ...(routing ? [routing.part] : []),
    popup.part,
    originDot.part,
  ];
  const failures = options.map ? PAGE_MAP_FAILURES : createMapFailureNotice();
  const lifecycle = createMapLifecycle({
    source: mapSourceFor(options),
    state,
    parts,
    reportFatal: failures.reportFatal,
  });
  const followers = [camera, popup, ...(routing ? [routing] : [])];
  const afterDrawing = () => {
    for (const follower of followers) follower.sync();
  };
  return {
    capabilities: new Set<Capability>(routing ? [...CAPABILITIES, "route"] : CAPABILITIES),
    pageMapElement: options.map?.getContainer(),
    apply: (diff) => drawing.apply(diff).then(afterDrawing).then(drawing.rendered),
    present(next) {
      present(next);
      popup.sync();
      originDot.sync();
    },
    setView: camera.setView,
    // Without the page's routing, routes aren't a capability: the store never asks for one.
    setRoute(route) {
      routing?.setRoute(route);
    },
    mountControl: controls.mountControl,
    mount: failures.mounting(lifecycle.mount),
    destroy() {
      lifecycle.destroy();
      controls.release();
      failures.clear();
    },
  };
}
