import { maplaceInstaller } from "./maplace-global.ts";

/**
 * The site's own `Maplace`, as each CDN script sets it: the npm entries it stands for, from the
 * site's bundle, and on MapLibre the maplibre-gl its maps draw with. This module's
 * `maplace/google` is the site's (`exampleMapId`), its calls on the site's map ID, as the
 * examples' version modules' is.
 */
export const installMaplace = maplaceInstaller(
  {
    google: () => mergedExports(import("maplace/google")),
    maplibre: () =>
      mergedExports(
        import("maplace/maplibre"),
        import("maplibre-gl").then((maplibre) => ({ maplibre })),
      ),
  },
  globalThis as { Maplace?: object },
);

async function mergedExports(...providerParts: readonly Promise<object>[]): Promise<object> {
  const parts = await Promise.all([import("maplace"), import("maplace/element"), ...providerParts]);
  return Object.assign({}, ...parts);
}
