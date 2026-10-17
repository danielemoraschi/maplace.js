import type { Loader } from "astro/loaders";
import {
  builtCdnScript,
  CDN_SCRIPTS,
  type CdnScript,
} from "../../../../scripts/build/cdn-builds.ts";
import {
  type Pin,
  pinnedSnippetOf,
  withPinnedScripts,
} from "../../../../scripts/build/cdn-pins.ts";
import { packageManifest, readRootFile } from "../../../../scripts/build/package.ts";
import { integrityOf } from "../../../../scripts/build/subresource-integrity.ts";

let pinOfThisBuild: Promise<Pin> | undefined;

/**
 * The package's version and each CDN script's integrity, hashed from the scripts built in memory
 * exactly as they are published, so never from a stale `dist`. Once per site build.
 */
export function cdnPin(): Promise<Pin> {
  pinOfThisBuild ??= pinOfBuiltScripts();
  return pinOfThisBuild;
}

async function pinOfBuiltScripts(): Promise<Pin> {
  const scripts = Object.keys(CDN_SCRIPTS) as CdnScript[];
  const integrities = new Map(await Promise.all(scripts.map(integrityByFile)));
  return {
    version: packageManifest().version,
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

/** What the install box offers: the README's pinned snippet for the element script. */
export interface Install {
  readonly version: string;
  readonly snippet: string;
}

export function installOf(pin: Pin): Install {
  const readme = withPinnedScripts(readRootFile("README.md"), pin);
  return { version: pin.version, snippet: pinnedSnippetOf(readme, CDN_SCRIPTS.plain) };
}

/** The content loader of the `install` collection: one entry, `element`. */
export function installLoader(): Loader {
  return {
    name: "install",
    async load({ store }) {
      store.clear();
      store.set({ id: "element", data: { ...installOf(await cdnPin()) } });
    },
  };
}
