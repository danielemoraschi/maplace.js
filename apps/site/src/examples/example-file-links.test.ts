import { describe, expect, it } from "vitest";
import {
  dataFetchedBy,
  exampleDataLinks,
  stylesheetHref,
  stylesheetLinks,
} from "./example-file-links.ts";

const names = (code: string[]) => dataFetchedBy(code).map(({ name }) => name);

describe("dataFetchedBy", () => {
  it("is the data file a page fetches by its path", () => {
    expect(names(["fetch('/points-4k.json')"])).toEqual(["points-4k"]);
  });

  it("is every data file a path with a template part can be", () => {
    expect(names([`fetch(\`/live-data-\${letter}.json\`)`])).toEqual([
      "live-data-a",
      "live-data-b",
      "live-data-c",
      "live-data-d",
      "live-data-e",
    ]);
  });

  it("is nothing for code fetching none, or a file the examples don't have", () => {
    expect(names(['<img src="/icons/a.svg">', "fetch('/locations.json')"])).toEqual([]);
  });
});

describe("exampleDataLinks", () => {
  it("links each data file to the site's copy, where the examples fetch it", () => {
    const [points] = dataFetchedBy(["/points-4k.json"]);
    expect(exampleDataLinks(points ? [points] : [])).toEqual([
      { file: "points-4k.json", url: "/points-4k.json" },
    ]);
  });
});

describe("stylesheetLinks", () => {
  it("links each stylesheet to the site's copy, in its example's folder", () => {
    expect(stylesheetLinks([{ folder: "whats-on", file: "whats-on.css" }])).toEqual([
      { file: "whats-on.css", url: "/examples/whats-on/whats-on.css" },
    ]);
  });
});

describe("stylesheetHref", () => {
  it("is where the site serves a stylesheet, in its example's folder", () => {
    expect(stylesheetHref({ folder: "whats-on", file: "whats-on.css" })).toBe(
      "/examples/whats-on/whats-on.css",
    );
  });
});
