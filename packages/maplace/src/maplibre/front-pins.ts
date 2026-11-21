import type { Marker } from "maplibre-gl";
import { paintPin } from "../adapter-kit/pin-icon";
import { type PinLook, type PinLooks, pinLookIn } from "../adapter-kit/pin-looks";
import type { LatLng } from "../geometry";
import type { LocationState } from "../location";
import { lngLatOf } from "./conversions";
import type { MountedMapLibre } from "./mounted-map";

/**
 * The selected and hovered pins, drawn again in the DOM over the pin layer: they stack above every
 * other pin, as Google's do, while the layer of every pin stays as it is. Changing a source or a
 * feature's state makes MapLibre lay out every pin again (80 ms for 4,000 in headless Chromium,
 * over the RFC's 50 ms for a selection); moving an element costs nothing. They only show: the pin
 * under each in the layer still takes the pointer, so clicks and hover stay one path.
 */
export interface FrontPins {
  /**
   * Shows `id`'s pin in front at `at`, stacked by `rank`, in the look of its `state`; again, it
   * only moves, restacks and repaints.
   */
  show(id: string, at: LatLng, rank: number, state: LocationState): void;
  hide(id: string): void;
  isShown(id: string): boolean;
}

/** The map's front pins in `looks`: a marker each while shown, kept for the next once hidden. */
export function createFrontPins({ map, maplibre }: MountedMapLibre, looks: PinLooks): FrontPins {
  const shown = new Map<string, Marker>();
  const spare: Marker[] = [];
  const document = map.getContainer().ownerDocument;
  const newMarker = (look: PinLook) =>
    new maplibre.Marker({ element: pinElement(document, look), anchor: "center" });

  return {
    show(id, at, rank, state) {
      const known = shown.get(id);
      const look = pinLookIn(looks, state);
      const marker = known ?? spare.pop() ?? newMarker(look);
      paintPin(document, look, marker.getElement() as HTMLImageElement);
      marker.setLngLat(lngLatOf(at));
      marker.getElement().style.zIndex = String(rank);
      if (known === undefined) {
        marker.addTo(map);
        shown.set(id, marker);
      }
    },
    hide(id) {
      const marker = shown.get(id);
      if (marker === undefined) return;
      marker.remove();
      shown.delete(id);
      spare.push(marker);
    },
    isShown: (id) => shown.has(id),
  };
}

/** The pin's image in `look`, letting the pointer through to the pin under it in the layer. */
function pinElement(document: Document, look: PinLook): HTMLElement {
  const image = paintPin(document, look);
  image.style.pointerEvents = "none";
  return image;
}
