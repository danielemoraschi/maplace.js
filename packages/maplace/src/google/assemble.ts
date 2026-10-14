/// <reference types="google.maps" />
import type { Adapter, Capability } from "../adapter";
import { createDrawing } from "./drawing";
import { INERT_METHODS } from "./inert";
import { mapClicks } from "./map-clicks";
import { mapSourceFor } from "./map-source";
import type { GoogleMapState } from "./map-state";
import { placeMarker } from "./marker";
import { createMapLifecycle } from "./mount";
import type { GoogleAdapterOptions } from "./options";
import type { Placers } from "./placed-location";
import { createPopup } from "./popup";
import { createPresenting } from "./presenting";
import { SHAPE_PLACERS } from "./shape";

const PLACERS: Placers = { marker: placeMarker, ...SHAPE_PLACERS };

/**
 * What the adapter draws beyond the contract's core. Capabilities grow with the rows that draw
 * them: declaring one the adapter can't draw yet would fail silently instead of being refused.
 */
const CAPABILITIES: readonly Capability[] = ["circle", "edit"];

/**
 * One Google adapter from its parts, drawing into `state`, which its test probe reads too. The
 * popup follows what is drawn and presented, so it syncs after each.
 */
export function assembleGoogleAdapter(
  options: GoogleAdapterOptions,
  state: GoogleMapState,
): Adapter {
  const drawing = createDrawing(state, PLACERS);
  const present = createPresenting(state);
  const popup = createPopup(state);
  const parts = [mapClicks, drawing.part, popup.part];
  return {
    capabilities: new Set(CAPABILITIES),
    pageMapElement: options.map?.getDiv(),
    ...INERT_METHODS,
    apply: (diff) => drawing.apply(diff).then(() => popup.sync()),
    present(next) {
      present(next);
      popup.sync();
    },
    ...createMapLifecycle({ source: mapSourceFor(options), state, parts }),
  };
}
