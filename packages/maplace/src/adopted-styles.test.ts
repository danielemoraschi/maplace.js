// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { adoptStyles } from "./adopted-styles";
import { cssTextOf } from "./testing/selectors";

describe("adoptStyles", () => {
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
});
