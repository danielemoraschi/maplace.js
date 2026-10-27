import { afterEach, describe, expect, it, onTestFinished } from "vitest";
import "../maplibre/testing/stylesheet";
import { TEST_STYLE } from "../maplibre/testing/test-style";
import "./maplibre";
import { queried } from "../testing/queried";
import { restoreScreen, showOnDesktop, showOnPhone } from "./testing/screens";

// Its own file: it registers only `maplibre`, so a map without `provider` opens on MapLibre, on
// the local test style, so nothing leaves the machine. The list is off the map, as the element
// places it by default: beside the map on a wide page, under it on a phone, where the list's own
// height resizes the map. Real MapLibre keeps its centre and zoom through a resize: "This area"
// must keep its list through it, never loop.

const STYLE = JSON.stringify(TEST_STYLE);
const LOAD = { timeout: 15_000 };

/** `count` places a degree apart along the equator, from 0° east. */
function places(count: number): string {
  return Array.from(
    { length: count },
    (_, index) =>
      `<maplace-location location-id="p${index}" lat="0" lng="${index}" title="Place ${index}"></maplace-location>`,
  ).join("");
}

afterEach(() => document.body.replaceChildren());

/** A MapLibre map with a scoped list placed off it, ready and fitted to every place. */
async function scopedMap(count: number) {
  document.body.innerHTML = `<maplace-map map-style='${STYLE}' list list-scope="viewport">${places(count)}</maplace-map>`;
  const map = document.querySelector("maplace-map");
  if (map === null) throw new Error("no map");
  await map.maplace.whenReady();
  await expect
    .poll(() => {
      const bounds = map.maplace.getSnapshot().viewport?.bounds;
      return bounds !== undefined && bounds.west <= 0 && bounds.east >= count - 1;
    }, LOAD)
    .toBe(true);
  const part = (selector: string) => queried(map, selector);
  const titles = () =>
    Array.from(map.querySelectorAll("[role=option]"), (option) => option.textContent);
  return {
    map,
    list: part(".maplace-placed-list"),
    pane: part(".maplace-map-pane"),
    all: part(".maplace-show-all"),
    area: part(".maplace-area-only"),
    status: part(".maplace-empty-area"),
    titles,
    entries: () => titles().length,
  };
}

describe("<maplace-map list-scope> on MapLibre, the list off the map", () => {
  it("beside the map: 'All' at load, styled, then 'This area' lists the view and follows each move", async () => {
    await showOnDesktop();
    onTestFinished(restoreScreen);
    const { map, list, pane, all, area, titles, entries } = await scopedMap(20);
    expect(list.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      pane.getBoundingClientRect().right,
    );
    expect([entries(), all.getAttribute("aria-pressed")]).toEqual([20, "true"]);
    expect(getComputedStyle(all).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    map.maplace.setView({ lat: 0, lng: 2 }, 8);
    await expect.poll(() => map.maplace.getSnapshot().viewport?.center.lng, LOAD).toBe(2);
    expect(entries()).toBe(20);
    area.click();
    expect(entries()).toBeLessThan(20);
    expect(titles()).toContain("Place 2");
    map.maplace.setView({ lat: 0, lng: 15 }, 8);
    await expect.poll(titles, LOAD).toContain("Place 15");
    expect(titles()).not.toContain("Place 2");
    all.click();
    expect(entries()).toBe(20);
  });

  it("under the map on a phone: 'This area' keeps its list through the resize its own height makes", async () => {
    await showOnPhone();
    onTestFinished(restoreScreen);
    const { map, list, pane, area, entries } = await scopedMap(20);
    expect(list.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      pane.getBoundingClientRect().bottom,
    );
    map.maplace.setView({ lat: 0, lng: 0 }, 8);
    await expect.poll(() => map.maplace.getSnapshot().viewport?.zoom, LOAD).toBe(8);
    const paneHeight = pane.getBoundingClientRect().height;
    const listHeight = list.getBoundingClientRect().height;
    const filtered = map.maplace.getSnapshot().viewport;
    area.click();
    const listedThere = entries();
    expect(listedThere).toBeLessThan(3);
    await expect.poll(() => pane.getBoundingClientRect().height, LOAD).toBeGreaterThan(paneHeight);
    expect(list.getBoundingClientRect().height).toBeLessThan(listHeight);
    await expect.poll(() => map.maplace.getSnapshot().viewport, LOAD).not.toBe(filtered);
    const resized = map.maplace.getSnapshot().viewport;
    expect([resized?.zoom, resized?.center]).toEqual([filtered?.zoom, filtered?.center]);
    expect([entries(), area.getAttribute("aria-pressed")]).toEqual([listedThere, "true"]);
    map.maplace.setView({ lat: 0, lng: 10 }, 8);
    await expect.poll(() => map.querySelector("[role=option]")?.textContent, LOAD).toBe("Place 9");
  });

  it("keeps 'This area' through a reopen, listing the view again once it comes", async () => {
    await showOnDesktop();
    onTestFinished(restoreScreen);
    const { map, area, titles } = await scopedMap(20);
    map.maplace.setView({ lat: 0, lng: 2 }, 8);
    await expect.poll(() => map.maplace.getSnapshot().viewport?.center.lng, LOAD).toBe(2);
    area.click();
    const inView = titles();
    const views: unknown[] = [];
    onTestFinished(map.maplace.subscribe(() => views.push(map.maplace.getSnapshot().viewport)));
    map.setAttribute("map-style", JSON.stringify({ ...TEST_STYLE, name: "reopened" }));
    await expect.poll(() => views.includes(undefined), LOAD).toBe(true);
    await expect.poll(titles, LOAD).toEqual(inView);
    expect(area.getAttribute("aria-pressed")).toBe("true");
  });
});
