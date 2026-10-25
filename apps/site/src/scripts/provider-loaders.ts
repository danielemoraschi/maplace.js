import type { Provider } from "../examples/example-providers.ts";

/** What loads each provider's element, the first map asking for it. */
export type ElementLoaders = Readonly<Record<Provider, () => Promise<unknown>>>;

/** The imports each provider's element and MapLibre's assets come from, each on demand. */
export type ProviderImports = ElementLoaders & {
  readonly mapLibreAssets: () => Promise<{ useBuiltWorker(): void }>;
};

/** The site's own imports: maplibre-gl joins no page that runs no MapLibre map. */
const SITE_IMPORTS: ProviderImports = {
  google: () => import("maplace/element/google"),
  maplibre: () => import("maplace/element/maplibre"),
  mapLibreAssets: () => import("./maplibre-assets.ts"),
};

/**
 * What loads each provider's element for a page map, built on `imports`; a version's own imports
 * ready maplibre-gl (`example-failure-notes.ts`). MapLibre's element loads beside its assets
 * (its stylesheet and its worker), not after them: it imports maplibre-gl only once a map opens,
 * which waits for the element's load to resolve. The assets load once, and pointing maplibre-gl
 * at its worker again changes nothing.
 */
export function elementLoaders(imports: ProviderImports): ElementLoaders {
  const readyMapLibre = async () => (await imports.mapLibreAssets()).useBuiltWorker();
  return {
    google: imports.google,
    maplibre: () => Promise.all([imports.maplibre(), readyMapLibre()]),
  };
}

export const ELEMENT_LOADERS = elementLoaders(SITE_IMPORTS);
