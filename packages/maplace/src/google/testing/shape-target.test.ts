// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { HOVERED_LOOK, SELECTED_LOOK } from "../../adapter-kit/shape-looks";
import { polygonDrawable } from "../../testing/conformance/fixtures";
import { SHAPE_PLACERS } from "../shape";
import { shapeTarget } from "./shape-target";
import { StubCircle, StubLatLng, StubPolygon, StubPolyline } from "./stub-shapes";
import { stubSite } from "./stub-site";

afterEach(() => vi.unstubAllGlobals());

/** A polygon placed on a stub map, its look `state`, read back by the probe. */
function probedStyle(state: { selected: boolean; hovered: boolean }) {
  vi.stubGlobal("google", {
    maps: { Circle: StubCircle, Polyline: StubPolyline, Polygon: StubPolygon, LatLng: StubLatLng },
  });
  const { site } = stubSite();
  const placed = SHAPE_PLACERS.polygon(polygonDrawable("p", { style: { fill: "red" } }), site);
  placed.present({ state, visible: true });
  return shapeTarget(placed.shape, placed.outlineCopy).read().style;
}

describe("shapeTarget", () => {
  it("reads the look a user sees: the lifted outline's stroke over the shape's own fill", () => {
    expect(probedStyle({ selected: true, hovered: false })).toEqual({
      ...SELECTED_LOOK,
      fill: "red",
    });
    expect(probedStyle({ selected: false, hovered: true })).toEqual({
      ...HOVERED_LOOK,
      fill: "red",
    });
  });
});
