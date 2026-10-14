/// <reference types="google.maps" />
import type { Adapter, Capability } from "../adapter";
import { createCamera } from "./camera";
import { createDrawing } from "./drawing";
import { INERT_METHODS } from "./inert";
import { mapClicks } from "./map-clicks";
import { mapSourceFor } from "./map-source";
import type { GoogleMapState } from "./map-state";
import { createMapLifecycle } from "./mount";
import type { GoogleAdapterOptions } from "./options";
import { PLACERS } from "./placers";
import { createPopup } from "./popup";
import { createPresenting } from "./presenting";
import { viewportReports } from "./viewport-reports";

/**
 * What the adapter draws beyond the contract's core. Capabilities grow with the rows that draw
 * them: declaring one the adapter can't draw yet would fail silently instead of being refused.
 */
const CAPABILITIES: readonly Capability[] = ["circle", "edit"];

/**
 * One Google adapter from its parts, drawing into `state`, which its test probe reads too. The
 * popup follows what is drawn and presented, and a view may wait for a location to be drawn, so
 * each syncs after what it follows. Viewports are reported from before the first move.
 */
export function assembleGoogleAdapter(
  options: GoogleAdapterOptions,
  state: GoogleMapState,
): Adapter {
  const drawing = createDrawing(state, PLACERS);
  const present = createPresenting(state);
  const popup = createPopup(state);
  const camera = createCamera(state, drawing);
  const parts = [mapClicks, viewportReports, drawing.part, camera.part, popup.part];
  const afterDrawing = () => {
    camera.sync();
    popup.sync();
  };
  return {
    capabilities: new Set(CAPABILITIES),
    pageMapElement: options.map?.getDiv(),
    ...INERT_METHODS,
    apply: (diff) => drawing.apply(diff).then(afterDrawing),
    present(next) {
      present(next);
      popup.sync();
    },
    setView: camera.setView,
    ...createMapLifecycle({ source: mapSourceFor(options), state, parts }),
  };
}
