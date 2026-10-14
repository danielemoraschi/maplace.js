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

  constructor(readonly callback: () => void) {}

  observe(): void {
    this.observed = true;
  }

  disconnect(): void {
    this.observed = false;
  }

  resized(): void {
    if (this.observed) this.callback();
  }
}

/** Puts the stub on the page; `vi.unstubAllGlobals()` takes it off. */
export function stubResizeObserver(): void {
  latest = undefined;
  // A constructor returning the stub, so the test can reach the observer the code just started.
  vi.stubGlobal("ResizeObserver", function ResizeObserver(callback: () => void) {
    latest = new StubResizeObserver(callback);
    return latest;
  });
}
