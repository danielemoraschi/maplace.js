// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { watchSize } from "./size-watch";
import { sizedElement } from "./testing/sized-element";
import { latestResizeObserver, stubResizeObserver } from "./testing/stub-resize-observer";

function watched() {
  stubResizeObserver();
  const { element, size } = sizedElement(512, 512);
  let resizes = 0;
  const stop = watchSize(element, () => resizes++);
  const observer = latestResizeObserver();
  return { size, resizes: () => resizes, stop, observer };
}

afterEach(() => vi.unstubAllGlobals());

describe("watchSize", () => {
  it("takes the observer's first callback as where it starts, reporting nothing", () => {
    const { resizes, observer } = watched();
    observer.resized();
    expect(resizes()).toBe(0);
  });

  it("reports each change, and nothing for a callback at the same size", () => {
    const { size, resizes, observer } = watched();
    observer.resized();
    size.width = 256;
    observer.resized();
    observer.resized();
    size.width = 0;
    observer.resized();
    expect(resizes()).toBe(2);
  });

  it("stops watching when stopped", () => {
    const { size, resizes, stop, observer } = watched();
    observer.resized();
    stop();
    size.width = 256;
    observer.resized();
    expect(resizes()).toBe(0);
  });
});
