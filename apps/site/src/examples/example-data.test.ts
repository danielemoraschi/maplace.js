import { describe, expect, it } from "vitest";
import { exampleData, exampleIcons } from "./example-data.ts";

describe("exampleData", () => {
  it("is each data file the example pages fetch, by the name in its path", () => {
    const files = exampleData();
    expect(files.map(({ name }) => name).sort()).toEqual([
      "mixed-a",
      "mixed-b",
      "mixed-c",
      "mixed-d",
      "mixed-e",
      "points-4k",
    ]);
    const points = files.find(({ name }) => name === "points-4k")?.json as unknown[];
    expect(points).toHaveLength(4000);
  });

  it("is each icon the example pages show, by its name, as SVG markup", () => {
    const icons = exampleIcons();
    expect(icons.map(({ name }) => name).sort()).toEqual(["a", "b", "c"]);
    expect(icons[0]?.svg).toMatch(/^<svg /);
  });
});
