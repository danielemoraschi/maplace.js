import { fileURLToPath } from "node:url";
import { normalizePath, type Plugin } from "vite";
import { VERSION_MODULE } from "./example-modules-run.ts";

/** The site's `maplace/google`, which the examples' version modules import instead. */
const ON_SITE = "\0maplace-google-on-site";

const SITE_GOOGLE = fileURLToPath(new URL("../examples/site-google.ts", import.meta.url));

/** The site's `maplace/google`: the package's, its calls defaulting to the site's map ID. */
const ON_SITE_MODULE = [
  'import { SITE_MAPS_MAP_ID } from "astro:env/client";',
  'import * as google from "maplace/google";',
  `import { googleWithMapId } from ${JSON.stringify(SITE_GOOGLE)};`,
  'export * from "maplace/google";',
  "export const { createGoogleAdapter, createGoogleMap } = googleWithMapId(google, SITE_MAPS_MAP_ID);",
].join("\n");

/**
 * Runs the examples' vanilla and React versions, and the site's `Maplace` its script versions
 * call, on the site's map ID (`SITE_MAPS_MAP_ID`), as the site runs them with its key: their
 * `maplace/google` is one whose calls default to it (`googleWithMapId`), the example files
 * unchanged.
 */
export function exampleMapId(): Plugin {
  return {
    name: "maplace-example-map-id",
    // Before Vite's own resolver, which would take maplace/google for the package.
    enforce: "pre",
    resolveId(source, importer) {
      if (source !== "maplace/google" || importer === undefined) return;
      return isOnSiteMapId(withoutQuery(importer)) ? ON_SITE : undefined;
    },
    load(id) {
      return id === ON_SITE ? ON_SITE_MODULE : undefined;
    },
  };
}

/** The site's own `Maplace` (W33), which a page's script and a script version call. */
/** As Vite names modules: forward slashes on every platform. */
export const SITE_MAPLACE = normalizePath(
  fileURLToPath(new URL("../scripts/site-maplace.ts", import.meta.url)),
);

/** Whether `importer` runs maps on the site's map ID: a version module, or the site's `Maplace`. */
function isOnSiteMapId(importer: string): boolean {
  return VERSION_MODULE.test(importer) || importer === SITE_MAPLACE;
}

/** A module id without the query a dev server adds (`?v=…`). */
function withoutQuery(id: string): string {
  return id.split("?")[0] ?? id;
}
