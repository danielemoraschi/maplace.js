import { describe, expect, it, vi } from "vitest";
import {
  type ReferenceTable,
  referenceProblems,
  tableNames,
  tableProblems,
} from "./reference-check.ts";

const PAGE = [
  "# Locations",
  "",
  "## Markers",
  "",
  "| Field | Type |",
  "|---|---|",
  "| `lat`, `lng` | `number` |",
  '| `icon` | `"a" \\| "b"` |',
  "",
  "## Circles",
  "",
  "| Field | Type |",
  "|---|---|",
  "| `radius` | `number` |",
  "",
  "## Content",
  "",
  "Prose, and no table.",
].join("\n");

const markers: ReferenceTable = {
  doc: "docs/reference/locations.md",
  heading: "## Markers",
  names: ["lat", "lng", "icon"],
  source: "MarkerLocation",
};

describe("tableNames", () => {
  it("reads the backticked names of the first column, two in a cell too", () => {
    expect(tableNames(PAGE, "## Markers", markers.doc)).toEqual(["lat", "lng", "icon"]);
  });

  it("reads only the table under its heading", () => {
    expect(tableNames(PAGE, "## Circles", markers.doc)).toEqual(["radius"]);
  });

  it("throws, naming the doc and the heading, when the heading is missing", () => {
    expect(() => tableNames(PAGE, "## Polygons", markers.doc)).toThrow(
      'docs/reference/locations.md: no "## Polygons" section',
    );
  });
});

describe("tableProblems", () => {
  it("finds none when the table lists the names", () => {
    expect(tableProblems(markers, ["lat", "lng", "icon"])).toEqual([]);
  });

  it("names a name the table lacks, and one the API lacks", () => {
    expect(tableProblems(markers, ["lat", "lng", "iconUrl"])).toEqual([
      "docs/reference/locations.md ## Markers: `icon` is in MarkerLocation but not in the table",
      "docs/reference/locations.md ## Markers: `iconUrl` is in the table but not in MarkerLocation",
    ]);
  });

  it("names a name listed twice", () => {
    expect(tableProblems(markers, ["lat", "lng", "icon", "lat"])).toEqual([
      "docs/reference/locations.md ## Markers: `lat` is listed twice",
    ]);
  });

  it("says so when the section has no table", () => {
    expect(tableProblems(markers, [])).toEqual([
      "docs/reference/locations.md ## Markers: no table of names",
    ]);
  });
});

describe("referenceProblems", () => {
  it("reads each table's page and gathers their problems", () => {
    const circles = { ...markers, heading: "## Circles", names: ["center", "radius"] };
    const content = { ...markers, heading: "## Content", names: ["content"] };
    const read = (file: string) => (file === markers.doc ? PAGE : "");
    expect(referenceProblems([markers, circles, content], read)).toEqual([
      "docs/reference/locations.md ## Circles: `center` is in MarkerLocation but not in the table",
      "docs/reference/locations.md ## Content: no table of names",
    ]);
  });

  it("reads each page once, however many of its tables are checked", () => {
    const circles = { ...markers, heading: "## Circles", names: ["radius"] };
    const read = vi.fn(() => PAGE);
    referenceProblems([markers, circles], read);
    expect(read).toHaveBeenCalledTimes(1);
  });
});
