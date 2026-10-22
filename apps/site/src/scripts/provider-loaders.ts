import type { Provider } from "../examples/example-providers.ts";

/** What loads each provider's element, the first map asking for it. */
export type ElementLoaders = Readonly<Record<Provider, () => Promise<unknown>>>;

/** The imports each provider's element and MapLibre's assets come from, each on demand. */
export type ProviderImports = ElementLoaders & {
  readonly mapLibreAssets: () => Promise<{ useBuiltWorker(): void }>;
};

/** What the site loads on demand for its providers. */
export interface ProviderLoaders {
  /** Readies MapLibre before any map of its runs: its stylesheet and its worker, once. */
  readonly readyMapLibre: () => Promise<void>;
  /** Loads each provider's element, MapLibre's with MapLibre readied. */
  readonly elementLoaders: ElementLoaders;
}

/** The site's own imports: maplibre-gl joins no page that runs no MapLibre map. */
const SITE_IMPORTS: ProviderImports = {
  google: () => import("maplace/element/google"),
  maplibre: () => import("maplace/element/maplibre"),
  mapLibreAssets: () => import("./maplibre-assets.ts"),
};

/**
 * The loaders built on `imports`. MapLibre's element loads beside its assets, not after them: it
 * imports maplibre-gl only once a map opens, which waits for the element's load to resolve.
 */
export function providerLoaders(imports: ProviderImports): ProviderLoaders {
  const readyMapLibre = onceUnlessFailed(async () => {
    const assets = await imports.mapLibreAssets();
    assets.useBuiltWorker();
  });
  const loadMapLibre = async () => {
    const [element] = await Promise.all([imports.maplibre(), readyMapLibre()]);
    return element;
  };
  return { readyMapLibre, elementLoaders: { google: imports.google, maplibre: loadMapLibre } };
}

/** `run`, run on the first call only, unless it failed: then on the next call again. */
function onceUnlessFailed(run: () => Promise<void>): () => Promise<void> {
  let running: Promise<void> | undefined;
  return () => {
    running ??= run().catch((error: unknown) => {
      running = undefined;
      throw error;
    });
    return running;
  };
}

export const { readyMapLibre, elementLoaders: ELEMENT_LOADERS } = providerLoaders(SITE_IMPORTS);
