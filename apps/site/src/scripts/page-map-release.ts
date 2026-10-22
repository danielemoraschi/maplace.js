import type { MaplaceMapElement } from "maplace/element";
import { runPageScripts } from "../examples/page-scripts.ts";
import { byProvider } from "./by-provider.ts";
import { releaseOnceDefined } from "./element-loader.ts";
import { clearScriptFailure, noteScriptFailure } from "./map-failures.ts";
import type { ElementLoaders } from "./provider-loaders.ts";

/**
 * What releases a page's map once its provider's element is loaded (`loaders`): each provider's
 * element loads once, with the first of its maps, and a map's page scripts run as it is
 * released, as the CDN script would have it. A failed load is noted on that map and tried again.
 */
export function pageMapRelease(loaders: ElementLoaders): (map: MaplaceMapElement) => Promise<void> {
  return byProvider({
    google: releaserFor(loaders.google),
    maplibre: releaserFor(loaders.maplibre),
  });
}

function releaserFor(load: () => Promise<unknown>): (map: MaplaceMapElement) => Promise<void> {
  return releaseOnceDefined<MaplaceMapElement>({
    load,
    release(map) {
      runPageScripts(map.closest("[data-live-page]") ?? map);
      map.release();
    },
    failed(map, error) {
      console.error("maplace: the map element's script didn't load", error);
      noteScriptFailure(map);
    },
    recovered: clearScriptFailure,
  });
}
