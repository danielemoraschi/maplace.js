// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { hoverSelectorsOutsideHoverMedia, selectorsOf, weighsNothing } from "./selectors";

describe("selectorsOf", () => {
  it("is each rule's selector text", () => {
    expect(selectorsOf(":where(a, b) > c { x: 1; }\nd, e { y: 2; }")).toEqual([
      ":where(a, b) > c",
      "d, e",
    ]);
  });
});

describe("weighsNothing", () => {
  it("holds for selectors wholly inside :where(), nested parentheses and lists too", () => {
    expect(weighsNothing(":where(a[x]:not([y])) > :where(.b), :where(c)")).toBe(true);
    expect(weighsNothing(":where(a) .b")).toBe(false);
    expect(weighsNothing(".a")).toBe(false);
  });
});

describe("hoverSelectorsOutsideHoverMedia", () => {
  it("finds the :hover rules a pointer that can't hover would still match", () => {
    const css =
      "a:hover { x: 1; } @media (pointer: coarse) { b:hover { x: 1; } } @media (hover: hover) { c:hover { x: 1; } } d { x: 1; }";
    expect(hoverSelectorsOutsideHoverMedia(css)).toEqual(["a:hover", "b:hover"]);
  });
});
