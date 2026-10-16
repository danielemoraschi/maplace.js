import { MaplaceError } from "../errors";

/**
 * Stands in for `clustered-markers` in the CDN script without clustering
 * (`scripts/build/leave-out-clustering.ts`): a map with `cluster` fails to load, naming the
 * script that clusters.
 */
throw new MaplaceError(
  "provider-load-failed",
  "attach: cluster needs maplace-element-cluster.iife.js; this script has no clustering",
);
