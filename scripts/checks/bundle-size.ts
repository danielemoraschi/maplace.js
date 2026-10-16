import { relative } from "node:path";
import { gzipSync } from "node:zlib";
import { buildSync, type Metafile } from "esbuild";

/** What to bundle: entry files, and whether code they share goes in chunks of its own. */
export interface BundleSpec {
  readonly entries: readonly string[];
  readonly splitting: boolean;
  /** The JavaScript the bundle is written for; RFC §3 promises evergreen browsers, ES2020. */
  readonly target?: string | undefined;
}

/** A bundle built in memory: esbuild's account of it, and each output's bytes by path. */
export interface Bundle {
  readonly metafile: Metafile;
  readonly outputs: ReadonlyMap<string, Uint8Array>;
}

const SHIPPED_TARGET = "es2020";

/** Bundles `spec` minified, as a page gets it, writing nothing. */
export function bundle(spec: BundleSpec): Bundle {
  const result = buildSync({
    entryPoints: [...spec.entries],
    bundle: true,
    format: "esm",
    minify: true,
    splitting: spec.splitting,
    target: spec.target ?? SHIPPED_TARGET,
    outdir: "out",
    write: false,
    metafile: true,
    logLevel: "silent",
  });
  const outputs = new Map(
    result.outputFiles.map((file) => [relative(".", file.path), file.contents]),
  );
  return { metafile: result.metafile, outputs };
}

/**
 * The outputs a page loads for `entry`: its own and those it imports, statically, and with
 * `dynamic` also those it imports on demand (the clustering chunk).
 */
export function reachableOutputs(
  metafile: Metafile,
  entry: string,
  { dynamic }: { readonly dynamic: boolean },
): Set<string> {
  const start = Object.keys(metafile.outputs).find(
    (path) => metafile.outputs[path]?.entryPoint === entry,
  );
  if (start === undefined) throw new Error(`no output for entry ${entry}`);
  const reached = new Set<string>();
  const queue = [start];
  for (let path = queue.pop(); path !== undefined; path = queue.pop()) {
    if (reached.has(path)) continue;
    reached.add(path);
    for (const { path: imported, kind } of metafile.outputs[path]?.imports ?? []) {
      if (kind === "import-statement" || (dynamic && kind === "dynamic-import"))
        queue.push(imported);
    }
  }
  return reached;
}

/** Each output gzipped as it is served, together, in kB (1,000 bytes). */
export function gzipKilobytes(bundled: Bundle, paths: Iterable<string>): number {
  let bytes = 0;
  for (const path of paths) {
    const contents = bundled.outputs.get(path);
    if (contents === undefined) throw new Error(`no output ${path}`);
    bytes += gzipSync(contents).length;
  }
  return bytes / 1000;
}
