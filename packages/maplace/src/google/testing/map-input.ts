/// <reference types="google.maps" />
import { expect } from "vitest";
import { commands } from "vitest/browser";
import type { LatLng } from "../../geometry";
import type { ViewportPoint } from "./mouse-commands";

/** A user's mouse on a Google map: trusted input at places given in degrees. */
export interface MapInput {
  click(at: LatLng): Promise<void>;
  /** Clicks `count` times in one gesture: 2 is a double-click. */
  multiClick(at: LatLng, count: number): Promise<void>;
  pointTo(at: LatLng): Promise<void>;
  drag(move: { readonly from: LatLng; readonly to: LatLng }): Promise<void>;
}

/** Mouse input on `map`, once Google can place points on it. */
export async function inputOn(map: google.maps.Map): Promise<MapInput> {
  const projection = await projectionOf(map);
  const onScreen = (at: LatLng): ViewportPoint => {
    const box = map.getDiv().getBoundingClientRect();
    const pixel = projection.fromLatLngToContainerPixel(at);
    if (pixel === null) throw new Error(`Google can't place ${JSON.stringify(at)} on the map`);
    return { x: box.left + pixel.x, y: box.top + pixel.y };
  };
  return {
    click: (at) => commands.pressMouse([onScreen(at)]),
    multiClick: (at, count) => commands.multiClickMouse(onScreen(at), count),
    pointTo: (at) => commands.moveMouse(onScreen(at)),
    drag: ({ from, to }) => commands.pressMouse([onScreen(from), onScreen(to)]),
  };
}

/** The map's pixel projection, which Google gives only to an overlay on a drawn map. */
async function projectionOf(map: google.maps.Map): Promise<google.maps.MapCanvasProjection> {
  const overlay = new google.maps.OverlayView();
  Object.assign(overlay, { onAdd() {}, draw() {}, onRemove() {} });
  overlay.setMap(map);
  // Null until the overlay is drawn.
  await expect.poll(() => overlay.getProjection(), { timeout: 10_000 }).toBeTruthy();
  return overlay.getProjection();
}
