/// <reference types="google.maps" preserve="true" />
import type { LatLng } from "../geometry";
import { latLngOf } from "./lat-lng";
import type { MapPart, MountedMap } from "./mounted-map";

/**
 * How long a click on the map waits for the `dblclick` that would make it half a double-click, and
 * how soon after the last click or `dblclick` a click is a later click of the same gesture.
 */
export const DOUBLE_CLICK_WAIT_MS = 250;

/** Each open map's way to drop the clicks it holds. */
const droppers = new WeakMap<MountedMap, () => void>();

/**
 * A single click on the map, not on a marker or shape (Google keeps those apart), and where it
 * was. Google gives a double-click as two clicks and a `dblclick`: a click is held for
 * `DOUBLE_CLICK_WAIT_MS` and dropped if a `dblclick` comes first, and the later clicks of one
 * gesture are none: a click within that time of the last click or `dblclick` (Google's event
 * doesn't always count clicks), or one its DOM event counts above 1. So a double- or triple-click
 * quicker than the hold reports nothing. A click Google can't place reports nothing either.
 */
export const mapClicks: MapPart = {
  open(mounted) {
    const held = new Set<ReturnType<typeof setTimeout>>();
    const hold = (position: LatLng) => {
      const timer = setTimeout(() => {
        held.delete(timer);
        mounted.live()?.reportMapClick(position);
      }, DOUBLE_CLICK_WAIT_MS);
      held.add(timer);
    };
    const dropHeld = () => {
      for (const timer of held) clearTimeout(timer);
      held.clear();
    };
    droppers.set(mounted, dropHeld);
    let lastClickAt = Number.NEGATIVE_INFINITY;
    const listeners = [
      mounted.map.addListener("click", (event: google.maps.MapMouseEvent) => {
        const now = performance.now();
        const later = now - lastClickAt < DOUBLE_CLICK_WAIT_MS || !isFirstClick(event);
        lastClickAt = now;
        if (event.latLng && !later) hold(latLngOf(event.latLng));
      }),
      mounted.map.addListener("dblclick", () => {
        lastClickAt = performance.now();
        dropHeld();
      }),
    ];
    mounted.onDestroy(() => {
      dropHeld();
      for (const listener of listeners) listener.remove();
    });
  },
};

/**
 * A click on a location, the user's last click: a map click still held is dropped, so it can't
 * clear the selection this click makes.
 */
export function reportLocationClick(mounted: MountedMap, id: string): void {
  droppers.get(mounted)?.();
  mounted.live()?.reportSelectionChange(id);
}

/** The first click of a gesture; an event that counts no clicks, or no event, is a single click. */
function isFirstClick({ domEvent }: google.maps.MapMouseEvent): boolean {
  return ((domEvent as Partial<UIEvent> | undefined)?.detail ?? 0) <= 1;
}
