import { describe, expect, it, vi } from "vitest";
import { followSectionAnchor, pageForAnchor } from "./section-anchor.ts";

/** A page holding no element with an anchor's id. */
const HOLDS_NONE = () => false;

describe("pageForAnchor", () => {
  it("sends an example's anchor on the home page to its page", () => {
    expect(pageForAnchor("#route", "/", HOLDS_NONE)).toBe("/examples/lines-routes/route/");
    expect(pageForAnchor("#simple", "/", HOLDS_NONE)).toBe("/examples/markers/simple/");
  });

  it("sends an example's anchor on any hub to its page", () => {
    expect(pageForAnchor("#search", "/examples/lists/", HOLDS_NONE)).toBe(
      "/examples/search/search/",
    );
    expect(pageForAnchor("#flights", "/examples/circles-polygons/", HOLDS_NONE)).toBe(
      "/examples/lines-routes/flights/",
    );
    expect(pageForAnchor("#menu", "/examples/lists/", HOLDS_NONE)).toBe("/examples/lists/menu/");
  });

  it("keeps an anchor inside an example, as a shared link-to-place address carries its map's", () => {
    expect(pageForAnchor("#link-to-place-maplibre-map", "/examples/live-data/", HOLDS_NONE)).toBe(
      "/examples/live-data/link-to-place/#link-to-place-maplibre-map",
    );
  });

  it("reads an anchor as inside the example whose name and a dash begin it", () => {
    expect(pageForAnchor("#css-markers-map", "/", HOLDS_NONE)).toBe(
      "/examples/markers/css-markers/#css-markers-map",
    );
    expect(pageForAnchor("#markers-map", "/", HOLDS_NONE)).toBe(
      "/examples/markers/markers/#markers-map",
    );
  });

  it("leaves an anchor the page holds, a hub's reference heading beginning with an example's name", () => {
    const heading = "#markers-from-the-locations-reference";
    const holds = (id: string) => id === heading.slice(1);
    expect(pageForAnchor(heading, "/examples/markers/", holds)).toBeUndefined();
  });

  it("leaves a hash that names no example, or none at all", () => {
    for (const hash of ["", "#", "#main", "#examples", "#reference", "#routes", "#big2"])
      expect(pageForAnchor(hash, "/", HOLDS_NONE), hash).toBeUndefined();
    expect(pageForAnchor("#reference", "/examples/markers/", HOLDS_NONE)).toBeUndefined();
  });

  it("leaves another page's own anchor alone, a heading sharing an example's name", () => {
    expect(pageForAnchor("#markers", "/locations/", HOLDS_NONE)).toBeUndefined();
    expect(pageForAnchor("#circles", "/locations/", HOLDS_NONE)).toBeUndefined();
    expect(pageForAnchor("#popups", "/examples/markers/simple/", HOLDS_NONE)).toBeUndefined();
  });

  it("reads a stray percent sign as no example, without throwing", () => {
    expect(pageForAnchor("#%E0%A4%A", "/", HOLDS_NONE)).toBeUndefined();
  });
});

describe("followSectionAnchor", () => {
  const SITE = "https://maplacejs.com";
  /** Where the page at `pathname`, holding the ids `held`, is sent: none if it stays. */
  const followed = (pathname: string, search: string, hash: string, held: string[] = []) => {
    const replace = vi.fn();
    const href = `${SITE}${pathname}${search}${hash}`;
    const location = { href, pathname, search, hash, replace } as unknown as Location;
    const document = { getElementById: (id: string) => (held.includes(id) ? {} : null) };
    followSectionAnchor(location, document as unknown as Document);
    return replace.mock.calls;
  };

  it("keeps the query, leaving no hash for a bare example name", () => {
    expect(followed("/", "?ref=x", "#route")).toEqual([
      [`${SITE}/examples/lines-routes/route/?ref=x`],
    ]);
  });

  it("keeps the query before an anchor inside the example", () => {
    expect(
      followed("/examples/live-data/", "?place-maplibre=milan", "#link-to-place-maplibre-map"),
    ).toEqual([
      [`${SITE}/examples/live-data/link-to-place/?place-maplibre=milan#link-to-place-maplibre-map`],
    ]);
  });

  it("stays on a page whose anchor is its own", () => {
    expect(followed("/locations/", "", "#markers")).toEqual([]);
  });

  it("stays on a hub at its own reference heading, which begins with an example's name", () => {
    const heading = "markers-from-the-locations-reference";
    expect(followed("/examples/markers/", "", `#${heading}`, [heading])).toEqual([]);
  });
});
