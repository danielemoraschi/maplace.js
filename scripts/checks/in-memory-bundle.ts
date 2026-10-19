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
  const start = Object.keys(metafile.outputs).find(
    (path) => metafile.outputs[path]?.entryPoint === entry,
  );
  if (start === undefined) throw new Error(`no output for entry ${entry}`);
  const reached = new Set<string>();
  const queue = [start];
  for (let path = queue.pop(); path !== undefined; path = queue.pop()) {
    if (reached.has(path)) continue;
    reached.add(path);
    for (const { path: imported, kind, external } of metafile.outputs[path]?.imports ?? []) {
      if (kind === "import-statement" && !external) queue.push(imported);
    }
  }
  return reached;
}

/** The scripts of a bundle, without their source maps. */
export function scriptsOf(bundled: Bundle): string[] {
  return [...bundled.outputs.keys()].filter((path) => path.endsWith(".js"));
}
