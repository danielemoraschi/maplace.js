import { afterEach, expect, it, onTestFinished, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { isPinIcon } from "../adapter-kit/pin-icon";
import { pinImageSize, pinRadiusOf } from "../adapter-kit/pin-image";
import { pinLooksOf } from "../adapter-kit/pin-looks";
import { createMaplace } from "../maplace/create";
import { adding, markerDrawable, ORIGIN, presented } from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { sizedContainer } from "../testing/container";
import { offPoint } from "../testing/off-point";
import { queried } from "../testing/queried";
import { frames } from "./frames";
import { clickHoldPassed, drawnMarker } from "./testing/map-waits";
import { centreOf, tabTo } from "./testing/page-input";
import { onGoogle } from "./testing/store-on-google";
import { mountedGoogle, pageMapIn, TEST_OPTIONS } from "./testing/subject";
import { describeWithMaps } from "./testing/with-maps";

/**
 * A name for a marker the test points at: userEvent finds an element by its role and name, and a
 * nameless marker's `button` role matches Google's own buttons once they draw.
 */
const NAMED = { title: "Rome" };

/** A map the page made, on the page, removed after the test. */
function pageMap(): google.maps.Map {
  const container = sizedContainer();
  onTestFinished(() => container.remove());
  return pageMapIn(container);
}

describeWithMaps("Google markers under real input", () => {
  afterEach(unmountAll);

  it("reports a click on a marker once, as the marker's and not the map's", async () => {
    const { adapter, state, host } = await mountedGoogle();
    await adapter.apply(adding(markerDrawable("a", ORIGIN, NAMED)));
    const marker = await drawnMarker(state, "a");
    await userEvent.click(marker);
    // Google dispatches the click after the input, not during it.
    await expect.poll(() => host.reportsOf("reportSelectionChange")).toEqual([["a"]]);
    // A second report, the map's, would come in the same dispatch; a map click once held.
    await frames(2);
    expect(host.reportsOf("reportSelectionChange")).toEqual([["a"]]);
    await clickHoldPassed();
    expect(host.reportsOf("reportMapClick")).toEqual([]);
  });

  it("leaves a clicked marker unhovered once the pointer goes: a click's focus never hovers it", async () => {
    const { adapter, state, host } = await mountedGoogle();
    await adapter.apply(adding(markerDrawable("a", ORIGIN, NAMED)));
    const marker = await drawnMarker(state, "a");
    await userEvent.click(marker);
    await expect.poll(() => host.reportsOf("reportSelectionChange")).toEqual([["a"]]);
    await userEvent.unhover(marker);
    expect(host.reportsOf("reportHoverChange")).toEqual([["a"], [undefined]]);
  });

  it("draws a default marker as maplace's pin, its dot on the point, larger while selected, back once deselected", async () => {
    const { adapter, state } = await mountedGoogle();
    adapter.setView({ kind: "center", center: ORIGIN, zoom: 5 });
    await adapter.apply(adding(markerDrawable("a", ORIGIN, NAMED)));
    const marker = await drawnMarker(state, "a");
    const pin = marker.firstElementChild as HTMLImageElement;
    expect(isPinIcon(pin)).toBe(true);
    const looks = pinLooksOf(document.body);
    const point = centreOf(state.mounted?.map.getDiv() as HTMLElement);
    const onPoint = () => offPoint(pin, point) <= 1;
    await expect.poll(onPoint).toBe(true);
    adapter.present(presented({ selectedId: "a" }));
    await expect.poll(() => pin.getBoundingClientRect().width).toBe(pinImageSize(looks.selected));
    expect(onPoint()).toBe(true);
    adapter.present(presented({}));
    await expect.poll(() => pin.getBoundingClientRect().width).toBe(pinImageSize(looks.resting));
    expect(onPoint()).toBe(true);
  });

  it("opens a selected pin's popup with its tail just above the dot, clear of it", async () => {
    const content = document.createElement("p");
    content.textContent = "One";
    const maplace = createMaplace({
      locations: [{ id: "a", ...ORIGIN, title: "Alpha", content }],
      view: { kind: "center", center: ORIGIN, zoom: 5 },
    });
    await onGoogle(maplace);
    maplace.select("a");
    const pin = await vi.waitFor(() => queried(document.body, ".maplace-pin"));
    const tail = await vi.waitFor(() => queried(document.body, ".gm-style-iw-tc"));
    const halo = pinRadiusOf(pinLooksOf(document.body).selected);
    // From the selected dot's top, halo included, up to the tail's tip: never into the dot.
    const gap = () => centreOf(pin).y - halo - tail.getBoundingClientRect().bottom;
    await expect.poll(gap).toBeGreaterThanOrEqual(-1);
    expect(gap()).toBeLessThan(20);
  });

  it("reports the pointer onto a marker and off it", async () => {
    const { adapter, state, host } = await mountedGoogle();
    await adapter.apply(adding(markerDrawable("a", ORIGIN, NAMED)));
    const marker = await drawnMarker(state, "a");
    await userEvent.hover(marker);
    await userEvent.unhover(marker);
    expect(host.reportsOf("reportHoverChange")).toEqual([["a"], [undefined]]);
  });

  it("is reached with Tab, named by its title, hovered by focus, and selected with Enter", async () => {
    const { adapter, state, host } = await mountedGoogle();
    await adapter.apply(adding(markerDrawable("a", ORIGIN, { title: "Rome" })));
    const marker = await drawnMarker(state, "a");
    expect(marker.getAttribute("aria-label")).toBe("Rome");
    await tabTo(marker);
    await userEvent.keyboard("{Enter}");
    expect(host.reportsOf("reportHoverChange")).toEqual([["a"]]);
    expect(host.reportsOf("reportSelectionChange")).toEqual([["a"]]);
  });

  it("selects an editable marker on a click, and reports it as it is dragged, and the drag once, on release", async () => {
    const { adapter, state, host } = await mountedGoogle();
    await adapter.apply(adding(markerDrawable("a", ORIGIN, { ...NAMED, editable: true })));
    const marker = await drawnMarker(state, "a");
    await userEvent.click(marker);
    await expect.poll(() => host.reportsOf("reportSelectionChange")).toEqual([["a"]]);
    const grabbed = centreOf(marker);
    await commands.pressMouse([grabbed, { x: grabbed.x + 80, y: grabbed.y - 40 }]);
    await expect.poll(() => host.reportsOf("reportLocationChange").length).toBe(1);
    expect(host.reportsOf("reportLocationChange")).toEqual([
      ["a", { type: "marker", lat: expect.any(Number), lng: expect.any(Number) }],
    ]);
    const edits = host.reportsOf("reportLocationEdit");
    expect(edits.length).toBeGreaterThan(1);
    // A marker read only where it started and where it was let go would show no move between.
    const underWay = edits.slice(0, -1).map(([, geometry]) => geometry);
    expect(underWay).toContainEqual(expect.not.objectContaining(ORIGIN));
    expect(edits[edits.length - 1]).toEqual(host.reportsOf("reportLocationChange")[0]);
  });

  it("leaves the page's own map as it was on destroy: its listeners, without maplace's markers", async () => {
    const map = pageMap();
    let pageClicks = 0;
    map.addListener("click", () => pageClicks++);
    const { adapter, state, destroy } = await mountedGoogle({ ...TEST_OPTIONS, map });
    await adapter.apply(adding(markerDrawable("a")));
    await drawnMarker(state, "a");
    destroy();
    expect(map.getDiv().querySelector("gmp-advanced-marker")).toBeNull();
    google.maps.event.trigger(map, "click", {});
    expect(pageClicks).toBe(1);
  });

  it("keeps two adapters on one page map apart: destroying one leaves the other's markers", async () => {
    const map = pageMap();
    const first = await mountedGoogle({ ...TEST_OPTIONS, map });
    const second = await mountedGoogle({ ...TEST_OPTIONS, map });
    await first.adapter.apply(adding(markerDrawable("a")));
    await second.adapter.apply(adding(markerDrawable("b")));
    const kept = await drawnMarker(second.state, "b");
    first.destroy();
    expect(map.getDiv().querySelectorAll("gmp-advanced-marker")).toHaveLength(1);
    expect(kept.isConnected).toBe(true);
  });
});
