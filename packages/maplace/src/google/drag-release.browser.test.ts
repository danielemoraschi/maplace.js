/// <reference types="google.maps" />
import { afterEach, expect, it } from "vitest";
import type { LatLng, MarkerGeometry } from "../geometry";
import {
  markerDrawable,
  polygonDrawable,
  reshaped,
  updating,
} from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import type { ViewportPoint } from "../testing/mouse-commands";
import {
  CUT_CORNER,
  changesOf,
  controlDrag,
  dragReportsOf,
  expectMarkerAt,
  holdHandleDrag,
  holdMarkerDrag,
  mountedAround,
  polygonOn,
} from "./testing/held-drags";
import { holdTouchAt } from "./testing/held-touch";
import { drawnMarker, QUIET_MS, wait } from "./testing/map-waits";
import { steadyPoint } from "./testing/page-input";
import { shapeTarget } from "./testing/shape-target";
import { describeWithMaps } from "./testing/with-maps";

const A_AT: LatLng = { lat: 2, lng: -3 };
const T_AT: LatLng = { lat: 2, lng: 3 };
/** How long a finger rests before it moves, and how it moves after: the probe's touch drag. */
const TOUCH_REST_MS = 300;
const TOUCH_MOVES = 8;
const TOUCH_STEP: ViewportPoint = { x: 5, y: -3 };

const blurWindow = () => window.dispatchEvent(new Event("blur"));

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

    // On the same map, sparing a billed load, and last: touch emulation stays away from every
    // mouse drag.
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

  it("cuts short a polygon handle's drag when the window loses focus: nothing reported, the polygon as the store has it, editable again once let go", async () => {
    const p = polygonDrawable("p", { editable: true });
    const mounted = await mountedAround(7, p);
    const { state, host, map } = mounted;
    const stored = await controlDrag(mounted, p);
    const reported = dragReportsOf(host, "p").length;

    const drag = await holdHandleDrag(map, CUT_CORNER);
    blurWindow();
    await drag.moveOn();
    await drag.release();
    await wait(QUIET_MS);
    expect(dragReportsOf(host, "p")).toHaveLength(reported);
    const polygon = polygonOn(state, "p");
    expect(shapeTarget(polygon).read().geometry).toEqual(stored.geometry);
    expect(polygon.getEditable()).toBe(true);
  });
});
