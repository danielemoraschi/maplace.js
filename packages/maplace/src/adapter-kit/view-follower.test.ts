import { describe, expect, it } from "vitest";
import type { Geometry } from "../geometry";
import type { ResolvedView } from "../viewport";
import type { CameraMove } from "./camera-move";
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
  let size: MapSize | undefined = SIZE;
  const site: ViewSite = {
    sizeOf: () => size,
    geometryOf: (id) => placed.get(id),
    move: (move) => moves.push(move),
    standing: standingView(),
  };
  const resize = (next: MapSize | undefined) => {
    size = next;
    follower.resized();
  };
  return { follower, site, moves, placed, drawn, resize };
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
