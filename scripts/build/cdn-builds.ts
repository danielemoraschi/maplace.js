import { mkdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { type BuildOptions, build, type Metafile, type Plugin } from "esbuild";
import { bundleMapLibre } from "./bundle-maplibre.ts";
import { leaveOutClustering } from "./leave-out-clustering.ts";
import { DIST, PACKAGE_ENTRIES, packageManifest, ROOT, TARGET } from "./package.ts";
import { thirdPartyLicenses } from "./third-party-licenses.ts";

/**
 * The CDN scripts (RFC §3): one page loads one of them. `<maplace-map>` on Google, without
 * clustering or with it, or on MapLibre (clustering included, maplibre-gl bundled).
 */
export const CDN_SCRIPTS = {
  plain: "maplace-element.iife.js",
  cluster: "maplace-element-cluster.iife.js",
  maplibre: "maplace-element-maplibre.iife.js",
} as const;

export type CdnScript = keyof typeof CDN_SCRIPTS;

/** Beside the scripts: the notices of the packages they bundle. */
export const LICENSES_FILE = "THIRD-PARTY-LICENSES.txt";

/** What a CDN script is built from, and what it carries besides maplace. */
interface CdnContents {
  readonly entry: string;
  /** Those shaping maplace's own code, which its budget measures too. */
  readonly plugins: readonly Plugin[];
  /** Those bringing in a package's assets besides its code, left out of maplace's own. */
  readonly assetPlugins: readonly Plugin[];
  readonly bundlesThirdParty: boolean;
  /** Whether its source map holds the sources; MapLibre's would make it 5.6 MB. */
  readonly sourcesContent: boolean;
}

const CDN_SCRIPT_CONTENTS: Readonly<Record<CdnScript, CdnContents>> = {
  plain: {
    entry: PACKAGE_ENTRIES.elementGoogle,
    plugins: [leaveOutClustering],
    assetPlugins: [],
    bundlesThirdParty: false,
    sourcesContent: true,
  },
  cluster: {
    entry: PACKAGE_ENTRIES.elementGoogle,
    plugins: [],
    assetPlugins: [],
    bundlesThirdParty: true,
    sourcesContent: true,
  },
  maplibre: {
    entry: PACKAGE_ENTRIES.elementMapLibre,
    plugins: [],
    assetPlugins: [bundleMapLibre],
    bundlesThirdParty: true,
    sourcesContent: false,
  },
};

/**
 * A CDN script: `<maplace-map>` in one minified file, no global. The plain Google script leaves
 * the clusterer out, so `cluster` on it fails the load; the MapLibre one bundles maplibre-gl with
 * its worker and stylesheet.
 */
export function cdnBuildOptions(
  script: CdnScript,
  outdir: string = DIST,
): BuildOptions & { metafile: true } {
  const contents = CDN_SCRIPT_CONTENTS[script];
  return {
    absWorkingDir: ROOT,
    entryPoints: [contents.entry],
    outfile: join(outdir, CDN_SCRIPTS[script]),
    bundle: true,
    format: "iife",
    target: TARGET,
    minify: true,
    sourcemap: "linked",
    sourcesContent: contents.sourcesContent,
    banner: { js: bannerOf(contents) },
    plugins: [...contents.plugins, ...contents.assetPlugins],
    metafile: true,
    logLevel: "warning",
  };
}

/**
 * Maplace's own code in a CDN script, as a budget measures it: its build without the packages it
 * bundles, so without its asset plugins; those shaping maplace's code still apply.
 */
export function ownCodeBuildOptions(script: CdnScript): BuildOptions & { metafile: true } {
  const plugins = [...CDN_SCRIPT_CONTENTS[script].plugins];
  return { ...cdnBuildOptions(script), plugins, packages: "external" };
}

/**
 * Writes every script, their source maps, and the licences file of what they bundle: the bytes
 * `builtCdnScript` makes, so a hash of either is the other's. Returns each script's metafile.
 */
export async function buildCdnScripts(
  outdir: string = DIST,
): Promise<Readonly<Record<CdnScript, Metafile>>> {
  const scripts = Object.keys(CDN_SCRIPTS) as CdnScript[];
  const built = await Promise.all(scripts.map((script) => inMemory(script, outdir)));
  mkdirSync(resolve(ROOT, outdir), { recursive: true });
  for (const { path, contents } of built.flatMap(({ outputFiles }) => outputFiles)) {
    writeFileSync(path, contents);
  }
  const licences = thirdPartyLicenses(built.map(({ metafile }) => metafile));
  writeFileSync(resolve(ROOT, outdir, LICENSES_FILE), `${licences}\n`);
  return Object.fromEntries(
    scripts.map((script, index) => [script, built[index]?.metafile]),
  ) as Record<CdnScript, Metafile>;
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

function bannerOf({ bundlesThirdParty }: CdnContents): string {
  const thirdParty = bundlesThirdParty ? ` | bundles third-party code: ${LICENSES_FILE}` : "";
  return `/*! maplace ${packageManifest().version} | MIT${thirdParty} */`;
}
