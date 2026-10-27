import { afterEach, describe, expect, it, onTestFinished } from "vitest";
import "../maplibre/testing/stylesheet";
import { TEST_STYLE } from "../maplibre/testing/test-style";
import "./maplibre";
import { restoreScreen, showOnPhone } from "./testing/screens";

// Its own file: it registers only `maplibre`, so a map without `provider` opens on MapLibre, on
// the local test style, so nothing leaves the machine. Real MapLibre reports the view it opens at
// before the store's fit, and keeps its centre and zoom through a resize: a scoped list must
// show no "Search this area" for either.

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

/** A MapLibre map with a scoped list beside it, ready. */
async function scopedMap(count: number) {
  document.body.innerHTML = `<maplace-map map-style='${STYLE}' list list-scope="viewport">${places(count)}</maplace-map>`;
  const map = document.querySelector("maplace-map");
  if (map === null) throw new Error("no map");
  await map.maplace.whenReady();
  const part = (selector: string) => map.querySelector(selector) as HTMLElement;
  return {
    map,
    button: () => part(".maplace-search-area"),
    entries: () => map.querySelectorAll("[role=option]").length,
  };
}

/** The viewport once it holds every place, `count` of them: the store's fit, reported. */
async function fitted(map: HTMLElementTagNameMap["maplace-map"], count: number): Promise<void> {
  await expect
    .poll(() => {
      const bounds = map.maplace.getSnapshot().viewport?.bounds;
      return bounds !== undefined && bounds.west <= 0 && bounds.east >= count - 1;
    }, LOAD)
    .toBe(true);
}

describe("<maplace-map list-scope> on MapLibre", () => {
  it("on load, the list lists every location and the button stays hidden", async () => {
    const { map, button, entries } = await scopedMap(5);
    await fitted(map, 5);
    expect([entries(), button().hidden]).toEqual([5, true]);
  });

  it("a list beside the map on a narrow page keeps the button hidden after a search that changes its height", async () => {
    await showOnPhone();
    onTestFinished(restoreScreen);
    const { map, button, entries } = await scopedMap(20);
    await fitted(map, 20);
    const list = map.querySelector(".maplace-placed-list") as HTMLElement;
    const pane = map.querySelector(".maplace-map-pane") as HTMLElement;
    map.maplace.setView({ lat: 0, lng: 0 }, 8);
    await expect.poll(button, LOAD).toHaveProperty("hidden", false);
    const paneHeight = pane.getBoundingClientRect().height;
    const listHeight = list.getBoundingClientRect().height;
    const searched = map.maplace.getSnapshot().viewport;
    button().click();
    expect(entries()).toBeLessThan(3);
    await expect.poll(() => pane.getBoundingClientRect().height, LOAD).toBeGreaterThan(paneHeight);
    expect(list.getBoundingClientRect().height).toBeLessThan(listHeight);
    await expect.poll(() => map.maplace.getSnapshot().viewport, LOAD).not.toBe(searched);
    const resized = map.maplace.getSnapshot().viewport;
    expect([resized?.zoom, resized?.center]).toEqual([searched?.zoom, searched?.center]);
    expect(button().hidden).toBe(true);
  });
});
