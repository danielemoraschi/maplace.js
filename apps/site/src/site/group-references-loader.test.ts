import { describe, expect, it } from "vitest";
import { tableRows } from "../../../../scripts/docs/markdown.ts";
import {
  EXAMPLE_GROUPS,
  EXAMPLE_SECTIONS,
  type ExampleGroup,
} from "../examples/example-sections.ts";
import { markers } from "../examples/groups/markers.ts";
import { groupReferenceMarkdown } from "./group-references-loader.ts";
import { headingSlug } from "./site-link-targets.ts";

const SETTINGS = {
  pin: { version: "1.2.3", integrityOf: (file: string) => `sha384-of-${file}` },
  blobBase: "https://github.com/o/r/blob/abc123/",
};

/** A group like `markers`, cutting only `references`. */
const cutting = (references: ExampleGroup["references"]): ExampleGroup => ({
  ...markers,
  references,
});

const headingsOf = (markdown: string) =>
  markdown.split("\n").filter((line) => line.startsWith("#"));

describe("groupReferenceMarkdown", () => {
  it("cuts each group's tables under headings that link their reference section", () => {
    const markdown = groupReferenceMarkdown(markers, SETTINGS);
    expect(headingsOf(markdown)).toEqual([
      "### Markers, from the [Locations reference](/locations/#markers)",
      "### Popup options, from the [Store reference](/store/#popup-options)",
    ]);
    expect(tableRows(markdown).map(([name]) => name)).toContain("`maxWidth`");
  });

  it("cuts a table for every reference of every group", () => {
    for (const each of EXAMPLE_GROUPS) {
      const markdown = groupReferenceMarkdown(each, SETTINGS);
      expect(headingsOf(markdown), each.id).toHaveLength(each.references.length);
      expect(tableRows(markdown).length, each.id).toBeGreaterThan(0);
    }
  });

  it("points a table's links to its doc's own headings at its doc's page", () => {
    const markdown = groupReferenceMarkdown(markers, SETTINGS);
    expect(markdown).toContain("](/locations/#icons)");
    expect(markdown).not.toContain("](#");
  });

  it("leaves the prose around a table out", () => {
    const markdown = groupReferenceMarkdown(
      cutting([{ doc: "locations", heading: "## Multipolygons" }]),
      SETTINGS,
    );
    const lines = markdown.split("\n").filter((line) => line !== "");
    for (const line of lines.slice(1)) expect(line.startsWith("|"), line).toBe(true);
  });

  it("names no reference heading as an example's id", () => {
    const names = new Set(EXAMPLE_SECTIONS.map(({ name }) => name));
    for (const each of EXAMPLE_GROUPS) {
      for (const heading of headingsOf(groupReferenceMarkdown(each, SETTINGS)))
        expect(names.has(headingSlug(heading)), heading).toBe(false);
    }
  });

  it("fails naming the doc when a cut's heading isn't there, or holds no table", () => {
    expect(() =>
      groupReferenceMarkdown(cutting([{ doc: "locations", heading: "## Nowhere" }]), SETTINGS),
    ).toThrow('docs/reference/locations.md: no "## Nowhere" section');
    expect(() =>
      groupReferenceMarkdown(cutting([{ doc: "locations", heading: "## Icons" }]), SETTINGS),
    ).toThrow('docs/reference/locations.md: "## Icons" holds no table');
    expect(() =>
      groupReferenceMarkdown(cutting([{ doc: "nowhere", heading: "## Markers" }]), SETTINGS),
    ).toThrow("nowhere isn't in REPO_DOCS");
  });
});
