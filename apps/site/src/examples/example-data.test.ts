import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { exampleData, servedExampleFiles } from "./example-data.ts";

const EXAMPLES = new URL("../../../../packages/maplace/examples/", import.meta.url);

describe("exampleData", () => {
  it("is each data file the example pages fetch, by the name in its path", () => {
    expect(exampleData().map(({ name }) => name)).toEqual([
      "live-data-a",
      "live-data-b",
      "live-data-c",
      "live-data-d",
      "live-data-e",
      "points-4k",
    ]);
  });
});

describe("servedExampleFiles", () => {
  const served = servedExampleFiles();
  const at = (path: string) => served.find((file) => file.path === path);

  it("is every file under the examples' data/ and styles/, by its path there", () => {
    expect(served.map(({ path }) => path)).toEqual([
      "data/icons/a.svg",
      "data/icons/b.svg",
      "data/icons/c.svg",
      "data/live-data-a.json",
      "data/live-data-b.json",
      "data/live-data-c.json",
      "data/live-data-d.json",
      "data/live-data-e.json",
      "data/points-4k.json",
      "styles/whats-on.css",
    ]);
  });

  it("is each file as written, byte for byte", () => {
    for (const { path, body } of served) {
      expect(body, path).toBe(readFileSync(new URL(path, EXAMPLES), "utf8"));
    }
  });

  it("types each file by its extension", () => {
    expect(at("data/points-4k.json")?.contentType).toBe("application/json");
    expect(at("data/icons/a.svg")?.contentType).toBe("image/svg+xml");
    expect(at("styles/whats-on.css")?.contentType).toBe("text/css; charset=utf-8");
  });
});
