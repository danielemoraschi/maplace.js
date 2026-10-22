import { VersionStartFailure } from "./version-start.ts";

/** What readying a Google version takes, each effect given (`site.ts` wires them). */
export interface GoogleReadying {
  /** Runs the version's inert Google bootstrap. */
  readonly runBootstrap: (version: HTMLElement) => void;
  /** Whether Maps JS is on the page already, by any loader: a second bootstrap would be ignored. */
  readonly mapsJsOnPage: () => boolean;
  /** Resolves once `google.maps.importLibrary` is there; rejects when Maps JS failed to load. */
  readonly mapsImportable: () => Promise<void>;
}

/**
 * What a Google version waits for before its module runs: Maps JS, through its own bootstrap
 * unless the page has it already (the element's tag, or another version's bootstrap). Without
 * the site's key (`data-maps-key-missing`) it runs nothing and fails with "no-key";
 * Maps JS failing to load fails it with "maps-js".
 */
export function googleVersionReady({
  runBootstrap,
  mapsJsOnPage,
  mapsImportable,
}: GoogleReadying): (version: HTMLElement) => Promise<void> {
  return async (version) => {
    if (version.hasAttribute("data-maps-key-missing")) throw new VersionStartFailure("no-key");
    if (!mapsJsOnPage()) runBootstrap(version);
    try {
      await mapsImportable();
    } catch (error) {
      throw new VersionStartFailure("maps-js", { cause: error });
    }
  };
}
