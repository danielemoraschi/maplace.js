/// <reference types="google.maps" />
import { afterEach, expect, it } from "vitest";
import type { LatLng } from "../geometry";
import {
  markerDrawable,
  polygonDrawable,
  removing,
  updating,
} from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import {
  CUT_CORNER,
  controlDrag,
  dragReportsOf,
  expectMarkerAt,
  holdHandleDrag,
  holdMarkerDrag,
  mountedAround,
  polygonOn,
} from "./testing/held-drags";
import { QUIET_MS, wait } from "./testing/map-waits";
import { shapeTarget } from "./testing/shape-target";
import { describeWithMaps } from "./testing/with-maps";

const A_AT: LatLng = { lat: 2, lng: -3 };
const B_AT: LatLng = { lat: 2, lng: 3 };
describeWithMaps("Google drags the page ends", () => {
  afterEach(unmountAll);

  it("cuts short a marker's drag when the page turns its `editable` off or removes it: nothing reported after, the marker where the store has it", async () => {
    const a = markerDrawable("a", A_AT, { editable: true });
    const b = markerDrawable("b", B_AT, { editable: true });
    const mounted = await mountedAround(6, a, b);
    const { adapter, state, host } = mounted;

    const dragA = await holdMarkerDrag(mounted, "a");
    await adapter.apply(updating({ ...a, editable: false }));
    const reportedOfA = dragReportsOf(host, "a");
    await dragA.moveOn();
    await dragA.release();
    await wait(QUIET_MS);
    expect(dragReportsOf(host, "a")).toEqual(reportedOfA);
    expect(host.reportsOf("reportLocationChange")).toEqual([]);
    expect((await expectMarkerAt(state, "a", A_AT)).gmpDraggable).toBe(false);

    const dragB = await holdMarkerDrag(mounted, "b");
    await adapter.apply(removing("b"));
    const reportedOfB = dragReportsOf(host, "b").length;
    await dragB.moveOn();
    await dragB.release();
    await wait(QUIET_MS);
    expect(dragReportsOf(host, "b").length).toBe(reportedOfB);
  });

  it("cuts short a polygon handle's drag when the page turns its `editable` off or removes it: nothing reported, the polygon as the store has it", async () => {
    const p = polygonDrawable("p", { editable: true });
    const mounted = await mountedAround(7, p);
    const { adapter, state, host } = mounted;
    const stored = await controlDrag(mounted, p);
    const reported = dragReportsOf(host, "p").length;

    const cutByEditable = await holdHandleDrag(mounted, "p", CUT_CORNER);
    await adapter.apply(updating({ ...stored, editable: false }));
    await cutByEditable.moveOn();
    await cutByEditable.release();
    await wait(QUIET_MS);
    expect(dragReportsOf(host, "p").length).toBe(reported);
    expect(shapeTarget(polygonOn(state, "p")).read().geometry).toEqual(stored.geometry);

    await adapter.apply(updating(stored));
    const cutByRemoval = await holdHandleDrag(mounted, "p", CUT_CORNER);
    await adapter.apply(removing("p"));
    await cutByRemoval.moveOn();
    await cutByRemoval.release();
    await wait(QUIET_MS);
    expect(dragReportsOf(host, "p").length).toBe(reported);
  });
});
