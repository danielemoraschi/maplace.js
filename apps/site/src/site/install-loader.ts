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

/**
 * How the install box installs maplacejs for each provider, in the order shown: the npm command,
 * MapLibre's adding its peer, and the CDN script it pins.
 */
const PROVIDER_INSTALLS = [
  {
    provider: "google",
    label: "Google Maps",
    npmCommand: "npm install maplace",
    file: CDN_SCRIPTS.plain,
  },
  {
    provider: "maplibre",
    label: "MapLibre",
    npmCommand: "npm install maplace maplibre-gl",
    file: CDN_SCRIPTS.maplibre,
  },
] as const satisfies readonly {
  provider: Provider;
  label: string;
  npmCommand: string;
  file: string;
}[];

/** One provider's install: its npm command, and the README's pinned CDN snippet, filled in. */
export type ProviderInstall = Omit<(typeof PROVIDER_INSTALLS)[number], "file"> & {
  readonly cdnSnippet: string;
};

/** What the install box offers: the version, and each provider's install. */
export interface Install {
  readonly version: string;
  readonly providers: readonly ProviderInstall[];
}

export function installOf(pin: Pin): Install {
  const readme = withPinnedScripts(readRootFile("README.md"), pin);
  return {
    version: pin.version,
    providers: PROVIDER_INSTALLS.map(({ file, ...shown }) => ({
      ...shown,
      cdnSnippet: pinnedSnippetOf(readme, file),
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
