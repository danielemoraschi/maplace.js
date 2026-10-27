import { describe, expect, it } from "vitest";
import * as maplace from "./index";

describe("the maplace entry", () => {
  it("imports without a DOM and exposes its runtime API", () => {
    expect(typeof document).toBe("undefined");
    expect(Object.keys(maplace).sort()).toEqual([
      "MaplaceError",
      "createListView",
      "createMaplace",
      "listedLocations",
      "locationsFromGeoJSON",
    ]);
  });
});
