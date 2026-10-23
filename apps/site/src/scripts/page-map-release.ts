import type { MaplaceMapElement } from "maplace/element";
import type { Provider } from "../examples/example-providers.ts";
import { runPageScripts } from "../examples/page-scripts.ts";
import { byProvider } from "./by-provider.ts";
import { releaseOnceDefined } from "./element-loader.ts";
import { clearScriptFailure, noteScriptFailure } from "./map-failures.ts";
import type { ElementLoaders } from "./provider-loaders.ts";

/**
 * What releases a page's map once its provider's element is loaded (`loaders`) and its provider's
 * `Maplace` is on the page (`installMaplace`), as the CDN script would have both: each loads once,
 * with the first of its maps, and a map's page scripts run as it is released. A failed load is
 * noted on that map, its note offering a reload, and tried again where the browser fetches it
 * again (`releaseOnceDefined`).
 */
export function pageMapRelease(
  loaders: ElementLoaders,
  installMaplace: (provider: Provider) => Promise<void>,
): (map: MaplaceMapElement) => Promise<void> {
  const releaserOn = (provider: Provider) =>
    releaserFor(() => Promise.all([loaders[provider](), installMaplace(provider)]));
  return byProvider({ google: releaserOn("google"), maplibre: releaserOn("maplibre") });
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
