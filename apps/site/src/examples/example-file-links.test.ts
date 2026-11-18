import { describe, expect, it } from "vitest";
import {
  dataFetchedBy,
  exampleFileHref,
  fetchedDataLinks,
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

describe("fetchedDataLinks", () => {
  const fetching = (provider: "google" | "maplibre", path: string) => ({
    provider,
    files: [{ code: `fetch("${path}")` }],
  });

  it("names the provider whose versions alone fetch a file", () => {
    const codes = [
      fetching("google", "/examples/data/countries.json"),
      fetching("maplibre", "/examples/data/route-milan-munich.json"),
      fetching("maplibre", "/examples/data/countries.json"),
    ];
    expect(fetchedDataLinks(codes)).toEqual([
      { file: "countries.json", url: "/examples/data/countries.json" },
      {
        file: "route-milan-munich.json",
        url: "/examples/data/route-milan-munich.json",
        onlyOn: "MapLibre",
      },
    ]);
  });

  it("names no provider for an example on one provider only", () => {
    const codes = [fetching("maplibre", "/examples/data/countries.json")];
    expect(fetchedDataLinks(codes)[0]).not.toHaveProperty("onlyOn");
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
