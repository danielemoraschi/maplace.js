import type { Map as MapLibreMap } from "maplibre-gl";
import type { LatLng } from "../../geometry";

/** A user's pointer on the map's canvas at `at`, `up` pixels above it: as MapLibre hears it. */
export interface CanvasPoint {
  readonly at: LatLng;
  readonly up?: number;
}

/** Clicks the canvas where `point` is drawn, as a user's single click. */
export function clickCanvas(map: MapLibreMap, point: CanvasPoint): void {
  dispatchAt(map, point, "mousedown");
  dispatchAt(map, point, "mouseup");
  dispatchAt(map, point, "click");
}

/** Moves the pointer over the canvas to where `point` is drawn. */
export function moveOverCanvas(map: MapLibreMap, point: CanvasPoint): void {
  dispatchAt(map, point, "mousemove");
}

/** Takes the pointer off the canvas. */
export function leaveCanvas(map: MapLibreMap): void {
  map.getCanvas().dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: null }));
}

function dispatchAt(map: MapLibreMap, { at, up = 0 }: CanvasPoint, type: string): void {
  const canvas = map.getCanvas();
  const box = canvas.getBoundingClientRect();
  const { x, y } = map.project([at.lng, at.lat]);
  const init = {
    bubbles: true,
    cancelable: true,
    clientX: box.left + x,
    clientY: box.top + y - up,
  };
  canvas.dispatchEvent(new MouseEvent(type, { ...init, detail: type === "click" ? 1 : 0 }));
}
