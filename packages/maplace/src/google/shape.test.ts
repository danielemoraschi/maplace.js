// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import type { Drawable } from "../drawable";
import {
  circleDrawable,
  holeCornerMoved,
  MOVED_HOLE_CORNER,
  ORIGIN,
  polygonDrawable,
  polylineDrawable,
  reshaped,
} from "../testing/conformance/fixtures";
import { SHAPE_PLACERS } from "./shape";
import type { ShapeType } from "./shape-kinds";
import type { StubCircle, StubPolygon, StubPolyline } from "./testing/stub-shapes";
import { stubSite } from "./testing/stub-site";

/** `drawable` placed on a stub map, with the stub shape it drew as `S`. */
function placed<S = StubPolygon>(drawable: Drawable) {
  const { site, host } = stubSite();
  const shape = SHAPE_PLACERS[drawable.geometry.type as ShapeType](drawable, site);
  return { placed: shape, stub: shape.shape as unknown as S, site, host };
}

describe("shape placers", () => {
  it("put a clickable shape on the map, styled, stacked, and shown as the presentation says", () => {
    const { stub, site } = placed(polygonDrawable("p", { style: { stroke: "red" } }));
    expect(stub.getMap()).toBe(site.mounted.map);
    expect(stub.get("clickable")).toBe(true);
    expect(stub.get("editable")).toBe(false);
    expect(stub.get("visible")).toBe(true);
    expect(stub.get("strokeColor")).toBe("red");
    expect(stub.get("zIndex")).toEqual(expect.any(Number));
  });

  it("draw each type's geometry, holes included", () => {
    const polygon = placed(polygonDrawable("p")).stub;
    expect(
      polygon
        .getPaths()
        .getArray()
        .map((ring) => ring.getLength()),
    ).toEqual([4, 4]);
    expect(placed<StubPolyline>(polylineDrawable("l")).stub.getPath().getLength()).toBe(2);
    const circle = placed<StubCircle>(circleDrawable("c")).stub;
    expect([circle.getCenter()?.toJSON(), circle.getRadius()]).toEqual([ORIGIN, 1000]);
  });

  it("redo only what an update gives a new reference", () => {
    const first = polygonDrawable("p", { style: { stroke: "red" } });
    const { placed: p, stub } = placed(first);
    const setPaths = vi.spyOn(stub, "setPaths");
    const setValues = vi.spyOn(stub, "setValues");
    p.update({ ...first, title: "P" });
    expect(setPaths).not.toHaveBeenCalled();
    expect(setValues).not.toHaveBeenCalled();
    p.update({ ...first, style: { stroke: "blue" }, editable: true });
    expect(stub.get("strokeColor")).toBe("blue");
    expect(stub.get("editable")).toBe(true);
    expect(setPaths).not.toHaveBeenCalled();
  });

  it("report a user's edit once, as the location's new geometry", () => {
    const { stub, host } = placed(polygonDrawable("p", { editable: true }));
    stub.getPaths().getArray()[1]?.setAt(2, MOVED_HOLE_CORNER);
    expect(host.reportsOf("reportChange")).toMatchObject([
      ["p", { type: "polygon", holes: [[{}, {}, MOVED_HOLE_CORNER, {}]] }],
    ]);
  });

  it("report a point added by a midpoint drag (0.2 #164)", () => {
    const { stub, host } = placed<StubPolyline>(polylineDrawable("l", { editable: true }));
    stub.getPath().insertAt(1, { lat: 0.5, lng: 0 });
    expect(host.reportsOf("reportChange")).toEqual([
      ["l", { type: "polyline", path: [ORIGIN, { lat: 0.5, lng: 0 }, { lat: 1, lng: 1 }] }],
    ]);
  });

  it("take the store's write-back of an edit without redrawing, and still report the next edit (0.2 #64)", () => {
    const drawable = polygonDrawable("p", { editable: true });
    const { placed: p, stub, host } = placed(drawable);
    stub.getPaths().getArray()[1]?.setAt(2, MOVED_HOLE_CORNER);
    const setPaths = vi.spyOn(stub, "setPaths");
    p.update(reshaped(drawable, holeCornerMoved()));
    expect(setPaths).not.toHaveBeenCalled();
    stub.getPaths().getArray()[0]?.setAt(0, { lat: -1.5, lng: -1 });
    expect(host.reportsOf("reportChange")).toHaveLength(2);
  });

  it("report nothing for their own redraws, and the next edit after one", () => {
    const drawable = circleDrawable("c", { editable: true });
    const { placed: c, stub, host } = placed<StubCircle>(drawable);
    c.update(reshaped(drawable, { type: "circle", center: ORIGIN, radius: 5 }));
    expect(host.reportsOf("reportChange")).toEqual([]);
    stub.setRadius(7);
    expect(host.reportsOf("reportChange")).toEqual([
      ["c", { type: "circle", center: ORIGIN, radius: 7 }],
    ]);
  });

  it("report clicks and the pointer while the map is live", () => {
    const { stub, host } = placed(polygonDrawable("p"));
    stub.trigger("click");
    stub.trigger("mouseover");
    stub.trigger("mouseout");
    expect(host.reportsOf("reportSelect")).toEqual([["p"]]);
    expect(host.reportsOf("reportHover")).toEqual([["p"], [undefined]]);
  });

  it("restack on a state change, hide, and leave the map on remove, unhovered", () => {
    const { placed: p, stub, host } = placed(polygonDrawable("p"));
    const plain = stub.get("zIndex") as number;
    stub.trigger("mouseover");
    p.present({ state: { selected: true, hovered: false }, visible: true });
    expect(stub.get("zIndex")).toBeGreaterThan(plain);
    p.present({ state: { selected: true, hovered: false }, visible: false });
    expect(stub.get("visible")).toBe(false);
    p.remove();
    expect(stub.getMap()).toBeNull();
    expect(host.reportsOf("reportHover")).toEqual([["p"], [undefined]]);
  });
});
