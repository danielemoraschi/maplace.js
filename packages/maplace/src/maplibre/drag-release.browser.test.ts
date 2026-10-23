import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import type { Geometry, LatLng } from "../geometry";
import { adding, markerDrawable, ORIGIN, polygonDrawable } from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import type { RecordingHost } from "../testing/conformance/recording-host";
import { sameRole } from "./edit-geometry";
import type { MapLibreState } from "./map-state";
import { mountedMapLibre } from "./testing/mounted";
import { pagePointOf, pinHeadOf } from "./testing/user-drags";

afterEach(unmountAll);

const CORNER: LatLng = { lat: 1, lng: 1 };
const BACK_OVER_THE_MAP: LatLng = { lat: -1, lng: -1 };

/** An editable polygon on a map at zoom 7 over the origin: its corner `CORNER` is a handle. */
async function editingPolygon() {
  const mounted = await mountedMapLibre();
  await mounted.adapter.apply(adding({ ...polygonDrawable("p"), editable: true }));
  mounted.adapter.setView({ kind: "center", center: ORIGIN, zoom: 7 });
  await mounted.probe.settle();
  return mounted;
}

/** An editable marker at the origin, drawn as a draggable pin, on a map zoomed in on it. */
async function editingMarker() {
  const mounted = await mountedMapLibre();
  mounted.adapter.setView({ kind: "center", center: ORIGIN, zoom: 6 });
  await mounted.adapter.apply(adding(markerDrawable("a", ORIGIN, { editable: true })));
  await mounted.probe.settle();
  const placed = mounted.state.placed.get("a");
  const marker = placed?.geometryType === "marker" ? placed.domMarker() : undefined;
  if (marker === undefined) throw new Error("a is no DOM marker");
  return { ...mounted, marker };
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

/** The change reported once, and the last edit where it ended. */
function expectOneChangeEndingTheEdits(host: RecordingHost): void {
  const changes = host.reportsOf("reportLocationChange");
  expect(changes).toHaveLength(1);
  const lastEdit = host.reportsOf("reportLocationEdit").at(-1);
  expect(lastEdit?.[1] as Geometry).toEqual(changes[0]?.[1]);
}

describe("a MapLibre drag let go outside the map", () => {
  it("ends a handle's drag let go outside the map there, reporting its change once", async () => {
    const { map, host, state } = await editingPolygon();
    const from = pagePointOf(map, CORNER);
    const outside = { x: map.getContainer().getBoundingClientRect().right + 100, y: from.y };
    await commands.pressMouse([from, outside]);
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
    const outside = { x: map.getContainer().getBoundingClientRect().right + 100, y: from.y };
    await commands.pressMouse([from, outside]);
    expectOneChangeEndingTheEdits(host);
    const left = marker.getLngLat();
    await commands.moveMouse(pagePointOf(map, BACK_OVER_THE_MAP));
    expect(marker.getLngLat()).toEqual(left);
  });
});
