import { describe, expect, it } from "vitest";
import { GOOGLE_MAPS_PAGES } from "./maps-pages";

describe("GOOGLE_MAPS_PAGES", () => {
  it("shows a point through Maps URLs' search", () => {
    expect(GOOGLE_MAPS_PAGES.openInMaps("41.900000", "-12.500000")).toBe(
      "https://www.google.com/maps/search/?api=1&query=41.900000%2C-12.500000",
    );
  });

  it("gives directions through Maps URLs' dir, with no origin", () => {
    expect(GOOGLE_MAPS_PAGES.directions("-41.900000", "12.500000")).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=-41.900000%2C12.500000",
    );
  });
});
