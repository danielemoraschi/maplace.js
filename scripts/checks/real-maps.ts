/**
 * MapLibre's own files, by name or folder: its adapter, the element's MapLibre provider, the
 * examples' `maplibre/` versions, the site's MapLibre e2e. No test on Google's real maps reads one.
 */
const MAPLIBRE_ONLY = /(^|\/)[^/]*maplibre[^/]*(\/|$)/i;

/**
 * Whether `next`, with these `changedPaths` since CI's `verify` last passed on it, runs the tests
 * on Google's real maps, each map billed: not when it changed only prose or MapLibre's own files.
 * Changes that can't be told (`undefined`: no run passed yet, a rewritten history, a run started
 * by hand) run them.
 */
export function needsRealMaps(changedPaths: readonly string[] | undefined): boolean {
  if (changedPaths === undefined) return true;
  return changedPaths.some((path) => !isProse(path) && !MAPLIBRE_ONLY.test(path));
}

/** Prose, which no test runs: the docs, the tracker, an example's guide, the package's own docs. */
function isProse(path: string): boolean {
  return path.endsWith(".md");
}
