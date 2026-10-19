import type { Loader } from "astro/loaders";
import { CDN_SCRIPTS } from "../../../../scripts/build/cdn-builds.ts";
import {
  type Pin,
  pinnedSnippetOf,
  withPinnedScripts,
} from "../../../../scripts/build/cdn-pins.ts";
import { readRootFile } from "../../../../scripts/build/package.ts";
import { cdnPin } from "./cdn-pin.ts";

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
