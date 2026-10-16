/// <reference types="google.maps" preserve="true" />
import type { Adapter } from "../adapter";
import type { AuthHook } from "./auth-hook";
import { type GoogleLibraries, loadLibraries } from "./libraries";
import type { MapInUse, MapSource } from "./map-source";
import type { GoogleMapState } from "./map-state";
import { loadMarkerLayer } from "./marker-layer";
import { type MapPart, type MapVerdict, mountMap, type OpenMap } from "./mounted-map";
import { keyRefusedError } from "./page-auth";

export interface MapLifecycleParts {
  readonly source: MapSource;
  readonly state: GoogleMapState;
  /** What each tracker row adds to the open map, opened in this order. */
  readonly parts: readonly MapPart[];
  /** What Google must answer, once the parts are open, before the mount resolves. */
  readonly verdict: MapVerdict;
  /** Google refusing the page's key, which disables every map on the page. */
  readonly keyRefusal: AuthHook;
}

/**
 * Loads the libraries, and the marker layer the store's `cluster` asks for, then opens the map in the container unless the load was cancelled or the
 * adapter destroyed meanwhile, and opens each part on it, then waits for Google's verdict;
 * destroying closes it once. Measured on Maps JS 3.66: once Google refuses the key, its maps stop
 * working (`addListener` gives nothing, markers throw), so no map opens after a refusal, and an
 * open one is abandoned at it, left on the page with Google's message until destroyed.
 */
export function createMapLifecycle({
  source,
  state,
  parts,
  verdict,
  keyRefusal,
}: MapLifecycleParts): Pick<Adapter, "mount" | "destroy"> {
  let open: OpenMap | undefined;
  let destroyed = false;

  /** The source's map, unless Google refused the key: then none stays open, and mount fails. */
  function openUnlessRefused(container: HTMLElement, libraries: GoogleLibraries): MapInUse {
    if (keyRefusal.refused()) throw keyRefusedError();
    const inUse = source.open(container, libraries);
    if (!disabledByGoogle(inUse.map)) return inUse;
    inUse.release();
    throw keyRefusedError();
  }

  function keyRefused(): void {
    const host = state.mounted?.live();
    state.mounted = undefined;
    open?.abandon();
    host?.reportError(keyRefusedError());
  }

  return {
    async mount(context) {
      const [libraries, markerLayer] = await Promise.all([
        loadLibraries(),
        loadMarkerLayer(context.cluster),
      ]);
      if (destroyed || context.signal.aborted) return;
      const inUse = openUnlessRefused(context.container, libraries);
      open = mountMap({ inUse, libraries, context, markerLayer });
      const { mounted } = open;
      state.mounted = mounted;
      mounted.onDestroy(keyRefusal.listen(keyRefused));
      for (const part of parts) part.open(mounted);
      await verdict(mounted);
    },
    destroy() {
      destroyed = true;
      state.mounted = undefined;
      open?.close();
      open = undefined;
    },
  };
}

/**
 * Whether Google refused the key before maplace could hear it (the page made a map first).
 * Measured on Maps JS 3.66: a map Google disabled has no element.
 */
function disabledByGoogle(map: google.maps.Map): boolean {
  return map.getDiv() === undefined;
}
