import type { Map as MapLibreMap } from "maplibre-gl";
import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import type { LatLng } from "../geometry";
import { adding, ORIGIN, polygonDrawable, presented } from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { sameRole } from "./edit-geometry";
import type { MapLibreState } from "./map-state";
import { editingMarker, expectOneChangeEndingTheEdits } from "./testing/editable-marker";
import { holdDrag, holdTouchDrag } from "./testing/held-drag";
import { mountedMapLibre } from "./testing/mounted";
import { type PagePoint, pagePointOf, pinHeadOf } from "./testing/user-drags";

afterEach(unmountAll);

const CORNER: LatLng = { lat: 1, lng: 1 };
const BACK_OVER_THE_MAP: LatLng = { lat: -1, lng: -1 };
/** Where a drag is held when the browser ends it. */
const HELD_AT: LatLng = { lat: 0.5, lng: 1.5 };

/** An editable polygon on a map at zoom 7 over the origin: its corner `CORNER` is a handle. */
async function editingPolygon() {
  const mounted = await mountedMapLibre();
  await mounted.adapter.apply(adding({ ...polygonDrawable("p"), editable: true }));
  mounted.adapter.setView({ kind: "center", center: ORIGIN, zoom: 7 });
  await mounted.probe.settle();
  return mounted;
}

function cornerHandle(state: MapLibreState) {
  const placed = state.placed.get("p");
  if (placed === undefined || placed.geometryType === "marker") throw new Error("no shape p");
  const handle = placed
    .editHandles()
    .find(({ role }) => sameRole(role, { kind: "vertex", ring: 0, index: 2 }));
  if (handle === undefined) throw new Error("no corner handle");
  return handle.marker;
}

/** 100 px right of the map, level with `from`: off the map, in the test's frame. */
function rightOfTheMap(map: MapLibreMap, from: PagePoint): PagePoint {
  return { x: map.getContainer().getBoundingClientRect().right + 100, y: from.y };
}

describe("a MapLibre drag let go outside the map", () => {
  it("ends a handle's drag let go outside the map there, reporting its change once", async () => {
    const { map, host, state } = await editingPolygon();
    const from = pagePointOf(map, CORNER);
    await commands.pressMouse([from, rightOfTheMap(map, from)]);
    expectOneChangeEndingTheEdits(host);
    const handle = cornerHandle(state);
    const left = handle.getLngLat();
    const edits = host.reportsOf("reportLocationEdit").length;
    await commands.moveMouse(pagePointOf(map, BACK_OVER_THE_MAP));
    expect(handle.getLngLat()).toEqual(left);
    expect(host.reportsOf("reportLocationEdit")).toHaveLength(edits);
  });

  it("ends an editable marker's drag let go outside the map there, reporting its change once", async () => {
    const { map, host, marker } = await editingMarker();
    const from = pinHeadOf(marker.getElement().firstElementChild as Element);
    await commands.pressMouse([from, rightOfTheMap(map, from)]);
    expectOneChangeEndingTheEdits(host);
    const left = marker.getLngLat();
    await commands.moveMouse(pagePointOf(map, BACK_OVER_THE_MAP));
    expect(marker.getLngLat()).toEqual(left);
  });
});

describe("a MapLibre drag held when the window loses focus", () => {
  const loseFocus = () => window.dispatchEvent(new Event("blur"));

  it("ends a handle's drag held when the window loses focus, there, reporting its change once", async () => {
    const { map, host, state } = await editingPolygon();
    const handle = cornerHandle(state);
    const drag = holdDrag(map, handle.getElement(), HELD_AT);
    loseFocus();
    expectOneChangeEndingTheEdits(host);
    const left = handle.getLngLat();
    drag.moveTo(BACK_OVER_THE_MAP);
    expect(handle.getLngLat()).toEqual(left);
  });

  it("ends an editable marker's drag held when the window loses focus, there, reporting its change once", async () => {
    const { map, host, marker } = await editingMarker();
    const drag = holdDrag(map, marker.getElement(), HELD_AT);
    loseFocus();
    expectOneChangeEndingTheEdits(host);
    const left = marker.getLngLat();
    drag.moveTo(BACK_OVER_THE_MAP);
    expect(marker.getLngLat()).toEqual(left);
  });
});

describe("a MapLibre touch drag the browser cancels", () => {
  it("ends a handle's touch drag the browser cancels, there, reporting its change once", async () => {
    const { map, host, state } = await editingPolygon();
    const handle = cornerHandle(state);
    const touch = holdTouchDrag(map, handle.getElement(), HELD_AT);
    touch.cancel();
    expectOneChangeEndingTheEdits(host);
    const left = handle.getLngLat();
    touch.moveTo(BACK_OVER_THE_MAP);
    expect(handle.getLngLat()).toEqual(left);
  });

  it("ends an editable marker's touch drag the browser cancels, then applies a hide that waited for it", async () => {
    const { map, host, marker, adapter } = await editingMarker();
    const touch = holdTouchDrag(map, marker.getElement(), HELD_AT);
    adapter.present(presented({ hiddenIds: new Set(["a"]) }));
    expect(marker.getElement().isConnected).toBe(true);
    touch.cancel();
    expectOneChangeEndingTheEdits(host);
    expect(marker.getElement().isConnected).toBe(false);
  });
});
