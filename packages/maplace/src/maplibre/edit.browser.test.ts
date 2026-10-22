import type { Map as MapLibreMap } from "maplibre-gl";
import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { DOUBLE_CLICK_WAIT_MS } from "../adapter-kit/click-gesture";
import type { Drawable } from "../drawable";
import type { CircleGeometry, Geometry, LatLng } from "../geometry";
import {
  adding,
  circleDrawable,
  ORIGIN,
  polygonDrawable,
  presented,
  squareAround,
  updating,
} from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { pointAtBearing } from "./circle-sphere";
import type { MapLibreState } from "./map-state";
import { wait } from "./testing/map-settle";
import { mountedMapLibre, mountedOnPageMap } from "./testing/mounted";

afterEach(unmountAll);

/** How close a drag lands to where it aimed: a pixel at zoom 7 is about 0.011°, 1.2 km. */
const PIXEL_DEGREES = 0.03;
const PIXEL_METRES = 3000;

const editable = (drawable: Drawable): Drawable => ({ ...drawable, editable: true });

const circleOf = (radius: number, center: LatLng = ORIGIN): CircleGeometry => ({
  type: "circle",
  center,
  radius,
});

/** An editable shape on a map at zoom 7 over the origin, where a user drags its handles. */
async function editing(...drawables: Drawable[]) {
  const mounted = await mountedMapLibre();
  const { map, adapter, probe } = mounted;
  await adapter.apply(adding(...drawables));
  adapter.setView({ kind: "center", center: ORIGIN, zoom: 7 });
  await probe.settle();
  const drag = (from: LatLng, to: LatLng) =>
    commands.pressMouse([onPage(map, from), onPage(map, to)]);
  const handleCount = () => mounted.container.querySelectorAll(".maplace-edit-handle").length;
  return { ...mounted, drag, handleCount };
}

/** Where `at` is drawn on the page. */
function onPage(map: MapLibreMap, at: LatLng) {
  const box = map.getContainer().getBoundingClientRect();
  const { x, y } = map.project([at.lng, at.lat]);
  return { x: box.left + x, y: box.top + y };
}

function expectNear(point: LatLng | undefined, to: LatLng): void {
  expect(Math.abs((point?.lat ?? Number.NaN) - to.lat)).toBeLessThan(PIXEL_DEGREES);
  expect(Math.abs((point?.lng ?? Number.NaN) - to.lng)).toBeLessThan(PIXEL_DEGREES);
}

const changesOf = (host: { reportsOf(kind: "reportLocationChange"): unknown[][] }) =>
  host.reportsOf("reportLocationChange").map(([, geometry]) => geometry as Geometry);

/** Holds the shape's third handle, a corner, moved to `to`: a drag not let go. */
function startDrag(state: MapLibreState, id: string, to: LatLng): void {
  const placed = state.placed.get(id);
  const corner = placed?.geometryType === "marker" ? undefined : placed?.editHandles()[2];
  if (corner === undefined) throw new Error(`${id} has no handles`);
  corner.marker.setLngLat([to.lng, to.lat]);
  corner.marker.fire("dragstart");
  corner.marker.fire("drag");
}

describe("editing shapes on MapLibre", () => {
  it("reports a dragged polygon corner as edits, then once as a change on release", async () => {
    const { host, drag } = await editing(editable(polygonDrawable("p")));
    await drag({ lat: 1, lng: 1 }, { lat: 1.5, lng: 1.5 });
    const [change] = changesOf(host);
    expect(changesOf(host)).toHaveLength(1);
    if (change?.type !== "polygon") throw new Error("the change is the polygon's");
    expectNear(change.path[2], { lat: 1.5, lng: 1.5 });
    const edits = host.reportsOf("reportLocationEdit");
    expect(edits.length).toBeGreaterThan(1);
    expect(edits.at(-1)).toEqual(["p", change]);
  });

  it("inserts a point where a polygon's midpoint handle is dragged", async () => {
    const { host, drag } = await editing(editable(polygonDrawable("p")));
    const corner = { lat: -1.5, lng: 0 };
    await drag({ lat: -1, lng: 0 }, corner);
    const [change] = changesOf(host);
    if (change?.type !== "polygon") throw new Error("the change is the polygon's");
    expect(change.path).toHaveLength(5);
    expectNear(change.path[1], corner);
  });

  it("resizes a circle by its radius handle, the radius reported live", async () => {
    const circle = circleOf(50_000);
    const { host, drag } = await editing(editable(circleDrawable("c", { geometry: circle })));
    const east = (metres: number) => pointAtBearing(ORIGIN, metres, 90);
    await drag(east(50_000), east(80_000));
    const radii = host
      .reportsOf("reportLocationEdit")
      .map(([, at]) => (at as CircleGeometry).radius);
    expect(radii.length).toBeGreaterThan(1);
    expect(radii).toEqual([...radii].sort((a, b) => a - b));
    const [change] = changesOf(host);
    expect(Math.abs((change as CircleGeometry).radius - 80_000)).toBeLessThan(PIXEL_METRES);
  });

  it("moves a circle by its centre handle", async () => {
    const circle = circleOf(50_000);
    const { host, drag } = await editing(editable(circleDrawable("c", { geometry: circle })));
    const to = { lat: 0.5, lng: -0.5 };
    await drag(ORIGIN, to);
    const [change] = changesOf(host);
    expectNear((change as CircleGeometry).center, to);
    expect((change as CircleGeometry).radius).toBe(50_000);
  });

  it("draws the shape where the handle left it", async () => {
    const { host, probe, drag } = await editing(editable(polygonDrawable("p")));
    await drag({ lat: 1, lng: -1 }, { lat: 1.4, lng: -1.4 });
    const [change] = changesOf(host);
    expect(probe.location("p")?.geometry).toEqual(change);
  });

  it("selects nothing, reports no map click and doesn't pan for a handle's drag", async () => {
    const { map, host, drag } = await editing(editable(polygonDrawable("p")));
    const centre = map.getCenter();
    await drag({ lat: 1, lng: 1 }, { lat: 1.5, lng: 1.5 });
    await wait(DOUBLE_CLICK_WAIT_MS * 2);
    expect(host.reportsOf("reportSelectionChange")).toEqual([]);
    expect(host.reportsOf("reportMapClick")).toEqual([]);
    expect(map.getCenter()).toEqual(centre);
  });

  it("restacks a shape grown past another by an edit", async () => {
    const grown = editable(circleDrawable("grown", { geometry: circleOf(30_000) }));
    const other = circleDrawable("other", { geometry: circleOf(50_000) });
    const { probe, drag } = await editing(grown, other);
    expect(probe.stackOrder()).toEqual(["grown", "other"]);
    const east = (metres: number) => pointAtBearing(ORIGIN, metres, 90);
    await drag(east(30_000), east(80_000));
    expect(probe.stackOrder()).toEqual(["other", "grown"]);
  });

  it("takes the handles off when a shape stops being editable or is hidden", async () => {
    const circle = editable(circleDrawable("c"));
    const { adapter, handleCount } = await editing(circle);
    expect(handleCount()).toBe(5);
    await adapter.apply(updating({ ...circle, editable: false }));
    expect(handleCount()).toBe(0);
    await adapter.apply(updating(circle));
    expect(handleCount()).toBe(5);
    adapter.present(presented({ hiddenIds: new Set(["c"]) }));
    expect(handleCount()).toBe(0);
    adapter.present(presented({}));
    expect(handleCount()).toBe(5);
  });

  it("takes the handles off a page's own map when destroyed, the map kept", async () => {
    const { map, adapter, destroy } = await mountedOnPageMap();
    await adapter.apply(adding(editable(circleDrawable("c"))));
    const handles = () => map.getCanvasContainer().querySelectorAll(".maplace-edit-handle");
    expect(handles()).toHaveLength(5);
    destroy();
    expect(handles()).toHaveLength(0);
  });

  it("draws the store's new geometry when it ends the editing in the middle of a drag", async () => {
    const polygon = editable(polygonDrawable("p"));
    const { adapter, probe, state } = await editing(polygon);
    startDrag(state, "p", { lat: 1.5, lng: 1.5 });
    const moved = { type: "polygon", path: squareAround({ lat: 0.5, lng: 0.5 }, 1) } as const;
    await adapter.apply(updating({ ...polygon, geometry: moved, editable: false }));
    expect(probe.location("p")?.geometry).toEqual(moved);
  });

  it("keeps a drag's edit drawn while the store updates the shape's title", async () => {
    const polygon = editable(polygonDrawable("p"));
    const { adapter, probe, state } = await editing(polygon);
    startDrag(state, "p", { lat: 1.5, lng: 1.5 });
    const edited = probe.location("p")?.geometry;
    await adapter.apply(updating({ ...polygon, title: "renamed" }));
    expect(probe.location("p")?.geometry).toEqual(edited);
    expect(edited).not.toEqual(polygon.geometry);
  });

  it("shows no handles on a shape that isn't editable", async () => {
    const { handleCount } = await editing(polygonDrawable("p"), circleDrawable("c"));
    expect(handleCount()).toBe(0);
  });

  it("shows handles on a shape added as editable, with no presentation after it", async () => {
    const { adapter, container } = await mountedMapLibre();
    await adapter.apply(adding(editable(polygonDrawable("p"))));
    expect(container.querySelectorAll(".maplace-edit-handle")).toHaveLength(16);
  });
});
