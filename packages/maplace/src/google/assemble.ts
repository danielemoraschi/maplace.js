/// <reference types="google.maps" />
import type { Adapter, Capability } from "../adapter";
import { createCamera } from "./camera";
import { createControls } from "./controls";
import { createDrawing } from "./drawing";
import { mapClicks } from "./map-clicks";
import { mapInitialised } from "./map-initialised";
import { mapSourceFor } from "./map-source";
import type { GoogleMapState } from "./map-state";
import { createMapLifecycle } from "./mount";
import type { GoogleAdapterOptions } from "./options";
import { pageAuthHook } from "./page-auth";
import { PLACERS } from "./placers";
import { createPopup } from "./popup";
import { createPresenting } from "./presenting";
import { ROUTE_STOP_LIMIT } from "./route-conversions";
import { createRouting } from "./routing";
import { viewportReports } from "./viewport-reports";

/**
 * What the adapter draws beyond the contract's core. Capabilities grow with the rows that draw
 * them: declaring one the adapter can't draw yet would fail silently instead of being refused.
 */
const CAPABILITIES: readonly Capability[] = ["circle", "edit", "route", "cluster"];

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
  const camera = createCamera(state, drawing);
  const routing = createRouting(state, drawing);
  const controls = createControls();
  const parts = [
    mapClicks,
    viewportReports,
    drawing.part,
    camera.part,
    popup.part,
    routing.part,
    controls.part,
  ];
  const lifecycle = createMapLifecycle({
    source: mapSourceFor(options),
    state,
    parts,
    verdict: mapInitialised,
    keyRefusal: pageAuthHook(),
  });
  const followers = [camera, popup, routing];
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
    },
    setView: camera.setView,
    setRoute: routing.setRoute,
    mountControl: controls.mountControl,
    mount: lifecycle.mount,
    destroy() {
      lifecycle.destroy();
      controls.release();
    },
  };
}
