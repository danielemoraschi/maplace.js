import type { LatLng } from "../../geometry";
import type { LocationOnMap } from "../../testing/map-probe";
import { PIN_SOURCE } from "../layers";
import { PIN_SIZE } from "../pin-image";
import type { PlacedMarker } from "../placed-location";
import { clickCanvas, leaveCanvas, moveOverCanvas } from "./pointer";
import type { ProbeTarget, TargetSite } from "./probe-target";

/** Where on a pin a user points: the middle of its head, above its tip. */
const PIN_HEAD = PIN_SIZE.height - PIN_SIZE.width / 2;

/**
 * A marker as a user reaches it: a DOM marker by its element, a pin by the canvas where it is
 * drawn. It reads what MapLibre was given (the marker's element and point, the pin's feature),
 * and a pin's source still on the map, so a pin left after destroy shows.
 */
export function markerTarget(
  placed: PlacedMarker,
  { map, features, stillPlaced }: TargetSite,
): ProbeTarget {
  const dom = () => placed.domMarker();
  const pinPoint = (): LatLng | undefined => {
    if (map.getSource(PIN_SOURCE) === undefined) return undefined;
    const coordinates = features.pins.featureOf(placed.drawable().id)?.geometry;
    if (coordinates?.type !== "Point") return undefined;
    const [lng = Number.NaN, lat = Number.NaN] = coordinates.coordinates;
    return { lat, lng };
  };
  const element = () => dom()?.getElement();
  const shown = () => (element()?.isConnected ?? false) || pinPoint() !== undefined;
  const pin = () => ({ at: pinPoint() ?? (placed.drawable().geometry as LatLng), up: PIN_HEAD });
  return {
    isMarker: true,
    onMap: () => (stillPlaced() && map.getSource(PIN_SOURCE) !== undefined) || shown(),
    shown,
    read(): LocationOnMap {
      const marker = dom();
      const at = marker?.getLngLat() ?? pinPoint() ?? (placed.drawable().geometry as LatLng);
      return {
        geometry: { type: "marker", lat: at.lat, lng: at.lng },
        title: marker
          ? (element()?.getAttribute("aria-label") ?? undefined)
          : placed.drawable().title,
        visible: shown(),
        icon: element()?.firstChild ?? undefined,
        style: undefined,
      };
    },
    // What is in the DOM (an icon, a selected or hovered pin) is above the canvas's pins.
    stack: () => (placed.isInDom() ? 2 ** 31 : 0) + placed.rank(),
    click() {
      const target = element();
      if (target) target.click();
      else clickCanvas(map, pin());
    },
    pointerOver() {
      const target = element();
      if (target) target.dispatchEvent(new PointerEvent("pointerenter"));
      else moveOverCanvas(map, pin());
    },
    pointerOut() {
      const target = element();
      if (target) target.dispatchEvent(new PointerEvent("pointerleave"));
      else leaveCanvas(map);
    },
  };
}
