import type { Adapter } from "../adapter";
import type { MaplaceError } from "../errors";
import { loadClustering } from "./clustering";
import { loadMapLibre } from "./library";
import { routeMapErrors } from "./map-errors";
import type { MapSource } from "./map-source";
import type { MapLibreState } from "./map-state";
import { whenAborted } from "./map-waits";
import { type MapPart, type MountedMapLibre, mountMap, type OpenMap } from "./mounted-map";
import { styleLoaded } from "./style-load";
import { warnOfMissingStylesheetOnce } from "./stylesheet-check";

export interface MapLifecycleSetup {
  readonly source: MapSource;
  readonly state: MapLibreState;
  /** What each part of the adapter adds to the open map, opened in this order. */
  readonly parts: readonly MapPart[];
}

/**
 * The map's life, from mount to destroy:
 * 1. maplibre-gl loads, and the clustering when the store clusters;
 * 2. the map opens in the container, unless the load was cancelled or the adapter destroyed
 *    meanwhile;
 * 3. the mount waits for its style, whose failure fails it, its errors routed from now on;
 * 4. each part opens on it;
 * 5. destroying closes it, once.
 */
export function createMapLifecycle({
  source,
  state,
  parts,
}: MapLifecycleSetup): Pick<Adapter, "mount" | "destroy"> {
  let open: OpenMap | undefined;
  let destroyed = false;

  return {
    async mount(context) {
      const [maplibre, clustering] = await Promise.all([
        loadMapLibre(),
        loadClustering(context.cluster),
      ]);
      if (destroyed || context.signal.aborted) return;
      const inUse = source.open(context.container, maplibre);
      open = mountMap({ inUse, maplibre, context, clustering });
      const { mounted } = open;
      let loaded = false;
      const styleFailure = routeErrors(mounted, () => loaded);
      await Promise.race([styleLoaded(mounted.map), styleFailure, whenAborted(mounted.closing)]);
      loaded = true;
      if (mounted.closing.aborted) return;
      warnOfMissingStylesheetOnce(mounted.map);
      state.mounted = mounted;
      for (const part of parts) part.open(mounted);
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
 * Routes the map's errors for its life: a style failing before it loaded fails the mount (the
 * promise returned rejects with it); after, one of maplace's sources failing is reported, and so is
 * a style failing while the map has none (a page replacing its style with `diff: false`; a diffed
 * restyle keeps the old style, so its failure is the page's own, logged or left to its listener).
 */
function routeErrors(mounted: MountedMapLibre, styleIsLoaded: () => boolean): Promise<never> {
  let failMount: (error: MaplaceError) => void = () => {};
  const styleFailure = new Promise<never>((_, reject) => {
    failMount = reject;
  });
  const report = (error: MaplaceError) => mounted.live()?.reportError(error);
  const stopRouting = routeMapErrors(mounted.map, {
    styleFailed: (error) => (styleIsLoaded() ? report(error) : failMount(error)),
    sourceFailed: report,
  });
  mounted.onDestroy(stopRouting);
  return styleFailure;
}
