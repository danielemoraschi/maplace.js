/// <reference types="google.maps" />
import type { AdapterHost, MountContext } from "../adapter";
import type { GoogleLibraries } from "./libraries";
import type { MapInUse } from "./map-source";

/** The open map as each part of the adapter sees it. */
export interface MountedMap {
  readonly map: google.maps.Map;
  readonly libraries: GoogleLibraries;
  /** Whom to report to; undefined once the load is cancelled or the map closed. */
  live(): AdapterHost | undefined;
  /** Runs on destroy, the last added first: each part removes here what it added. */
  onDestroy(teardown: () => void): void;
}

/** What a tracker row adds to the map once it opens; it never edits mount or destroy. */
export interface MapPart {
  open(mounted: MountedMap): void;
}

export interface OpenedMap {
  readonly inUse: MapInUse;
  readonly libraries: GoogleLibraries;
  readonly context: MountContext;
}

/**
 * The map in use as parts see it, and how to close it: the map's release first, then the parts'
 * teardowns, last added first. A map maplace created is off the page by then, where Google takes
 * markers off it for free (on the page, each costs more the more markers it holds).
 */
export function mountMap({ inUse, libraries, context }: OpenedMap): {
  readonly mounted: MountedMap;
  close(): void;
} {
  const teardowns: (() => void)[] = [];
  let closed = false;
  const mounted: MountedMap = {
    map: inUse.map,
    libraries,
    live: () => (closed || context.signal.aborted ? undefined : context.host),
    onDestroy: (teardown) => teardowns.push(teardown),
  };
  return {
    mounted,
    close() {
      if (closed) return;
      closed = true;
      inUse.release();
      for (const teardown of teardowns.splice(0).reverse()) teardown();
    },
  };
}
