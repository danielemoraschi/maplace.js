import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import type { LoadState, Snapshot } from "../store";
import type { Bounds, Viewport } from "../viewport";
import { listedEntries } from "./model";
import {
  inViewOf,
  isNewView,
  type ListScope,
  offersAreaOnly,
  scopeAfter,
  scopedTo,
  UNSCOPED,
} from "./viewport-scope";

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

function snapshotAt(at: Viewport | undefined, loadState: LoadState = "ready"): Snapshot {
  return {
    locations,
    selectedId: undefined,
    hoveredId: undefined,
    filter: undefined,
    view: { kind: "fit-all", padding: 40 },
    viewport: at,
    route: undefined,
    routeResult: undefined,
    loadState,
  };
}

function listed(scope: ListScope, list: readonly Location[] = locations): string[] {
  return listedEntries({ locations: list, filter: undefined }, inViewOf(scope)).map(({ id }) => id);
}

describe("scopeAfter", () => {
  it("stays unscoped through every viewport; unscopes a scoped list without a laid-out viewport", () => {
    expect(scopeAfter(UNSCOPED, WEST_ONLY)).toBe(UNSCOPED);
    const scoped = scopedTo(WEST_ONLY);
    expect(scopeAfter(scoped, WHOLE)).toBe(scoped);
    expect(scopeAfter(scoped, undefined)).toBe(UNSCOPED);
    expect(scopeAfter(scoped, NO_AREA)).toBe(UNSCOPED);
    expect(scopedTo(NO_AREA)).toBe(UNSCOPED);
  });
});

describe("offersAreaOnly", () => {
  it("offers 'This area only' only once ready, for a laid-out view that would list other locations", () => {
    expect(offersAreaOnly(snapshotAt(WEST_ONLY), locations)).toBe(true);
    expect(offersAreaOnly(snapshotAt(WEST_ONLY, "loading"), locations)).toBe(false);
    expect(offersAreaOnly(snapshotAt(NO_AREA), locations)).toBe(false);
    expect(offersAreaOnly(snapshotAt(undefined), locations)).toBe(false);
  });

  it("offers none for a view holding exactly what is listed, as the fitted view at load does", () => {
    expect(offersAreaOnly(snapshotAt(WHOLE), locations)).toBe(false);
  });

  it("offers one for a view that lists other locations than shown, none for one listing the same", () => {
    expect(offersAreaOnly(snapshotAt(WHOLE), [west])).toBe(true);
    expect(offersAreaOnly(snapshotAt({ ...WEST_ONLY, zoom: 4 }), [west])).toBe(false);
  });
});

describe("isNewView", () => {
  it("takes another centre or zoom as a new view, never the same report or a resize of it", () => {
    const resized = { ...WEST_ONLY, bounds: { south: 5, west: 0, north: 15, east: 20 } };
    expect(isNewView(WEST_ONLY, WEST_ONLY)).toBe(false);
    expect(isNewView(WEST_ONLY, resized)).toBe(false);
    expect(isNewView(WEST_ONLY, { ...WEST_ONLY, zoom: 6 })).toBe(true);
    expect(isNewView(WEST_ONLY, WHOLE)).toBe(true);
    expect(isNewView(undefined, WEST_ONLY)).toBe(true);
    expect(isNewView(WEST_ONLY, undefined)).toBe(true);
  });
});

describe("inViewOf", () => {
  it("narrows nothing while unscoped", () => {
    expect(inViewOf(UNSCOPED)).toBeUndefined();
  });

  it("lists a typeless marker in the view, not one outside", () => {
    expect(listed(scopedTo(WEST_ONLY))).toEqual(["west"]);
  });

  it("lists a circle by its centre", () => {
    const near: Location = {
      id: "near",
      type: "circle",
      center: { lat: 10, lng: 25 },
      radius: 1e6,
    };
    const inside: Location = { id: "in", type: "circle", center: { lat: 10, lng: 15 }, radius: 1 };
    expect(listed(scopedTo(WEST_ONLY), [near, inside])).toEqual(["in"]);
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
    expect(listed(scopedTo(WEST_ONLY), [line, away])).toEqual(["line"]);
  });

  it("finds a location across the antimeridian", () => {
    const across = viewport({ south: -10, west: 170, north: 10, east: -170 });
    const fiji: Location = { id: "fiji", lat: 0, lng: 178 };
    const samoa: Location = { id: "samoa", lat: 0, lng: -172 };
    const lima: Location = { id: "lima", lat: -12, lng: -77 };
    expect(listed(scopedTo(across), [fiji, samoa, lima])).toEqual(["fiji", "samoa"]);
  });
});
