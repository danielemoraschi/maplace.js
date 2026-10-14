/// <reference types="google.maps" />
import type { Adapter, Capability } from "../adapter";
import { createDrawing } from "./drawing";
import { INERT_METHODS, NOT_YET_PLACED } from "./inert";
import { mapClicks } from "./map-clicks";
import { mapSourceFor } from "./map-source";
import type { GoogleMapState } from "./map-state";
import { placeMarker } from "./marker";
import { createMapLifecycle } from "./mount";
import type { GoogleAdapterOptions } from "./options";
import type { Placers } from "./placed-location";
import { createPresenting } from "./presenting";

const PLACERS: Placers = { marker: placeMarker, ...NOT_YET_PLACED };

/**
 * One Google adapter from its parts, drawing into `state`, which its test probe reads too.
 * Capabilities grow with the rows that draw them: declaring one the adapter can't draw yet would
 * fail silently instead of being refused.
 */
export function assembleGoogleAdapter(
  options: GoogleAdapterOptions,
  state: GoogleMapState,
): Adapter {
  const drawing = createDrawing(state, PLACERS);
  const parts = [mapClicks, drawing.part];
  return {
    capabilities: new Set<Capability>(),
    pageMapElement: options.map?.getDiv(),
    ...INERT_METHODS,
    apply: drawing.apply,
    present: createPresenting(state),
    ...createMapLifecycle({ source: mapSourceFor(options), state, parts }),
  };
}
