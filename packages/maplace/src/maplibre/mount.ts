import type { Adapter } from "../adapter";
import type { MapFailureNotice } from "../adapter-kit/map-failure";
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
import { type WorkerWatch, watchWorker } from "./worker-failure";

export interface MapLifecycleSetup {
  readonly source: MapSource;
  readonly state: MapLibreState;
  /** What each part of the adapter adds to the open map, opened in this order. */
  readonly parts: readonly MapPart[];
  /** How a failure the map doesn't outlive is reported. */
  readonly reportFatal: MapFailureNotice["reportFatal"];
}

/** What routing a map's errors needs besides the map. */
interface ErrorRouting {
  readonly worker: WorkerWatch;
  readonly styleIsLoaded: () => boolean;
  readonly reportFatal: MapFailureNotice["reportFatal"];
}

/**
 * The map's life, from mount to destroy:
 * 1. maplibre-gl loads, and the clustering when the store clusters;
 * 2. the page's worker is watched, and a worker known dead fails the mount, as it can't recover;
 * 3. the map opens in the container, unless the load was cancelled or the adapter destroyed
 *    meanwhile;
 * 4. the mount waits for its style, whose failure fails it, as the worker's does; its errors routed
 *    from now on;
 * 5. each part opens on it;
 * 6. destroying closes it, once.
 */
export function createMapLifecycle({
  source,
  state,
  parts,
  reportFatal,
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
      const worker = watchWorker(maplibre);
      const known = worker.failure();
      if (known !== undefined) throw known;
      const inUse = source.open(context.container, maplibre);
      open = mountMap({ inUse, maplibre, context, clustering });
      const { mounted } = open;
      let loaded = false;
      const mountFailure = routeErrors(mounted, {
        worker,
        styleIsLoaded: () => loaded,
        reportFatal,
      });
      await Promise.race([styleLoaded(mounted.map), mountFailure, whenAborted(mounted.closing)]);
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
 * The page's worker failing fails the mount too, or, once the style has loaded, the map: fatally.
 */
function routeErrors(
  mounted: MountedMapLibre,
  { worker, styleIsLoaded, reportFatal }: ErrorRouting,
): Promise<never> {
  let failMount: (error: MaplaceError) => void = () => {};
  const mountFailure = new Promise<never>((_, reject) => {
    failMount = reject;
  });
  const report = (error: MaplaceError) => mounted.live()?.reportError(error);
  const stopRouting = routeMapErrors(mounted.map, {
    styleFailed: (error) => (styleIsLoaded() ? report(error) : failMount(error)),
    sourceFailed: report,
  });
  mounted.onDestroy(stopRouting);
  const stopHearing = worker.whenFails((error) => {
    const host = mounted.live();
    if (!styleIsLoaded()) failMount(error);
    else if (host !== undefined) reportFatal(host, error);
  });
  mounted.onDestroy(stopHearing);
  return mountFailure;
}
