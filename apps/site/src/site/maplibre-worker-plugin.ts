import type { Plugin } from "vite";
import { withoutSourceMapComment } from "../../../../scripts/build/source-map-comment.ts";

/** The worker's file as maplibre-gl ships it, which `maplibre-assets.ts` imports by its URL. */
const WORKER_FILE = "maplibre-gl-worker.mjs";

/**
 * Drops the source map comment from maplibre-gl's worker in the site's client build. The build
 * copies the file as it is, comment and all, but not the map it names, so a browser's developer
 * tools asked for it and got a 404. The file keeps the name Vite hashed from maplibre-gl's bytes,
 * so a browser may keep a copy with the comment under it (`/_astro/*` is cached as immutable):
 * harmless, as the comment runs nothing, and a new maplibre-gl renames the file.
 */
export function mapLibreWorkerUnmapped(): Plugin {
  return {
    name: "maplace-maplibre-worker-unmapped",
    applyToEnvironment: (environment) => environment.name === "client",
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle))
        if (file.type === "asset" && file.names.includes(WORKER_FILE))
          file.source = withoutSourceMapComment(asText(file.source));
    },
  };
}

function asText(source: string | Uint8Array): string {
  return typeof source === "string" ? source : new TextDecoder().decode(source);
}
