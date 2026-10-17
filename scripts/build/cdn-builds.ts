import { mkdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { type BuildOptions, build } from "esbuild";
import { leaveOutClustering } from "./leave-out-clustering.ts";
import { DIST, PACKAGE_ENTRIES, packageManifest, ROOT, TARGET } from "./package.ts";
import { thirdPartyLicenses } from "./third-party-licenses.ts";

/** The two CDN scripts (RFC §3): one page loads one of them. */
export const CDN_SCRIPTS = {
  plain: "maplace-element.iife.js",
  cluster: "maplace-element-cluster.iife.js",
} as const;

export type CdnScript = keyof typeof CDN_SCRIPTS;

/** Beside the scripts: the notices of the packages they bundle (the cluster script's). */
export const LICENSES_FILE = "THIRD-PARTY-LICENSES.txt";

/**
 * A CDN script: `<maplace-map>` on Google in one minified file, no global. The cluster script
 * bundles the clusterer; the plain one leaves it out, so `cluster` on it fails the load.
 */
export function cdnBuildOptions(
  script: CdnScript,
  outdir: string = DIST,
): BuildOptions & { metafile: true } {
  const clusters = script === "cluster";
  return {
    absWorkingDir: ROOT,
    entryPoints: [PACKAGE_ENTRIES.elementGoogle],
    outfile: join(outdir, CDN_SCRIPTS[script]),
    bundle: true,
    format: "iife",
    target: TARGET,
    minify: true,
    sourcemap: "linked",
    banner: { js: bannerOf(clusters) },
    plugins: clusters ? [] : [leaveOutClustering],
    metafile: true,
    logLevel: "warning",
  };
}

/**
 * Writes both scripts, their source maps, and the licences file of what they bundle: the bytes
 * `builtCdnScript` makes, so a hash of either is the other's.
 */
export async function buildCdnScripts(outdir: string = DIST): Promise<void> {
  const built = await Promise.all([inMemory("plain", outdir), inMemory("cluster", outdir)]);
  mkdirSync(resolve(ROOT, outdir), { recursive: true });
  for (const { path, contents } of built.flatMap(({ outputFiles }) => outputFiles)) {
    writeFileSync(path, contents);
  }
  const licences = thirdPartyLicenses(built.map(({ metafile }) => metafile));
  writeFileSync(resolve(ROOT, outdir, LICENSES_FILE), `${licences}\n`);
}

/**
 * A CDN script's bytes, built in memory exactly as `buildCdnScripts` writes them: what a page
 * pinning the published file gets, so its integrity is the published file's.
 */
export async function builtCdnScript(script: CdnScript): Promise<Uint8Array> {
  const { outputFiles } = await inMemory(script);
  const file = outputFiles.find(({ path }) => basename(path) === CDN_SCRIPTS[script]);
  if (file === undefined)
    throw new Error(`the ${script} CDN build wrote no ${CDN_SCRIPTS[script]}`);
  return file.contents;
}

/** A CDN script built as `cdnBuildOptions` says, kept in memory: its script and source map. */
function inMemory(script: CdnScript, outdir?: string) {
  return build({ ...cdnBuildOptions(script, outdir), write: false });
}

function bannerOf(clusters: boolean): string {
  const thirdParty = clusters ? ` | bundles third-party code: ${LICENSES_FILE}` : "";
  return `/*! maplace ${packageManifest().version} | MIT${thirdParty} */`;
}
