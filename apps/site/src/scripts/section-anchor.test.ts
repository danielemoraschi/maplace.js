import { describe, expect, it, vi } from "vitest";
import { followSectionAnchor, pageForAnchor } from "./section-anchor.ts";

describe("pageForAnchor", () => {
  it("sends an old home page link to an example on another group's page to that page", () => {
    expect(pageForAnchor("#route", "/")).toBe("/examples/data-routes/");
    expect(pageForAnchor("#menu", "/")).toBe("/examples/lists/");
  });

  it("leaves a link to an example on the home page where it is", () => {
    expect(pageForAnchor("#simple", "/")).toBeUndefined();
  });

  it("leaves a hash that names no example, or none at all", () => {
    for (const hash of ["", "#", "#main", "#examples"])
      expect(pageForAnchor(hash, "/")).toBeUndefined();
  });

  it("leaves another page's own anchor alone, a heading sharing an example's name", () => {
    expect(pageForAnchor("#markers", "/locations/")).toBeUndefined();
    expect(pageForAnchor("#circles", "/locations/")).toBeUndefined();
    expect(pageForAnchor("#route", "/examples/lists/")).toBeUndefined();
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
    expect(replace).toHaveBeenCalledWith("/examples/data-routes/?ref=x#route");
  });
});
