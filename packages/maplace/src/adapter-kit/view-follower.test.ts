import { describe, expect, it } from "vitest";
import type { Geometry } from "../geometry";
import type { ResolvedView } from "../viewport";
import type { CameraMove } from "./camera-move";
import { type Insets, NO_INSETS } from "./panel-insets";
import { createViewFollower, type StandingView, type ViewSite } from "./view-follower";
import type { MapSize } from "./web-mercator";

const CENTER: ResolvedView = { kind: "center", center: { lat: 1, lng: 2 }, zoom: 4 };
const AT_A: ResolvedView = { kind: "location", id: "a", zoom: 6 };
const SIZE = { width: 512, height: 512 };

function standingView(): StandingView {
  let view: ResolvedView | undefined;
  return { shown: (next) => (view = next), standing: () => view, stop() {} };
}

/** A follower on an open map whose size and placed geometries the test sets. */
function followed(drawn = { applied: 0, through: 0 }) {
  const follower = createViewFollower({
    applied: () => drawn.applied,
    drawnThrough: (count) => drawn.through >= count,
  });
  const moves: CameraMove[] = [];
  const placed = new Map<string, Geometry>();
  const clearOf: Insets[] = [];
  let size: MapSize | undefined = SIZE;
  let covered: Insets = NO_INSETS;
  /** Whether a panel reaches inside what a fit kept clear: by default, when it covers deeper on a side. */
  let reaching = (insets: Insets) =>
    covered.top > insets.top ||
    covered.right > insets.right ||
    covered.bottom > insets.bottom ||
    covered.left > insets.left;
  const site: ViewSite = {
    sizeOf: () => size,
    geometryOf: (id) => placed.get(id),
    panelInsets: () => covered,
    keptClear: () => NO_INSETS,
    reachesInto: (insets) => reaching(insets),
    move: (move, insets) => {
      moves.push(move);
      clearOf.push(insets);
    },
    standing: standingView(),
  };
  const resize = (next: MapSize | undefined) => {
    size = next;
    follower.resized();
  };
  /** A panel settles covering `insets` of the map, reaching inside a fit's clear area or not. */
  const panelsCover = (insets: Insets, reachesIn?: boolean) => {
    covered = insets;
    if (reachesIn !== undefined) reaching = () => reachesIn;
    follower.panelsSettled();
  };
  return { follower, site, moves, clearOf, placed, drawn, resize, panelsCover };
}

describe("createViewFollower", () => {
  it("shows a view once the map is open, and not after it closed", () => {
    const { follower, site, moves } = followed();
    follower.setView(CENTER);
    expect(moves).toEqual([]);
    follower.open(site);
    expect(moves).toEqual([{ kind: "jump", center: CENTER.center, zoom: 4 }]);
    follower.close();
    follower.setView(CENTER);
    expect(moves).toHaveLength(1);
  });

  it("holds a view while the map has no size, and shows it once it has one", () => {
    const { follower, site, moves, resize } = followed();
    follower.open(site);
    resize(undefined);
    follower.setView(CENTER);
    expect(moves).toEqual([]);
    resize(SIZE);
    expect(moves).toHaveLength(1);
  });

  it("holds a location view until the diffs sent before it are drawn", () => {
    const drawn = { applied: 1, through: 0 };
    const { follower, site, moves, placed } = followed(drawn);
    follower.open(site);
    placed.set("a", { type: "marker", lat: 3, lng: 4 });
    follower.setView(AT_A);
    expect(moves).toEqual([]);
    drawn.through = 1;
    follower.sync();
    expect(moves).toEqual([{ kind: "jump", center: { lat: 3, lng: 4 }, zoom: 6 }]);
  });

  it("shows the standing view again after a resize", () => {
    const { follower, site, moves, resize } = followed();
    follower.open(site);
    follower.setView(CENTER);
    resize({ width: 300, height: 200 });
    expect(moves).toHaveLength(2);
  });
});

/** A box over the map's middle, fitted below the zoom cap. */
const FIT: ResolvedView = {
  kind: "fit-bounds",
  bounds: { south: 40, west: -10, north: 60, east: 10 },
  padding: 40,
};
const TOP_PANEL: Insets = { ...NO_INSETS, top: 75 };

describe("a follower's fit clear of what covers the map (N32)", () => {
  it("fits clear of what covers the map's edges when it moves", () => {
    const { follower, site, clearOf, panelsCover } = followed();
    panelsCover(TOP_PANEL);
    follower.open(site);
    follower.setView(FIT);
    expect(clearOf).toEqual([TOP_PANEL]);
  });

  it("fits a standing fit again when the panels settle covering more", () => {
    const { follower, site, moves, clearOf, panelsCover } = followed();
    follower.open(site);
    follower.setView(FIT);
    panelsCover(TOP_PANEL);
    expect(moves).toHaveLength(2);
    expect(clearOf.at(-1)).toEqual(TOP_PANEL);
  });

  it("leaves the view when the panels cover what they did at the last move", () => {
    const { follower, site, moves, panelsCover } = followed();
    panelsCover(TOP_PANEL);
    follower.open(site);
    follower.setView(FIT);
    panelsCover(TOP_PANEL);
    expect(moves).toHaveLength(1);
  });

  it("leaves the view when the panels come to cover less, as a list narrowing as the visitor types", () => {
    const { follower, site, moves, panelsCover } = followed();
    panelsCover({ ...NO_INSETS, top: 200 });
    follower.open(site);
    follower.setView(FIT);
    panelsCover(TOP_PANEL);
    panelsCover({ ...NO_INSETS, top: 200 });
    expect(moves).toHaveLength(1);
  });

  it("leaves a fit when a panel counts on another edge but stays out of what it kept clear", () => {
    const { follower, site, moves, panelsCover } = followed();
    panelsCover({ ...NO_INSETS, left: 260 });
    follower.open(site);
    follower.setView(FIT);
    // A tall list on the left, narrowed by a search to a short box: now counted on the top.
    panelsCover({ ...NO_INSETS, top: 100 }, false);
    expect(moves).toHaveLength(1);
  });

  it("leaves a fit when a panel too large to keep clear of shrinks within where it was", () => {
    const { follower, site, moves, clearOf, panelsCover } = followed();
    panelsCover({ ...NO_INSETS, left: 400 });
    follower.open(site);
    follower.setView(FIT);
    expect(clearOf).toEqual([NO_INSETS]);
    // A search narrows it into a box the room rule keeps, inside the strip it covered.
    panelsCover({ ...NO_INSETS, top: 100 }, false);
    expect(moves).toHaveLength(1);
  });

  it("leaves a standing location view where it is", () => {
    const { follower, site, moves, placed, panelsCover } = followed();
    placed.set("a", { type: "marker", lat: 3, lng: 4 });
    follower.open(site);
    follower.setView(AT_A);
    panelsCover(TOP_PANEL);
    expect(moves).toHaveLength(1);
  });

  it("does nothing before the map opens", () => {
    const { follower, moves, panelsCover } = followed();
    follower.setView(FIT);
    panelsCover(TOP_PANEL);
    expect(moves).toEqual([]);
  });
});
