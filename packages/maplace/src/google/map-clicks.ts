/// <reference types="google.maps" preserve="true" />
import { type ClickGesture, createClickGesture } from "../adapter-kit/click-gesture";
import { latLngOf } from "./lat-lng";
import type { MapPart, MountedMap } from "./mounted-map";

/** Each open map's click gesture, so a location's click can drop what it holds. */
const gestures = new WeakMap<MountedMap, ClickGesture>();

/**
 * A single click on the map, not on a marker or shape (Google keeps those apart), and where it
 * was, told from a double-click by the click gesture. A click Google can't place reports nothing.
 */
export const mapClicks: MapPart = {
  open(mounted) {
    const gesture = createClickGesture((at) => mounted.live()?.reportMapClick(at));
    gestures.set(mounted, gesture);
    const listeners = [
      mounted.map.addListener("click", (event: google.maps.MapMouseEvent) => {
        const at = event.latLng ? latLngOf(event.latLng) : undefined;
        gesture.click(at, clickCountOf(event));
      }),
      mounted.map.addListener("dblclick", () => gesture.doubleClick()),
    ];
    mounted.onDestroy(() => {
      gesture.dropHeld();
      for (const listener of listeners) listener.remove();
    });
  },
};

/**
 * A click on a location, the user's last click: a map click still held is dropped, so it can't
 * clear the selection this click makes.
 */
export function reportLocationClick(mounted: MountedMap, id: string): void {
  gestures.get(mounted)?.dropHeld();
  mounted.live()?.reportSelectionChange(id);
}

/** How many clicks the DOM event counts; an event that counts none, or no event, is 0. */
function clickCountOf({ domEvent }: google.maps.MapMouseEvent): number {
  return (domEvent as Partial<UIEvent> | undefined)?.detail ?? 0;
}
