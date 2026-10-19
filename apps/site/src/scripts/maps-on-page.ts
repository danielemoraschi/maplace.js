/** Any Maps JS tag, the element's or a bootstrap's. */
const MAPS_JS = 'script[src^="https://maps.googleapis.com/maps/api/js"]';

/** How often the wait for `importLibrary` looks again. */
const POLL_MS = 50;

/** The page's `google.maps`, read without Google's types: the site has none. */
interface PageGlobals {
  readonly google?: { readonly maps?: { readonly importLibrary?: unknown } };
}

/** Whether Maps JS is on the page or on its way: a Maps tag, or `importLibrary` defined. */
export function mapsJsOnPage(document: Document): boolean {
  return document.querySelector(MAPS_JS) !== null || canImportLibraries();
}

/** What `watchMapsJs` keeps: whether Maps JS is ready to import from, or failed. */
export interface MapsJsWatch {
  /** Resolves once `importLibrary` is there; rejects once a Maps tag failed, before or during. */
  importable(): Promise<void>;
  /**
   * Calls `listener` each time a Maps tag fails: a bootstrap defines `importLibrary` before its
   * tag loads, so a version waiting on `importable` alone never hears of that tag failing.
   */
  whenFailed(listener: () => void): void;
}

/**
 * Watches `document` for a Maps tag that fails to load. A script element keeps no trace of its
 * failure, so this is installed as the page starts, before any map asks for Maps JS.
 */
export function watchMapsJs(document: Document): MapsJsWatch {
  let failed = false;
  const listeners: (() => void)[] = [];
  document.addEventListener(
    "error",
    (event) => {
      if (!(event.target instanceof Element && event.target.matches(MAPS_JS))) return;
      failed = true;
      for (const listener of listeners) listener();
    },
    true,
  );
  let importable: Promise<void> | undefined;
  return {
    importable: () => {
      importable ??= waitForImportLibrary(() => failed);
      return importable;
    },
    whenFailed: (listener) => listeners.push(listener),
  };
}

/**
 * Resolves once `importLibrary` is there, rejects once `hasFailed`: looking now, then every
 * `POLL_MS`.
 */
function waitForImportLibrary(hasFailed: () => boolean): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const isOver = () => hasFailed() || canImportLibraries();
    const settle = () => {
      if (hasFailed()) reject(new Error("Maps JS didn't load"));
      else resolve();
    };
    if (isOver()) {
      settle();
      return;
    }
    const timer = setInterval(() => {
      if (!isOver()) return;
      clearInterval(timer);
      settle();
    }, POLL_MS);
  });
}

function canImportLibraries(): boolean {
  return typeof (globalThis as PageGlobals).google?.maps?.importLibrary === "function";
}
