import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "esbuild";
import { ROOT, SRC } from "./package.ts";

const MAPLIBRE_FOR_CDN = "maplibre-for-cdn";
const ADOPT_STYLES = resolve(ROOT, SRC, "adopted-styles.ts");
const WORKER_SOURCE_MAP_COMMENT = /\n\/\/# sourceMappingURL=\S+\s*$/;

/**
 * For the MapLibre CDN script: maplibre-gl bundled with its worker and its stylesheet, so the one
 * pinned file is all a page loads. An IIFE has no `import.meta.url` for MapLibre to find its
 * worker beside its module, so the worker's source is inlined and started from a `blob:` URL (a
 * module worker: it ends `export { … as default }` and imports nothing); the stylesheet is adopted
 * when MapLibre first loads.
 */
export const bundleMapLibre: Plugin = {
  name: "bundle-maplibre",
  setup(build) {
    build.onResolve({ filter: /^maplibre-gl$/ }, ({ namespace }) =>
      namespace === MAPLIBRE_FOR_CDN
        ? undefined
        : { path: "maplibre-gl", namespace: MAPLIBRE_FOR_CDN },
    );
    build.onLoad({ filter: /.*/, namespace: MAPLIBRE_FOR_CDN }, () => ({
      contents: mapLibreWithItsAssets(),
      resolveDir: ROOT,
      loader: "js",
    }));
  },
};

/** maplibre-gl, its worker set to the inlined source and its stylesheet adopted first. */
function mapLibreWithItsAssets(): string {
  const worker = withoutSourceMapComment(distFile("maplibre-gl-worker.mjs"));
  return [
    'import { setWorkerUrl } from "maplibre-gl";',
    `import { adoptStyles } from ${JSON.stringify(ADOPT_STYLES)};`,
    `setWorkerUrl(URL.createObjectURL(new Blob([${JSON.stringify(worker)}], { type: "text/javascript" })));`,
    `adoptStyles(document, ${JSON.stringify(distFile("maplibre-gl.css"))});`,
    'export * from "maplibre-gl";',
  ].join("\n");
}

/** The worker without its trailing source map comment: from a `blob:` URL it reaches nothing. */
function withoutSourceMapComment(source: string): string {
  return source.replace(WORKER_SOURCE_MAP_COMMENT, "\n");
}

/** A file of maplibre-gl's `dist`, as the installed version has it. */
export function distFile(name: string): string {
  return readFileSync(fileURLToPath(import.meta.resolve(`maplibre-gl/dist/${name}`)), "utf8");
}
