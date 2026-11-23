import type { Map as MapLibreMap } from "maplibre-gl";
import { afterEach, describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { DOUBLE_CLICK_WAIT_MS } from "../adapter-kit/click-gesture";
import { pinImageUrl, pinLiftOf } from "../adapter-kit/pin-image";
import { pinLooksOf } from "../adapter-kit/pin-looks";
import type { LatLng } from "../geometry";
import { markerDrawable, ORIGIN, presented, updating } from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { offPoint } from "../testing/off-point";
import type { MapLibreState } from "./map-state";
import { withEditableMarker } from "./testing/editable-marker";
import { wait } from "./testing/map-settle";
import { markerTarget } from "./testing/marker-target";
import { placedMarker } from "./testing/placed-markers";
import { removePageMaps } from "./testing/subject";
import { middleOf, pagePointOf } from "./testing/user-drags";

afterEach(() => {
  unmountAll();
  removePageMaps();
});

/** The marker's element MapLibre moves, and the icon in it. */
function elementsOf(state: MapLibreState, id: string) {
  const marker = placedMarker(state, id).domMarker();
  const element = marker?.getElement();
  return { marker, element, icon: element?.firstElementChild ?? undefined };
}

/** A user's drag of `id`'s pin, by its dot, to where `to` is drawn: its dot lands there. */
async function dragPin(map: MapLibreMap, state: MapLibreState, id: string, to: LatLng) {
  const icon = elementsOf(state, id).icon as Element;
  await commands.pressMouse([middleOf(icon), pagePointOf(map, to)]);
}

/** How far `element`'s middle is from where `at` is drawn. */
const offDrawnPoint = (map: MapLibreMap, element: Element, at: LatLng) =>
  offPoint(element, pagePointOf(map, at));

/** Where the editable marker `a` is dragged to. */
const DRAGGED_TO: LatLng = { lat: 1, lng: 2 };

describe("dragging MapLibre's markers", () => {
  it("draws an editable marker with no icon as a draggable pin in the DOM, not in the pin layer", async () => {
    const { state } = await withEditableMarker();
    const { marker, icon } = elementsOf(state, "a");
    expect(marker?.isDraggable()).toBe(true);
    expect(icon?.localName).toBe("img");
    expect(state.features?.pins.featureOf("a")).toBeUndefined();
  });

  it("draws a draggable pin's selected look, keeping the node", async () => {
    const { adapter, state } = await withEditableMarker();
    const looks = pinLooksOf(document.body);
    const pin = elementsOf(state, "a").icon as HTMLImageElement;
    expect(pin.getAttribute("src")).toBe(pinImageUrl(document, looks.resting));
    adapter.present(presented({ selectedId: "a" }));
    expect(elementsOf(state, "a").icon).toBe(pin);
    expect(pin.getAttribute("src")).toBe(pinImageUrl(document, looks.selected));
  });

  it("puts an inline image icon's bottom on its point, with no line of text under it", async () => {
    const icon = document.createElement("img");
    icon.width = 20;
    icon.height = 30;
    const { state, map } = await withEditableMarker({ renderIcon: () => icon });
    expect(elementsOf(state, "a").icon).toBe(icon);
    expect(
      Math.abs(icon.getBoundingClientRect().bottom - pagePointOf(map, ORIGIN).y),
    ).toBeLessThanOrEqual(1);
  });

  it("puts the dragged pin's dot on its point, at rest and while selected, its popup over it", async () => {
    const { adapter, state, map } = await withEditableMarker();
    const pin = elementsOf(state, "a").icon as Element;
    expect(offDrawnPoint(map, pin, ORIGIN)).toBeLessThanOrEqual(1);
    adapter.present(presented({ selectedId: "a" }));
    expect(offDrawnPoint(map, pin, ORIGIN)).toBeLessThanOrEqual(1);
    expect(placedMarker(state, "a").popupPlace()).toMatchObject({
      at: ORIGIN,
      lift: pinLiftOf(pinLooksOf(document.body)),
    });
  });

  it("centres maplace's pin again when the page's icon builds nothing, and puts a later icon's bottom back on the point", async () => {
    const icon = document.createElement("img");
    icon.width = 20;
    icon.height = 30;
    const { adapter, state, map } = await withEditableMarker({
      renderIcon: (shown) => (shown.selected ? icon : undefined),
    });
    const pin = elementsOf(state, "a").icon as Element;
    expect(offDrawnPoint(map, pin, ORIGIN)).toBeLessThanOrEqual(1);
    adapter.present(presented({ selectedId: "a" }));
    expect(elementsOf(state, "a").icon).toBe(icon);
    const bottom = icon.getBoundingClientRect().bottom;
    expect(Math.abs(bottom - pagePointOf(map, ORIGIN).y)).toBeLessThanOrEqual(1);
    adapter.present(presented({}));
    expect(elementsOf(state, "a").icon).toBe(pin);
    expect(offDrawnPoint(map, pin, ORIGIN)).toBeLessThanOrEqual(1);
  });

  it("keeps the keyboard's focus on a marker made again for an icon met at another anchor", async () => {
    const icon = document.createElement("img");
    const { adapter, state } = await withEditableMarker({
      renderIcon: (shown) => (shown.selected ? icon : undefined),
    });
    const before = elementsOf(state, "a").element as HTMLElement;
    before.focus();
    adapter.present(presented({ selectedId: "a" }));
    const after = elementsOf(state, "a").element;
    expect(after).not.toBe(before);
    expect(document.activeElement).toBe(after);
  });

  it("lets the pointer's hover go on a marker made again for an icon met at another anchor", async () => {
    const icon = document.createElement("img");
    const { adapter, state, host } = await withEditableMarker({
      renderIcon: (shown) => (shown.selected ? icon : undefined),
    });
    await commands.moveMouse(middleOf(elementsOf(state, "a").element as Element));
    expect(host.reportsOf("reportHoverChange")).toEqual([["a"]]);
    adapter.present(presented({ selectedId: "a" }));
    expect(host.reportsOf("reportHoverChange")).toEqual([["a"], [undefined]]);
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
