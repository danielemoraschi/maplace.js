import { describe, expect, it } from "vitest";
import type { Geometry } from "../geometry";
import { MAP_SIZE } from "../testing/map-probe";
import type { ResolvedView } from "../viewport";
import { cameraMove, FIT_MAX_ZOOM } from "./camera-move";

const placed: Record<string, Geometry> = {
  a: { type: "marker", lat: 10, lng: 20 },
  ring: { type: "circle", center: { lat: -5, lng: 7 }, radius: 1000 },
};
const where = { geometryOf: (id: string) => placed[id], size: () => MAP_SIZE };
const move = (view: ResolvedView) => cameraMove(view, where);

describe("cameraMove", () => {
  it("jumps to a centre and zoom", () => {
    expect(move({ kind: "center", center: { lat: 1, lng: 2 }, zoom: 4 })).toEqual({
      kind: "jump",
      center: { lat: 1, lng: 2 },
      zoom: 4,
    });
  });

  it("pans to a location keeping the zoom, and jumps when given one", () => {
    expect(move({ kind: "location", id: "a", zoom: undefined })).toEqual({
      kind: "pan",
      center: { lat: 10, lng: 20 },
    });
    expect(move({ kind: "location", id: "a", zoom: 9 })).toEqual({
      kind: "jump",
      center: { lat: 10, lng: 20 },
      zoom: 9,
    });
  });

  it("brings a shape to its centre point", () => {
    expect(move({ kind: "location", id: "ring", zoom: undefined })).toEqual({
      kind: "pan",
      center: { lat: -5, lng: 7 },
    });
  });

  it("asks for no move while the location isn't placed", () => {
    expect(move({ kind: "location", id: "later", zoom: 3 })).toBeUndefined();
  });

  it("leaves a box that fits below the cap to the map's own fit", () => {
    const bounds = { south: -20, west: 170, north: 0, east: -170 };
    expect(move({ kind: "fit-bounds", bounds, padding: 40 })).toEqual({
      kind: "fit",
      bounds,
      padding: 40,
    });
  });

  it("centres a box with no size, or metres wide, at the cap", () => {
    const point = { south: 10, west: 20, north: 10, east: 20 };
    expect(move({ kind: "fit-bounds", bounds: point, padding: 40 })).toMatchObject({
      kind: "jump",
      zoom: FIT_MAX_ZOOM,
    });
    const metres = { south: 10, west: 179.9999, north: 10.0001, east: -179.9999 };
    const jump = move({ kind: "fit-bounds", bounds: metres, padding: 40 });
    expect(jump).toMatchObject({ kind: "jump", zoom: FIT_MAX_ZOOM });
    expect(jump && "center" in jump && Math.abs(jump.center.lng)).toBeCloseTo(180);
  });

  it("leaves a fit to a map with no size, as a hidden one, without a NaN", () => {
    const bounds = { south: 10, west: 20, north: 10, east: 20 };
    const hidden = cameraMove(
      { kind: "fit-bounds", bounds, padding: 40 },
      { ...where, size: () => ({ width: 0, height: 0 }) },
    );
    expect(hidden).toEqual({ kind: "fit", bounds, padding: 40 });
  });
});
