import type { Loader } from "astro/loaders";
import { CDN_SCRIPTS } from "../../../../scripts/build/cdn-builds.ts";
import {
  type Pin,
  pinnedSnippetOf,
  withPinnedScripts,
} from "../../../../scripts/build/cdn-pins.ts";
import { readRootFile } from "../../../../scripts/build/package.ts";
import type { Provider } from "../examples/example-providers.ts";
import { cdnPin } from "./cdn-pin.ts";

/** The CDN scripts the install box pins, by the provider each draws on, in the order shown. */
const PINNED_SCRIPTS = [
  { provider: "google", label: "Google Maps", file: CDN_SCRIPTS.plain },
  { provider: "maplibre", label: "MapLibre", file: CDN_SCRIPTS.maplibre },
] as const satisfies readonly { provider: Provider; label: string; file: string }[];

/** One pinned CDN script: the provider it draws on, and the README's snippet for it, filled in. */
export type PinnedScript = Omit<(typeof PINNED_SCRIPTS)[number], "file"> & {
  readonly snippet: string;
};

/** What the install box offers: the version, and a pinned snippet per provider. */
export interface Install {
  readonly version: string;
  readonly scripts: readonly PinnedScript[];
}

export function installOf(pin: Pin): Install {
  const readme = withPinnedScripts(readRootFile("README.md"), pin);
  return {
    version: pin.version,
    scripts: PINNED_SCRIPTS.map(({ file, ...shown }) => ({
      ...shown,
      snippet: pinnedSnippetOf(readme, file),
    })),
  };
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
