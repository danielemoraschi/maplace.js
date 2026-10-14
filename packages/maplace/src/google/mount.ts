import type { Adapter } from "../adapter";
import { loadLibraries } from "./libraries";
import type { MapSource } from "./map-source";
import type { GoogleMapState } from "./map-state";
import { type MapPart, mountMap } from "./mounted-map";

export interface MapLifecycleParts {
  readonly source: MapSource;
  readonly state: GoogleMapState;
  /** What each tracker row adds to the open map, opened in this order. */
  readonly parts: readonly MapPart[];
}

/**
 * Loads the libraries, then opens the map in the container unless the load was cancelled or the
 * adapter destroyed meanwhile, and opens each part on it; destroying closes it once.
 */
export function createMapLifecycle({
  source,
  state,
  parts,
}: MapLifecycleParts): Pick<Adapter, "mount" | "destroy"> {
  let close: (() => void) | undefined;
  let destroyed = false;
  return {
    async mount(context) {
      const libraries = await loadLibraries();
      if (destroyed || context.signal.aborted) return;
      const inUse = source.open(context.container, libraries);
      const opened = mountMap({ inUse, libraries, context });
      close = opened.close;
      state.mounted = opened.mounted;
      for (const part of parts) part.open(opened.mounted);
    },
    destroy() {
      destroyed = true;
      state.mounted = undefined;
      close?.();
      close = undefined;
    },
  };
}
