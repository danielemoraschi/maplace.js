import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import type { Bounds, Viewport } from "../viewport";
import { listedEntries } from "./model";
import { inViewOf, scopeIn } from "./viewport-scope";

const west: Location = { id: "west", lat: 10, lng: 10 };
const east: Location = { id: "east", type: "marker", lat: 10, lng: 50 };
const locations = [west, east];

function viewport(bounds: Bounds, zoom = 5): Viewport {
  const center = { lat: (bounds.south + bounds.north) / 2, lng: (bounds.west + bounds.east) / 2 };
  return { center, zoom, bounds };
}

const WHOLE = viewport({ south: 0, west: 0, north: 20, east: 60 }, 3);
const WEST_ONLY = viewport({ south: 0, west: 0, north: 20, east: 20 });
const NO_AREA = viewport({ south: 0, west: 0, north: 0, east: 0 });

function listed(scope: Viewport | undefined, list: readonly Location[] = locations): string[] {
  return listedEntries({ locations: list, filter: undefined }, inViewOf(scope)).map(({ id }) => id);
}

describe("scopeIn", () => {
  it("lists everything in 'All', whatever the view", () => {
    expect(scopeIn("all", undefined, WEST_ONLY)).toBe(undefined);
    expect(scopeIn("all", scopeIn("area", undefined, WEST_ONLY), WHOLE)).toBe(undefined);
  });

  it("in 'This area', follows each new view", () => {
    const west = scopeIn("area", undefined, WEST_ONLY);
    expect(listed(west)).toEqual(["west"]);
    expect(listed(scopeIn("area", west, WHOLE))).toEqual(["west", "east"]);
  });

  it("keeps the scope through a resize, which keeps the centre and zoom", () => {
    const west = scopeIn("area", undefined, WEST_ONLY);
    const taller = { ...WEST_ONLY, bounds: { south: -10, west: 0, north: 30, east: 20 } };
    expect(scopeIn("area", west, taller)).toBe(west);
    expect(scopeIn("area", west, { ...WEST_ONLY, zoom: 6 })).not.toBe(west);
  });

  it("lists everything in 'This area' without a laid-out view, until one comes", () => {
    const west = scopeIn("area", undefined, WEST_ONLY);
    expect(scopeIn("area", west, undefined)).toBe(undefined);
    expect(scopeIn("area", west, NO_AREA)).toBe(undefined);
    expect(listed(scopeIn("area", undefined, WEST_ONLY))).toEqual(["west"]);
  });
});

describe("inViewOf", () => {
  it("narrows nothing without a view", () => {
    expect(inViewOf(undefined)).toBeUndefined();
  });

  it("lists a typeless marker in the view, not one outside", () => {
    expect(listed(scopeIn("area", undefined, WEST_ONLY))).toEqual(["west"]);
  });

  it("lists a circle by its centre", () => {
    const near: Location = {
      id: "near",
      type: "circle",
      center: { lat: 10, lng: 25 },
      radius: 1e6,
    };
    const inside: Location = { id: "in", type: "circle", center: { lat: 10, lng: 15 }, radius: 1 };
    expect(listed(scopeIn("area", undefined, WEST_ONLY), [near, inside])).toEqual(["in"]);
  });

  it("lists a polyline or polygon with any point in view", () => {
    const line: Location = {
      id: "line",
      type: "polyline",
      path: [
        { lat: 10, lng: 50 },
        { lat: 10, lng: 15 },
      ],
    };
    const away: Location = {
      id: "away",
      type: "polygon",
      path: [
        { lat: 10, lng: 30 },
        { lat: 15, lng: 35 },
        { lat: 10, lng: 40 },
      ],
    };
    expect(listed(scopeIn("area", undefined, WEST_ONLY), [line, away])).toEqual(["line"]);
  });

  it("finds a location across the antimeridian", () => {
    const across = viewport({ south: -10, west: 170, north: 10, east: -170 });
    const fiji: Location = { id: "fiji", lat: 0, lng: 178 };
    const samoa: Location = { id: "samoa", lat: 0, lng: -172 };
    const lima: Location = { id: "lima", lat: -12, lng: -77 };
    expect(listed(scopeIn("area", undefined, across), [fiji, samoa, lima])).toEqual([
      "fiji",
      "samoa",
    ]);
  });
});
