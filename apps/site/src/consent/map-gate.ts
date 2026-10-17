export interface MapGate<Held> {
  /** Runs `run` once `map` is in view. */
  readonly whenVisible: (map: Held, run: () => void) => void;
  /** Lets `map` load: until then it asks its provider for nothing. */
  readonly release: (map: Held) => void;
}

/**
 * Keeps `maps` held until the returned function is called (consent is given), then releases each
 * as it comes into view. Calling it again does nothing.
 */
export function gateMaps<Held>(
  maps: readonly Held[],
  { whenVisible, release }: MapGate<Held>,
): () => void {
  let opened = false;
  return () => {
    if (opened) return;
    opened = true;
    for (const map of maps) whenVisible(map, () => release(map));
  };
}
