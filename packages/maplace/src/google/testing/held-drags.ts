/// <reference types="google.maps" />
import { expect } from "vitest";
import type { Drawable } from "../../drawable";
import type { Geometry, LatLng } from "../../geometry";
import { adding, ORIGIN, reshaped, updating } from "../../testing/conformance/fixtures";
import type { RecordingHost } from "../../testing/conformance/recording-host";
import type { ViewportPoint } from "../../testing/mouse-commands";
import type { GoogleMapState } from "../map-state";
import type { PlacedShape } from "../placed-location";
import { cameraAt } from "./camera-at";
import { holdMouseAt } from "./held-mouse";
import { inputOn } from "./map-input";
import { drawnMarker, QUIET_MS, wait } from "./map-waits";
import { steadyPoint } from "./page-input";
import { probedPoint } from "./probe-target";
import { mountedGoogle, TEST_OPTIONS } from "./subject";

/** A drag a test holds under way: moved on further, then let go. */
export interface HeldDrag {
  moveOn(): Promise<void>;
  release(): Promise<void>;
}

/** Each leg of a marker's held drag: far enough that Google takes it for a drag. */
const MARKER_STEP: ViewportPoint = { x: 40, y: 20 };

/** Each leg of a handle's held drag: about 20 px up and 30 px right at zoom 7. */
const HANDLE_STEP: LatLng = { lat: 0.22, lng: 0.33 };

/** The polygon fixture's corner a control drag moves, outward, clear of the hole and the others. */
const CONTROL_CORNER: LatLng = { lat: 1, lng: -1 };

/** The polygon fixture's corner a cut drag starts on. */
export const CUT_CORNER: LatLng = { lat: 1, lng: 1 };

/** How long Google takes to draw a shape's handles once its editing comes back. */
export const HANDLES_DRAWN_MS = 500;

/** Google drawing `drawables` around the origin at `zoom`, with the map they're on. */
export async function mountedAround(zoom: number, ...drawables: Drawable[]) {
  const mounted = await mountedGoogle({
    ...TEST_OPTIONS,
    mapOptions: { disableDoubleClickZoom: true },
  });
  const map = mounted.state.mounted?.map as google.maps.Map;
  await mounted.adapter.apply(adding(...drawables));
  await cameraAt(map, { center: ORIGIN, zoom });
  return { ...mounted, map };
}

/** Every edit and change reported of `id`, in order, each as `[report, id, geometry]`. */
export function dragReportsOf(host: RecordingHost, id: string): readonly unknown[][] {
  return host
    .reportsIn("reportLocationEdit", "reportLocationChange")
    .filter((report) => report[1] === id);
}

/** The changes reported of `id`, each as `[report, id, geometry]`. */
export function changesOf(host: RecordingHost, id: string): readonly unknown[][] {
  return dragReportsOf(host, id).filter(([report]) => report === "reportLocationChange");
}

/** A held drag of the marker drawn for `id`, under way once Google has reported its first edit. */
export async function holdMarkerDrag(
  { state, host }: { readonly state: GoogleMapState; readonly host: RecordingHost },
  id: string,
): Promise<HeldDrag> {
  const marker = await drawnMarker(state, id);
  const start = await steadyPoint(() => marker);
  const held = await holdMouseAt(start);
  await held.moveTo(shifted(start, 1));
  await expect
    .poll(() => dragReportsOf(host, id).some(([report]) => report === "reportLocationEdit"))
    .toBe(true);
  return { moveOn: () => held.moveTo(shifted(start, 2)), release: held.release };
}

/**
 * A held drag of the shape's handle at `from`, checked to have caught it: the map hasn't panned.
 * Google reports nothing of it until let go, so a test also begins with a drag it lets go.
 */
export async function holdHandleDrag(map: google.maps.Map, from: LatLng): Promise<HeldDrag> {
  const input = await inputOn(map);
  const centre = map.getCenter()?.toJSON();
  const held = await input.hold(from);
  const leg = (legs: number) => ({
    lat: from.lat + legs * HANDLE_STEP.lat,
    lng: from.lng + legs * HANDLE_STEP.lng,
  });
  await held.moveTo(leg(1));
  // A press that missed the handle pans the map: the drag holds it still.
  expect(map.getCenter()?.toJSON()).toEqual(centre);
  return { moveOn: () => held.moveTo(leg(2)), release: held.release };
}

/**
 * A drag of `polygon`'s handle let go, its one change written back as the store would: the press,
 * distances and timing reach a handle on this map. Returns the polygon as the store has it then.
 */
export async function controlDrag(
  { map, host, adapter }: Awaited<ReturnType<typeof mountedAround>>,
  polygon: Drawable,
): Promise<Drawable> {
  const drag = await holdHandleDrag(map, CONTROL_CORNER);
  await drag.moveOn();
  await drag.release();
  await expect.poll(() => changesOf(host, polygon.id).length).toBe(1);
  await wait(QUIET_MS);
  expect(changesOf(host, polygon.id)).toHaveLength(1);
  const [, , moved] = changesOf(host, polygon.id)[0] as [string, string, Geometry];
  const stored = reshaped(polygon, moved);
  await adapter.apply(updating(stored));
  return stored;
}

/** The polygon placed for `id`. */
export function polygonOn(state: GoogleMapState, id: string): google.maps.Polygon {
  return (state.placed.get(id) as PlacedShape).shape as google.maps.Polygon;
}

/** Checks that Google draws the marker for `id` at `at`, and returns it. */
export async function expectMarkerAt(
  state: GoogleMapState,
  id: string,
  at: LatLng,
): Promise<google.maps.marker.AdvancedMarkerElement> {
  const marker = (await drawnMarker(state, id)) as google.maps.marker.AdvancedMarkerElement;
  const place = probedPoint(marker.position);
  expect(place.lat).toBeCloseTo(at.lat, 6);
  expect(place.lng).toBeCloseTo(at.lng, 6);
  return marker;
}

function shifted({ x, y }: ViewportPoint, legs: number): ViewportPoint {
  return { x: x + legs * MARKER_STEP.x, y: y + legs * MARKER_STEP.y };
}
