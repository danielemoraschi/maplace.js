// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { showCurrentInPinnedNav } from "./menu-in-view.ts";

/** A pinned list 100px tall at the top of the screen, its current link `top` px down its content. */
function pinnedNav(top: number | undefined): HTMLElement {
  document.body.innerHTML = `<nav data-pinned-nav><a href="/a/">A</a><a href="/b/">B</a></nav>`;
  const nav = document.querySelector("nav") as HTMLElement;
  nav.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
  const link = nav.querySelector('[href="/b/"]') as HTMLElement;
  if (top !== undefined) {
    link.setAttribute("aria-current", "page");
    link.getBoundingClientRect = () => new DOMRect(0, top - nav.scrollTop, 200, 20);
  }
  return nav;
}

describe("showCurrentInPinnedNav", () => {
  it("scrolls the list to centre a current link below its fold", () => {
    const nav = pinnedNav(500);
    showCurrentInPinnedNav(document);
    expect(nav.scrollTop).toBe(460);
  });

  it("leaves the list where it is when the current link is in view, or there is none", () => {
    const shown = pinnedNav(40);
    showCurrentInPinnedNav(document);
    expect(shown.scrollTop).toBe(0);
    const unmarked = pinnedNav(undefined);
    showCurrentInPinnedNav(document);
    expect(unmarked.scrollTop).toBe(0);
  });
});
