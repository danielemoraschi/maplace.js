// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { plainTextOf, popupMarkupOf, previewLocationsOf } from "./builder-popups.ts";

describe("popupMarkupOf", () => {
  it("gives markup back as parsed", () => {
    expect(popupMarkupOf("<b>a</b>")).toBe("<b>a</b>");
  });
});

describe("plainTextOf", () => {
  it("keeps the words, without scripts or styles", () => {
    expect(plainTextOf("<script>x</script><style>y</style><b>a</b>")).toBe("a");
  });
});

describe("plainTextOf between blocks", () => {
  it("keeps blocks and lines apart", () => {
    expect(plainTextOf("<h3>Rome</h3><p>Capital</p>one<br>two")).toBe("Rome Capital one two");
  });
});

describe("popupMarkupOf and noscript", () => {
  it("refuses a noscript, whose contents a scripting page parses differently", () => {
    expect(popupMarkupOf("<noscript><!-- </noscript><b>x</b> --></noscript>")).toBeUndefined();
  });
});

describe("previewLocationsOf", () => {
  it("drops icon and turns html into its text", () => {
    expect(previewLocationsOf([{ id: "1", icon: "i.png", html: "<b>a</b>" }])).toEqual([
      { id: "1", content: "a" },
    ]);
    expect(previewLocationsOf([{ id: "1", html: "<script>x</script>a" }])).toEqual([
      { id: "1", content: "a" },
    ]);
  });

  it("gives html with nothing to say no popup", () => {
    expect(previewLocationsOf([{ id: "1", html: "<img src=x>" }])).toEqual([{ id: "1" }]);
  });
});
