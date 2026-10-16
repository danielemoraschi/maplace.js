import { resolve } from "node:path";
import type { Plugin } from "esbuild";
import { ROOT, SRC } from "./package.ts";

const CLUSTERED_LAYER = /^\.\/clustered-markers$/;
const STAND_IN = resolve(ROOT, SRC, "google/clustering-left-out.ts");

/**
 * For a build without clustering: the clustered marker layer, which the Google adapter imports
 * on demand, is a stand-in failing the load and naming the script that clusters.
 */
export const leaveOutClustering: Plugin = {
  name: "leave-out-clustering",
  setup(build) {
    build.onResolve({ filter: CLUSTERED_LAYER }, ({ importer }) =>
      importer.endsWith("/google/marker-layer.ts") ? { path: STAND_IN } : undefined,
    );
  },
};
