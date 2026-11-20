import { describe, expect, it, vi } from "vitest";
import { followSectionAnchor, pageForAnchor } from "./section-anchor.ts";

describe("pageForAnchor", () => {
  it("sends an example's anchor on the home page to the page holding it", () => {
    expect(pageForAnchor("#route", "/")).toBe("/examples/lines-routes/");
    expect(pageForAnchor("#simple", "/")).toBe("/examples/markers/");
  });

  it("sends an anchor on an examples' page to the page now holding it", () => {
    expect(pageForAnchor("#search", "/examples/lists/")).toBe("/examples/search/");
    expect(pageForAnchor("#flights", "/examples/circles-polygons/")).toBe(
      "/examples/lines-routes/",
    );
  });

  it("leaves an example's anchor on its own page where it is", () => {
    expect(pageForAnchor("#menu", "/examples/lists/")).toBeUndefined();
  });

  it("leaves a hash that names no example, or none at all", () => {
    for (const hash of ["", "#", "#main", "#examples", "#reference"])
      expect(pageForAnchor(hash, "/")).toBeUndefined();
  });

  it("leaves another page's own anchor alone, a heading sharing an example's name", () => {
    expect(pageForAnchor("#markers", "/locations/")).toBeUndefined();
    expect(pageForAnchor("#circles", "/locations/")).toBeUndefined();
  });

  it("reads a stray percent sign as no example, without throwing", () => {
    expect(pageForAnchor("#%E0%A4%A", "/")).toBeUndefined();
  });

  it("keeps the query and the hash on the way", () => {
    const replace = vi.fn();
    followSectionAnchor({
      pathname: "/",
      search: "?ref=x",
      hash: "#route",
      replace,
    } as unknown as Location);
    expect(replace).toHaveBeenCalledWith("/examples/lines-routes/?ref=x#route");
  });
});
