import { type BuildOptions, buildSync } from "esbuild";
import { DIST, PACKAGE_ENTRIES, ROOT, SRC, TARGET } from "./package.ts";

/**
 * npm's ESM: a file per entry and chunks for the code they share, so the core exists once (one
 * `MaplaceError` across entries); dependencies left to the page's bundler, which also minifies.
 */
export function esmBuildOptions(outdir: string = DIST): BuildOptions {
  return {
    absWorkingDir: ROOT,
    entryPoints: Object.values(PACKAGE_ENTRIES),
    outbase: SRC,
    outdir,
    bundle: true,
    splitting: true,
    format: "esm",
    target: TARGET,
    packages: "external",
    // The React entry's JSX, as `react/jsx-runtime` calls: set here, not left to a tsconfig.
    jsx: "automatic",
    chunkNames: "chunks/[name]-[hash]",
    logLevel: "warning",
  };
}

export function buildEsm(outdir: string = DIST): void {
  buildSync(esmBuildOptions(outdir));
}
