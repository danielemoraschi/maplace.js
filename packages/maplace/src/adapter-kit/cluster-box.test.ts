import { describe, expect, it } from "vitest";
import { isInBox } from "../view-box";
import { clusterBoxAround, holdsView, WORLD_BOX } from "./cluster-box";

const VIEW = { south: 10, west: 20, north: 30, east: 60 };

describe("clusterBoxAround", () => {
  it("pads the view by half its size each side", () => {
    expect(clusterBoxAround(VIEW)).toEqual({ south: 0, west: 0, north: 40, east: 80 });
  });

  it("keeps latitudes on the globe", () => {
    const box = clusterBoxAround({ south: -80, west: 0, north: 80, east: 10 });
    expect(box).toMatchObject({ south: -90, north: 90 });
  });

  it("takes the whole world once the padded view spans it", () => {
    expect(clusterBoxAround({ south: -60, west: -100, north: 60, east: 140 })).toEqual(WORLD_BOX);
  });
});

describe("isInBox", () => {
  it("leaves out a point beyond the padded view", () => {
    const box = clusterBoxAround(VIEW);
    expect(isInBox({ lat: 20, lng: 79 }, box)).toBe(true);
    expect(isInBox({ lat: 20, lng: 81 }, box)).toBe(false);
    expect(isInBox({ lat: 41, lng: 40 }, box)).toBe(false);
  });
});

describe("holdsView", () => {
  const box = clusterBoxAround(VIEW);

  it("holds a view panned less than half of it", () => {
    expect(holdsView(box, { south: 15, west: 35, north: 35, east: 75 })).toBe(true);
  });

  it("lets go of a view panned past the box, or taller than it", () => {
    expect(holdsView(box, { south: 10, west: 50, north: 30, east: 90 })).toBe(false);
    expect(holdsView(box, { south: -5, west: 20, north: 30, east: 60 })).toBe(false);
  });

  it("holds a view on the far side of the antimeridian from its box", () => {
    const across = { south: -10, west: 170, north: 10, east: 190 };
    expect(holdsView(across, { south: 0, west: -179, north: 5, east: -175 })).toBe(true);
  });

  it("holds every view in the whole world", () => {
    expect(holdsView(WORLD_BOX, { south: -60, west: 170, north: 60, east: 190 })).toBe(true);
  });
});
