import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import type { Adapter, ControlPosition } from "../adapter";
import { pinRadiusOf } from "../adapter-kit/pin-image";
import { pinLooksOf } from "../adapter-kit/pin-looks";
import type { LatLng } from "../geometry";
import { places } from "../google/testing/places";
import { createListView } from "../list-view";
import { createMaplace } from "../maplace/create";
import { mapOfWidthIn } from "./testing/map-of-width";
import { wait } from "./testing/map-settle";
import { RENDER_WAIT } from "./testing/rendered";
import { pagePointOf } from "./testing/user-drags";

/** The Dropdown of places example's cities, which a phone's fit put under its select (N32). */
const CITIES = [
  { id: "london", lat: 51.5074, lng: -0.1278, title: "London" },
  { id: "edinburgh", lat: 55.9533, lng: -3.1883, title: "Edinburgh" },
  { id: "belfast", lat: 54.5973, lng: -5.9301, title: "Belfast" },
];

/** Long enough for a re-fit to have shown on the camera. */
const QUIET_MS = 500;

const RADIUS = pinRadiusOf(pinLooksOf(document.body).selected);

/** A panel of `width` × `height` px in `position`, as a select with its heading takes. */
function panelOn(adapter: Adapter, position: ControlPosition, width: number, height: number) {
  const node = document.createElement("div");
  node.style.cssText = `width: ${width}px; height: ${height}px`;
  adapter.mountControl(node, position);
  return node;
}

/** Whether `at`'s dot is drawn clear of `panel`. */
function clearOf(map: Parameters<typeof pagePointOf>[0], at: LatLng, panel: HTMLElement): boolean {
  const { x, y } = pagePointOf(map, at);
  const box = panel.getBoundingClientRect();
  return (
    x + RADIUS < box.left ||
    x - RADIUS > box.right ||
    y + RADIUS < box.top ||
    y - RADIUS > box.bottom
  );
}

const everyCityClearOf = (map: Parameters<typeof pagePointOf>[0], panel: HTMLElement) =>
  CITIES.every((city) => clearOf(map, city, panel));

describe("a fit clear of maplace's panels on MapLibre (N32)", () => {
  it("fits the example's 375 × 440 map clear of its select above and the attribution below", async () => {
    const maplace = createMaplace({ locations: CITIES });
    const { adapter, map, attribution } = await mapOfWidthIn(maplace, 375, 440);
    const panel = panelOn(adapter, "top-right", 190, 100);
    await expect
      .poll(
        () =>
          everyCityClearOf(map, panel) &&
          CITIES.every(
            (city) =>
              pagePointOf(map, city).y + RADIUS <= attribution().getBoundingClientRect().top,
          ),
        RENDER_WAIT,
      )
      .toBe(true);
  });

  it("fits again, clear of the panel, when it grows on a map nobody has moved", async () => {
    const maplace = createMaplace({ locations: CITIES });
    const { adapter, map } = await mapOfWidthIn(maplace, 375);
    const node = panelOn(adapter, "top-right", 175, 20);
    await expect.poll(() => everyCityClearOf(map, node), RENDER_WAIT).toBe(true);
    node.style.height = "110px";
    await expect.poll(() => everyCityClearOf(map, node), RENDER_WAIT).toBe(true);
  });

  it("keeps clear of the open attribution on a map too short to keep clear of its select too", async () => {
    const maplace = createMaplace({ locations: CITIES });
    const { adapter, map, attribution } = await mapOfWidthIn(maplace, 375, 260);
    panelOn(adapter, "top-right", 190, 110);
    await expect
      .poll(
        () =>
          CITIES.every(
            (city) =>
              pagePointOf(map, city).y + RADIUS <= attribution().getBoundingClientRect().top,
          ),
        RENDER_WAIT,
      )
      .toBe(true);
  });

  it("leaves the camera where it is as a search narrows a list too wide to keep clear of on a phone", async () => {
    const maplace = createMaplace({ locations: places(30) });
    const { adapter, map } = await mapOfWidthIn(maplace, 375, 440);
    const list = createListView(maplace, { search: true, searchLabel: "Find" });
    list.element.style.cssText = "width: 230px; max-height: 300px; overflow: auto";
    adapter.mountControl(list.element, "top-left");
    await expect.poll(() => map.isMoving(), RENDER_WAIT).toBe(false);
    await wait(QUIET_MS);
    const before = { center: map.getCenter().toArray(), zoom: map.getZoom() };
    list.element.querySelector("input")?.focus();
    await userEvent.keyboard("zzzz");
    await wait(QUIET_MS);
    expect({ center: map.getCenter().toArray(), zoom: map.getZoom() }).toEqual(before);
  });

  it("leaves the camera where it is as a search narrows a tall list on a wide map", async () => {
    const maplace = createMaplace({ locations: places(30) });
    const { adapter, map } = await mapOfWidthIn(maplace, 1024, 512);
    const list = createListView(maplace, { search: true, searchLabel: "Find" });
    list.element.style.cssText = "width: 250px; max-height: 480px; overflow: auto";
    adapter.mountControl(list.element, "top-left");
    await expect.poll(() => map.isMoving(), RENDER_WAIT).toBe(false);
    await wait(QUIET_MS);
    const before = { center: map.getCenter().toArray(), zoom: map.getZoom() };
    list.element.querySelector("input")?.focus();
    await userEvent.keyboard("zzzz");
    await wait(QUIET_MS);
    expect({ center: map.getCenter().toArray(), zoom: map.getZoom() }).toEqual(before);
  });

  it("fits a 375px map clear of a panel in its bottom-left corner, above the attribution", async () => {
    const maplace = createMaplace({ locations: CITIES });
    const { adapter, map } = await mapOfWidthIn(maplace, 375);
    const panel = panelOn(adapter, "bottom-left", 200, 80);
    await expect.poll(() => everyCityClearOf(map, panel), RENDER_WAIT).toBe(true);
  });
});
