// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { Geometry } from "../geometry";
import { createPopupLinks, type MapsPages } from "./popup-links";

const PAGES: MapsPages = {
  openInMaps: (lat, lng) => `https://maps.test/open/${lat},${lng}`,
  directions: (lat, lng) => `https://maps.test/to/${lat},${lng}`,
};

const BOTH = { openInMapsLabel: "Open", directionsLabel: "Go" };
const NOWHERE: Geometry = { type: "marker", lat: 0, lng: 0 };

function linksWith(
  options: { openInMapsLabel?: string; directionsLabel?: string } = BOTH,
  geometry = NOWHERE,
) {
  const { openInMapsLabel, directionsLabel } = options;
  const settings = { options: { openInMapsLabel, directionsLabel }, pages: PAGES };
  return createPopupLinks(settings, document, geometry);
}

function anchorsOf(links: ReturnType<typeof linksWith>): HTMLAnchorElement[] {
  return [...(links?.element.querySelectorAll("a") ?? [])];
}

const hrefAt = (geometry: Geometry) => {
  const links = linksWith({ openInMapsLabel: "Open" }, geometry);
  return anchorsOf(links)[0]?.href;
};

describe("createPopupLinks", () => {
  it("makes no row without a label", () => {
    expect(linksWith({})).toBeUndefined();
  });

  it("makes one link per label, open-in-maps first", () => {
    expect(anchorsOf(linksWith()).map(({ textContent }) => textContent)).toEqual(["Open", "Go"]);
    const directions = anchorsOf(linksWith({ directionsLabel: "Go" }));
    expect(directions.map(({ textContent }) => textContent)).toEqual(["Go"]);
  });

  it("parts the links with a space in their text", () => {
    expect(linksWith()?.element.textContent?.trim()).toBe("Open Go");
  });

  it("keeps a label's markup as text", () => {
    const [link] = anchorsOf(linksWith({ openInMapsLabel: "<b>Open</b>" }));
    expect(link?.textContent).toBe("<b>Open</b>");
    expect(link?.children).toHaveLength(0);
  });

  it("opens each in a new tab with no referrer", () => {
    for (const link of anchorsOf(linksWith())) {
      expect([link.target, link.rel]).toEqual(["_blank", "noreferrer"]);
    }
  });

  it("points at a marker, a circle's centre, a polygon's bounds' centre, a polyline's halfway point", () => {
    const open = (at: string) => `https://maps.test/open/${at}`;
    expect(hrefAt({ type: "marker", lat: 41.9, lng: -12.5 })).toBe(open("41.900000,-12.500000"));
    const center = { lat: 1, lng: 2 };
    expect(hrefAt({ type: "circle", center, radius: 5 })).toBe(open("1.000000,2.000000"));
    const path = [
      { lat: 0, lng: 0 },
      { lat: 2, lng: 0 },
      { lat: 2, lng: 4 },
      { lat: 0, lng: 4 },
    ];
    expect(hrefAt({ type: "polygon", path })).toBe(open("1.000000,2.000000"));
    const line = [
      { lat: 0, lng: 0 },
      { lat: 2, lng: 0 },
    ];
    expect(hrefAt({ type: "polyline", path: line })).toBe(open("1.000000,0.000000"));
  });

  it("writes a tiny coordinate without an exponent", () => {
    expect(hrefAt({ type: "marker", lat: 1e-7, lng: -1e-7 })).toBe(
      "https://maps.test/open/0.000000,-0.000000",
    );
  });

  it("moves the same link elements when pointed elsewhere", () => {
    const links = linksWith();
    const before = anchorsOf(links);
    links?.pointAt({ type: "marker", lat: 3, lng: 4 });
    expect(anchorsOf(links)).toEqual(before);
    expect(before.map(({ href }) => href)).toEqual([
      "https://maps.test/open/3.000000,4.000000",
      "https://maps.test/to/3.000000,4.000000",
    ]);
  });
});
