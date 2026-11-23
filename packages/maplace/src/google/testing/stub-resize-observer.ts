import { vi } from "vitest";

let latest: StubResizeObserver | undefined;

/** The observer made last: the one the code under test just started. */
export function latestResizeObserver(): StubResizeObserver {
  if (latest === undefined) throw new Error("no ResizeObserver started yet");
  return latest;
}

/** The page's `ResizeObserver`, driven by a test: `resized()` delivers a callback. */
export class StubResizeObserver {
  observed = false;
  /** The elements it observes now. */
  readonly targets = new Set<Element>();

  constructor(readonly callback: (entries: ResizeObserverEntry[]) => void) {}

  observe(target?: Element): void {
    this.observed = true;
    if (target) this.targets.add(target);
  }

  unobserve(target: Element): void {
    this.targets.delete(target);
  }

  disconnect(): void {
    this.observed = false;
    this.targets.clear();
  }

  /** A callback for every element it observes, as when they all resize at once. */
  resized(): void {
    if (!this.observed) return;
    this.callback([...this.targets].map((target) => ({ target }) as ResizeObserverEntry));
  }
}

/** Puts the stub on the page; `vi.unstubAllGlobals()` takes it off. */
export function stubResizeObserver(): void {
  latest = undefined;
  // A constructor returning the stub, so the test can reach the observer the code just started.
  vi.stubGlobal(
    "ResizeObserver",
    function resizeObserver(callback: (entries: ResizeObserverEntry[]) => void) {
      latest = new StubResizeObserver(callback);
      return latest;
    },
  );
}
