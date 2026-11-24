// @vitest-environment happy-dom
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { SELECTED_LOOK } from "../adapter-kit/shape-looks";
import type { Drawable } from "../drawable";
import {
  circleDrawable,
  holeCornerMoved,
  MOVED_HOLE_CORNER,
  multipolygonDrawable,
  ORIGIN,
  polygonDrawable,
  polylineDrawable,
  reshaped,
  squareAround,
} from "../testing/conformance/fixtures";
import { mapClicks } from "./map-clicks";
import { SHAPE_PLACERS } from "./shape";
import type { ShapeType } from "./shape-kinds";
import type { StubMap } from "./testing/stub-libraries";
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

  it("draw a multipolygon as one shape of every polygon's rings, not drawn again unchanged", () => {
    const drawable = multipolygonDrawable("mp");
    const shape = placed(drawable);
    expect(
      shape.stub
        .getPaths()
        .getArray()
        .map((ring) => ring.getLength()),
    ).toEqual([4, 4, 4]);
    const shown = shape.stub.getPaths().getArray();
    shape.placed.update({ ...drawable, geometry: structuredClone(drawable.geometry) });
    expect(shape.stub.getPaths().getArray(), "the same geometry isn't drawn again").toBe(shown);
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
    expect(setPaths).not.toHaveBeenCalled();
  });

  it("show an editable shape's handles only while it is hovered or selected, and shown", () => {
    const { placed: p, stub } = placed(polygonDrawable("p", { editable: true }));
    expect(stub.get("editable")).toBe(false);
    p.present({ state: { selected: false, hovered: true }, visible: true });
    expect(stub.get("editable")).toBe(true);
    p.present({ state: { selected: true, hovered: false }, visible: true });
    expect(stub.get("editable")).toBe(true);
    p.present({ state: { selected: true, hovered: false }, visible: false });
    expect(stub.get("editable")).toBe(false);
    p.present({ state: { selected: false, hovered: false }, visible: true });
    expect(stub.get("editable")).toBe(false);
  });

  it("report a user's edit once, as the location's new geometry, its one edit there too", () => {
    const { stub, host } = placed(polygonDrawable("p", { editable: true }));
    stub.getPaths().getArray()[1]?.setAt(2, MOVED_HOLE_CORNER);
    expect(host.reportsOf("reportLocationChange")).toMatchObject([
      ["p", { type: "polygon", holes: [[{}, {}, MOVED_HOLE_CORNER, {}]] }],
    ]);
    expect(host.reportsOf("reportLocationEdit")).toEqual(host.reportsOf("reportLocationChange"));
  });

  it("report a point added by a midpoint drag (0.2 #164)", () => {
    const { stub, host } = placed<StubPolyline>(polylineDrawable("l", { editable: true }));
    stub.getPath().insertAt(1, { lat: 0.5, lng: 0 });
    expect(host.reportsOf("reportLocationChange")).toEqual([
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
    expect(host.reportsOf("reportLocationChange")).toHaveLength(2);
  });

  it("report nothing for their own redraws, and the next edit after one", () => {
    const drawable = circleDrawable("c", { editable: true });
    const { placed: c, stub, host } = placed<StubCircle>(drawable);
    c.update(reshaped(drawable, { type: "circle", center: ORIGIN, radius: 5 }));
    expect(host.reports).toEqual([]);
    stub.setRadius(7);
    expect(host.reportsOf("reportLocationChange")).toEqual([
      ["c", { type: "circle", center: ORIGIN, radius: 7 }],
    ]);
  });

  it("report clicks and the pointer while the map is live", () => {
    const { stub, host } = placed(polygonDrawable("p"));
    stub.trigger("click");
    stub.trigger("mouseover");
    stub.trigger("mouseout");
    expect(host.reportsOf("reportSelectionChange")).toEqual([["p"]]);
    expect(host.reportsOf("reportHoverChange")).toEqual([["p"], [undefined]]);
  });

  it("hover nothing from a touch, letting go of what the pointer hovered", () => {
    const { stub, host } = placed(polygonDrawable("p"));
    stub.trigger("mouseover");
    stub.trigger("mouseover", { domEvent: { pointerType: "touch" } });
    expect(host.reportsOf("reportHoverChange")).toEqual([["p"], [undefined]]);
  });

  it("drop a map click still held when one is clicked", () => {
    vi.useFakeTimers();
    onTestFinished(() => {
      vi.useRealTimers();
    });
    const { stub, site, host } = placed(polygonDrawable("p"));
    mapClicks.open(site.mounted);
    (site.mounted.map as unknown as StubMap).trigger("click", { latLng: { toJSON: () => ORIGIN } });
    stub.trigger("click");
    vi.runAllTimers();
    expect(host.reportsOf("reportMapClick")).toEqual([]);
    expect(host.reportsOf("reportSelectionChange")).toEqual([["p"]]);
  });

  it("restyle on a state change and on an update, the state's look under the shape's own style", () => {
    const { placed: p, stub } = placed(polygonDrawable("p", { style: { strokeWidth: 1 } }));
    p.present({ state: { selected: true, hovered: false }, visible: true });
    expect(stub.get("strokeWeight")).toBe(1);
    expect(stub.get("fillOpacity")).toBe(SELECTED_LOOK.fillOpacity);
    p.update(polygonDrawable("p", { style: { fill: "blue" } }));
    expect(stub.get("strokeWeight")).toBe(SELECTED_LOOK.strokeWidth);
    expect(stub.get("fillColor")).toBe("blue");
    p.present({ state: { selected: false, hovered: false }, visible: true });
    expect(stub.get("fillOpacity")).toBeUndefined();
  });

  it("restyle a selected shape when only its selected style changes", () => {
    const { placed: p, stub } = placed(polygonDrawable("p", { selectedStyle: { fill: "red" } }));
    p.present({ state: { selected: true, hovered: false }, visible: true });
    expect(stub.get("fillColor")).toBe("red");
    p.update(polygonDrawable("p", { selectedStyle: { fill: "blue" } }));
    expect(stub.get("fillColor")).toBe("blue");
  });

  it("keep their place in the stack on a state change, hide, and leave the map on remove, unhovered", () => {
    const { placed: p, stub, host } = placed(polygonDrawable("p"));
    const plain = stub.get("zIndex") as number;
    stub.trigger("mouseover");
    p.present({ state: { selected: true, hovered: false }, visible: true });
    expect(stub.get("zIndex")).toBe(plain);
    p.present({ state: { selected: true, hovered: false }, visible: false });
    expect(stub.get("visible")).toBe(false);
    p.remove();
    expect(stub.getMap()).toBeNull();
    expect(host.reportsOf("reportHoverChange")).toEqual([["p"], [undefined]]);
  });

  it("restack behind smaller shapes once reshaped larger", () => {
    const drawable = polygonDrawable("p");
    const { placed: p, stub } = placed(drawable);
    const before = stub.get("zIndex") as number;
    const larger = [
      { lat: -5, lng: -5 },
      { lat: -5, lng: 5 },
      { lat: 5, lng: 5 },
      { lat: 5, lng: -5 },
    ];
    p.update(reshaped(drawable, { type: "polygon", path: larger }));
    expect(stub.get("zIndex")).toBeLessThan(before);
  });

  it("draw a hovered or selected shape's outline again above every shape, unfilled and not clickable", () => {
    const style = { stroke: "red", strokeWidth: 3, fillOpacity: 0.7 };
    const { placed: p, stub, site } = placed(polygonDrawable("p", { style }));
    const map = site.mounted.map as unknown as StubMap;
    const outlines = () => [...map.shapes].filter((shape) => shape !== stub) as StubPolygon[];
    expect(outlines()).toEqual([]);
    p.present({ state: { selected: false, hovered: true }, visible: true });
    const [outline] = outlines();
    expect(outline?.get("zIndex")).toBeGreaterThan(stub.get("zIndex") as number);
    expect([outline?.get("strokeColor"), outline?.get("strokeWeight")]).toEqual(["red", 3]);
    expect([outline?.get("fillOpacity"), outline?.get("clickable")]).toEqual([0, false]);
    expect(outline?.getPaths().getArray()).toHaveLength(2);
    expect([stub.get("strokeOpacity"), stub.get("strokeWeight")]).toEqual([0, 3]);
    p.present({ state: { selected: false, hovered: false }, visible: true });
    expect(outlines()).toEqual([]);
    expect(stub.get("strokeOpacity")).toBeUndefined();
  });

  it("lift no outline of an editable or hidden shape, and none once taken off", () => {
    const { placed: p, stub, site } = placed(polygonDrawable("p", { editable: true }));
    const map = site.mounted.map as unknown as StubMap;
    const others = () => [...map.shapes].filter((shape) => shape !== stub);
    p.present({ state: { selected: true, hovered: false }, visible: true });
    expect(others()).toEqual([]);
    p.update(polygonDrawable("p"));
    expect(others()).toHaveLength(1);
    p.present({ state: { selected: true, hovered: false }, visible: false });
    expect(others()).toEqual([]);
    p.present({ state: { selected: true, hovered: false }, visible: true });
    p.remove();
    expect([...map.shapes]).toEqual([]);
  });

  it("give a shape its own stroke back once its outline is no longer lifted", () => {
    const style = { strokeOpacity: 0.5 };
    const { placed: p, stub } = placed(polygonDrawable("p", { style }));
    p.present({ state: { selected: true, hovered: false }, visible: true });
    expect(stub.get("strokeOpacity")).toBe(0);
    p.update(polygonDrawable("p", { editable: true, style }));
    expect(stub.get("strokeOpacity")).toBe(0.5);
  });

  it("keep a lifted outline in step with its shape's new geometry and style", () => {
    const drawable = polygonDrawable("p");
    const { placed: p, stub, site } = placed(drawable);
    const map = site.mounted.map as unknown as StubMap;
    const outline = () => [...map.shapes].find((shape) => shape !== stub) as StubPolygon;
    p.present({ state: { selected: true, hovered: false }, visible: true });
    const square = { type: "polygon", path: squareAround(ORIGIN, 1) } as const;
    p.update({ ...reshaped(drawable, square), style: { stroke: "blue" } });
    expect(outline().getPaths().getArray()).toHaveLength(1);
    expect(outline().get("strokeColor")).toBe("blue");
  });
});
