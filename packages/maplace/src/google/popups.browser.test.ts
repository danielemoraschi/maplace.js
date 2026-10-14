import { afterEach, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import type { Drawable } from "../drawable";
import {
  adding,
  markerDrawable,
  polygonDrawable,
  presented,
  withContent,
} from "../testing/conformance/fixtures";
import type { MountSettings } from "../testing/conformance/harness";
import { unmountAll } from "../testing/conformance/harness";
import type { GoogleMapState } from "./map-state";
import { cameraAt } from "./testing/camera-at";
import { mountedGoogle, TEST_OPTIONS } from "./testing/subject";
import { describeWithMaps } from "./testing/with-maps";

const ALPHA = withContent(markerDrawable("a"), "Alpha");
/** Longer than Google takes to start panning an open popup into view. */
const AUTO_PAN_WAIT_MS = 500;

/** Google drawing `drawables`, with a button outside the map holding focus, as a page's would. */
async function drawn(drawables: Drawable[], settings?: MountSettings) {
  const mounted = await mountedGoogle(TEST_OPTIONS, settings);
  await mounted.adapter.apply(adding(...drawables));
  const outside = document.createElement("button");
  outside.textContent = "Outside the map";
  mounted.container.after(outside);
  outside.focus();
  return { ...mounted, outside };
}

/** The marker Google drew for `id`, once it has a size on the page. */
async function drawnMarker(state: GoogleMapState, id: string): Promise<HTMLElement> {
  const marker = () => {
    const placed = state.placed.get(id);
    return placed && "marker" in placed ? placed.marker : undefined;
  };
  await expect.poll(() => (marker()?.getBoundingClientRect().width ?? 0) > 0).toBe(true);
  return marker() as HTMLElement;
}

/** The popup's element once its content is reported in the DOM. */
async function openedPopup(state: GoogleMapState): Promise<HTMLElement> {
  await expect.poll(() => state.popup?.shown).toBe(true);
  return state.popup?.element as HTMLElement;
}

describeWithMaps("Google popups under real input", () => {
  afterEach(unmountAll);

  it("opens a clicked marker's popup with its content in the DOM, and moves focus into it", async () => {
    const { adapter, state, host } = await drawn([ALPHA]);
    await userEvent.click(await drawnMarker(state, "a"));
    expect(host.reportsOf("reportSelect")).toEqual([["a"]]);
    adapter.present(presented({ selectedId: "a" }));
    const element = await openedPopup(state);
    expect(host.reportsOf("reportPopupOpen")).toEqual([["a", element]]);
    expect([element.isConnected, element.textContent]).toEqual([true, "Alpha"]);
    await expect
      .poll(() => element.closest('[role="dialog"]')?.contains(document.activeElement))
      .toBe(true);
  });

  it("leaves focus where it was for a popup opened from outside the map", async () => {
    const { adapter, state, outside } = await drawn([ALPHA]);
    adapter.present(presented({ selectedId: "a" }));
    await openedPopup(state);
    expect(document.activeElement).toBe(outside);
  });

  it("reports a click on its close button once, and stays closed", async () => {
    const { adapter, state, host } = await drawn([ALPHA]);
    adapter.present(presented({ selectedId: "a" }));
    await openedPopup(state);
    await userEvent.click(page.getByRole("button", { name: "Close" }));
    await expect.poll(() => host.reportsOf("reportPopupClose")).toEqual([["a"]]);
    adapter.present(presented({ selectedId: "a" }));
    expect(state.popup).toBeUndefined();
  });

  it("opens a hover popup without moving the camera or focus", async () => {
    // Just inside the top edge at zoom 6: a popup opening there would pan the map into view.
    const top = withContent(markerDrawable("t", { lat: 5, lng: 0 }), "Top");
    const { adapter, state, outside } = await drawn([top], { openOn: "hover" });
    const map = state.mounted?.map as google.maps.Map;
    await cameraAt(map, { center: { lat: 0, lng: 0 }, zoom: 6 });
    let moves = 0;
    map.addListener("center_changed", () => moves++);
    adapter.present(presented({ hoveredId: "t" }));
    await openedPopup(state);
    // A pan starts once the window is drawn; give it the time it would take to begin.
    await new Promise((resolve) => setTimeout(resolve, AUTO_PAN_WAIT_MS));
    expect(moves).toBe(0);
    expect(document.activeElement).toBe(outside);
  });

  it("shows content as given, so markup in a string stays text", async () => {
    const markup = { ...ALPHA, renderContent: () => document.createTextNode("<b>bold</b>") };
    const { adapter, state } = await drawn([markup]);
    adapter.present(presented({ selectedId: "a" }));
    const element = await openedPopup(state);
    expect([element.querySelector("b"), element.textContent]).toEqual([null, "<b>bold</b>"]);
  });

  it("keeps a popup open through its location's type change, pointing at the new shape", async () => {
    const { adapter, state, host } = await drawn([ALPHA]);
    adapter.present(presented({ selectedId: "a" }));
    await openedPopup(state);
    const polygon = { ...ALPHA, geometry: polygonDrawable("a").geometry };
    await adapter.apply({ added: [polygon], updated: [], removed: ["a"] });
    await expect.poll(() => host.reportsOf("reportPopupOpen").length).toBe(2);
    expect(state.popup?.infoWindow.isOpen).toBe(true);
    expect(state.popup?.infoWindow.getPosition()?.toJSON()).toEqual({ lat: 0, lng: 0 });
    expect(host.reportsOf("reportPopupClose")).toEqual([]);
  });

  it("points a shape's popup at its centre", async () => {
    const { adapter, state } = await drawn([withContent(polygonDrawable("p"), "Pi")]);
    adapter.present(presented({ selectedId: "p" }));
    await openedPopup(state);
    expect(state.popup?.infoWindow.getPosition()?.toJSON()).toEqual({ lat: 0, lng: 0 });
  });
});
