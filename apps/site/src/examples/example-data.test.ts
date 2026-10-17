import { describe, expect, it } from "vitest";
import { exampleData } from "./example-data.ts";

describe("exampleData", () => {
  it("is each data file the example pages fetch, by the name in its path", () => {
    const files = exampleData();
    expect(files.map(({ name }) => name).sort()).toEqual(["locations", "points-4k"]);
    const points = files.find(({ name }) => name === "points-4k")?.json as unknown[];
    expect(points).toHaveLength(4000);
  });
});
