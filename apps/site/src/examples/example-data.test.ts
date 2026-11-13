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
      "data/photos/colosseum.webp",
      "data/photos/duomo.webp",
      "data/photos/st-marks.webp",
      "data/points-4k.json",
      "styles/popups.css",
      "styles/whats-on.css",
    ]);
  });

  it("is each file as written, byte for byte: a photo as bytes, the rest as text", () => {
    for (const { path, body } of served) {
      const file = readFileSync(new URL(path, EXAMPLES));
      expect(typeof body === "string", path).toBe(!path.endsWith(".webp"));
      if (typeof body === "string") expect(body, path).toBe(file.toString("utf8"));
      else expect(Buffer.from(body).equals(file), path).toBe(true);
    }
  });

  it("types each file by its extension", () => {
    expect(at("data/points-4k.json")?.contentType).toBe("application/json");
    expect(at("data/icons/a.svg")?.contentType).toBe("image/svg+xml");
    expect(at("styles/whats-on.css")?.contentType).toBe("text/css; charset=utf-8");
    expect(at("data/photos/colosseum.webp")?.contentType).toBe("image/webp");
  });
});
