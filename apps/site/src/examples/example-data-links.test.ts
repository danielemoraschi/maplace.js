import { describe, expect, it } from "vitest";
import { dataFetchedBy, exampleDataLinks } from "./example-data-links.ts";

const names = (code: string[]) => dataFetchedBy(code).map(({ name }) => name);

describe("dataFetchedBy", () => {
  it("is the data file a page fetches by its path", () => {
    expect(names(["fetch('/points-4k.json')"])).toEqual(["points-4k"]);
  });

  it("is every data file a path with a template part can be", () => {
    expect(names([`fetch(\`/mixed-\${letter}.json\`)`])).toEqual([
      "mixed-a",
      "mixed-b",
      "mixed-c",
      "mixed-d",
      "mixed-e",
    ]);
  });

  it("is nothing for code fetching none, or a file the examples don't have", () => {
    expect(names(['<img src="/icons/a.svg">', "fetch('/locations.json')"])).toEqual([]);
  });
});

describe("exampleDataLinks", () => {
  it("links each data file to its place in the repo, at the blob URL given", () => {
    const [points] = dataFetchedBy(["/points-4k.json"]);
    expect(exampleDataLinks(points ? [points] : [], "https://github.com/o/r/blob/abc/")).toEqual([
      {
        file: "points-4k.json",
        url: "https://github.com/o/r/blob/abc/packages/maplace/examples/data/points-4k.json",
      },
    ]);
  });
});
