import { NO_KEY, NOT_LOADED } from "./version-failures.ts";
import { failingWith, VersionStartFailure } from "./version-start.ts";

/** How a Google version finds the page's Maps JS, and waits for it. */
export interface PageMapsJs {
  /** Whether Maps JS is on the page already, by any loader: a second bootstrap would be ignored. */
  readonly mapsJsOnPage: () => boolean;
  /** Resolves once `google.maps.importLibrary` is there; rejects when Maps JS failed to load. */
  readonly mapsImportable: () => Promise<void>;
}

/** What readying a Google module version takes, each effect given (`site.ts` wires them). */
export interface GoogleReadying extends PageMapsJs {
  /** Runs the version's inert Google bootstrap. */
  readonly runBootstrap: (version: HTMLElement) => void;
}

/**
 * What a Google version waits for before its module runs: Maps JS, through its own bootstrap
 * unless the page has it already (the element's tag, or another version's bootstrap). Without
 * the site's key (`data-maps-key-missing`) it runs nothing and fails as a map with no key;
 * Maps JS failing to load fails it as Maps JS not loaded, as the element reports either.
 */
export function googleVersionReady({
  runBootstrap,
  mapsJsOnPage,
  mapsImportable,
}: GoogleReadying): (version: HTMLElement) => Promise<void> {
  const awaitMapsJs = failingWith(NOT_LOADED, mapsImportable);
  return async (version) => {
    refuseWithoutKey(version);
    if (!mapsJsOnPage()) runBootstrap(version);
    await awaitMapsJs();
  };
}

/**
 * What a Google script version (W33) waits for before its program runs: nothing of Maps JS when
 * the page has none, since its adapter adds it; the page's when it has some, which its adapter
 * would share, failing as a module version does when that failed. Without the site's key it
 * fails as a map with no key, adding nothing.
 */
export function googleScriptReady({
  mapsJsOnPage,
  mapsImportable,
}: PageMapsJs): (version: HTMLElement) => Promise<void> {
  const awaitMapsJs = failingWith(NOT_LOADED, mapsImportable);
  return async (version) => {
    refuseWithoutKey(version);
    if (mapsJsOnPage()) await awaitMapsJs();
  };
}

/** Fails a version the site has no key for (`data-maps-key-missing`), as a map with no key. */
function refuseWithoutKey(version: HTMLElement): void {
  if (version.dataset.mapsKeyMissing !== undefined) throw new VersionStartFailure(NO_KEY);
}
