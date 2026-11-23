/// <reference types="google.maps" />
import { expect, it } from "vitest";
import { createMaplace } from "../maplace/create";
import { settledOnMap } from "./testing/controls-placed";
import { onGoogle } from "./testing/store-on-google";
import { describeWithMaps } from "./testing/with-maps";

/** The Dropdown of places example's cities, which a phone's fit put under its select (N32). */
const CITIES = [
  { id: "london", lat: 51.5074, lng: -0.1278, title: "London" },
  { id: "edinburgh", lat: 55.9533, lng: -3.1883, title: "Edinburgh" },
  { id: "belfast", lat: 54.5973, lng: -5.9301, title: "Belfast" },
];

/** Whether every marker Google draws in `container` is wholly clear of `panel`. */
function everyMarkerClearOf(container: HTMLElement, panel: Element): boolean {
  const box = panel.getBoundingClientRect();
  const markers = [...container.querySelectorAll("gmp-advanced-marker")];
  return (
    markers.length === CITIES.length &&
    markers.every((marker) => {
      const { left, right, top, bottom } = marker.getBoundingClientRect();
      return right < box.left || left > box.right || bottom < box.top || top > box.bottom;
    })
  );
}

describeWithMaps("a fit clear of maplace's panels on Google (N32)", () => {
  it("fits the example's 375 × 440 map with every city clear of its select", async () => {
    const container = document.createElement("div");
    container.style.cssText = "width: 375px; height: 440px";
    document.body.append(container);
    const maplace = createMaplace({ locations: CITIES });
    const { adapter } = await onGoogle(maplace, { container });
    const node = document.createElement("div");
    node.style.cssText = "width: 190px; height: 100px";
    adapter.mountControl(node, "top-right");
    await settledOnMap(node);
    const panel = node.parentElement as HTMLElement;
    await expect.poll(() => everyMarkerClearOf(container, panel), { timeout: 15_000 }).toBe(true);
  }, 60_000);
});
