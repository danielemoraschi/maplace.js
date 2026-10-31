// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { frames } from "./frames";
import { watchMapResizes } from "./map-resizes";
import { sizeable } from "./testing/sized-element";
import { StubMap } from "./testing/stub-libraries";
import { latestResizeObserver, stubResizeObserver } from "./testing/stub-resize-observer";

afterEach(() => vi.unstubAllGlobals());

/** A map whose element a test resizes, with the root Google builds inside it. */
function resizedMap(width = 512) {
  stubResizeObserver();
  const element = document.createElement("div");
  const googleRoot = document.createElement("div");
  const region = document.createElement("div");
  region.setAttribute("aria-live", "polite");
  // A link past the map and a live region go first in the container, on a page's own map too.
  element.append(document.createElement("a"), region, googleRoot);
  const size = sizeable(element, width, 512);
  const map = new StubMap(element) as unknown as google.maps.Map;
  const widths: string[] = [];
  let resizes = 0;
  const stop = watchMapResizes(map, () => {
    resizes++;
    widths.push(googleRoot.style.width);
  });
  const observer = latestResizeObserver();
  observer.resized();
  const resize = (next: number) => {
    size.width = next;
    observer.resized();
  };
  return { googleRoot, resize, resizes: () => resizes, widths, stop };
}

describe("watchMapResizes", () => {
  it("calls back a frame after a resize, once Google has the new size", async () => {
    const { resize, resizes, googleRoot } = resizedMap();
    resize(256);
    expect(resizes()).toBe(0);
    await frames(1);
    expect(resizes()).toBe(1);
    expect(googleRoot.style.width).toBe("");
  });

  it("makes Google measure a map shown again, nudging its root, then calls back", async () => {
    const { resize, resizes, googleRoot, widths } = resizedMap();
    resize(0);
    await frames(1);
    resize(512);
    await frames(1);
    expect(googleRoot.style.width).toBe("99.9%");
    await frames(2);
    expect(resizes()).toBe(2);
    expect(widths).toEqual(["", ""]);
  });

  it("restores Google's root once when the map is shown again twice within a nudge", async () => {
    const { resize, googleRoot } = resizedMap();
    googleRoot.style.width = "100%";
    resize(0);
    resize(512);
    resize(0);
    resize(512);
    await frames(6);
    expect(googleRoot.style.width).toBe("100%");
  });

  it("calls back once for resizes that come before its wait is over", async () => {
    const { resize, resizes } = resizedMap();
    resize(400);
    resize(300);
    resize(256);
    await frames(2);
    expect(resizes()).toBe(1);
  });

  it("stops watching when stopped", async () => {
    const { resize, resizes, stop } = resizedMap();
    stop();
    resize(256);
    await frames(2);
    expect(resizes()).toBe(0);
  });
});
