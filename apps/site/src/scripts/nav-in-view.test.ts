// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { followNavFocus, revealCurrentNavLink } from "./nav-in-view.ts";

afterEach(() => document.body.replaceChildren());

/** A nav of three links in `parent`, the one at `current` (if any) the page shown. */
function navIn(parent: HTMLElement, current?: number): HTMLAnchorElement[] {
  const nav = document.createElement("nav");
  const links = ["Setup", "Element", "Migrating"].map((label, index) => {
    const link = document.createElement("a");
    link.textContent = label;
    if (index === current) link.setAttribute("aria-current", "page");
    link.scrollIntoView = vi.fn();
    return link;
  });
  nav.append(...links);
  parent.append(nav);
  document.body.append(parent);
  return links;
}

/** The header's nav, as `navIn` makes it. */
const navWith = (current?: number) => navIn(document.createElement("header"), current);

describe("revealCurrentNavLink", () => {
  it("centres the current page's link in the nav, clear of its fade, the page staying put", () => {
    const links = navWith(2);
    revealCurrentNavLink(document);
    expect(links[2]?.scrollIntoView).toHaveBeenCalledWith({ block: "nearest", inline: "center" });
    expect(links[0]?.scrollIntoView).not.toHaveBeenCalled();
  });

  it("does nothing on a page no link is current on", () => {
    const links = navWith();
    revealCurrentNavLink(document);
    for (const link of links) expect(link.scrollIntoView).not.toHaveBeenCalled();
  });
});

describe("another nav, as a reference page's contents", () => {
  it("is left where it is, its current link and focus alike", () => {
    const links = navIn(document.createElement("aside"), 1);
    revealCurrentNavLink(document);
    followNavFocus(document);
    links[1]?.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(links[1]?.scrollIntoView).not.toHaveBeenCalled();
  });
});

describe("followNavFocus", () => {
  it("scrolls a nav link that takes focus into the nav's view, clear of its scroll padding", () => {
    const links = navWith();
    followNavFocus(document);
    links[1]?.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(links[1]?.scrollIntoView).toHaveBeenCalledWith({ block: "nearest", inline: "nearest" });
  });

  it("leaves focus outside a nav alone", () => {
    navWith();
    const button = document.createElement("button");
    button.scrollIntoView = vi.fn();
    document.body.append(button);
    followNavFocus(document);
    button.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(button.scrollIntoView).not.toHaveBeenCalled();
  });
});
