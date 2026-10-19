/** How near the viewport a map opens, so it is drawn by the time it scrolls in. */
const AHEAD = "200px";

/** Runs `run` once `element` comes near the viewport, then stops watching it. */
export type WhenVisible = (element: Element, run: () => void) => void;

/**
 * A `whenVisible` with one observer for every element it watches, made on first use; an element
 * in a hidden panel never comes into view.
 */
export function visibilityWatcher(): WhenVisible {
  const waiting = new Map<Element, () => void>();
  let observer: IntersectionObserver | undefined;

  function runVisible(entries: readonly IntersectionObserverEntry[]): void {
    for (const { target, isIntersecting } of entries) {
      const run = waiting.get(target);
      if (!isIntersecting || run === undefined) continue;
      waiting.delete(target);
      observer?.unobserve(target);
      run();
    }
  }

  return (element, run) => {
    observer ??= new IntersectionObserver(runVisible, { rootMargin: AHEAD });
    waiting.set(element, run);
    observer.observe(element);
  };
}

/** The page's watcher: one observer for every map on it. */
export const whenVisible: WhenVisible = visibilityWatcher();
