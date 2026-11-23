/// <reference types="google.maps" preserve="true" />
import type { Adapter, Capability } from "../adapter";
import { createMapFailureNotice, PAGE_MAP_FAILURES } from "../adapter-kit/map-failure";
import { createCamera } from "./camera";
import { createControls } from "./controls";
import { createDrawing } from "./drawing";
import { createHeatPart } from "./heat-part";
import { mapClicks } from "./map-clicks";
import { mapInitialised } from "./map-initialised";
import { mapSourceFor } from "./map-source";
import type { GoogleMapState } from "./map-state";
import { createMapLifecycle } from "./mount";
import type { GoogleAdapterOptions } from "./options";
import { createGoogleOriginDot } from "./origin-dot";
import { pageAuthHook } from "./page-auth";
import { PLACERS } from "./placers";
import { createPopup } from "./popup";
import { createPresenting } from "./presenting";
import { ROUTE_STOP_LIMIT } from "./route-conversions";
import { createGoogleRouting } from "./routing";
import { viewportReports } from "./viewport-reports";

/**
 * What the adapter draws beyond the contract's core. A capability is declared only once the
 * adapter draws it: declaring one it can't draw would fail silently instead of being refused.
 */
const CAPABILITIES: readonly Capability[] = [
  "circle",
  "edit",
  "route",
  "cluster",
  "multipolygon",
  "heatmap",
];

/**
 * One Google adapter from its parts, drawing into `state`, which its test probe reads too. The
 * popup follows what is drawn and presented, a view may wait for a location to be drawn, and a
 * route for its stops, so each syncs after what it follows. Viewports are reported from before
 * the first move. The page's auth hook is taken over here, before the map opens: Google checks
 * the key as its first map opens.
 */
export function assembleGoogleAdapter(
  options: GoogleAdapterOptions,
  state: GoogleMapState,
): Adapter {
  const drawing = createDrawing(state, PLACERS);
  const present = createPresenting(state);
  const popup = createPopup(state);
  const originDot = createGoogleOriginDot(state);
  const camera = createCamera(state, drawing);
  const routing = createGoogleRouting(state, drawing);
  const controls = createControls(camera.panelsSettled, options.colorScheme);
  const heat = createHeatPart(state);
  const parts = [
    mapClicks,
    viewportReports,
    drawing.part,
    camera.part,
    popup.part,
    routing.part,
    controls.part,
    originDot.part,
    heat.part,
  ];
  const failures = options.map ? PAGE_MAP_FAILURES : createMapFailureNotice();
  const lifecycle = createMapLifecycle({
    source: mapSourceFor(options),
    state,
    parts,
    verdict: mapInitialised,
    keyRefusal: pageAuthHook(),
  });
  const followers = [camera, popup, routing, heat];
  const afterDrawing = () => {
    for (const follower of followers) follower.sync();
  };
  return {
    capabilities: new Set(CAPABILITIES),
    routeStopLimit: ROUTE_STOP_LIMIT,
    pageMapElement: options.map?.getDiv(),
    apply: (diff) => drawing.apply(diff).then(afterDrawing),
    present(next) {
      present(next);
      popup.sync();
      originDot.sync();
      heat.present();
    },
    setView: camera.setView,
    setRoute: routing.setRoute,
    mountControl: controls.mountControl,
    mount: failures.mounting(lifecycle.mount),
    destroy() {
      lifecycle.destroy();
      controls.release();
      failures.clear();
    },
  };
}
