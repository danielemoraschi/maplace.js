// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { adoptCarriedStyles, adoptStyles, carryStyles } from "./adopted-styles";
import { frameDocument } from "./testing/iframes";
import { cssTextOf } from "./testing/selectors";

describe("adoptStyles", () => {
  afterEach(() => document.body.replaceChildren());

  it("adds a stylesheet before the page's own, so a page's rule wins", () => {
    const page = new CSSStyleSheet();
    page.replaceSync("b { color: red; }");
    document.adoptedStyleSheets = [page];
    adoptStyles(document, ":where(a) { color: blue; }");
    expect(document.adoptedStyleSheets.map(cssTextOf)).toEqual([
      expect.stringContaining(":where(a)"),
      expect.stringContaining("b {"),
    ]);
  });

  it("adds each stylesheet once per document, however often it is asked", () => {
    document.adoptedStyleSheets = [];
    adoptStyles(document, ":where(i) { color: blue; }");
    adoptStyles(document, ":where(i) { color: blue; }");
    adoptStyles(document, ":where(u) { color: blue; }");
    expect(document.adoptedStyleSheets).toHaveLength(2);
  });

  it("adds nothing, and throws nothing, in a DOM without constructable stylesheets", () => {
    const bare = { title: "jsdom" } as unknown as Document;
    expect(() => adoptStyles(bare, ":where(a) { color: blue; }")).not.toThrow();
  });

  it("adds a stylesheet to a frame's document, made in the frame's own window", () => {
    const frame = frameDocument();
    adoptStyles(frame, ":where(s) { color: blue; }");
    expect(frame.adoptedStyleSheets.map(cssTextOf)).toEqual([expect.stringContaining(":where(s)")]);
  });

  it("adds nothing to a document without a window, as a browser would refuse it the sheet", () => {
    const windowless = document.implementation.createHTMLDocument();
    expect(() => adoptStyles(windowless, ":where(q) { color: blue; }")).not.toThrow();
    expect(windowless.adoptedStyleSheets).toEqual([]);
  });
});

describe("carryStyles", () => {
  it("adopts a carried sheet into the page's document at once", () => {
    carryStyles(":where(dl) { color: blue; }");
    expect(document.adoptedStyleSheets.map(cssTextOf)).toContainEqual(
      expect.stringContaining(":where(dl)"),
    );
  });

  it("adopts every carried sheet into a frame's document, once however often asked", () => {
    carryStyles(":where(dt) { color: blue; }");
    carryStyles(":where(dd) { color: blue; }");
    const frame = frameDocument();
    adoptCarriedStyles(frame);
    adoptCarriedStyles(frame);
    const texts = frame.adoptedStyleSheets.map(cssTextOf);
    expect(texts.filter((text) => text.includes(":where(dt)"))).toHaveLength(1);
    expect(texts.filter((text) => text.includes(":where(dd)"))).toHaveLength(1);
  });
});
