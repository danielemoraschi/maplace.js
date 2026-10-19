/** Why a version didn't start: the site has no key, Maps JS didn't load, or its own script. */
export type VersionFailure = "no-key" | "maps-js" | "script";

/** What starting a vanilla or React version takes, each effect given (`site.ts` wires them). */
export interface VersionStarting {
  /** Imports the version's module, which runs it. */
  readonly load: (version: HTMLElement) => Promise<unknown>;
  /** Runs the version's inert Google bootstrap. */
  readonly runBootstrap: (version: HTMLElement) => void;
  /** Whether Maps JS is on the page already, by any loader: a second bootstrap would be ignored. */
  readonly mapsJsOnPage: () => boolean;
  /** Resolves once `google.maps.importLibrary` is there; rejects when Maps JS failed to load. */
  readonly mapsImportable: () => Promise<void>;
  readonly failed: (version: HTMLElement, failure: VersionFailure) => void;
}

/**
 * What starts a version, once, as a page's map is released: Maps JS through its own bootstrap
 * unless the page has it already (the element's tag, or another version's bootstrap), then its
 * module. Without the site's key it runs nothing and says so. `data-starting` marks the wait,
 * `data-started` a version whose module runs.
 */
export function versionStarter(starting: VersionStarting): (version: HTMLElement) => Promise<void> {
  const started = new WeakSet<HTMLElement>();
  return async (version) => {
    if (started.has(version)) return;
    started.add(version);
    if (version.closest("[data-maps-key-missing]")) {
      starting.failed(version, "no-key");
      return;
    }
    version.dataset.starting = "";
    try {
      await run(version, starting);
    } finally {
      delete version.dataset.starting;
    }
  };
}

async function run(version: HTMLElement, starting: VersionStarting): Promise<void> {
  if (!starting.mapsJsOnPage()) starting.runBootstrap(version);
  try {
    await starting.mapsImportable();
  } catch {
    starting.failed(version, "maps-js");
    return;
  }
  try {
    await starting.load(version);
    version.dataset.started = "";
  } catch (error) {
    console.error("maplace: the example's script didn't load", error);
    starting.failed(version, "script");
  }
}
