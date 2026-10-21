/**
 * The packages the dev server bundles before any page asks: each is imported only on demand (the
 * Google adapter's clusterer, a React version's React, the star button's script), and one found
 * that late makes the dev server bundle anew and refuse the modules it had already handed out,
 * as every React version did ("504 Outdated Optimize Dep"). maplace itself is its source.
 */
export const PREBUNDLED_DEPS: readonly string[] = [
  "@googlemaps/markerclusterer",
  "github-buttons",
  "react",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "react-dom/client",
];
