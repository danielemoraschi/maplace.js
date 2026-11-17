import { describe, expect, it } from "vitest";
import { markerDrawable, presented, TOWNS } from "../testing/conformance/fixtures";
import { heatPointsOf, pixelCopies } from "./heat-points";

/** Placed locations as the heat reads them: only their drawables. */
const placedOf = (...drawables: ReturnType<typeof markerDrawable>[]) =>
  new Map(drawables.map((drawable) => [drawable.id, { drawable: () => drawable }]));

describe("heatPointsOf", () => {
  it("gives the visible heat markers, weighed against the heaviest", () => {
    const placed = placedOf(
      markerDrawable("a", TOWNS.bologna, { heatWeight: 4 }),
      markerDrawable("b", TOWNS.modena, { heatWeight: 2 }),
      markerDrawable("pin", TOWNS.ferrara),
    );
    expect(heatPointsOf(placed.values(), presented({}), 4)).toEqual([
      { at: TOWNS.bologna, weight: 1 },
      { at: TOWNS.modena, weight: 0.5 },
    ]);
  });

  it("leaves a hidden heat marker out", () => {
    const placed = placedOf(markerDrawable("a", TOWNS.bologna, { heatWeight: 4 }));
    expect(heatPointsOf(placed.values(), presented({ hiddenIds: new Set(["a"]) }), 4)).toEqual([]);
  });
});

/** `pixelCopies` into a list of its own. */
function copiesOf(
  ...args: [Parameters<typeof pixelCopies>[0], number, Parameters<typeof pixelCopies>[2]]
) {
  const into: Parameters<typeof pixelCopies>[3] = [];
  pixelCopies(...args, into);
  return into;
}

describe("pixelCopies", () => {
  const frame = { left: 100, top: 50, width: 300, height: 200, radius: 10, worldWidth: 256 };

  it("places a point in the canvas, once when one copy of the world fills it", () => {
    expect(copiesOf({ x: 150, y: 80 }, 0.5, { ...frame, worldWidth: 1024 })).toEqual([
      { x: 50, y: 30, weight: 0.5 },
    ]);
  });

  it("draws it again on every copy of the world the canvas shows", () => {
    expect(copiesOf({ x: 150, y: 80 }, 1, frame).map(({ x }) => x)).toEqual([50, 306]);
  });

  it("finds the copy in view of a point projected a world away", () => {
    expect(copiesOf({ x: 150 - 256 * 3, y: 80 }, 1, frame).map(({ x }) => x)).toEqual([50, 306]);
  });

  it("leaves out a point above or below the canvas", () => {
    expect(copiesOf({ x: 150, y: 50 - 20 }, 1, frame)).toEqual([]);
    expect(copiesOf({ x: 150, y: 50 + 230 }, 1, frame)).toEqual([]);
  });
});
