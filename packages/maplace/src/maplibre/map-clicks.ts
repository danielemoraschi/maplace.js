import type { MapMouseEvent } from "maplibre-gl";
import { type ClickGesture, createClickGesture } from "../adapter-kit/click-gesture";
import { wrappedLatLng } from "./conversions";
import type { MapPart, MountedMapLibre } from "./mounted-map";
import { isOnCanvas } from "./pointer-targets";

/** Each open map's click gesture, so a location's click can drop what it holds. */
const gestures = new WeakMap<MountedMapLibre, ClickGesture>();

/**
 * Clicks on the map's canvas: on a location drawn in a layer (`locationAt` says which), a
 * selection; elsewhere, a click on the map, told from a double-click by the click gesture. What
 * isn't the canvas (a DOM marker, a popup, a control) handles its own clicks.
 */
export function mapClicks(locationAt: (event: MapMouseEvent) => string | undefined): MapPart {
  return {
    open(mounted) {
      const { map } = mounted;
      const gesture = createClickGesture((at) => mounted.live()?.reportMapClick(at));
      gestures.set(mounted, gesture);
      const onClick = (event: MapMouseEvent) => {
        if (!isOnCanvas(event, map.getCanvas())) return;
        const id = locationAt(event);
        if (id === undefined)
          gesture.click(wrappedLatLng(event.lngLat), event.originalEvent.detail);
        else selectLocation(mounted, id);
      };
      const onDoubleClick = () => gesture.doubleClick();
      map.on("click", onClick);
      map.on("dblclick", onDoubleClick);
      mounted.onDestroy(() => {
        gesture.dropHeld();
        map.off("click", onClick);
        map.off("dblclick", onDoubleClick);
      });
    },
  };
}

/**
 * A click on a location, the user's last click: a map click still held is dropped, so it can't
 * clear the selection this click makes.
 */
export function selectLocation(mounted: MountedMapLibre, id: string): void {
  gestures.get(mounted)?.dropHeld();
  mounted.live()?.reportSelectionChange(id);
}
