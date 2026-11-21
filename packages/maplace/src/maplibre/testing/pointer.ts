import type { Map as MapLibreMap } from "maplibre-gl";
import type { LatLng } from "../../geometry";
import { pagePointOf } from "./user-drags";

/** Clicks the canvas where `at` is drawn, as a user's single click. */
export function clickCanvas(map: MapLibreMap, at: LatLng): void {
  dispatchAt(map, at, "mousedown");
  dispatchAt(map, at, "mouseup");
  dispatchAt(map, at, "click");
}

/** Moves the pointer over the canvas to where `at` is drawn, as MapLibre hears it. */
export function moveOverCanvas(map: MapLibreMap, at: LatLng): void {
  dispatchAt(map, at, "mousemove");
}

/** Takes the pointer off the canvas. */
export function leaveCanvas(map: MapLibreMap): void {
  map.getCanvas().dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: null }));
}

function dispatchAt(map: MapLibreMap, at: LatLng, type: string): void {
  const { x, y } = pagePointOf(map, at);
  const init = { bubbles: true, cancelable: true, clientX: x, clientY: y };
  map
    .getCanvas()
    .dispatchEvent(new MouseEvent(type, { ...init, detail: type === "click" ? 1 : 0 }));
}
