/** How near the viewport a lazy map opens, so it is drawn by the time it scrolls in. */
const NEAR_VIEW_MARGIN = "100px";

/** Holds a map with `loading="lazy"` until it comes near the viewport. */
export interface NearViewWait {
  /** Whether the map is waiting to come near the viewport. */
  readonly waiting: boolean;
  /**
   * With `loading="lazy"`, waits until `host` comes within NEAR_VIEW_MARGIN of the viewport (in a
   * frame, until it shows in the frame; hidden, until shown), then stops and calls `onNear`.
   */
  start(): void;
  stop(): void;
}

/** One observer per element, made on `start()` and gone once near or stopped. */
export function createNearViewWait(host: Element, onNear: () => void): NearViewWait {
  let observer: IntersectionObserver | undefined;

  function stop(): void {
    observer?.disconnect();
    observer = undefined;
  }

  /** A stopped observer may still deliver what it queued before: only the current one counts. */
  function stopOnceNear(
    entries: readonly IntersectionObserverEntry[],
    reporter: IntersectionObserver,
  ): void {
    if (reporter !== observer || !entries.some(({ isIntersecting }) => isIntersecting)) return;
    stop();
    onNear();
  }

  return {
    get waiting() {
      return observer !== undefined;
    },
    start() {
      if (observer !== undefined || host.getAttribute("loading") !== "lazy") return;
      observer = new IntersectionObserver(stopOnceNear, { rootMargin: NEAR_VIEW_MARGIN });
      observer.observe(host);
    },
    stop,
  };
}
