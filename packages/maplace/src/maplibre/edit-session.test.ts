// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { createHoverReports } from "../adapter-kit/hover-reports";
import type { Geometry, LatLng } from "../geometry";
import {
  circleDrawable,
  holeCornerMoved,
  MOVED_HOLE_CORNER,
  polygonDrawable,
} from "../testing/conformance/fixtures";
import { createRecordingHost } from "../testing/conformance/recording-host";
import type { EditHandle } from "./edit-handles";
import { editShape } from "./edit-session";
import type { MountedMapLibre } from "./mounted-map";

type Listener = () => void;

/** MapLibre's marker as the handles use it, recording what they do to it. */
class StubMarker {
  readonly element: HTMLElement;
  lngLat: LatLng = { lat: Number.NaN, lng: Number.NaN };
  moves = 0;
  removed = false;
  private readonly listeners = new Map<string, Listener[]>();

  constructor({ element }: { element: HTMLElement }) {
    this.element = element;
  }
  setLngLat([lng, lat]: [number, number]) {
    this.lngLat = { lat, lng };
    this.moves += 1;
    return this;
  }
  getLngLat = () => this.lngLat;
  getElement = () => this.element;
  addTo = () => this;
  remove() {
    this.removed = true;
    return this;
  }
  on(type: string, listener: Listener) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
    return this;
  }
  fire(type: string) {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }
}

const POLYGON = polygonDrawable("p").geometry;
const CIRCLE = circleDrawable("c").geometry;

/** A shape's editing on a stub map, with what it reported and drew. */
function editing(geometry: Geometry) {
  const host = createRecordingHost();
  const closed = { value: false };
  const hover = createHoverReports(() => (closed.value ? undefined : host));
  const container = document.createElement("div");
  const mounted = {
    map: { getContainer: () => container },
    maplibre: { Marker: StubMarker },
    live: () => (closed.value ? undefined : host),
  } as unknown as MountedMapLibre;
  const drawn: Geometry[] = [];
  const session = editShape(geometry, {
    mounted,
    id: "s",
    hover,
    onEdit: (edited) => drawn.push(edited),
  });
  const markers = () => session.handles().map(markerOf);
  return { session, host, hover, drawn, closed, markers };
}

const markerOf = (handle: EditHandle) => handle.marker as unknown as StubMarker;

/** The handle with `role`'s fields. */
function handleWith(handles: readonly EditHandle[], role: object): StubMarker {
  const found = handles.find((handle) =>
    Object.entries(role).every(
      ([key, value]) => handle.role[key as keyof typeof handle.role] === value,
    ),
  );
  if (found === undefined) throw new Error(`no handle ${JSON.stringify(role)}`);
  return markerOf(found);
}

/** Drags `marker` to `to` and holds it there, not let go. */
function hold(marker: StubMarker, to: LatLng): void {
  marker.fire("dragstart");
  marker.setLngLat([to.lng, to.lat]);
  marker.fire("drag");
}

/** Drags `marker` through `points`, a `drag` at each, and lets go at the last. */
function drag(marker: StubMarker, ...points: LatLng[]): void {
  marker.fire("dragstart");
  for (const { lat, lng } of points) {
    marker.setLngLat([lng, lat]);
    marker.fire("drag");
  }
  marker.fire("dragend");
}

const holeCorner = { kind: "vertex", ring: 1, index: 2 };

describe("a shape's editing session", () => {
  it("places a handle on every point and midpoint of an editable polygon", () => {
    const { markers } = editing(POLYGON);
    expect(markers()).toHaveLength(16);
    expect(markers().every((marker) => marker.element.getAttribute("aria-hidden") === "true")).toBe(
      true,
    );
  });

  it("reports each drag as an edit and the drop as the change, the change last", () => {
    const { session, host } = editing(POLYGON);
    drag(handleWith(session.handles(), holeCorner), { lat: 0.55, lng: 0.55 }, MOVED_HOLE_CORNER);
    expect(host.reportsIn("reportLocationEdit", "reportLocationChange").slice(-2)).toEqual([
      ["reportLocationEdit", "s", holeCornerMoved()],
      ["reportLocationChange", "s", holeCornerMoved()],
    ]);
    expect(host.reportsOf("reportLocationEdit")).toHaveLength(2);
  });

  it("reports nothing for a drag that leaves the shape as it was", () => {
    const { session, host } = editing(POLYGON);
    drag(handleWith(session.handles(), holeCorner), { lat: 0.5, lng: 0.5 });
    expect(host.reportsIn("reportLocationEdit", "reportLocationChange")).toEqual([]);
  });

  it("shows a drag back to where it started live, and reports no change on its drop", () => {
    const { session, host, drawn } = editing(POLYGON);
    drag(handleWith(session.handles(), holeCorner), MOVED_HOLE_CORNER, { lat: 0.5, lng: 0.5 });
    expect(host.reportsOf("reportLocationEdit")).toEqual([
      ["s", holeCornerMoved()],
      ["s", POLYGON],
    ]);
    expect(host.reportsOf("reportLocationChange")).toEqual([]);
    expect(drawn.at(-1)).toEqual(POLYGON);
  });

  it("moves the circle's radius handles with its centre while it is dragged", () => {
    const { session, markers } = editing(CIRCLE);
    hold(handleWith(session.handles(), { kind: "center" }), { lat: 1, lng: 1 });
    const north = handleWith(session.handles(), { kind: "radius", bearing: 0 });
    expect(north.lngLat.lng).toBeCloseTo(1, 6);
    expect(north.lngLat.lat).toBeGreaterThan(1);
    expect(markers()).toHaveLength(5);
  });

  it("puts a new point's handles in once a midpoint is dropped", () => {
    const { session, markers } = editing(POLYGON);
    const before = markers();
    drag(handleWith(session.handles(), { kind: "midpoint", ring: 0, index: 0 }), {
      lat: -1.5,
      lng: 0,
    });
    expect(before.every((marker) => marker.removed)).toBe(true);
    expect(markers()).toHaveLength(18);
  });

  it("shows the store's write-back of an edit without moving a handle", () => {
    const { session, markers } = editing(POLYGON);
    drag(handleWith(session.handles(), holeCorner), MOVED_HOLE_CORNER);
    const after = markers();
    const moves = after.map((marker) => marker.moves);
    session.follow(structuredClone(holeCornerMoved()));
    expect(markers()).toEqual(after);
    expect(after.map((marker) => marker.moves)).toEqual(moves);
    expect(after.some((marker) => marker.removed)).toBe(false);
  });

  it("moves the handles to a geometry the store sends anew", () => {
    const { session, markers } = editing(POLYGON);
    const before = markers();
    session.follow(holeCornerMoved());
    expect(markers()).toEqual(before);
    expect(handleWith(session.handles(), holeCorner).lngLat).toEqual(MOVED_HOLE_CORNER);
  });

  it("draws the shape as it was when stopped in the middle of a drag", () => {
    const { session, drawn } = editing(POLYGON);
    hold(handleWith(session.handles(), holeCorner), MOVED_HOLE_CORNER);
    session.stop();
    expect(drawn.at(-1)).toEqual(POLYGON);
  });

  // A page's listener runs inside the report: one destroying the map stops the editing there.
  it("leaves no handle on the map when stopped by the change's listener", () => {
    const { session, host, markers } = editing(POLYGON);
    const before = markers();
    host.reportLocationChange = () => session.stop();
    drag(handleWith(session.handles(), holeCorner), MOVED_HOLE_CORNER);
    expect(session.handles()).toEqual([]);
    expect(before.every((marker) => marker.removed)).toBe(true);
  });

  it("leaves no handle on the map when stopped by an edit's listener", () => {
    const { session, host } = editing(POLYGON);
    host.reportLocationEdit = () => session.stop();
    hold(handleWith(session.handles(), holeCorner), MOVED_HOLE_CORNER);
    expect(session.handles()).toEqual([]);
  });

  it("takes every handle off when stopped", () => {
    const { session, markers } = editing(CIRCLE);
    const before = markers();
    session.stop();
    expect(before.every((marker) => marker.removed)).toBe(true);
    expect(session.handles()).toEqual([]);
  });

  it("reports nothing once the map has closed", () => {
    const { session, host, closed } = editing(POLYGON);
    closed.value = true;
    drag(handleWith(session.handles(), holeCorner), MOVED_HOLE_CORNER);
    expect(host.reports).toEqual([]);
  });

  it("hovers the shape while the pointer is on one of its handles", () => {
    const { markers, host } = editing(CIRCLE);
    const [handle] = markers();
    handle?.element.dispatchEvent(new PointerEvent("pointerenter"));
    handle?.element.dispatchEvent(new PointerEvent("pointerleave"));
    expect(host.reportsOf("reportHoverChange")).toEqual([["s"], [undefined]]);
  });

  it("lets the shape's hover go when the handle under the pointer is taken off", () => {
    const { session, markers, host } = editing(CIRCLE);
    markers()[0]?.element.dispatchEvent(new PointerEvent("pointerenter"));
    session.stop();
    expect(host.reportsOf("reportHoverChange")).toEqual([["s"], [undefined]]);
  });

  it("keeps another location's hover when a handle the pointer left is taken off", () => {
    const { session, markers, host, hover } = editing(CIRCLE);
    const [handle] = markers();
    handle?.element.dispatchEvent(new PointerEvent("pointerenter"));
    handle?.element.dispatchEvent(new PointerEvent("pointerleave"));
    hover.enter("pointer", "other");
    session.stop();
    expect(host.reportsOf("reportHoverChange")).toEqual([["s"], [undefined], ["other"]]);
  });

  it("gives the shape each edit to draw", () => {
    const { session, drawn } = editing(POLYGON);
    drag(handleWith(session.handles(), holeCorner), { lat: 0.55, lng: 0.55 }, MOVED_HOLE_CORNER);
    expect(drawn).toHaveLength(3);
    expect(drawn.at(-1)).toEqual(holeCornerMoved());
  });
});
