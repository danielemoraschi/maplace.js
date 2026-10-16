import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
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

/** Writes both scripts, their source maps, and the licences file of what they bundle. */
export async function buildCdnScripts(outdir: string = DIST): Promise<void> {
  const built = await Promise.all([
    build(cdnBuildOptions("plain", outdir)),
    build(cdnBuildOptions("cluster", outdir)),
  ]);
  const licences = thirdPartyLicenses(built.map(({ metafile }) => metafile));
  writeFileSync(resolve(ROOT, outdir, LICENSES_FILE), `${licences}\n`);
}

function bannerOf(clusters: boolean): string {
  const thirdParty = clusters ? ` | bundles third-party code: ${LICENSES_FILE}` : "";
  return `/*! maplace ${packageManifest().version} | MIT${thirdParty} */`;
}
