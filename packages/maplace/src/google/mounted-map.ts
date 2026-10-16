/// <reference types="google.maps" preserve="true" />
import type { AdapterHost, MountContext } from "../adapter";
import type { ResolvedPopupOptions } from "../popup";
import type { GoogleLibraries } from "./libraries";
import type { MapInUse } from "./map-source";
import type { MarkerLayer, MarkerLayerFactory } from "./marker-layer";

/** The open map as each part of the adapter sees it. */
export interface MountedMap {
  readonly map: google.maps.Map;
  readonly libraries: GoogleLibraries;
  /** How popups open and where they sit, fixed for the life of the map. */
  readonly popup: ResolvedPopupOptions;
  /** Where markers go on it, fixed for the life of the map: each on it, or into clusters. */
  readonly markers: MarkerLayer;
  /** Whom to report to; undefined once the load is cancelled or the map closed. */
  live(): AdapterHost | undefined;
  /** Runs on destroy, the last added first: each part removes here what it added. */
  onDestroy(teardown: () => void): void;
}

/** What a tracker row adds to the map once it opens; it never edits mount or destroy. */
export interface MapPart {
  open(mounted: MountedMap): void;
}

/**
 * What Google must answer before the map counts as open: it reports a failure itself, and settles
 * by the time the map closes.
 */
export type MapVerdict = (mounted: MountedMap) => Promise<void>;

export interface OpenedMap {
  readonly inUse: MapInUse;
  readonly libraries: GoogleLibraries;
  readonly context: MountContext;
  readonly markerLayer: MarkerLayerFactory;
}

/** The map in use as parts see it, and how to close it. */
export interface OpenMap {
  readonly mounted: MountedMap;
  /** Gives the map back, then runs the parts' teardowns, once. */
  close(): void;
  /**
   * Lets go of a map Google disabled (it refused the key): the parts' teardowns run, each letting
   * go of the map, and their failures to take off what Google no longer serves are left. The map
   * stays, with Google's own message on it, until closed.
   */
  abandon(): void;
}

/**
 * The map in use as parts see it, and how to close it: the map's release first, then the parts'
 * teardowns, last added first. A map maplace created is off the page by then, where Google takes
 * markers off it for free (on the page, each costs more the more markers it holds).
 */
export function mountMap({ inUse, libraries, context, markerLayer }: OpenedMap): OpenMap {
  const markers = markerLayer(inUse.map, libraries);
  // The layer lets go of its markers last, once every part has removed its own.
  const teardowns: (() => void)[] = [() => markers.release()];
  let released = false;
  let tornDown = false;
  const mounted: MountedMap = {
    map: inUse.map,
    libraries,
    popup: context.popup,
    markers,
    live: () => (tornDown || context.signal.aborted ? undefined : context.host),
    onDestroy: (teardown) => teardowns.push(teardown),
  };

  function tearDown(run: (teardown: () => void) => void): void {
    if (tornDown) return;
    tornDown = true;
    for (const teardown of teardowns.splice(0).reverse()) run(teardown);
  }

  return {
    mounted,
    close() {
      if (!released) {
        released = true;
        inUse.release();
      }
      tearDown((teardown) => teardown());
    },
    abandon: () => tearDown(ignoringFailure),
  };
}

function ignoringFailure(teardown: () => void): void {
  try {
    teardown();
  } catch {
    // Google disabled the map: what it held went with it.
  }
}
