/// <reference types="google.maps" />
import { afterEach, expect, it } from "vitest";
import type { Geometry, LatLng, MarkerGeometry, PolygonGeometry } from "../geometry";
import {
  markerDrawable,
  polygonDrawable,
  reshaped,
  updating,
} from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import type { ViewportPoint } from "../testing/mouse-commands";
import { holdTouchAt } from "../testing/touch";
import {
  CUT_CORNER,
  changesOf,
  controlDrag,
  dragReportsOf,
  expectMarkerAt,
  handleLeg,
  holdHandleDrag,
  holdMarkerDrag,
  mountedAround,
  polygonOn,
  storeLastChange,
} from "./testing/held-drags";
import { inputOn } from "./testing/map-input";
import { drawnMarker, QUIET_MS, wait } from "./testing/map-waits";
import { steadyPoint } from "./testing/page-input";
import { pointerTakenByHandle } from "./testing/shape-pointer";
import { shapeTarget } from "./testing/shape-target";
import { describeWithMaps } from "./testing/with-maps";

const A_AT: LatLng = { lat: 2, lng: -3 };
const T_AT: LatLng = { lat: 2, lng: 3 };
/** How long a finger rests before it moves, and how it moves after: the probe's touch drag. */
const TOUCH_REST_MS = 300;
const TOUCH_MOVES = 8;
const TOUCH_STEP: ViewportPoint = { x: 5, y: -3 };

const blurWindow = () => window.dispatchEvent(new Event("blur"));

/** Off the polygon fixture, where a finger or the mouse finds only the map. */
const OFF_POLYGON: LatLng = { lat: -1.6, lng: 1.6 };

/** The corner of `geometry`'s outline nearest `near`: where a dragged corner now is. */
function cornerNear(geometry: Geometry, near: LatLng): LatLng {
  const distance = (at: LatLng) => Math.hypot(at.lat - near.lat, at.lng - near.lng);
  const [nearest] = [...(geometry as PolygonGeometry).path].sort(
    (a, b) => distance(a) - distance(b),
  );
  if (nearest === undefined) throw new Error("a polygon with no outline");
  return nearest;
}

describeWithMaps("Google drags the browser ends", () => {
  afterEach(unmountAll);

  it("ends a marker's drag where it was when the window loses focus, its change there and nothing more; and a touch drag the browser ends, the finger never lifted, with one change and nothing after", async () => {
    const a = markerDrawable("a", A_AT, { editable: true });
    const t = markerDrawable("t", T_AT, { editable: true });
    const mounted = await mountedAround(6, a, t);
    const { adapter, state, host } = mounted;

    const drag = await holdMarkerDrag(mounted, "a");
    blurWindow();
    const [, , endedAt] = host.reportsIn("reportLocationEdit").at(-1) as [
      string,
      string,
      MarkerGeometry,
    ];
    expect(changesOf(host, "a")).toEqual([["reportLocationChange", "a", endedAt]]);
    await adapter.apply(updating(reshaped(a, endedAt)));
    const reportedOfA = dragReportsOf(host, "a");
    await drag.moveOn();
    await drag.release();
    await wait(QUIET_MS);
    expect(dragReportsOf(host, "a")).toEqual(reportedOfA);
    expect((await expectMarkerAt(state, "a", endedAt)).gmpDraggable).toBe(true);

    // On the same map, sparing a billed load.
    const markerT = await drawnMarker(state, "t");
    const start = await steadyPoint(() => markerT);
    const finger = await holdTouchAt(start);
    await wait(TOUCH_REST_MS);
    for (let move = 1; move <= TOUCH_MOVES; move++) {
      await finger.moveTo({ x: start.x + move * TOUCH_STEP.x, y: start.y + move * TOUCH_STEP.y });
    }
    await finger.cancel();
    await expect.poll(() => changesOf(host, "t").length).toBe(1);
    const reportedOfT = dragReportsOf(host, "t").length;
    await wait(QUIET_MS);
    expect(changesOf(host, "t")).toHaveLength(1);
    expect(dragReportsOf(host, "t")).toHaveLength(reportedOfT);
  });

  it("cuts short a polygon handle's drag when the window loses focus: nothing reported, the polygon as the store has it, editable again once let go; and a touch drag of it the browser cancels ends, following no pointer, the handle dragged again as before", async () => {
    const p = polygonDrawable("p", { editable: true });
    const mounted = await mountedAround(7, p);
    const { state, host, map } = mounted;
    const stored = await controlDrag(mounted, p);
    const reported = dragReportsOf(host, "p").length;

    const drag = await holdHandleDrag(mounted, "p", CUT_CORNER);
    blurWindow();
    await drag.moveOn();
    await drag.release();
    await wait(QUIET_MS);
    expect(dragReportsOf(host, "p")).toHaveLength(reported);
    const polygon = polygonOn(state, "p");
    expect(shapeTarget(polygon).read().geometry).toEqual(stored.geometry);
    expect(polygon.getEditable()).toBe(true);

    // On the same map, sparing a billed load: touch drags of the corner the blur left.
    const input = await inputOn(map);
    /** A finger on the handle at `from`, rested, moved two legs, and still down. */
    const touchDrag = async (from: LatLng) => {
      await pointerTakenByHandle(input, polygonOn(state, "p"), from);
      await input.pointTo(OFF_POLYGON);
      const finger = await input.touch(from);
      await wait(TOUCH_REST_MS);
      await finger.moveTo(handleLeg(from, 1));
      await finger.moveTo(handleLeg(from, 2));
      return finger;
    };
    const drawn = () => shapeTarget(polygonOn(state, "p")).read().geometry;

    // A finger lifted: one change, so a finger catches a handle on this map.
    const changesBefore = changesOf(host, "p").length;
    await (await touchDrag(CUT_CORNER)).lift();
    await expect.poll(() => changesOf(host, "p").length).toBe(changesBefore + 1);
    const lifted = await storeLastChange(mounted, p);
    const corner = cornerNear(lifted.geometry, handleLeg(CUT_CORNER, 2));

    // A finger the browser cancels: Google ends the drag where it was, with one change, as it
    // does a marker's, and draws the polygon as the store then has it.
    const changesBeforeCancel = changesOf(host, "p").length;
    await (await touchDrag(corner)).cancel();
    await expect.poll(() => changesOf(host, "p").length).toBe(changesBeforeCancel + 1);
    await wait(QUIET_MS);
    expect(changesOf(host, "p")).toHaveLength(changesBeforeCancel + 1);
    const cancelled = await storeLastChange(mounted, p);
    const cornerNow = cornerNear(cancelled.geometry, handleLeg(corner, 2));
    expect(cornerNow.lat).toBeGreaterThan(handleLeg(corner, 1).lat);
    expect(drawn()).toEqual(cancelled.geometry);
    const reportedAfterCancel = dragReportsOf(host, "p").length;
    await input.pointTo(handleLeg(cornerNow, 3));
    await input.pointTo(OFF_POLYGON);
    const elsewhere = await input.touch(OFF_POLYGON);
    await elsewhere.moveTo(handleLeg(OFF_POLYGON, -1));
    await elsewhere.lift();
    await wait(QUIET_MS);
    expect(dragReportsOf(host, "p")).toHaveLength(reportedAfterCancel);
    expect(drawn()).toEqual(cancelled.geometry);

    // The handle drags again, by the mouse, as before.
    const changesAfter = changesOf(host, "p").length;
    const again = await holdHandleDrag(mounted, "p", cornerNow);
    await again.moveOn();
    await again.release();
    await expect.poll(() => changesOf(host, "p").length).toBe(changesAfter + 1);
  });
});
