// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { showCurrentInPinnedColumn } from "./menu-in-view.ts";

/** A pinned column 100px tall at the top of the screen, its current link `top` px down its content. */
function pinnedColumn(top: number | undefined): HTMLElement {
  document.body.innerHTML = `<div data-pinned-column><a href="/a/">A</a><a href="/b/">B</a></div>`;
  const column = document.querySelector("[data-pinned-column]") as HTMLElement;
  column.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
  const link = column.querySelector('[href="/b/"]') as HTMLElement;
  if (top !== undefined) {
    link.setAttribute("aria-current", "page");
    link.getBoundingClientRect = () => new DOMRect(0, top - column.scrollTop, 200, 20);
  }
  return column;
}

describe("showCurrentInPinnedColumn", () => {
  it("scrolls the column to centre a current link below its fold", () => {
    const column = pinnedColumn(500);
    showCurrentInPinnedColumn(document);
    expect(column.scrollTop).toBe(460);
  });

  it("leaves the column where it is when the current link is in view, or there is none", () => {
    const shown = pinnedColumn(40);
    showCurrentInPinnedColumn(document);
    expect(shown.scrollTop).toBe(0);
    const unmarked = pinnedColumn(undefined);
    showCurrentInPinnedColumn(document);
    expect(unmarked.scrollTop).toBe(0);
  });
});
