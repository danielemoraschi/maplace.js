/** How near the viewport a map opens, so it is drawn by the time it scrolls in. */
const AHEAD = "200px";

/** What runs once each watched element comes near the viewport. */
const waiting = new Map<Element, () => void>();

let observer: IntersectionObserver | undefined;

/**
 * Runs `run` once `element` comes near the viewport, then stops watching it; an element in a
 * hidden panel never does. One observer watches every element.
 */
export function whenVisible(element: Element, run: () => void): void {
  observer ??= new IntersectionObserver(runVisible, { rootMargin: AHEAD });
  waiting.set(element, run);
  observer.observe(element);
}

function runVisible(entries: readonly IntersectionObserverEntry[]): void {
  for (const { target, isIntersecting } of entries) {
    const run = waiting.get(target);
    if (!isIntersecting || run === undefined) continue;
    waiting.delete(target);
    observer?.unobserve(target);
    run();
  }
}
