import type { Metafile } from "esbuild";
import { packageName } from "../checks/imports.ts";
import { outputsReached } from "../checks/in-memory-bundle.ts";

/**
 * The outputs a page may load for `entry`: its own and those it imports, statically or on demand
 * (the size budgets' `reachableOutputs` counts the static ones only, what a page loads up front).
 */
export function outputsLoadedBy(metafile: Metafile, entry: string): Set<string> {
  return outputsReached(metafile, entry, () => true);
}

/** The packages the outputs `entry` may load import by name, left to the page's bundler. */
export function packagesLoadedBy(metafile: Metafile, entry: string): Set<string> {
  const outputs = [...outputsLoadedBy(metafile, entry)];
  return new Set(
    outputs.flatMap((path) =>
      (metafile.outputs[path]?.imports ?? [])
        .filter(({ external }) => external)
        .map(({ path: imported }) => packageName(imported)),
    ),
  );
}
