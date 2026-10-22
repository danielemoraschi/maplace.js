import type { Map as MapLibreMap } from "maplibre-gl";
import type { AdapterHost, MountContext } from "../adapter";
import { createTeardowns } from "../adapter-kit/teardowns";
import type { ResolvedPopupOptions } from "../popup";
import type { Clustering, ClusteringFactory } from "./clustering";
import type { MapLibre } from "./library";
import type { MapInUse } from "./map-source";

/** The open map as each part of the adapter sees it. */
export interface MountedMapLibre {
  readonly map: MapLibreMap;
  readonly maplibre: MapLibre;
  /** How popups open and where they sit, fixed for the life of the map. */
  readonly popup: ResolvedPopupOptions;
  /** How markers group on it, fixed for the life of the map. */
  readonly clustering: Clustering;
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
  readonly clustering: ClusteringFactory;
}

/** The map in use as parts see it, and how to close it. */
export interface OpenMap {
  readonly mounted: MountedMapLibre;
  /** Runs the parts' teardowns, then gives the map back, once. */
  close(): void;
}

/**
 * The map in use as parts see it, and how to close it: the parts' teardowns first, last added
 * first, while the map can still take off what they added (a page's own map stays), the
 * clustering's release after them, then the map's release.
 */
export function mountMap({ inUse, maplibre, context, clustering }: MapToMount): OpenMap {
  const teardowns = createTeardowns();
  const closing = new AbortController();
  const grouping = clustering(inUse.map, maplibre);
  // Added first, so it runs last: once every part let go of its markers.
  teardowns.add(() => grouping.release());
  const mounted: MountedMapLibre = {
    map: inUse.map,
    maplibre,
    popup: context.popup,
    clustering: grouping,
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
