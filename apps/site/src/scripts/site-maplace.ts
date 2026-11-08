import { maplaceInstaller } from "./maplace-global.ts";

/**
 * The site's own `Maplace`, as each CDN script sets it: the npm entries it stands for, from the
 * site's bundle, and on MapLibre the maplibre-gl its maps draw with. This module's
 * `@maplacejs/maplace/google` and `@maplacejs/maplace/maplibre` are the site's, as the examples'
 * version modules' are: their maps' failed loads noted (`exampleFailureNotes`), Google's on the
 * site's map ID (`exampleMapId`).
 */
export const installMaplace = maplaceInstaller(
  {
    google: () => mergedExports(import("@maplacejs/maplace/google")),
    maplibre: () =>
      mergedExports(
        import("@maplacejs/maplace/maplibre"),
        import("maplibre-gl").then((maplibre) => ({ maplibre })),
      ),
  },
  globalThis as { Maplace?: object },
);

async function mergedExports(...providerParts: readonly Promise<object>[]): Promise<object> {
  const parts = await Promise.all([
    import("@maplacejs/maplace"),
    import("@maplacejs/maplace/element"),
    ...providerParts,
  ]);
  return Object.assign({}, ...parts);
}
