export interface ElementLoading<Held> {
  /** Loads the script that defines the maps' element: once, unless it failed. */
  readonly load: () => Promise<unknown>;
  /** Lets a map load, once its element is defined. */
  readonly release: (map: Held) => void;
  /** The element's script didn't load: `map` waits for a later try. */
  readonly failed: (map: Held, error: unknown) => void;
  /** A later try loaded it: `map`, which had waited, is released now. */
  readonly recovered: (map: Held) => void;
}

/**
 * The page's one load of the maps' element, shared by every map: each map asks to be released,
 * and is once the element is defined. A failed load is tried again on the next ask, and the maps
 * that waited are released with it.
 */
export function releaseOnceDefined<Held>({
  load,
  release,
  failed,
  recovered,
}: ElementLoading<Held>): (map: Held) => Promise<void> {
  let loading: Promise<unknown> | undefined;
  const waiting = new Set<Held>();

  function releaseWithWaiting(map: Held): void {
    for (const earlier of waiting) {
      recovered(earlier);
      release(earlier);
    }
    waiting.clear();
    release(map);
  }

  return async (map) => {
    loading ??= load();
    const attempt = loading;
    try {
      await attempt;
    } catch (error) {
      // Only this load is forgotten: a map may have started the next one meanwhile.
      if (loading === attempt) loading = undefined;
      waiting.add(map);
      failed(map, error);
      return;
    }
    releaseWithWaiting(map);
  };
}
