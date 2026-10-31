import { describe, expect, it } from "vitest";
import { OPENSTREETMAP_PAGES } from "./openstreetmap-pages";

describe("OPENSTREETMAP_PAGES", () => {
  it("shows a point with a marker, at the zoom a fit stops at", () => {
    expect(OPENSTREETMAP_PAGES.openInMaps("41.900000", "-12.500000")).toBe(
      "https://www.openstreetmap.org/?mlat=41.900000&mlon=-12.500000#map=15/41.900000/-12.500000",
    );
  });

  it("gives directions with the point as the end", () => {
    expect(OPENSTREETMAP_PAGES.directions("-41.900000", "12.500000")).toBe(
      "https://www.openstreetmap.org/directions?to=-41.900000%2C12.500000",
    );
  });
});
