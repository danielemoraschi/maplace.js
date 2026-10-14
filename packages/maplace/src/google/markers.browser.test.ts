import { afterEach, expect, it, onTestFinished } from "vitest";
import { userEvent } from "vitest/browser";
import { adding, markerDrawable, ORIGIN } from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { sizedContainer } from "../testing/container";
import type { GoogleMapState } from "./map-state";
import { mountedGoogle, pageMapIn, TEST_OPTIONS } from "./testing/subject";
import { describeWithMaps } from "./testing/with-maps";

/** The marker Google drew for `id`, once it is on the page and has a size. */
async function drawnMarker(state: GoogleMapState, id: string): Promise<HTMLElement> {
  const marker = () => state.placed.get(id)?.marker;
  await expect.poll(() => (marker()?.getBoundingClientRect().width ?? 0) > 0).toBe(true);
  return marker() as HTMLElement;
}

/** Tabs through the page until `element` has keyboard focus. */
async function tabTo(element: HTMLElement): Promise<void> {
  for (let presses = 0; presses < 50 && document.activeElement !== element; presses++) {
    await userEvent.keyboard("{Tab}");
  }
  expect(document.activeElement).toBe(element);
}

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
    await adapter.apply(adding(markerDrawable("a")));
    const marker = await drawnMarker(state, "a");
    await userEvent.click(marker);
    expect(host.reportsOf("reportSelect")).toEqual([["a"]]);
    // The click focuses the marker too, but only keyboard focus hovers it.
    await userEvent.unhover(marker);
    expect(host.reportsOf("reportHover")).toEqual([["a"], [undefined]]);
  });

  it("reports the pointer onto a marker and off it", async () => {
    const { adapter, state, host } = await mountedGoogle();
    await adapter.apply(adding(markerDrawable("a")));
    const marker = await drawnMarker(state, "a");
    await userEvent.hover(marker);
    await userEvent.unhover(marker);
    expect(host.reportsOf("reportHover")).toEqual([["a"], [undefined]]);
  });

  it("is reached with Tab, named by its title, hovered by focus, and selected with Enter", async () => {
    const { adapter, state, host } = await mountedGoogle();
    await adapter.apply(adding(markerDrawable("a", ORIGIN, { title: "Rome" })));
    const marker = await drawnMarker(state, "a");
    expect(marker.getAttribute("aria-label")).toBe("Rome");
    await tabTo(marker);
    await userEvent.keyboard("{Enter}");
    expect(host.reportsOf("reportHover")).toEqual([["a"]]);
    expect(host.reportsOf("reportSelect")).toEqual([["a"]]);
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
