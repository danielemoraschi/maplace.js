import { describe, expect, it } from "vitest";
import { stylesheetsLinkedBy, withStylesheetsWritten } from "./linked-stylesheets";

const STYLESHEETS: Readonly<Record<string, string>> = {
  "styles/whats-on.css": ".whats-on { color: red; }\n",
};

/** A stylesheet in `STYLESHEETS`, read as the site's `exampleFile` reads one. */
function read(folder: string, file: string): string {
  const css = STYLESHEETS[`${folder}/${file}`];
  if (css === undefined) throw new Error(`examples/${folder}/${file} doesn't exist`);
  return css;
}

const linking = (href: string) =>
  `<link rel="stylesheet" href="${href}">\n<div class="whats-on"></div>`;

describe("withStylesheetsWritten", () => {
  it("writes a linked stylesheet in its place, as a style", () => {
    expect(withStylesheetsWritten(linking("../styles/whats-on.css"), "whats-on", read)).toBe(
      '<style>\n.whats-on { color: red; }\n</style>\n<div class="whats-on"></div>',
    );
  });

  it("resolves a link from a MapLibre version's folder up to the examples' styles", () => {
    const html = linking("../../styles/whats-on.css");
    expect(withStylesheetsWritten(html, "whats-on/maplibre", read)).toContain(
      ".whats-on { color: red; }",
    );
  });

  it("leaves HTML that links no stylesheet as it is", () => {
    expect(withStylesheetsWritten("<p>Hello</p>", "simple", read)).toBe("<p>Hello</p>");
  });

  it.each([
    ["another origin", "https://example.com/a.css"],
    ["a protocol-relative URL", "//example.com/a.css"],
    ["a site path", "/a.css"],
    ["a file out of the examples", "../../a.css"],
    ["a file beside the example's versions", "whats-on.css"],
    ["another folder of the examples", "../data/a.css"],
    ["a file in a folder of the styles", "../styles/old/a.css"],
    ["a file that isn't CSS", "../styles/theme.scss"],
  ])("refuses a link it can't write in: %s", (_, href) => {
    expect(() => withStylesheetsWritten(linking(href), "whats-on", read)).toThrow(
      `an example links a .css file in examples/styles/ only, not ${href}`,
    );
  });

  it.each([
    ["written another way", '<link href="whats-on.css" rel="stylesheet">'],
    ["closed as XML", '<link rel="stylesheet" href="whats-on.css" />'],
    ["of another kind", '<link rel="icon" href="icon.svg">'],
  ])("refuses a link %s, which nothing would load", (_, link) => {
    expect(() => withStylesheetsWritten(link, "whats-on", read)).toThrow(
      `an example's only links are stylesheets, as <link rel="stylesheet" href="…">, not ${link}`,
    );
  });

  it("throws for a stylesheet that isn't there, through its reader", () => {
    expect(() => withStylesheetsWritten(linking("../styles/gone.css"), "whats-on", read)).toThrow(
      "examples/styles/gone.css doesn't exist",
    );
  });
});

describe("stylesheetsLinkedBy", () => {
  it("lists the stylesheets a version links, each by its place, resolved from its folder", () => {
    expect(stylesheetsLinkedBy(linking("../../styles/whats-on.css"), "whats-on/maplibre")).toEqual([
      { folder: "styles", file: "whats-on.css" },
    ]);
  });

  it("lists none for HTML that links none", () => {
    expect(stylesheetsLinkedBy("<p>Hello</p>", "simple")).toEqual([]);
  });
});
