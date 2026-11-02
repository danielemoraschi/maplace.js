// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { followNavFocus } from "./nav-in-view.ts";

afterEach(() => document.body.replaceChildren());

/** Where something sits across the screen. */
const span = (left: number, right: number) => ({ left, right }) as DOMRect;

/** A nav from 100 to 300 with a 30 px end fade, its links where `spans` says, in `parent`. */
function navIn(parent: HTMLElement, spans: readonly [number, number][]) {
  const nav = document.createElement("nav");
  nav.style.paddingInlineEnd = "30px";
  nav.getBoundingClientRect = () => span(100, 300);
  nav.scrollBy = vi.fn();
  const links = spans.map(([left, right]) => {
    const link = document.createElement("a");
    link.getBoundingClientRect = () => span(left, right);
    return link;
  });
  nav.append(...links);
  parent.append(nav);
  document.body.append(parent);
  return { nav, links };
}

/** Links before the nav's start, inside it, under its fade and past its end. */
const SPANS: readonly [number, number][] = [
  [40, 90],
  [120, 180],
  [240, 290],
  [320, 380],
];

const headerNav = () => navIn(document.createElement("header"), SPANS);

const focusOn = (element: Element) =>
  element.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

describe("another nav, as a reference page's contents", () => {
  it("is left where it is", () => {
    const { nav, links } = navIn(document.createElement("aside"), SPANS);
    followNavFocus(document);
    focusOn(links[3] as Element);
    expect(nav.scrollBy).not.toHaveBeenCalled();
  });
});

describe("followNavFocus", () => {
  it("brings a link taking focus clear of the nav's end fade", () => {
    const { nav, links } = headerNav();
    followNavFocus(document);
    focusOn(links[2] as Element);
    expect(nav.scrollBy).toHaveBeenCalledWith({ left: 20 });
  });

  it("brings a link taking focus back clear of the nav's start", () => {
    const { nav, links } = headerNav();
    followNavFocus(document);
    focusOn(links[0] as Element);
    expect(nav.scrollBy).toHaveBeenCalledWith({ left: -60 });
  });

  it("brings a link past the nav's end clear, as far as it needs, moving the nav, never the page", () => {
    const scrollPage = vi.spyOn(window, "scrollBy").mockImplementation(() => undefined);
    const { nav, links } = headerNav();
    const scrollLink = vi.fn();
    for (const link of links) link.scrollIntoView = scrollLink;
    followNavFocus(document);
    focusOn(links[3] as Element);
    expect(nav.scrollBy).toHaveBeenCalledWith({ left: 110 });
    expect(scrollLink).not.toHaveBeenCalled();
    expect(scrollPage).not.toHaveBeenCalled();
    scrollPage.mockRestore();
  });

  it("leaves a link already clear where it is", () => {
    const { nav, links } = headerNav();
    followNavFocus(document);
    focusOn(links[1] as Element);
    expect(nav.scrollBy).not.toHaveBeenCalled();
  });

  it("leaves focus outside a nav alone", () => {
    const { nav } = headerNav();
    const button = document.createElement("button");
    document.body.append(button);
    followNavFocus(document);
    focusOn(button);
    expect(nav.scrollBy).not.toHaveBeenCalled();
  });
});
