// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { Geometry } from "../geometry";
import {
  circleDrawable,
  holeCornerMoved,
  MOVED_HOLE_CORNER,
  ORIGIN,
  polygonDrawable,
  squareAround,
} from "../testing/conformance/fixtures";
import { drag, editingOnStub, handleWith, hold } from "./testing/recording-marker";

const POLYGON = polygonDrawable("p").geometry;
const CIRCLE = circleDrawable("c").geometry;

const holeCorner = { kind: "vertex", ring: 1, index: 2 };

/** POLYGON with one more outline point: handles of other roles than POLYGON's. */
const WITH_ONE_MORE_POINT: Geometry = {
  type: "polygon",
  path: [...squareAround(ORIGIN, 2), { lat: 1.5, lng: 0 }],
  holes: [squareAround(ORIGIN, 1)],
};

describe("a shape's editing session", () => {
  it("places a handle on every point and midpoint of an editable polygon", () => {
    const { markers } = editingOnStub(POLYGON);
    expect(markers()).toHaveLength(16);
    expect(markers().every((marker) => marker.element.getAttribute("aria-hidden") === "true")).toBe(
      true,
    );
  });

  it("reports each drag as an edit and the drop as the change, the change last", () => {
    const { session, host } = editingOnStub(POLYGON);
    drag(handleWith(session.handles(), holeCorner), { lat: 0.55, lng: 0.55 }, MOVED_HOLE_CORNER);
    expect(host.reportsIn("reportLocationEdit", "reportLocationChange").slice(-2)).toEqual([
      ["reportLocationEdit", "s", holeCornerMoved()],
      ["reportLocationChange", "s", holeCornerMoved()],
    ]);
    expect(host.reportsOf("reportLocationEdit")).toHaveLength(2);
  });

  it("reports nothing for a drag that leaves the shape as it was", () => {
    const { session, host } = editingOnStub(POLYGON);
    drag(handleWith(session.handles(), holeCorner), { lat: 0.5, lng: 0.5 });
    expect(host.reportsIn("reportLocationEdit", "reportLocationChange")).toEqual([]);
  });

  it("shows a drag back to where it started live, and reports no change on its drop", () => {
    const { session, host, drawn } = editingOnStub(POLYGON);
    drag(handleWith(session.handles(), holeCorner), MOVED_HOLE_CORNER, { lat: 0.5, lng: 0.5 });
    expect(host.reportsOf("reportLocationEdit")).toEqual([
      ["s", holeCornerMoved()],
      ["s", POLYGON],
    ]);
    expect(host.reportsOf("reportLocationChange")).toEqual([]);
    expect(drawn.at(-1)).toEqual(POLYGON);
  });

  it("reports a drag's edits after an earlier drag that changed nothing, with the store's geometry since", () => {
    const { session, host } = editingOnStub(POLYGON);
    drag(handleWith(session.handles(), holeCorner), MOVED_HOLE_CORNER, { lat: 0.5, lng: 0.5 });
    const before = host.reportsIn("reportLocationEdit", "reportLocationChange").length;
    session.follow(holeCornerMoved());
    drag(handleWith(session.handles(), holeCorner), { lat: 0.5, lng: 0.5 });
    expect(host.reportsIn("reportLocationEdit", "reportLocationChange").slice(before)).toEqual([
      ["reportLocationEdit", "s", POLYGON],
      ["reportLocationChange", "s", POLYGON],
    ]);
  });

  it("moves the circle's radius handles with its centre while it is dragged", () => {
    const { session, markers } = editingOnStub(CIRCLE);
    hold(handleWith(session.handles(), { kind: "center" }), { lat: 1, lng: 1 });
    const north = handleWith(session.handles(), { kind: "radius", bearing: 0 });
    expect(north.lngLat.lng).toBeCloseTo(1, 6);
    expect(north.lngLat.lat).toBeGreaterThan(1);
    expect(markers()).toHaveLength(5);
  });

  it("reports a circle the store takes when a radius handle is dropped on its centre", () => {
    const { session, host } = editingOnStub(CIRCLE);
    drag(handleWith(session.handles(), { kind: "radius", bearing: 90 }), ORIGIN);
    expect(host.reportsOf("reportLocationChange")).toEqual([["s", { ...CIRCLE, radius: 0.001 }]]);
  });

  it("puts a new point's handles in once a midpoint is dropped", () => {
    const { session, markers } = editingOnStub(POLYGON);
    const before = markers();
    drag(handleWith(session.handles(), { kind: "midpoint", ring: 0, index: 0 }), {
      lat: -1.5,
      lng: 0,
    });
    expect(before.every((marker) => marker.removed)).toBe(true);
    expect(markers()).toHaveLength(18);
  });

  it("shows the store's write-back of an edit without moving a handle", () => {
    const { session, markers } = editingOnStub(POLYGON);
    drag(handleWith(session.handles(), holeCorner), MOVED_HOLE_CORNER);
    const after = markers();
    const moves = after.map((marker) => marker.moves);
    session.follow(structuredClone(holeCornerMoved()));
    expect(markers()).toEqual(after);
    expect(after.map((marker) => marker.moves)).toEqual(moves);
    expect(after.some((marker) => marker.removed)).toBe(false);
  });

  it("moves the handles to a geometry the store sends anew", () => {
    const { session, markers } = editingOnStub(POLYGON);
    const before = markers();
    session.follow(holeCornerMoved());
    expect(markers()).toEqual(before);
    expect(handleWith(session.handles(), holeCorner).lngLat).toEqual(MOVED_HOLE_CORNER);
  });

  it("draws the shape as it was when stopped in the middle of a drag", () => {
    const { session, drawn } = editingOnStub(POLYGON);
    hold(handleWith(session.handles(), holeCorner), MOVED_HOLE_CORNER);
    session.stop();
    expect(drawn.at(-1)).toEqual(POLYGON);
  });

  it("ends a drag whose handles the store replaces with others", () => {
    const { session } = editingOnStub(POLYGON);
    hold(handleWith(session.handles(), holeCorner), MOVED_HOLE_CORNER);
    session.follow(WITH_ONE_MORE_POINT);
    expect(session.isDragging()).toBe(false);
  });

  it("reports nothing for a step that leaves the shape as it was, after a drag cut short by new handles", () => {
    const { session, host } = editingOnStub(POLYGON);
    hold(handleWith(session.handles(), holeCorner), MOVED_HOLE_CORNER);
    session.follow(WITH_ONE_MORE_POINT);
    hold(handleWith(session.handles(), holeCorner), { lat: 0.5, lng: 0.5 });
    expect(host.reportsOf("reportLocationEdit")).toHaveLength(1);
  });

  // A page's listener runs inside the report: one destroying the map stops the editing there.
  it("leaves no handle on the map when stopped by the change's listener", () => {
    const { session, host, markers } = editingOnStub(POLYGON);
    const before = markers();
    host.reportLocationChange = () => session.stop();
    drag(handleWith(session.handles(), holeCorner), MOVED_HOLE_CORNER);
    expect(session.handles()).toEqual([]);
    expect(before.every((marker) => marker.removed)).toBe(true);
  });

  it("leaves no handle on the map when stopped by an edit's listener", () => {
    const { session, host } = editingOnStub(POLYGON);
    host.reportLocationEdit = () => session.stop();
    hold(handleWith(session.handles(), holeCorner), MOVED_HOLE_CORNER);
    expect(session.handles()).toEqual([]);
  });

  it("takes every handle off when stopped", () => {
    const { session, markers } = editingOnStub(CIRCLE);
    const before = markers();
    session.stop();
    expect(before.every((marker) => marker.removed)).toBe(true);
    expect(session.handles()).toEqual([]);
  });

  it("reports nothing once the map has closed", () => {
    const { session, host, closed } = editingOnStub(POLYGON);
    closed.value = true;
    drag(handleWith(session.handles(), holeCorner), MOVED_HOLE_CORNER);
    expect(host.reports).toEqual([]);
  });

  it("hovers the shape while the pointer is on one of its handles", () => {
    const { markers, host } = editingOnStub(CIRCLE);
    const [handle] = markers();
    handle?.element.dispatchEvent(new PointerEvent("pointerenter"));
    handle?.element.dispatchEvent(new PointerEvent("pointerleave"));
    expect(host.reportsOf("reportHoverChange")).toEqual([["s"], [undefined]]);
  });

  it("lets the shape's hover go when the handle under the pointer is taken off", () => {
    const { session, markers, host } = editingOnStub(CIRCLE);
    markers()[0]?.element.dispatchEvent(new PointerEvent("pointerenter"));
    session.stop();
    expect(host.reportsOf("reportHoverChange")).toEqual([["s"], [undefined]]);
  });

  it("keeps another location's hover when a handle the pointer left is taken off", () => {
    const { session, markers, host, hover } = editingOnStub(CIRCLE);
    const [handle] = markers();
    handle?.element.dispatchEvent(new PointerEvent("pointerenter"));
    handle?.element.dispatchEvent(new PointerEvent("pointerleave"));
    hover.enter("pointer", "other");
    session.stop();
    expect(host.reportsOf("reportHoverChange")).toEqual([["s"], [undefined], ["other"]]);
  });

  it("gives the shape each edit to draw", () => {
    const { session, drawn } = editingOnStub(POLYGON);
    drag(handleWith(session.handles(), holeCorner), { lat: 0.55, lng: 0.55 }, MOVED_HOLE_CORNER);
    expect(drawn).toHaveLength(3);
    expect(drawn.at(-1)).toEqual(holeCornerMoved());
  });
});
