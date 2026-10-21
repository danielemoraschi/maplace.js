import type { LatLng } from "../../geometry";
import type { LocationOnMap } from "../../testing/map-probe";
import { PIN_SOURCE } from "../layers";
import { PIN_SIZE } from "../pin-image";
import type { PlacedMarker } from "../placed-location";
import { clickCanvas, leaveCanvas, moveOverCanvas } from "./pointer";
import type { ProbeTarget, TargetSite } from "./probe-target";

/** Where on a pin a user points: the middle of its head, above its tip. */
const PIN_HEAD = PIN_SIZE.height - PIN_SIZE.width / 2;

/** Above every pin in the canvas: what is in the DOM (an icon, a selected or hovered pin). */
const IN_DOM = 2 ** 31;

/**
 * A marker as a user reaches it: a DOM marker by its element, a pin by the canvas where it is
 * drawn. It reads what MapLibre has (the marker's element and point, the pin's feature as its
 * source was sent it), so a pin left after destroy shows.
 */
export function markerTarget(
  placed: PlacedMarker,
  { map, sent, stillPlaced }: TargetSite,
): ProbeTarget {
  const dom = () => placed.domMarker();
  const pinFeature = () => sent.featureOf(PIN_SOURCE, placed.drawable().id);
  const pinPoint = (): LatLng | undefined => {
    const coordinates = pinFeature()?.geometry;
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
    stack() {
      const target = element();
      if (target) return IN_DOM + Number(target.style.zIndex);
      // A front pin is MapLibre's marker, out of the probe's reach: stacked by its rank.
      if (placed.isInDom()) return IN_DOM + placed.rank();
      return pinFeature()?.properties.rank ?? 0;
    },
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
