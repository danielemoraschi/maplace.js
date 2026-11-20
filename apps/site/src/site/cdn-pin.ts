import {
  builtCdnScript,
  CDN_SCRIPTS,
  type CdnScript,
} from "../../../../scripts/build/cdn-builds.ts";
import type { Pin } from "../../../../scripts/build/cdn-pins.ts";
import { packageManifest } from "../../../../scripts/build/package.ts";
import { integrityOf } from "../../../../scripts/build/subresource-integrity.ts";
import {
  type Fetch,
  PACKAGE_NAME,
  publishedFiles,
} from "../../../../scripts/release/published-package.ts";

let pinOfThisBuild: Promise<Pin> | undefined;

/**
 * The manifest's version and its scripts' integrity, once per site build: on the dev server the
 * repo's own scripts, built in memory, as it runs the repo's library and asks npm nothing; in a
 * build, what npm published (`pinOfVersion`), which is what the CDN serves.
 */
export function cdnPin(): Promise<Pin> {
  pinOfThisBuild ??= pinOfThisSite().catch((error) => {
    pinOfThisBuild = undefined; // the next loader run tries again
    throw error;
  });
  return pinOfThisBuild;
}

/**
 * The dev server's pin, the repo's own scripts, or a build's, npm's: read once, by `cdnPin`. The
 * dev server is told by Astro's mode, `development` under `astro dev`: not by `DEV`, which a build
 * run from the tests (`NODE_ENV=test`) has too.
 */
function pinOfThisSite(): Promise<Pin> {
  const { version } = packageManifest();
  const onDevServer = import.meta.env.MODE === "development";
  return onDevServer ? pinOfBuiltScripts(version) : pinOfVersion(version, fetch);
}

/**
 * The version's pin: what npm published, or the source, built in memory as it would be published,
 * while npm hasn't it. A failure to read npm rejects: never a guess.
 */
export async function pinOfVersion(version: string, fetchUrl: Fetch): Promise<Pin> {
  const published = await publishedFiles(version, fetchUrl);
  return published === undefined ? pinOfBuiltScripts(version) : pinOfPublished(version, published);
}

/** Hashed at once, so the pin a build keeps doesn't hold the whole package. */
function pinOfPublished(version: string, files: ReadonlyMap<string, Uint8Array>): Pin {
  const cdnFiles: readonly string[] = Object.values(CDN_SCRIPTS);
  const integrities = new Map<string, string>();
  for (const file of cdnFiles) {
    const bytes = files.get(`dist/${file}`);
    if (bytes !== undefined) integrities.set(file, integrityOf(bytes));
  }
  return {
    version,
    integrityOf(file) {
      const integrity = integrities.get(file);
      if (integrity !== undefined) return integrity;
      if (!cdnFiles.includes(file)) throw new Error(`${file} isn't a CDN script`);
      throw new Error(
        `${file} isn't in ${PACKAGE_NAME}@${version} on npm: a CDN script added since a release can't be pinned until it is released, so land it with the next release`,
      );
    },
  };
}

async function pinOfBuiltScripts(version: string): Promise<Pin> {
  const scripts = Object.keys(CDN_SCRIPTS) as CdnScript[];
  const integrities = new Map(await Promise.all(scripts.map(integrityByFile)));
  return {
    version,
    integrityOf(file) {
      const integrity = integrities.get(file);
      if (integrity === undefined) throw new Error(`${file} isn't a CDN script`);
      return integrity;
    },
  };
}

/** A CDN script's file name and its integrity. */
async function integrityByFile(script: CdnScript): Promise<readonly [string, string]> {
  return [CDN_SCRIPTS[script], integrityOf(await builtCdnScript(script))];
}
