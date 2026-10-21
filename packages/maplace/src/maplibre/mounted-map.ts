import type { Map as MapLibreMap } from "maplibre-gl";
import type { AdapterHost, MountContext } from "../adapter";
import { createTeardowns } from "../adapter-kit/teardowns";
import type { ResolvedPopupOptions } from "../popup";
import type { MapLibre } from "./library";
import type { MapInUse } from "./map-source";

/** The open map as each part of the adapter sees it. */
export interface MountedMapLibre {
  readonly map: MapLibreMap;
  readonly maplibre: MapLibre;
  /** How popups open and where they sit, fixed for the life of the map. */
  readonly popup: ResolvedPopupOptions;
  /** Aborted once the map closes: a wait on the map races it, as a closed map settles nothing. */
  readonly closing: AbortSignal;
  /** Whom to report to; undefined once the load is cancelled or the map closed. */
  live(): AdapterHost | undefined;
  /** Runs on destroy, the last added first: each part removes here what it added. */
  onDestroy(teardown: () => void): void;
}

/**
 * One part of the adapter, opened on the map once its style has loaded: behaviour comes as a
 * part, and never as an edit to mount or destroy.
 */
export interface MapPart {
  open(mounted: MountedMapLibre): void;
}

interface MapToMount {
  readonly inUse: MapInUse;
  readonly maplibre: MapLibre;
  readonly context: MountContext;
}

/** The map in use as parts see it, and how to close it. */
export interface OpenMap {
  readonly mounted: MountedMapLibre;
  /** Runs the parts' teardowns, then gives the map back, once. */
  close(): void;
}

/**
 * The map in use as parts see it, and how to close it: the parts' teardowns first, last added
 * first, while the map can still take off what they added (a page's own map stays), then the
 * map's release.
 */
export function mountMap({ inUse, maplibre, context }: MapToMount): OpenMap {
  const teardowns = createTeardowns();
  const closing = new AbortController();
  const mounted: MountedMapLibre = {
    map: inUse.map,
    maplibre,
    popup: context.popup,
    closing: closing.signal,
    live: () => (closing.signal.aborted || context.signal.aborted ? undefined : context.host),
    onDestroy: teardowns.add,
  };
  return {
    mounted,
    close() {
      if (closing.signal.aborted) return;
      closing.abort();
      teardowns.runAll();
      inUse.release();
    },
  };
}
