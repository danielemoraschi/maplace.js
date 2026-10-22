import type { Metafile } from "esbuild";
import { packageName } from "../checks/imports.ts";

/**
 * The outputs a page may load for `entry`: its own and those it imports, statically or on demand
 * (the size budgets' `reachableOutputs` counts the static ones only, what a page loads up front).
 */
export function outputsLoadedBy(metafile: Metafile, entry: string): Set<string> {
  const loaded = new Set<string>();
  const toVisit = [entryOutput(metafile, entry)];
  for (let path = toVisit.pop(); path !== undefined; path = toVisit.pop()) {
    if (loaded.has(path)) continue;
    loaded.add(path);
    for (const { path: imported, external } of metafile.outputs[path]?.imports ?? []) {
      if (!external) toVisit.push(imported);
    }
  }
  return loaded;
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

function entryOutput(metafile: Metafile, entry: string): string {
  const output = Object.keys(metafile.outputs).find(
    (path) => metafile.outputs[path]?.entryPoint === entry,
  );
  if (output === undefined) throw new Error(`no output for entry ${entry}`);
  return output;
}
