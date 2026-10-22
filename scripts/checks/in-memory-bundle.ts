import { relative } from "node:path";
import { type BuildOptions, build, type Metafile } from "esbuild";
import { ROOT } from "../build/package.ts";

/** A build made in memory: esbuild's account of it, and each output's bytes by path. */
export interface Bundle {
  readonly metafile: Metafile;
  readonly outputs: ReadonlyMap<string, Uint8Array>;
}

/** Builds as `options` say, minified as a page gets it, writing nothing. */
export async function bundleInMemory(options: BuildOptions): Promise<Bundle> {
  const result = await build({
    ...options,
    minify: true,
    // Measured without their maps, which pages load only in devtools.
    sourcemap: false,
    write: false,
    metafile: true,
    logLevel: "silent",
  });
  const outputs = new Map(
    result.outputFiles.map((file) => [relative(ROOT, file.path), file.contents]),
  );
  return { metafile: result.metafile, outputs };
}

/**
 * The outputs a page loads for `entry`: its own and those it imports statically, not those it
 * imports on demand (the clustering chunk), nor the packages it leaves to the page (React).
 */
export function reachableOutputs(metafile: Metafile, entry: string): Set<string> {
  return outputsReached(metafile, entry, ({ kind }) => kind === "import-statement");
}

/** An import of a build's output, as esbuild's metafile records it. */
export type OutputImport = Metafile["outputs"][string]["imports"][number];

/**
 * The outputs reached from `entry`'s own output through the imports `follows` takes; a package
 * left to the page (an external import) is never followed.
 */
export function outputsReached(
  metafile: Metafile,
  entry: string,
  follows: (imported: OutputImport) => boolean,
): Set<string> {
  const start = Object.keys(metafile.outputs).find(
    (path) => metafile.outputs[path]?.entryPoint === entry,
  );
  if (start === undefined) throw new Error(`no output for entry ${entry}`);
  const reached = new Set<string>();
  const toVisit = [start];
  for (let path = toVisit.pop(); path !== undefined; path = toVisit.pop()) {
    if (reached.has(path)) continue;
    reached.add(path);
    for (const imported of metafile.outputs[path]?.imports ?? []) {
      if (!imported.external && follows(imported)) toVisit.push(imported.path);
    }
  }
  return reached;
}

/** The scripts of a bundle, without their source maps. */
export function scriptsOf(bundled: Bundle): string[] {
  return [...bundled.outputs.keys()].filter((path) => path.endsWith(".js"));
}
