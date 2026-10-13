import type { Adapter } from "../adapter";
import type { MapInUse, MapSource } from "./map-source";
import type { GoogleMapState } from "./map-state";

/**
 * Loads the map, then opens it in the container unless the load was cancelled or the adapter
 * destroyed meanwhile; destroying gives the map back once.
 */
export function createMapLifecycle(
  source: MapSource,
  state: GoogleMapState,
): Pick<Adapter, "mount" | "destroy"> {
  let inUse: MapInUse | undefined;
  let destroyed = false;
  return {
    async mount({ container, signal }) {
      const open = await source.load();
      if (destroyed || signal.aborted) return;
      inUse = open(container);
      state.map = inUse.map;
    },
    destroy() {
      destroyed = true;
      inUse?.release();
      inUse = undefined;
      state.map = undefined;
    },
  };
}
