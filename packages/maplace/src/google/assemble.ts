/// <reference types="google.maps" />
import type { Adapter, Capability } from "../adapter";
import { INERT_METHODS } from "./inert";
import { mapSourceFor } from "./map-source";
import type { GoogleMapState } from "./map-state";
import { createMapLifecycle } from "./mount";
import type { GoogleAdapterOptions } from "./options";

/**
 * One Google adapter from its parts, drawing into `state`, which its test probe reads too.
 * Capabilities grow with the rows that draw them: declaring one the adapter can't draw yet would
 * fail silently instead of being refused.
 */
export function assembleGoogleAdapter(
  options: GoogleAdapterOptions,
  state: GoogleMapState,
): Adapter {
  return {
    capabilities: new Set<Capability>(),
    pageMapElement: options.map?.getDiv(),
    ...INERT_METHODS,
    ...createMapLifecycle(mapSourceFor(options), state),
  };
}
