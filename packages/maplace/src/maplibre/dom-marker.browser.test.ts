import type { Map as MapLibreMap } from "maplibre-gl";
import { afterEach, describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { DOUBLE_CLICK_WAIT_MS } from "../adapter-kit/click-gesture";
import type { Drawable } from "../drawable";
import type { LatLng } from "../geometry";
import {
  adding,
  markerDrawable,
  ORIGIN,
  presented,
  updating,
} from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import type { MapLibreState } from "./map-state";
import { PIN_SIZE } from "./pin-image";
import { wait } from "./testing/map-settle";
import { markerTarget } from "./testing/marker-target";
import { mountedMapLibre } from "./testing/mounted";
import { placedMarker } from "./testing/placed-markers";
import { removePageMaps } from "./testing/subject";
import { pagePointOf, pinHeadOf } from "./testing/user-drags";

afterEach(() => {
  unmountAll();
  removePageMaps();
});

const editable = (id: string, overrides?: Partial<Drawable>) =>
  markerDrawable(id, ORIGIN, { editable: true, ...overrides });

/** The marker's element MapLibre moves, and the icon in it. */
function elementsOf(state: MapLibreState, id: string) {
  const marker = placedMarker(state, id).domMarker();
  const element = marker?.getElement();
  return { marker, element, icon: element?.firstElementChild ?? undefined };
}

/** A user's drag of `id`'s pin, by its head, to where `to` is drawn: its tip lands there. */
async function dragPin(map: MapLibreMap, state: MapLibreState, id: string, to: LatLng) {
  const icon = elementsOf(state, id).icon as Element;
  const head = pinHeadOf(icon);
  const tipBelowHead = icon.getBoundingClientRect().bottom - head.y;
  const target = pagePointOf(map, to);
  await commands.pressMouse([head, { x: target.x, y: target.y - tipBelowHead }]);
}

/** An editable marker at the origin, on a map zoomed in on it. */
async function withEditableMarker(overrides?: Partial<Drawable>) {
  const mounted = await mountedMapLibre();
  mounted.adapter.setView({ kind: "center", center: ORIGIN, zoom: 6 });
  await mounted.adapter.apply(adding(editable("a", overrides)));
  await mounted.probe.settle();
  return mounted;
}

/** Where `editable("a")` is dragged to. */
const DRAGGED_TO: LatLng = { lat: 1, lng: 2 };

describe("dragging MapLibre's markers", () => {
  it("draws an editable marker with no icon as a draggable pin in the DOM, not in the pin layer", async () => {
    const { state } = await withEditableMarker();
    const { marker, icon } = elementsOf(state, "a");
    expect(marker?.isDraggable()).toBe(true);
    expect(icon?.localName).toBe("img");
    expect(state.features?.pins.featureOf("a")).toBeUndefined();
  });

  it("puts the dragged pin's tip on its point, as the layer's pin", async () => {
    const { state, map } = await withEditableMarker();
    const box = (elementsOf(state, "a").icon as Element).getBoundingClientRect();
    const point = pagePointOf(map, ORIGIN);
    expect(box.left + box.width / 2).toBeCloseTo(point.x, 0);
    expect(Math.abs(box.bottom - point.y)).toBeLessThanOrEqual(1);
    expect(placedMarker(state, "a").popupPlace().lift).toBe(PIN_SIZE.height);
  });

  it("keeps a page's icon node when only `editable` changes", async () => {
    const icon = document.createElement("span");
    const { adapter, state } = await withEditableMarker({
      editable: false,
      renderIcon: () => icon,
    });
    const drawn = placedMarker(state, "a").drawable();
    await adapter.apply(updating({ ...drawn, editable: true }));
    expect(elementsOf(state, "a")).toMatchObject({ icon });
    expect(elementsOf(state, "a").marker?.isDraggable()).toBe(true);
  });

  it("drags a marker whose icon builder gives the default pin for its state, once it becomes editable", async () => {
    const { adapter, state } = await withEditableMarker({
      editable: false,
      renderIcon: () => undefined,
    });
    expect(elementsOf(state, "a").marker).toBeUndefined();
    const drawn = placedMarker(state, "a").drawable();
    await adapter.apply(updating({ ...drawn, editable: true }));
    expect(elementsOf(state, "a").marker?.isDraggable()).toBe(true);
    expect(state.features?.pins.featureOf("a")).toBeUndefined();
  });

  it("reports a drag's edits as it moves and its change once, where it was let go", async () => {
    const { map, state, host } = await withEditableMarker();
    await dragPin(map, state, "a", DRAGGED_TO);
    const edits = host.reportsOf("reportLocationEdit");
    const changes = host.reportsOf("reportLocationChange");
    expect(edits.length).toBeGreaterThan(1);
    expect(changes).toHaveLength(1);
    const [[id, geometry]] = changes as [[string, LatLng & { type: string }]];
    expect(id).toBe("a");
    expect(geometry.lat).toBeCloseTo(DRAGGED_TO.lat, 0);
    expect(geometry.lng).toBeCloseTo(DRAGGED_TO.lng, 0);
    expect(edits.at(-1)).toEqual(changes[0]);
  });

  it("selects an editable marker clicked without moving it", async () => {
    const { state, host } = await withEditableMarker();
    await userEvent.click(elementsOf(state, "a").icon as Element);
    expect(host.reportsOf("reportSelectionChange")).toEqual([["a"]]);
    expect(host.reportsOf("reportLocationChange")).toEqual([]);
  });

  it("selects nothing and reports no map click for a drag", async () => {
    const { map, state, host } = await withEditableMarker();
    await dragPin(map, state, "a", DRAGGED_TO);
    await wait(DOUBLE_CLICK_WAIT_MS * 2);
    expect(host.reportsOf("reportLocationChange")).toHaveLength(1);
    expect(host.reportsOf("reportSelectionChange")).toEqual([]);
    expect(host.reportsOf("reportMapClick")).toEqual([]);
  });

  it("takes the store's write-back of a drag without moving it or reporting again", async () => {
    const { map, adapter, state, host } = await withEditableMarker();
    await dragPin(map, state, "a", DRAGGED_TO);
    const [, geometry] = host.reportsOf("reportLocationChange")[0] as [string, LatLng];
    const before = elementsOf(state, "a").marker?.getLngLat() as LatLng;
    const editsBefore = host.reportsOf("reportLocationEdit").length;
    await adapter.apply(updating(markerDrawable("a", geometry, { editable: true })));
    const after = elementsOf(state, "a").marker?.getLngLat() as LatLng;
    expect(after.lat).toBeCloseTo(before.lat, 9);
    expect(after.lng).toBeCloseTo(before.lng, 9);
    expect(host.reportsOf("reportLocationEdit")).toHaveLength(editsBefore);
    expect(host.reportsOf("reportLocationChange")).toHaveLength(1);
  });

  it("shows the hand that drags over an editable marker, and a pointer once it only selects", async () => {
    const icon = document.createElement("span");
    const { adapter, state } = await withEditableMarker({ renderIcon: () => icon });
    const element = elementsOf(state, "a").element as HTMLElement;
    expect(getComputedStyle(element).cursor).toBe("grab");
    const drawn = placedMarker(state, "a").drawable();
    await adapter.apply(updating({ ...drawn, editable: false }));
    expect(getComputedStyle(element).cursor).toBe("pointer");
  });

  it("puts a marker no longer editable back in the pin layer, not draggable", async () => {
    const { adapter, state } = await withEditableMarker();
    await adapter.apply(updating(markerDrawable("a", ORIGIN, { editable: false })));
    expect(elementsOf(state, "a").marker).toBeUndefined();
    expect(state.features?.pins.featureOf("a")).toBeDefined();
  });

  it("keeps a marker that isn't editable from being dragged", async () => {
    const icon = document.createElement("span");
    const { map, state, host, probe } = await withEditableMarker({
      editable: false,
      renderIcon: () => icon,
    });
    targetOf(map, state, "a").drag?.({ type: "marker", ...DRAGGED_TO });
    expect(host.reportsOf("reportLocationEdit")).toEqual([]);
    expect(probe.location("a")?.geometry).toEqual({ type: "marker", ...ORIGIN });
  });

  it("drags through the probe as a user would", async () => {
    const { map, state, host, adapter } = await withEditableMarker();
    adapter.present(presented({}));
    const dragged = { type: "marker", ...DRAGGED_TO } as const;
    targetOf(map, state, "a").drag?.(dragged);
    expect(host.reportsOf("reportLocationEdit")).toEqual([["a", dragged]]);
    expect(host.reportsOf("reportLocationChange")).toEqual([["a", dragged]]);
  });
});

/** `id` as the probe reaches it; it sends nothing to the pin layer in these checks. */
function targetOf(map: MapLibreMap, state: MapLibreState, id: string) {
  const sent = { featureOf: () => undefined, stop() {} };
  return markerTarget(placedMarker(state, id), { map, sent, stillPlaced: () => true });
}
