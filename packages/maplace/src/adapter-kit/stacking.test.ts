import { describe, expect, it } from "vitest";
import type { Geometry } from "../geometry";
import {
  CLUSTER_RANK,
  createOrderCounter,
  ROUTE_LINE_RANK,
  shapeStackRank,
  stackRank,
} from "./stacking";

const plain = { selected: false, hovered: false };

describe("stackRank", () => {
  it("stacks the later added in front", () => {
    const next = createOrderCounter();
    const [first, second] = [next(), next()];
    expect(stackRank(second, plain)).toBeGreaterThan(stackRank(first, plain));
  });

  it("puts the selected marker above the rest, and the hovered one above that", () => {
    const late = 1_000_000;
    const selected = stackRank(1, { selected: true, hovered: false });
    expect(selected).toBeGreaterThan(stackRank(late, plain));
    expect(stackRank(2, { selected: true, hovered: true })).toBeGreaterThan(selected);
    expect(stackRank(2, { selected: false, hovered: true })).toBeGreaterThan(selected);
  });
});

const circle = (radius: number): Geometry => ({
  type: "circle",
  center: { lat: 0, lng: 0 },
  radius,
});
const line: Geometry = {
  type: "polyline",
  path: [
    { lat: 0, lng: 0 },
    { lat: 1, lng: 1 },
  ],
};

describe("shapeStackRank", () => {
  it("stacks the smaller shape in front, whichever came first", () => {
    expect(shapeStackRank(circle(5000), 1)).toBeGreaterThan(shapeStackRank(circle(15000), 2));
  });

  it("stacks a line in front of any area", () => {
    expect(shapeStackRank(line, 1)).toBeGreaterThan(shapeStackRank(circle(1), 2));
  });

  it("stacks the later added in front among shapes of one size", () => {
    expect(shapeStackRank(circle(5000), 2)).toBeGreaterThan(shapeStackRank(circle(5000), 1));
  });

  it("tells apart shapes a hundredth apart in size, the later added in front only when equal", () => {
    expect(shapeStackRank(circle(5000), 1)).toBeGreaterThan(shapeStackRank(circle(5050), 2));
  });

  it("stays above a route's line and below the clusters, however large or small", () => {
    expect(shapeStackRank(circle(1e9), 1)).toBeGreaterThan(ROUTE_LINE_RANK);
    const earth = circle(6_371_000 * 2);
    expect(shapeStackRank(earth, 1)).toBeGreaterThan(ROUTE_LINE_RANK);
    expect(shapeStackRank(line, 1_000_000)).toBeLessThan(CLUSTER_RANK);
  });
});
