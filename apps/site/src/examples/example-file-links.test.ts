import { describe, expect, it } from "vitest";
import {
  dataFetchedBy,
  exampleDataLinks,
  exampleFileHref,
  stylesheetLinks,
} from "./example-file-links.ts";

const names = (code: string[]) => dataFetchedBy(code).map(({ name }) => name);

describe("dataFetchedBy", () => {
  it("is the data file a page fetches by its path", () => {
    expect(names(["fetch('/examples/data/points-4k.json')"])).toEqual(["points-4k"]);
  });

  it("is every data file a path with a template part can be", () => {
    expect(names([`fetch(\`/examples/data/live-data-\${letter}.json\`)`])).toEqual([
      "live-data-a",
      "live-data-b",
      "live-data-c",
      "live-data-d",
      "live-data-e",
    ]);
  });

  it("is nothing for code fetching none, or a file the examples don't have", () => {
    expect(names(['<img src="/examples/data/icons/a.svg">', "fetch('/locations.json')"])).toEqual(
      [],
    );
  });
});

describe("exampleDataLinks", () => {
  it("links each data file to the site's copy, where the examples fetch it", () => {
    const [points] = dataFetchedBy(["/examples/data/points-4k.json"]);
    expect(exampleDataLinks(points ? [points] : [])).toEqual([
      { file: "points-4k.json", url: "/examples/data/points-4k.json" },
    ]);
  });
});

describe("stylesheetLinks", () => {
  it("links each stylesheet to the site's copy, in the examples' styles", () => {
    expect(stylesheetLinks([{ folder: "styles", file: "whats-on.css" }])).toEqual([
      { file: "whats-on.css", url: "/examples/styles/whats-on.css" },
    ]);
  });
});

describe("exampleFileHref", () => {
  it("is where the site serves an example's file: at its own path, under /examples/", () => {
    expect(exampleFileHref("styles/whats-on.css")).toBe("/examples/styles/whats-on.css");
    expect(exampleFileHref("data/points-4k.json")).toBe("/examples/data/points-4k.json");
  });
});
