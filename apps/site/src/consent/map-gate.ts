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

/** What opens maps on consent, the page's own and those added later. */
export interface ConsentLatch {
  /** Runs `open` once maps are on: at once if they are, else when they turn on. */
  whenOn(open: () => void): void;
  /** Maps are on: runs what was waiting, once. */
  turnOn(): void;
}

/** A latch shut until consent is given, then open for good. */
export function consentLatch(): ConsentLatch {
  let on = false;
  const waiting: (() => void)[] = [];
  return {
    whenOn(open) {
      if (on) open();
      else waiting.push(open);
    },
    turnOn() {
      on = true;
      for (const open of waiting.splice(0)) open();
    },
  };
}
