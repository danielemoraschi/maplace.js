/**
 * The packages the dev server bundles before any page asks: each is imported only on demand (the
 * Google adapter's clusterer, MapLibre and its clusterer, a React version's React and React DOM,
 * whose `createPortal` maplace's binding uses), and one found that late
 * makes the dev server bundle anew and refuse the modules it had already handed out, as every
 * React version did ("504 Outdated Optimize Dep").
 * maplace itself is its source.
 *
 * maplibre-gl is pre-bundled here while the root `vitest.config.ts` excludes it: a pre-bundled
 * copy looks for its worker in Vite's cache, where there is none, and the tests rely on its own
 * lookup. The site never does: it points maplibre-gl at the worker it serves
 * (`useBuiltWorker`) before any MapLibre map runs.
 */
export const PREBUNDLED_DEPS: readonly string[] = [
  "@googlemaps/markerclusterer",
  "maplibre-gl",
  "react",
  "react-dom",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "react-dom/client",
  "supercluster",
];
