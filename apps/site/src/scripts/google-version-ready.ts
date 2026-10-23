import { VersionStartFailure } from "./version-start.ts";

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
 * the site's key (`data-maps-key-missing`) it runs nothing and fails with "no-key";
 * Maps JS failing to load fails it with "maps-js".
 */
export function googleVersionReady({
  runBootstrap,
  mapsJsOnPage,
  mapsImportable,
}: GoogleReadying): (version: HTMLElement) => Promise<void> {
  return async (version) => {
    refuseWithoutKey(version);
    if (!mapsJsOnPage()) runBootstrap(version);
    await awaitMapsJs(mapsImportable);
  };
}

/**
 * What a Google script version (W33) waits for before its program runs: nothing of Maps JS when
 * the page has none, since its adapter adds it; the page's when it has some, which its adapter
 * would share, failing with "maps-js" as a module version does when that failed. Without the
 * site's key it fails with "no-key", adding nothing.
 */
export function googleScriptReady({
  mapsJsOnPage,
  mapsImportable,
}: PageMapsJs): (version: HTMLElement) => Promise<void> {
  return async (version) => {
    refuseWithoutKey(version);
    if (mapsJsOnPage()) await awaitMapsJs(mapsImportable);
  };
}

/** Resolves once Maps JS can import libraries; its failure is the version's "maps-js". */
async function awaitMapsJs(mapsImportable: () => Promise<void>): Promise<void> {
  try {
    await mapsImportable();
  } catch (error) {
    throw new VersionStartFailure("maps-js", { cause: error });
  }
}

/** Fails a version the site has no key for (`data-maps-key-missing`) with "no-key". */
function refuseWithoutKey(version: HTMLElement): void {
  if (version.dataset.mapsKeyMissing !== undefined) throw new VersionStartFailure("no-key");
}
