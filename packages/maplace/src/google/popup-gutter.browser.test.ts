import { afterEach, describe, expect, it } from "vitest";
import { gutterOf } from "./popup-gutter";

afterEach(() => document.body.replaceChildren());

/**
 * A scroll box like Google's bubble's, `borders` in place of its scrollbars, which headless
 * Chromium hides: like them, outside its client area.
 */
function scrollBox(borders: string, dir = "ltr"): HTMLElement {
  const box = document.createElement("div");
  box.dir = dir;
  box.style.cssText = `overflow:auto;width:200px;height:100px;${borders}`;
  document.body.append(box);
  return box;
}

describe("gutterOf", () => {
  it("measures the room a scroll box keeps for its scrollbars at its inline end and below", () => {
    const box = scrollBox("border-inline-end:18px solid;border-bottom:12px solid");
    expect(gutterOf(box)).toEqual({ inlineEnd: 18, blockEnd: 12 });
  });

  it("measures none where the scrollbars take no room", () => {
    expect(gutterOf(scrollBox(""))).toEqual({ inlineEnd: 0, blockEnd: 0 });
  });

  it("measures a right-to-left box's inline end, its left", () => {
    expect(gutterOf(scrollBox("border-inline-end:18px solid", "rtl")).inlineEnd).toBe(18);
  });

  it("measures none at the inline end where the scrollbar sits at the inline start instead, as Safari puts it on a right-to-left page", () => {
    expect(gutterOf(scrollBox("border-inline-start:18px solid", "rtl")).inlineEnd).toBe(0);
  });
});
